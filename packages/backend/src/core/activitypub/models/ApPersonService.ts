/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import promiseLimit from 'promise-limit';
import { DataSource } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import type { FollowingsRepository, InstancesRepository, MiMeta, UserProfilesRepository, UserPublickeysRepository, UsersRepository } from '@/models/_.js';
import type { Config } from '@/config.js';
import type { MiLocalUser, MiRemoteUser } from '@/models/User.js';
import { MiUser } from '@/models/User.js';
import { truncate } from '@/misc/truncate.js';
import type { CacheService } from '@/core/CacheService.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { isDuplicateKeyValueError } from '@/misc/is-duplicate-key-value-error.js';
import type Logger from '@/logger.js';
import type { MiNote } from '@/models/Note.js';
import type { IdService } from '@/core/IdService.js';
import type { MfmService } from '@/core/MfmService.js';
import { toArray } from '@/misc/prelude/array.js';
import type { GlobalEventService } from '@/core/GlobalEventService.js';
import type { FederatedInstanceService } from '@/core/FederatedInstanceService.js';
import type { FetchInstanceMetadataService } from '@/core/FetchInstanceMetadataService.js';
import { MiUserProfile } from '@/models/UserProfile.js';
import { MiUserPublickey } from '@/models/UserPublickey.js';
import type UsersChart from '@/core/chart/charts/users.js';
import type InstanceChart from '@/core/chart/charts/instance.js';
import type { HashtagService } from '@/core/HashtagService.js';
import { MiUserNotePining } from '@/models/UserNotePining.js';
import { StatusError } from '@/misc/status-error.js';
import type { UtilityService } from '@/core/UtilityService.js';
import type { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import { RoleService } from '@/core/RoleService.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import type { AccountMoveService } from '@/core/AccountMoveService.js';
import { checkHttps } from '@/misc/check-https.js';
import { getApId, getApType, getOneApHrefNullable, isActor, isCollection, isCollectionOrOrderedCollection, isPropertyValue } from '../type.js';
import { extractApHashtags } from './tag.js';
import type { OnModuleInit } from '@nestjs/common';
import type { ApNoteService } from './ApNoteService.js';
import type { ApMfmService } from '../ApMfmService.js';
import type { ApResolverService, Resolver } from '../ApResolverService.js';
import type { ApLoggerService } from '../ApLoggerService.js';

import type { ApImageService } from './ApImageService.js';
import type { IActor, ICollection, IObject, IOrderedCollection } from '../type.js';

const nameLength = 128;
const summaryLength = 2048;

type Field = Record<'name' | 'value', string>;

@Injectable()
export class ApPersonService implements OnModuleInit {
	private utilityService: UtilityService;
	private userEntityService: UserEntityService;
	private driveFileEntityService: DriveFileEntityService;
	private idService: IdService;
	private globalEventService: GlobalEventService;
	private federatedInstanceService: FederatedInstanceService;
	private fetchInstanceMetadataService: FetchInstanceMetadataService;
	private cacheService: CacheService;
	private apResolverService: ApResolverService;
	private apNoteService: ApNoteService;
	private apImageService: ApImageService;
	private apMfmService: ApMfmService;
	private mfmService: MfmService;
	private hashtagService: HashtagService;
	private usersChart: UsersChart;
	private instanceChart: InstanceChart;
	private apLoggerService: ApLoggerService;
	private accountMoveService: AccountMoveService;
	private logger: Logger;

	constructor(
		private moduleRef: ModuleRef,

		@Inject(DI.config)
		private config: Config,

		@Inject(DI.meta)
		private meta: MiMeta,

		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.userPublickeysRepository)
		private userPublickeysRepository: UserPublickeysRepository,

		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private roleService: RoleService,
	) {
	}

	onModuleInit(): void {
		this.utilityService = this.moduleRef.get('UtilityService');
		this.userEntityService = this.moduleRef.get('UserEntityService');
		this.driveFileEntityService = this.moduleRef.get('DriveFileEntityService');
		this.idService = this.moduleRef.get('IdService');
		this.globalEventService = this.moduleRef.get('GlobalEventService');
		this.federatedInstanceService = this.moduleRef.get('FederatedInstanceService');
		this.fetchInstanceMetadataService = this.moduleRef.get('FetchInstanceMetadataService');
		this.cacheService = this.moduleRef.get('CacheService');
		this.apResolverService = this.moduleRef.get('ApResolverService');
		this.apNoteService = this.moduleRef.get('ApNoteService');
		this.apImageService = this.moduleRef.get('ApImageService');
		this.apMfmService = this.moduleRef.get('ApMfmService');
		this.mfmService = this.moduleRef.get('MfmService');
		this.hashtagService = this.moduleRef.get('HashtagService');
		this.usersChart = this.moduleRef.get('UsersChart');
		this.instanceChart = this.moduleRef.get('InstanceChart');
		this.apLoggerService = this.moduleRef.get('ApLoggerService');
		this.accountMoveService = this.moduleRef.get('AccountMoveService');
		this.logger = this.apLoggerService.logger;
	}

	private punyHost(url: string): string {
		const urlObj = new URL(url);
		const host = `${this.utilityService.toPuny(urlObj.hostname)}${urlObj.port.length > 0 ? ':' + urlObj.port : ''}`;
		return host;
	}

	/**
	 * Validate and convert to actor object
	 * @param x Fetched object
	 * @param uri Fetch target URI
	 */
	@bindThis
	private validateActor(x: IObject, uri: string): IActor {
		const expectHost = this.punyHost(uri);

		if (!isActor(x)) {
			throw new Error(`invalid Actor type '${x.type}'`);
		}

		if (!(typeof x.id === 'string' && x.id.length > 0)) {
			throw new Error('invalid Actor: wrong id');
		}

		if (!(typeof x.inbox === 'string' && x.inbox.length > 0)) {
			throw new Error('invalid Actor: wrong inbox');
		}

		if (!(typeof x.preferredUsername === 'string' && x.preferredUsername.length > 0 && x.preferredUsername.length <= 128 && /^\w([\w-.]*\w)?$/.test(x.preferredUsername))) {
			throw new Error('invalid Actor: wrong username');
		}

		// These fields are only informational, and some AP software allows these
		// fields to be very long. If they are too long, we cut them off. This way
		// we can at least see these users and their activities.
		if (x.name) {
			if (!(typeof x.name === 'string' && x.name.length > 0)) {
				throw new Error('invalid Actor: wrong name');
			}
			x.name = truncate(x.name, nameLength);
		} else if (x.name === '') {
			// Mastodon emits empty string when the name is not set.
			x.name = undefined;
		}
		if (x.summary) {
			if (!(typeof x.summary === 'string' && x.summary.length > 0)) {
				throw new Error('invalid Actor: wrong summary');
			}
			x.summary = truncate(x.summary, summaryLength);
		}

		const idHost = this.punyHost(x.id);
		if (idHost !== expectHost) {
			throw new Error('invalid Actor: id has different host');
		}

		if (x.publicKey) {
			if (typeof x.publicKey.id !== 'string') {
				throw new Error('invalid Actor: publicKey.id is not a string');
			}

			const publicKeyIdHost = this.punyHost(x.publicKey.id);
			if (publicKeyIdHost !== expectHost) {
				throw new Error('invalid Actor: publicKey.id has different host');
			}
		}

		return x;
	}

	/**
	 * uriからUser(Person)をフェッチします。
	 *
	 * Misskeyに対象のPersonが登録されていればそれを返し、登録がなければnullを返します。
	 */
	@bindThis
	public async fetchPerson(uri: string): Promise<MiLocalUser | MiRemoteUser | null> {
		const cached = this.cacheService.uriPersonCache.get(uri) as MiLocalUser | MiRemoteUser | null | undefined;
		if (cached) return cached;

		// URIがこのサーバーを指しているならデータベースからフェッチ
		if (uri.startsWith(`${this.config.url}/`)) {
			const id = uri.split('/').pop();
			const u = await this.usersRepository.findOneBy({ id }) as MiLocalUser | null;
			if (u) this.cacheService.uriPersonCache.set(uri, u);
			return u;
		}

		//#region このサーバーに既に登録されていたらそれを返す
		const exist = await this.usersRepository.findOneBy({ uri }) as MiLocalUser | MiRemoteUser | null;

		if (exist) {
			this.cacheService.uriPersonCache.set(uri, exist);
			return exist;
		}
		//#endregion

		return null;
	}

	private async resolveAvatarAndBanner(user: MiRemoteUser, icon: any, image: any): Promise<Partial<Pick<MiRemoteUser, 'avatarId' | 'bannerId' | 'avatarUrl' | 'bannerUrl' | 'avatarBlurhash' | 'bannerBlurhash'>>> {
		if (user == null) throw new Error('failed to create user: user is null');

		const [avatar, banner] = await Promise.all([icon, image].map(img => {
			// icon and image may be arrays
			// see https://www.w3.org/TR/activitystreams-vocabulary/#dfn-icon
			if (Array.isArray(img)) {
				img = img.find(item => item && item.url) ?? null;
			}
			
			// if we have an explicitly missing image, return an
			// explicitly-null set of values
			if ((img == null) || (typeof img === 'object' && img.url == null)) {
				return { id: null, url: null, blurhash: null };
			}

			return this.apImageService.resolveImage(user, img).catch(() => null);
		}));

		if (((avatar != null && avatar.id != null) || (banner != null && banner.id != null))
				&& !(await this.roleService.getUserPolicies(user.id)).canUpdateBioMedia) {
			return {};
		}

		/*
			we don't want to return nulls on errors! if the database fields
			are already null, nothing changes; if the database has old
			values, we should keep those. The exception is if the remote has
			actually removed the images: in that case, the block above
			returns the special {id:null}&c value, and we return those
		*/
		return {
			...( avatar ? {
				avatarId: avatar.id,
				avatarUrl: avatar.url ? this.driveFileEntityService.getPublicUrl(avatar, 'avatar') : null,
				avatarBlurhash: avatar.blurhash,
			} : {}),
			...( banner ? {
				bannerId: banner.id,
				bannerUrl: banner.url ? this.driveFileEntityService.getPublicUrl(banner) : null,
				bannerBlurhash: banner.blurhash,
			} : {}),
		};
	}

	/**
	 * Personを作成します。
	 */
	@bindThis
	public async createPerson(uri: string, resolver?: Resolver): Promise<MiRemoteUser> {
		if (typeof uri !== 'string') throw new Error('uri is not string');

		if (uri.startsWith(this.config.url)) {
			throw new StatusError('cannot resolve local user', 400, 'cannot resolve local user');
		}

		// eslint-disable-next-line no-param-reassign
		if (resolver == null) resolver = this.apResolverService.createResolver();

		const object = await resolver.resolve(uri);
		if (object.id == null) throw new Error('invalid object.id: ' + object.id);

		const person = this.validateActor(object, uri);

		this.logger.info(`Creating the Person: ${person.id}`);

		const host = this.punyHost(object.id);

		const fields = this.analyzeAttachments(person.attachment ?? []);

		const tags = extractApHashtags(person.tag).map(normalizeForSearch).splice(0, 32);

		const isBot = getApType(object) === 'Service' || getApType(object) === 'Application';

		const [followingVisibility, followersVisibility] = await Promise.all(
			[
				this.isPublicCollection(person.following, resolver),
				this.isPublicCollection(person.followers, resolver),
			].map((p): Promise<'public' | 'private'> => p
				.then(isPublic => isPublic ? 'public' : 'private')
				.catch(err => {
					if (!(err instanceof StatusError) || err.isRetryable) {
						this.logger.error('error occurred while fetching following/followers collection', { stack: err });
					}
					return 'private';
				}),
			),
		);

		const bday = person['vcard:bday']?.match(/^\d{4}-\d{2}-\d{2}/);

		const url = getOneApHrefNullable(person.url);

		if (url && !checkHttps(url)) {
			throw new Error('unexpected schema of person url: ' + url);
		}

		// Create user
		let user: MiRemoteUser | null = null;

		//#region カスタム絵文字取得
		const emojis = await this.apNoteService.extractEmojis(person.tag ?? [], host)
			.then(_emojis => _emojis.map(emoji => emoji.name))
			.catch(err => {
				this.logger.error('error occurred while fetching user emojis', { stack: err });
				return [];
			});
		//#endregion

		try {
			// Start transaction
			await this.db.transaction(async transactionalEntityManager => {
				user = await transactionalEntityManager.save(new MiUser({
					id: this.idService.gen(),
					avatarId: null,
					bannerId: null,
					lastFetchedAt: new Date(),
					name: truncate(person.name, nameLength),
					isLocked: person.manuallyApprovesFollowers,
					movedToUri: person.movedTo,
					movedAt: person.movedTo ? new Date() : null,
					alsoKnownAs: person.alsoKnownAs,
					isExplorable: person.discoverable,
					username: person.preferredUsername,
					usernameLower: person.preferredUsername?.toLowerCase(),
					host,
					inbox: person.inbox,
					sharedInbox: person.sharedInbox ?? person.endpoints?.sharedInbox,
					followersUri: person.followers ? getApId(person.followers) : undefined,
					featured: person.featured ? getApId(person.featured) : undefined,
					uri: person.id,
					tags,
					isBot,
					isCat: (person as any).isCat === true,
					requireSigninToViewContents: (person as any).requireSigninToViewContents === true,
					makeNotesFollowersOnlyBefore: (person as any).makeNotesFollowersOnlyBefore ?? null,
					makeNotesHiddenBefore: (person as any).makeNotesHiddenBefore ?? null,
					emojis,
				})) as MiRemoteUser;

				let _description: string | null = null;

				if (person._misskey_summary) {
					_description = truncate(person._misskey_summary, summaryLength);
				} else if (person.summary) {
					_description = this.apMfmService.htmlToMfm(truncate(person.summary, summaryLength), person.tag);
				}

				await transactionalEntityManager.save(new MiUserProfile({
					userId: user.id,
					description: _description,
					followedMessage: person._misskey_followedMessage != null ? truncate(person._misskey_followedMessage, 256) : null,
					url,
					fields,
					followingVisibility,
					followersVisibility,
					birthday: bday?.[0] ?? null,
					location: person['vcard:Address'] ?? null,
					userHost: host,
				}));

				if (person.publicKey) {
					await transactionalEntityManager.save(new MiUserPublickey({
						userId: user.id,
						keyId: person.publicKey.id,
						keyPem: person.publicKey.publicKeyPem,
					}));
				}
			});
		} catch (e) {
			// duplicate key error
			if (isDuplicateKeyValueError(e)) {
				// /users/@a => /users/:id のように入力がaliasなときにエラーになることがあるのを対応
				const u = await this.usersRepository.findOneBy({ uri: person.id });
				if (u == null) throw new Error('already registered');

				user = u as MiRemoteUser;
			} else {
				this.logger.error(e instanceof Error ? e : new Error(e as string));
				throw e;
			}
		}

		if (user == null) throw new Error('failed to create user: user is null');

		// Register to the cache
		this.cacheService.uriPersonCache.set(user.uri, user);

		// Register host
		if (this.meta.enableStatsForFederatedInstances) {
			this.federatedInstanceService.fetchOrRegister(host).then(i => {
				this.instancesRepository.increment({ id: i.id }, 'usersCount', 1);
				if (this.meta.enableChartsForFederatedInstances) {
					this.instanceChart.newUser(i.host);
				}
				this.fetchInstanceMetadataService.fetchInstanceMetadata(i);
			});
		}

		this.usersChart.update(user, true);

		// ハッシュタグ更新
		this.hashtagService.updateUsertags(user, tags);

		//#region アバターとヘッダー画像をフェッチ
		try {
			const updates = await this.resolveAvatarAndBanner(user, person.icon, person.image);
			await this.usersRepository.update(user.id, updates);
			user = { ...user, ...updates };

			// Register to the cache
			this.cacheService.uriPersonCache.set(user.uri, user);
		} catch (err) {
			this.logger.error('error occurred while fetching user avatar/banner', { stack: err });
		}
		//#endregion

		await this.updateFeatured(user.id, resolver).catch(err => this.logger.error(err));

		return user;
	}

	/**
	 * Personの情報を更新します。
	 * Misskeyに対象のPersonが登録されていなければ無視します。
	 * もしアカウントの移行が確認された場合、アカウント移行処理を行います。
	 *
	 * @param uri URI of Person
	 * @param resolver Resolver
	 * @param hint Hint of Person object (この値が正当なPersonの場合、Remote resolveをせずに更新に利用します)
	 * @param movePreventUris ここに指定されたURIがPersonのmovedToに指定されていたり10回より多く回っている場合これ以上アカウント移行を行わない（無限ループ防止）
	 */
	@bindThis
	public async updatePerson(uri: string, resolver?: Resolver | null, hint?: IObject, movePreventUris: string[] = []): Promise<string | void> {
		if (typeof uri !== 'string') throw new Error('uri is not string');

		// URIがこのサーバーを指しているならスキップ
		if (uri.startsWith(`${this.config.url}/`)) return;

		//#region このサーバーに既に登録されているか
		const exist = await this.fetchPerson(uri) as MiRemoteUser | null;
		if (exist === null) return;
		//#endregion

		// eslint-disable-next-line no-param-reassign
		if (resolver == null) resolver = this.apResolverService.createResolver();

		const object = hint ?? await resolver.resolve(uri);

		const person = this.validateActor(object, uri);

		this.logger.info(`Updating the Person: ${person.id}`);

		// カスタム絵文字取得
		const emojis = await this.apNoteService.extractEmojis(person.tag ?? [], exist.host).catch(e => {
			this.logger.info(`extractEmojis: ${e}`);
			return [];
		});

		const emojiNames = emojis.map(emoji => emoji.name);

		const fields = this.analyzeAttachments(person.attachment ?? []);

		const tags = extractApHashtags(person.tag).map(normalizeForSearch).splice(0, 32);

		const [followingVisibility, followersVisibility] = await Promise.all(
			[
				this.isPublicCollection(person.following, resolver),
				this.isPublicCollection(person.followers, resolver),
			].map((p): Promise<'public' | 'private' | undefined> => p
				.then(isPublic => isPublic ? 'public' : 'private')
				.catch(err => {
					if (!(err instanceof StatusError) || err.isRetryable) {
						this.logger.error('error occurred while fetching following/followers collection', { stack: err });
						// Do not update the visibiility on transient errors.
						return undefined;
					}
					return 'private';
				}),
			),
		);

		const bday = person['vcard:bday']?.match(/^\d{4}-\d{2}-\d{2}/);

		const url = getOneApHrefNullable(person.url);

		if (url && !checkHttps(url)) {
			throw new Error('unexpected schema of person url: ' + url);
		}

		const updates = {
			lastFetchedAt: new Date(),
			inbox: person.inbox,
			sharedInbox: person.sharedInbox ?? person.endpoints?.sharedInbox,
			followersUri: person.followers ? getApId(person.followers) : undefined,
			featured: person.featured,
			emojis: emojiNames,
			name: truncate(person.name, nameLength),
			tags,
			isBot: getApType(object) === 'Service' || getApType(object) === 'Application',
			isCat: (person as any).isCat === true,
			isLocked: person.manuallyApprovesFollowers,
			movedToUri: person.movedTo ?? null,
			alsoKnownAs: person.alsoKnownAs ?? null,
			isExplorable: person.discoverable,
			...(await this.resolveAvatarAndBanner(exist, person.icon, person.image).catch(() => ({}))),
		} as Partial<MiRemoteUser> & Pick<MiRemoteUser, 'isBot' | 'isCat' | 'isLocked' | 'movedToUri' | 'alsoKnownAs' | 'isExplorable'>;

		const moving = ((): boolean => {
			// 移行先がない→ある
			if (
				exist.movedToUri === null &&
				updates.movedToUri
			) return true;

			// 移行先がある→別のもの
			if (
				exist.movedToUri !== null &&
				updates.movedToUri !== null &&
				exist.movedToUri !== updates.movedToUri
			) return true;

			// 移行先がある→ない、ない→ないは無視
			return false;
		})();

		if (moving) updates.movedAt = new Date();

		// Update user
		await this.usersRepository.update(exist.id, updates);

		if (person.publicKey) {
			await this.userPublickeysRepository.update({ userId: exist.id }, {
				keyId: person.publicKey.id,
				keyPem: person.publicKey.publicKeyPem,
			});
		}

		let _description: string | null = null;

		if (person._misskey_summary) {
			_description = truncate(person._misskey_summary, summaryLength);
		} else if (person.summary) {
			_description = this.apMfmService.htmlToMfm(truncate(person.summary, summaryLength), person.tag);
		}

		await this.userProfilesRepository.update({ userId: exist.id }, {
			url,
			fields,
			description: _description,
			followedMessage: person._misskey_followedMessage != null ? truncate(person._misskey_followedMessage, 256) : null,
			followingVisibility,
			followersVisibility,
			birthday: bday?.[0] ?? null,
			location: person['vcard:Address'] ?? null,
		});

		this.globalEventService.publishInternalEvent('remoteUserUpdated', { id: exist.id });

		// ハッシュタグ更新
		this.hashtagService.updateUsertags(exist, tags);

		// 該当ユーザーが既にフォロワーになっていた場合はFollowingもアップデートする
		await this.followingsRepository.update(
			{ followerId: exist.id },
			{ followerSharedInbox: person.sharedInbox ?? person.endpoints?.sharedInbox },
		);

		await this.updateFeatured(exist.id, resolver).catch(err => this.logger.error(err));

		const updated = { ...exist, ...updates };

		this.cacheService.uriPersonCache.set(uri, updated);

		// 移行処理を行う
		if (updated.movedAt && (
			// 初めて移行する場合はmovedAtがnullなので移行処理を許可
			exist.movedAt == null ||
			// 以前のmovingから14日以上経過した場合のみ移行処理を許可
			// （Mastodonのクールダウン期間は30日だが若干緩めに設定しておく）
			exist.movedAt.getTime() + 1000 * 60 * 60 * 24 * 14 < updated.movedAt.getTime()
		)) {
			this.logger.info(`Start to process Move of @${updated.username}@${updated.host} (${uri})`);
			return this.processRemoteMove(updated, movePreventUris)
				.then(result => {
					this.logger.info(`Processing Move Finished [${result}] @${updated.username}@${updated.host} (${uri})`);
					return result;
				})
				.catch(e => {
					this.logger.info(`Processing Move Failed @${updated.username}@${updated.host} (${uri})`, { stack: e });
				});
		}

		return 'skip';
	}

	/**
	 * Personを解決します。
	 *
	 * Misskeyに対象のPersonが登録されていればそれを返し、そうでなければ
	 * リモートサーバーからフェッチしてMisskeyに登録しそれを返します。
	 */
	@bindThis
	public async resolvePerson(uri: string, resolver?: Resolver): Promise<MiLocalUser | MiRemoteUser> {
		//#region このサーバーに既に登録されていたらそれを返す
		const exist = await this.fetchPerson(uri);
		if (exist) return exist;
		//#endregion

		// リモートサーバーからフェッチしてきて登録
		// eslint-disable-next-line no-param-reassign
		if (resolver == null) resolver = this.apResolverService.createResolver();
		return await this.createPerson(uri, resolver);
	}

	@bindThis
	// TODO: `attachments`が`IObject`だった場合、返り値が`[]`になるようだが構わないのか？
	public analyzeAttachments(attachments: IObject | IObject[] | undefined): Field[] {
		const fields: Field[] = [];

		if (Array.isArray(attachments)) {
			for (const attachment of attachments.filter(isPropertyValue)) {
				fields.push({
					name: attachment.name,
					value: this.mfmService.fromHtml(attachment.value),
				});
			}
		}

		return fields;
	}

	@bindThis
	public async updateFeatured(userId: MiUser['id'], resolver?: Resolver): Promise<void> {
		const user = await this.usersRepository.findOneByOrFail({ id: userId });
		if (!this.userEntityService.isRemoteUser(user)) return;
		if (!user.featured) return;

		this.logger.info(`Updating the featured: ${user.uri}`);

		const _resolver = resolver ?? this.apResolverService.createResolver();

		// Resolve to (Ordered)Collection Object
		const collection = await _resolver.resolveCollection(user.featured);
		if (!isCollectionOrOrderedCollection(collection)) throw new Error('Object is not Collection or OrderedCollection');

		// Resolve to Object(may be Note) arrays
		const unresolvedItems = isCollection(collection) ? collection.items : collection.orderedItems;
		const items = await Promise.all(toArray(unresolvedItems).map(x => _resolver.resolve(x)));

		// Resolve and regist Notes
		const limit = promiseLimit<MiNote | null>(2);
		const featuredNotes = await Promise.all(items
			.filter(item => getApType(item) === 'Note')	// TODO: Noteでなくてもいいかも
			.slice(0, 5)
			.map(item => limit(() => this.apNoteService.resolveNote(item, {
				resolver: _resolver,
				sentFrom: new URL(user.uri),
			}))));

		await this.db.transaction(async transactionalEntityManager => {
			await transactionalEntityManager.delete(MiUserNotePining, { userId: user.id });

			// とりあえずidを別の時間で生成して順番を維持
			let td = 0;
			for (const note of featuredNotes.filter(x => x != null)) {
				td -= 1000;
				transactionalEntityManager.insert(MiUserNotePining, {
					id: this.idService.gen(Date.now() + td),
					userId: user.id,
					noteId: note.id,
				});
			}
		});
	}

	/**
	 * リモート由来のアカウント移行処理を行います
	 * @param src 移行元アカウント（リモートかつupdatePerson後である必要がある、というかこれ自体がupdatePersonで呼ばれる前提）
	 * @param movePreventUris ここに列挙されたURIにsrc.movedToUriが含まれる場合、移行処理はしない（無限ループ防止）
	 */
	@bindThis
	private async processRemoteMove(src: MiRemoteUser, movePreventUris: string[] = []): Promise<string> {
		if (!src.movedToUri) return 'skip: no movedToUri';
		if (src.uri === src.movedToUri) return 'skip: movedTo itself (src)'; // ？？？
		if (movePreventUris.length > 10) return 'skip: too many moves';

		// まずサーバー内で検索して様子見
		let dst = await this.fetchPerson(src.movedToUri);

		if (dst && this.userEntityService.isLocalUser(dst)) {
			// targetがローカルユーザーだった場合データベースから引っ張ってくる
			dst = await this.usersRepository.findOneByOrFail({ uri: src.movedToUri }) as MiLocalUser;
		} else if (dst) {
			if (movePreventUris.includes(src.movedToUri)) return 'skip: circular move';

			// targetを見つけたことがあるならtargetをupdatePersonする
			await this.updatePerson(src.movedToUri, undefined, undefined, [...movePreventUris, src.uri]);
			dst = await this.fetchPerson(src.movedToUri) ?? dst;
		} else {
			if (src.movedToUri.startsWith(`${this.config.url}/`)) {
				// ローカルユーザーっぽいのにfetchPersonで見つからないということはmovedToUriが間違っている
				return 'failed: movedTo is local but not found';
			}

			// targetが知らない人だったらresolvePerson
			// (uriが存在しなかったり応答がなかったりする場合resolvePersonはthrow Errorする)
			dst = await this.resolvePerson(src.movedToUri);
		}

		if (dst.movedToUri === dst.uri) return 'skip: movedTo itself (dst)'; // ？？？
		if (src.movedToUri !== dst.uri) return 'skip: missmatch uri'; // ？？？
		if (dst.movedToUri === src.uri) return 'skip: dst.movedToUri === src.uri';
		if (!dst.alsoKnownAs || dst.alsoKnownAs.length === 0) {
			return 'skip: dst.alsoKnownAs is empty';
		}
		if (!dst.alsoKnownAs.includes(src.uri)) {
			return 'skip: alsoKnownAs does not include from.uri';
		}

		await this.accountMoveService.postMoveProcess(src, dst);

		return 'ok';
	}

	@bindThis
	private async isPublicCollection(collection: string | ICollection | IOrderedCollection | undefined, resolver: Resolver): Promise<boolean> {
		if (collection) {
			const resolved = await resolver.resolveCollection(collection);
			if (resolved.first || (resolved as ICollection).items || (resolved as IOrderedCollection).orderedItems) {
				return true;
			}
		}

		return false;
	}
}
