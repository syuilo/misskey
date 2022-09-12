import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { DI_SYMBOLS } from '@/di-symbols.js';
import { Users } from '@/models/index.js';
import type { Config } from '@/config/types.js';
import type { CacheableRemoteUser } from '@/models/entities/user.js';
import type { UserFollowingService } from '@/services/UserFollowingService.js';
import type { ReactionService } from '@/services/ReactionService.js';
import type { RelayService } from '@/services/RelayService.js';
import type { NotePiningService } from '@/services/NotePiningService.js';
import type { UserBlockingService } from '@/services/UserBlockingService.js';
import { StatusError } from '@/services/HttpRequestService.js';
import type { NoteDeleteService } from '@/services/NoteDeleteService.js';
import type { NoteCreateService } from '@/services/NoteCreateService.js';
import { concat, toArray, toSingle, unique } from '@/prelude/array.js';
import type { AppLockService } from '@/services/AppLockService.js';
import { extractDbHost } from '@/misc/convert-host.js';
import { createNote, fetchNote } from './models/note.js';
import { updatePerson } from './models/person.js';
import { updateQuestion } from './models/question.js';
import { getApId, getApIds, getApType, isAccept, isActor, isAdd, isAnnounce, isBlock, isCollection, isCollectionOrOrderedCollection, isCreate, isDelete, isFlag, isFollow, isLike, isPost, isRead, isReject, isRemove, isTombstone, isUndo, isUpdate, validActor, validPost } from './type.js';
import type { ApDbResolverService } from './ApDbResolverService.js';
import type { ApResolverService, Resolver } from './ApResolverService.js';
import type { IAccept, IAdd, IAnnounce, IBlock, ICreate, IDelete, IFlag, IFollow, ILike, IObject, IRead, IReject, IRemove, IUndo, IUpdate } from './type.js';

@Injectable()
export class ApInboxService {
	constructor(
		@Inject(DI_SYMBOLS.config)
		private config: Config,

		@Inject('usersRepository')
		private usersRepository: typeof Users,

		private userFollowingService: UserFollowingService,
		private reactionService: ReactionService,
		private relayService: RelayService,
		private notePiningService: NotePiningService,
		private userBlockingService: UserBlockingService,
		private noteCreateService: NoteCreateService,
		private noteDeleteService: NoteDeleteService,
		private appLockService: AppLockService,
		private apResolverService: ApResolverService,
		private apDbResolverService: ApDbResolverService,
	) {
	}
	
	public async performActivity(actor: CacheableRemoteUser, activity: IObject) {
		if (isCollectionOrOrderedCollection(activity)) {
			const resolver = this.apResolverService.createResolver();
			for (const item of toArray(isCollection(activity) ? activity.items : activity.orderedItems)) {
				const act = await resolver.resolve(item);
				try {
					await this.performOneActivity(actor, act);
				} catch (err) {
					if (err instanceof Error || typeof err === 'string') {
						apLogger.error(err);
					}
				}
			}
		} else {
			await this.performOneActivity(actor, activity);
		}
	}

	public async performOneActivity(actor: CacheableRemoteUser, activity: IObject): Promise<void> {
		if (actor.isSuspended) return;

		if (isCreate(activity)) {
			await this.#create(actor, activity);
		} else if (isDelete(activity)) {
			await this.#delete(actor, activity);
		} else if (isUpdate(activity)) {
			await this.#update(actor, activity);
		} else if (isRead(activity)) {
			await this.#read(actor, activity);
		} else if (isFollow(activity)) {
			await this.#follow(actor, activity);
		} else if (isAccept(activity)) {
			await this.#accept(actor, activity);
		} else if (isReject(activity)) {
			await this.#reject(actor, activity);
		} else if (isAdd(activity)) {
			await this.#add(actor, activity).catch(err => apLogger.error(err));
		} else if (isRemove(activity)) {
			await this.#remove(actor, activity).catch(err => apLogger.error(err));
		} else if (isAnnounce(activity)) {
			await this.#announce(actor, activity);
		} else if (isLike(activity)) {
			await this.#like(actor, activity);
		} else if (isUndo(activity)) {
			await this.#undo(actor, activity);
		} else if (isBlock(activity)) {
			await this.#block(actor, activity);
		} else if (isFlag(activity)) {
			await this.#flag(actor, activity);
		} else {
			apLogger.warn(`unrecognized activity type: ${(activity as any).type}`);
		}
	}

