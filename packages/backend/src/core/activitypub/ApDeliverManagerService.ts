/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { IsNull, Not } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { FollowingsRepository } from '@/models/_.js';
import type { MiLocalUser, MiRemoteUser, MiUser } from '@/models/User.js';
import { QueueService } from '@/core/QueueService.js';
import { bindThis } from '@/decorators.js';
import type { IActivity } from '@/core/activitypub/type.js';
import { ThinUser } from '@/queue/types.js';
import { AccountUpdateService } from '@/core/AccountUpdateService.js';
import type Logger from '@/logger.js';
import { UserKeypairService } from '../UserKeypairService.js';
import { ApLoggerService } from './ApLoggerService.js';
import type { PrivateKeyWithPem } from '@misskey-dev/node-http-message-signatures';

interface IRecipe {
	type: string;
}

interface IFollowersRecipe extends IRecipe {
	type: 'Followers';
}

interface IDirectRecipe extends IRecipe {
	type: 'Direct';
	to: MiRemoteUser;
}

interface IAllKnowingSharedInboxRecipe extends IRecipe {
	type: 'AllKnowingSharedInbox';
}

const isFollowers = (recipe: IRecipe): recipe is IFollowersRecipe =>
	recipe.type === 'Followers';

const isDirect = (recipe: IRecipe): recipe is IDirectRecipe =>
	recipe.type === 'Direct';

const isAllKnowingSharedInbox = (recipe: IRecipe): recipe is IAllKnowingSharedInboxRecipe =>
	recipe.type === 'AllKnowingSharedInbox';

class DeliverManager {
	private actor: ThinUser;
	private activity: IActivity | null;
	private recipes: IRecipe[] = [];

	/**
	 * Constructor
	 * @param userKeypairService
	 * @param followingsRepository
	 * @param queueService
	 * @param actor Actor
	 * @param activity Activity to deliver
	 */
	constructor(
		private userKeypairService: UserKeypairService,
		private followingsRepository: FollowingsRepository,
		private queueService: QueueService,
		private accountUpdateService: AccountUpdateService,
		private logger: Logger,

		actor: { id: MiUser['id']; host: null; },
		activity: IActivity | null,
	) {
		// 型で弾いてはいるが一応ローカルユーザーかチェック
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (actor.host != null) throw new Error('actor.host must be null');

		// パフォーマンス向上のためキューに突っ込むのはidのみに絞る
		this.actor = {
			id: actor.id,
		};
		this.activity = activity;
	}

	/**
	 * Add recipe for followers deliver
	 */
	@bindThis
	public addFollowersRecipe(): void {
		const deliver: IFollowersRecipe = {
			type: 'Followers',
		};

		this.addRecipe(deliver);
	}

	/**
	 * Add recipe for direct deliver
	 * @param to To
	 */
	@bindThis
	public addDirectRecipe(to: MiRemoteUser): void {
		const recipe: IDirectRecipe = {
			type: 'Direct',
			to,
		};

		this.addRecipe(recipe);
	}

	/**
	 * Add recipe for all-knowing shared inbox deliver
	 */
	@bindThis
	public addAllKnowingSharedInboxRecipe(): void {
		const deliver: IAllKnowingSharedInboxRecipe = {
			type: 'AllKnowingSharedInbox',
		};

		this.addRecipe(deliver);
	}

	/**
	 * Add recipe
	 * @param recipe Recipe
	 */
	@bindThis
	public addRecipe(recipe: IRecipe): void {
		this.recipes.push(recipe);
	}