	async #follow(actor: CacheableRemoteUser, activity: IFollow): Promise<string> {
		const followee = await this.apDbResolverService.getUserFromApId(activity.object);
	
		if (followee == null) {
			return 'skip: followee not found';
		}
	
		if (followee.host != null) {
			return 'skip: フォローしようとしているユーザーはローカルユーザーではありません';
		}
	
		await this.userFollowingService.follow(actor, followee, activity.id);
		return 'ok';
	}

	async #like(actor: CacheableRemoteUser, activity: ILike): Promise<string> {
		const targetUri = getApId(activity.object);

		const note = await fetchNote(targetUri);
		if (!note) return `skip: target note not found ${targetUri}`;

		await extractEmojis(activity.tag || [], actor.host).catch(() => null);

		return await this.reactionService.create(actor, note, activity._misskey_reaction || activity.content || activity.name).catch(e => {
			if (e.id === '51c42bb4-931a-456b-bff7-e5a8a70dd298') {
				return 'skip: already reacted';
			} else {
				throw e;
			}
		}).then(() => 'ok');
	}

	async #read(actor: CacheableRemoteUser, activity: IRead): Promise<string> {
		const id = await getApId(activity.object);

		if (!isSelfHost(extractDbHost(id))) {
			return `skip: Read to foreign host (${id})`;
		}

		const messageId = id.split('/').pop();

		const message = await MessagingMessages.findOneBy({ id: messageId });
		if (message == null) {
			return 'skip: message not found';
		}

		if (actor.id !== message.recipientId) {
			return 'skip: actor is not a message recipient';
		}

		await readUserMessagingMessage(message.recipientId!, message.userId, [message.id]);
		return `ok: mark as read (${message.userId} => ${message.recipientId} ${message.id})`;
	}

	async #accept(actor: CacheableRemoteUser, activity: IAccept): Promise<string> {
		const uri = activity.id || activity;

		apLogger.info(`Accept: ${uri}`);
	
		const resolver = this.apResolverService.createResolver();
	
		const object = await resolver.resolve(activity.object).catch(e => {
			apLogger.error(`Resolution failed: ${e}`);
			throw e;
		});
	
		if (isFollow(object)) return await this.#acceptFollow(actor, object);
	
		return `skip: Unknown Accept type: ${getApType(object)}`;
	}

	async #acceptFollow(actor: CacheableRemoteUser, activity: IFollow): Promise<string> {
		// ※ activityはこっちから投げたフォローリクエストなので、activity.actorは存在するローカルユーザーである必要がある

		const follower = await this.apDbResolverService.getUserFromApId(activity.actor);

		if (follower == null) {
			return 'skip: follower not found';
		}

		if (follower.host != null) {
			return 'skip: follower is not a local user';
		}

		// relay
		const match = activity.id?.match(/follow-relay\/(\w+)/);
		if (match) {
			return await this.relayService.relayAccepted(match[1]);
		}

		await this.userFollowingService.acceptFollowRequest(actor, follower);
		return 'ok';
	}

	async #add(actor: CacheableRemoteUser, activity: IAdd): Promise<void> {
		if ('actor' in activity && actor.uri !== activity.actor) {
			throw new Error('invalid actor');
		}
	
		if (activity.target == null) {
			throw new Error('target is null');
		}
	
		if (activity.target === actor.featured) {
			const note = await resolveNote(activity.object);
			if (note == null) throw new Error('note not found');
			await this.notePiningService.addPinned(actor, note.id);
			return;
		}
	
		throw new Error(`unknown target: ${activity.target}`);
	}

	async #announce(actor: CacheableRemoteUser, activity: IAnnounce): Promise<void> {
		const uri = getApId(activity);

		logger.info(`Announce: ${uri}`);

		const targetUri = getApId(activity.object);

		this.#announceNote(actor, activity, targetUri);
	}

	async #announceNote(actor: CacheableRemoteUser, activity: IAnnounce, targetUri: string): Promise<void> {
		const uri = getApId(activity);

		if (actor.isSuspended) {
			return;
		}

		// アナウンス先をブロックしてたら中断
		const meta = await fetchMeta();
		if (meta.blockedHosts.includes(extractDbHost(uri))) return;

		const unlock = await this.appLockService.getApLock(uri);

		try {
		// 既に同じURIを持つものが登録されていないかチェック
			const exist = await fetchNote(uri);
			if (exist) {
				return;
			}

			// Announce対象をresolve
			let renote;
			try {
				renote = await resolveNote(targetUri);
			} catch (e) {
			// 対象が4xxならスキップ
				if (e instanceof StatusError) {
					if (e.isClientError) {
						logger.warn(`Ignored announce target ${targetUri} - ${e.statusCode}`);
						return;
					}

					logger.warn(`Error in announce target ${targetUri} - ${e.statusCode || e}`);
				}
				throw e;
			}

			if (!await Notes.isVisibleForMe(renote, actor.id)) return 'skip: invalid actor for this activity';

			logger.info(`Creating the (Re)Note: ${uri}`);

			const activityAudience = await parseAudience(actor, activity.to, activity.cc);

			await post(actor, {
				createdAt: activity.published ? new Date(activity.published) : null,
				renote,
				visibility: activityAudience.visibility,
				visibleUsers: activityAudience.visibleUsers,
				uri,
			});
		} finally {
			unlock();
		}
	}

	async #block(actor: CacheableRemoteUser, activity: IBlock): Promise<string> {
		// ※ activity.objectにブロック対象があり、それは存在するローカルユーザーのはず

		const blockee = await this.apDbResolverService.getUserFromApId(activity.object);

		if (blockee == null) {
			return 'skip: blockee not found';
		}

		if (blockee.host != null) {
			return 'skip: ブロックしようとしているユーザーはローカルユーザーではありません';
		}

		await this.userBlockingService.block(await Users.findOneByOrFail({ id: actor.id }), await Users.findOneByOrFail({ id: blockee.id }));
		return 'ok';
	}

	async #create(actor: CacheableRemoteUser, activity: ICreate): Promise<void> {
		const uri = getApId(activity);

		logger.info(`Create: ${uri}`);

		// copy audiences between activity <=> object.
		if (typeof activity.object === 'object') {
			const to = unique(concat([toArray(activity.to), toArray(activity.object.to)]));
			const cc = unique(concat([toArray(activity.cc), toArray(activity.object.cc)]));

			activity.to = to;
			activity.cc = cc;
			activity.object.to = to;
			activity.object.cc = cc;
		}

		// If there is no attributedTo, use Activity actor.
		if (typeof activity.object === 'object' && !activity.object.attributedTo) {
			activity.object.attributedTo = activity.actor;
		}

		const resolver = this.apResolverService.createResolver();

		const object = await resolver.resolve(activity.object).catch(e => {
			logger.error(`Resolution failed: ${e}`);
			throw e;
		});

		if (isPost(object)) {
			this.#createNote(resolver, actor, object, false, activity);
		} else {
			logger.warn(`Unknown type: ${getApType(object)}`);
		}
	}

	async #createNote(resolver: Resolver, actor: CacheableRemoteUser, note: IObject, silent = false, activity?: ICreate): Promise<string> {
		const uri = getApId(note);

		if (typeof note === 'object') {
			if (actor.uri !== note.attributedTo) {
				return 'skip: actor.uri !== note.attributedTo';
			}

			if (typeof note.id === 'string') {
				if (extractDbHost(actor.uri) !== extractDbHost(note.id)) {
					return 'skip: host in actor.uri !== note.id';
				}
			}
		}

		const unlock = await this.appLockService.getApLock(uri);

		try {
			const exist = await fetchNote(note);
			if (exist) return 'skip: note exists';

			await createNote(note, resolver, silent);
			return 'ok';
		} catch (e) {
			if (e instanceof StatusError && e.isClientError) {
				return `skip ${e.statusCode}`;
			} else {
				throw e;
			}
		} finally {
			unlock();
		}
	}

	async #delete(actor: CacheableRemoteUser, activity: IDelete): Promise<string> {
		if ('actor' in activity && actor.uri !== activity.actor) {
			throw new Error('invalid actor');
		}
	
		// 削除対象objectのtype
		let formerType: string | undefined;
	
		if (typeof activity.object === 'string') {
			// typeが不明だけど、どうせ消えてるのでremote resolveしない
			formerType = undefined;
		} else {
			const object = activity.object as IObject;
			if (isTombstone(object)) {
				formerType = toSingle(object.formerType);
			} else {
				formerType = toSingle(object.type);
			}
		}
	
		const uri = getApId(activity.object);
	
		// type不明でもactorとobjectが同じならばそれはPersonに違いない
		if (!formerType && actor.uri === uri) {
			formerType = 'Person';
		}
	
		// それでもなかったらおそらくNote
		if (!formerType) {
			formerType = 'Note';
		}
	
		if (validPost.includes(formerType)) {
			return await this.#deleteNote(actor, uri);
		} else if (validActor.includes(formerType)) {
			return await this.#deleteActor(actor, uri);
		} else {
			return `Unknown type ${formerType}`;
		}
	}

	async #deleteActor(actor: CacheableRemoteUser, uri: string): Promise<string> {
		logger.info(`Deleting the Actor: ${uri}`);
	
		if (actor.uri !== uri) {
			return `skip: delete actor ${actor.uri} !== ${uri}`;
		}
	
		const user = await Users.findOneByOrFail({ id: actor.id });
		if (user.isDeleted) {
			logger.info('skip: already deleted');
		}
	
		const job = await createDeleteAccountJob(actor);
	
		await Users.update(actor.id, {
			isDeleted: true,
		});
	
		return `ok: queued ${job.name} ${job.id}`;
	}

	async #deleteNote(actor: CacheableRemoteUser, uri: string): Promise<string> {
		logger.info(`Deleting the Note: ${uri}`);
	
		const unlock = await this.appLockService.getApLock(uri);
	
		try {
			const note = await this.apDbResolverService.getNoteFromApId(uri);
	
			if (note == null) {
				const message = await this.apDbResolverService.getMessageFromApId(uri);
				if (message == null) return 'message not found';
	
				if (message.userId !== actor.id) {
					return '投稿を削除しようとしているユーザーは投稿の作成者ではありません';
				}
	
				await deleteMessage(message);
	
				return 'ok: message deleted';
			}
	
			if (note.userId !== actor.id) {
				return '投稿を削除しようとしているユーザーは投稿の作成者ではありません';
			}
	
			await this.noteDeleteService.delete(actor, note);
			return 'ok: note deleted';
		} finally {
			unlock();
		}
	}

	async #flag(actor: CacheableRemoteUser, activity: IFlag): Promise<string> {
		// objectは `(User|Note) | (User|Note)[]` だけど、全パターンDBスキーマと対応させられないので
		// 対象ユーザーは一番最初のユーザー として あとはコメントとして格納する
		const uris = getApIds(activity.object);

		const userIds = uris.filter(uri => uri.startsWith(this.config.url + '/users/')).map(uri => uri.split('/').pop()!);
		const users = await Users.findBy({
			id: In(userIds),
		});
		if (users.length < 1) return 'skip';

		await AbuseUserReports.insert({
			id: genId(),
			createdAt: new Date(),
			targetUserId: users[0].id,
			targetUserHost: users[0].host,
			reporterId: actor.id,
			reporterHost: actor.host,
			comment: `${activity.content}\n${JSON.stringify(uris, null, 2)}`,
		});

		return 'ok';
	}

	async #reject(actor: CacheableRemoteUser, activity: IReject): Promise<string> {
		const uri = activity.id || activity;

		logger.info(`Reject: ${uri}`);

		const resolver = this.apResolverService.createResolver();

		const object = await resolver.resolve(activity.object).catch(e => {
			logger.error(`Resolution failed: ${e}`);
			throw e;
		});

		if (isFollow(object)) return await this.#rejectFollow(actor, object);

		return `skip: Unknown Reject type: ${getApType(object)}`;
	}

	async #rejectFollow(actor: CacheableRemoteUser, activity: IFollow): Promise<string> {
		// ※ activityはこっちから投げたフォローリクエストなので、activity.actorは存在するローカルユーザーである必要がある
	
		const follower = await this.apDbResolverService.getUserFromApId(activity.actor);
	
		if (follower == null) {
			return 'skip: follower not found';
		}
	
		if (!Users.isLocalUser(follower)) {
			return 'skip: follower is not a local user';
		}
	
		// relay
		const match = activity.id?.match(/follow-relay\/(\w+)/);
		if (match) {
			return await this.relayService.relayRejected(match[1]);
		}
	
		await this.userFollowingService.remoteReject(actor, follower);
		return 'ok';
	}

	async #remove(actor: CacheableRemoteUser, activity: IRemove): Promise<void> {
		if ('actor' in activity && actor.uri !== activity.actor) {
			throw new Error('invalid actor');
		}
	
		if (activity.target == null) {
			throw new Error('target is null');
		}
	
		if (activity.target === actor.featured) {
			const note = await resolveNote(activity.object);
			if (note == null) throw new Error('note not found');
			await this.notePiningService.removePinned(actor, note.id);
			return;
		}
	
		throw new Error(`unknown target: ${activity.target}`);
	}

	async #undo(actor: CacheableRemoteUser, activity: IUndo): Promise<string> {
		if ('actor' in activity && actor.uri !== activity.actor) {
			throw new Error('invalid actor');
		}
	
		const uri = activity.id || activity;
	
		logger.info(`Undo: ${uri}`);
	
		const resolver = this.apResolverService.createResolver();
	
		const object = await resolver.resolve(activity.object).catch(e => {
			logger.error(`Resolution failed: ${e}`);
			throw e;
		});
	
		if (isFollow(object)) return await this.#undoFollow(actor, object);
		if (isBlock(object)) return await this.#undoBlock(actor, object);
		if (isLike(object)) return await this.#undoLike(actor, object);
		if (isAnnounce(object)) return await this.#undoAnnounce(actor, object);
		if (isAccept(object)) return await this.#undoAccept(actor, object);
	
		return `skip: unknown object type ${getApType(object)}`;
	}

	async #undoAccept(actor: CacheableRemoteUser, activity: IAccept): Promise<string> {
		const follower = await this.apDbResolverService.getUserFromApId(activity.object);
		if (follower == null) {
			return 'skip: follower not found';
		}
	
		const following = await Followings.findOneBy({
			followerId: follower.id,
			followeeId: actor.id,
		});
	
		if (following) {
			await this.userFollowingService.unfollow(follower, actor);
			return 'ok: unfollowed';
		}
	
		return 'skip: フォローされていない';
	}

	async #undoAnnounce(actor: CacheableRemoteUser, activity: IAnnounce): Promise<string> {
		const uri = getApId(activity);

		const note = await Notes.findOneBy({
			uri,
			userId: actor.id,
		});

		if (!note) return 'skip: no such Announce';

		await this.noteDeleteService.delete(actor, note);
		return 'ok: deleted';
	}

	async #undoBlock(actor: CacheableRemoteUser, activity: IBlock): Promise<string> {
		const blockee = await this.apDbResolverService.getUserFromApId(activity.object);

		if (blockee == null) {
			return 'skip: blockee not found';
		}

		if (blockee.host != null) {
			return 'skip: ブロック解除しようとしているユーザーはローカルユーザーではありません';
		}

		await this.userBlockingService.unblock(await Users.findOneByOrFail({ id: actor.id }), blockee);
		return 'ok';
	}

	async #undoFollow(actor: CacheableRemoteUser, activity: IFollow): Promise<string> {
		const followee = await this.apDbResolverService.getUserFromApId(activity.object);
		if (followee == null) {
			return 'skip: followee not found';
		}

		if (followee.host != null) {
			return 'skip: フォロー解除しようとしているユーザーはローカルユーザーではありません';
		}

		const req = await FollowRequests.findOneBy({
			followerId: actor.id,
			followeeId: followee.id,
		});

		const following = await Followings.findOneBy({
			followerId: actor.id,
			followeeId: followee.id,
		});

		if (req) {
			await this.userFollowingService.cancelFollowRequest(followee, actor);
			return 'ok: follow request canceled';
		}

		if (following) {
			await this.userFollowingService.unfollow(actor, followee);
			return 'ok: unfollowed';
		}

		return 'skip: リクエストもフォローもされていない';
	}

	async #undoLike(actor: CacheableRemoteUser, activity: ILike): Promise<string> {
		const targetUri = getApId(activity.object);

		const note = await fetchNote(targetUri);
		if (!note) return `skip: target note not found ${targetUri}`;

		await this.reactionService.delete(actor, note).catch(e => {
			if (e.id === '60527ec9-b4cb-4a88-a6bd-32d3ad26817d') return;
			throw e;
		});

		return 'ok';
	}

	async #update(actor: CacheableRemoteUser, activity: IUpdate): Promise<string> {
		if ('actor' in activity && actor.uri !== activity.actor) {
			return 'skip: invalid actor';
		}
	
		apLogger.debug('Update');
	
		const resolver = this.apResolverService.createResolver();
	
		const object = await resolver.resolve(activity.object).catch(e => {
			apLogger.error(`Resolution failed: ${e}`);
			throw e;
		});
	
		if (isActor(object)) {
			await updatePerson(actor.uri!, resolver, object);
			return 'ok: Person updated';
		} else if (getApType(object) === 'Question') {
			await updateQuestion(object).catch(e => console.log(e));
			return 'ok: Question updated';
		} else {
			return `skip: Unknown type: ${getApType(object)}`;
		}
	}
}