	/**
	 * Execute delivers
	 */
	@bindThis
	public async execute(opts?: { privateKey?: PrivateKeyWithPem }): Promise<void> {
		//#region MIGRATION
		if (!opts?.privateKey) {
			/**
			 * ed25519の署名がなければ追加する
			 */
			const created = await this.userKeypairService.refreshAndPrepareEd25519KeyPair(this.actor.id);
			if (created) {
				// createdが存在するということは新規作成されたということなので、フォロワーに配信する
				this.logger.info(`ed25519 key pair created for user ${this.actor.id} and publishing to followers`);
				// リモートに配信
				const keyPair = await this.userKeypairService.getLocalUserPrivateKeyPem(created, 'main');
				await this.accountUpdateService.publishToFollowers(this.actor.id, keyPair);
			}
		}
		//#endregion

		//#region collect inboxes by recipes
		// The value flags whether it is shared or not.
		// key: inbox URL, value: whether it is sharedInbox
		const inboxes = new Map<string, boolean>();

		if (this.recipes.some(r => isAllKnowingSharedInbox(r))) {
			// all-knowing shared inbox
			const followings = await this.followingsRepository.find({
				where: [
					{ followerSharedInbox: Not(IsNull()) },
					{ followeeSharedInbox: Not(IsNull()) },
				],
				select: ['followerSharedInbox', 'followeeSharedInbox'],
			});

			for (const following of followings) {
				if (following.followeeSharedInbox) inboxes.set(following.followeeSharedInbox, true);
				if (following.followerSharedInbox) inboxes.set(following.followerSharedInbox, true);
			}
		}

		// build inbox list
		// Process follower recipes first to avoid duplication when processing direct recipes later.
		if (this.recipes.some(r => isFollowers(r))) {
			// followers deliver
			// TODO: SELECT DISTINCT ON ("followerSharedInbox") "followerSharedInbox" みたいな問い合わせにすればよりパフォーマンス向上できそう
			// ただ、sharedInboxがnullなリモートユーザーも稀におり、その対応ができなさそう？
			const followers = await this.followingsRepository.find({
				where: {
					followeeId: this.actor.id,
					followerHost: Not(IsNull()),
				},
				select: {
					followerSharedInbox: true,
					followerInbox: true,
				},
			});

			for (const following of followers) {
				const inbox = following.followerSharedInbox ?? following.followerInbox;
				if (inbox === null) throw new Error('inbox is null');
				inboxes.set(inbox, following.followerSharedInbox != null);
			}
		}

		for (const recipe of this.recipes.filter(isDirect)) {
			// check that shared inbox has not been added yet
			if (recipe.to.sharedInbox !== null && inboxes.has(recipe.to.sharedInbox)) continue;

			// check that they actually have an inbox
			if (recipe.to.inbox === null) continue;

			inboxes.set(recipe.to.inbox, false);
		}
		//#endregion

		// deliver
		await this.queueService.deliverMany(this.actor, this.activity, inboxes, opts?.privateKey);
		this.logger.info(`Deliver queues dispatched: inboxes=${inboxes.size} actorId=${this.actor.id} activityId=${this.activity?.id}`);
	}
}

@Injectable()
export class ApDeliverManagerService {
	private logger: Logger;

	constructor(
		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private userKeypairService: UserKeypairService,
		private queueService: QueueService,
		private accountUpdateService: AccountUpdateService,
		private apLoggerService: ApLoggerService,
	) {
		this.logger = this.apLoggerService.logger.createSubLogger('deliver-manager');
	}

	/**
	 * Deliver activity to followers
	 * @param actor
	 * @param activity Activity
	 * @param forceMainKey Force to use main (rsa) key
	 */
	@bindThis
	public async deliverToFollowers(actor: { id: MiLocalUser['id']; host: null; }, activity: IActivity, privateKey?: PrivateKeyWithPem): Promise<void> {
		const manager = new DeliverManager(
			this.userKeypairService,
			this.followingsRepository,
			this.queueService,
			this.accountUpdateService,
			this.logger,
			actor,
			activity,
		);
		manager.addFollowersRecipe();
		await manager.execute({ privateKey });
	}

	/**
	 * Deliver activity to user
	 * @param actor
	 * @param activity Activity
	 * @param to Target user
	 */
	@bindThis
	public async deliverToUser(actor: { id: MiLocalUser['id']; host: null; }, activity: IActivity, to: MiRemoteUser): Promise<void> {
		const manager = new DeliverManager(
			this.userKeypairService,
			this.followingsRepository,
			this.queueService,
			this.accountUpdateService,
			this.logger,
			actor,
			activity,
		);
		manager.addDirectRecipe(to);
		await manager.execute();
	}

	@bindThis
	public createDeliverManager(actor: { id: MiUser['id']; host: null; }, activity: IActivity | null): DeliverManager {
		return new DeliverManager(
			this.userKeypairService,
			this.followingsRepository,
			this.queueService,
			this.accountUpdateService,
			this.logger,
			actor,
			activity,
		);
	}
}
