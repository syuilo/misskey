
import { Inject, Injectable } from '@nestjs/common';
import type { FollowRequests , Followings , UserLists , UserListJoinings , Users , Blockings } from '@/models/index.js';

import { IdService } from '@/services/IdService.js';
import type { CacheableUser, User } from '@/models/entities/user.js';
import type { Blocking } from '@/models/entities/blocking.js';
import { QueueService } from '@/queue/queue.service.js';
import { GlobalEventService } from '@/services/GlobalEventService.js';
import PerUserFollowingChart from '@/services/chart/charts/per-user-following.js';
import { UserEntityService } from './entities/UserEntityService';
import { WebhookService } from './WebhookService';
import { ApRendererService } from './remote/activitypub/ApRendererService';

@Injectable()
export class UserBlockingService {
	constructor(
		@Inject('usersRepository')
		private usersRepository: typeof Users,

		@Inject('followingsRepository')
		private followingsRepository: typeof Followings,

		@Inject('followRequestsRepository')
		private followRequestsRepository: typeof FollowRequests,

		@Inject('blockingsRepository')
		private blockingsRepository: typeof Blockings,

		@Inject('userListsRepository')
		private userListsRepository: typeof UserLists,

		@Inject('userListJoiningsRepository')
		private userListJoiningsRepository: typeof UserListJoinings,

		private userEntityService: UserEntityService,
		private idService: IdService,
		private queueService: QueueService,
		private globalEventServie: GlobalEventService,
		private webhookService: WebhookService,
		private apRendererService: ApRendererService,
		private perUserFollowingChart: PerUserFollowingChart,
	) {
	}

	public async block(blocker: User, blockee: User) {
		await Promise.all([
			this.#cancelRequest(blocker, blockee),
			this.#cancelRequest(blockee, blocker),
			this.#unFollow(blocker, blockee),
			this.#unFollow(blockee, blocker),
			this.#removeFromList(blockee, blocker),
		]);

		const blocking = {
			id: this.idService.genId(),
			createdAt: new Date(),
			blocker,
			blockerId: blocker.id,
			blockee,
			blockeeId: blockee.id,
		} as Blocking;

		await this.blockingsRepository.insert(blocking);

		if (this.userEntityService.isLocalUser(blocker) && this.userEntityService.isRemoteUser(blockee)) {
			const content = this.apRendererService.renderActivity(this.apRendererService.renderBlock(blocking));
			this.queueService.deliver(blocker, content, blockee.inbox);
		}
	}

	async #cancelRequest(follower: User, followee: User) {
		const request = await this.followRequestsRepository.findOneBy({
			followeeId: followee.id,
			followerId: follower.id,
		});

		if (request == null) {
			return;
		}

		await this.followRequestsRepository.delete({
			followeeId: followee.id,
			followerId: follower.id,
		});

		if (this.userEntityService.isLocalUser(followee)) {
			this.userEntityService.pack(followee, followee, {
				detail: true,
			}).then(packed => this.globalEventServie.publishMainStream(followee.id, 'meUpdated', packed));
		}

		if (this.userEntityService.isLocalUser(follower)) {
			this.userEntityService.pack(followee, follower, {
				detail: true,
			}).then(async packed => {
				this.globalEventServie.publishUserEvent(follower.id, 'unfollow', packed);
				this.globalEventServie.publishMainStream(follower.id, 'unfollow', packed);

				const webhooks = (await this.webhookService.getActiveWebhooks()).filter(x => x.userId === follower.id && x.on.includes('unfollow'));
				for (const webhook of webhooks) {
					this.queueService.webhookDeliver(webhook, 'unfollow', {
						user: packed,
					});
				}
			});
		}

		// リモートにフォローリクエストをしていたらUndoFollow送信
		if (this.userEntityService.isLocalUser(follower) && this.userEntityService.isRemoteUser(followee)) {
			const content = this.apRendererService.renderActivity(this.apRendererService.renderUndo(this.apRendererService.renderFollow(follower, followee), follower));
			this.queueService.deliver(follower, content, followee.inbox);
		}

		// リモートからフォローリクエストを受けていたらReject送信
		if (this.userEntityService.isRemoteUser(follower) && this.userEntityService.isLocalUser(followee)) {
			const content = this.apRendererService.renderActivity(this.apRendererService.renderReject(this.apRendererService.renderFollow(follower, followee, request.requestId!), followee));
			this.queueService.deliver(followee, content, follower.inbox);
		}
	}

	async #unFollow(follower: User, followee: User) {
		const following = await this.followingsRepository.findOneBy({
			followerId: follower.id,
			followeeId: followee.id,
		});

		if (following == null) {
			return;
		}

		await Promise.all([
			this.followingsRepository.delete(following.id),
			this.usersRepository.decrement({ id: follower.id }, 'followingCount', 1),
			this.usersRepository.decrement({ id: followee.id }, 'followersCount', 1),
			this.perUserFollowingChart.update(follower, followee, false),
		]);

		// Publish unfollow event
		if (this.userEntityService.isLocalUser(follower)) {
			this.userEntityService.pack(followee, follower, {
				detail: true,
			}).then(async packed => {
				this.globalEventServie.publishUserEvent(follower.id, 'unfollow', packed);
				this.globalEventServie.publishMainStream(follower.id, 'unfollow', packed);

				const webhooks = (await this.webhookService.getActiveWebhooks()).filter(x => x.userId === follower.id && x.on.includes('unfollow'));
				for (const webhook of webhooks) {
					this.queueService.webhookDeliver(webhook, 'unfollow', {
						user: packed,
					});
				}
			});
		}

		// リモートにフォローをしていたらUndoFollow送信
		if (this.userEntityService.isLocalUser(follower) && this.userEntityService.isRemoteUser(followee)) {
			const content = this.apRendererService.renderActivity(this.apRendererService.renderUndo(this.apRendererService.renderFollow(follower, followee), follower));
			this.queueService.deliver(follower, content, followee.inbox);
		}
	}

	async #removeFromList(listOwner: User, user: User) {
		const userLists = await this.userListsRepository.findBy({
			userId: listOwner.id,
		});

		for (const userList of userLists) {
			await this.userListJoiningsRepository.delete({
				userListId: userList.id,
				userId: user.id,
			});
		}
	}

	public async unblock(blocker: CacheableUser, blockee: CacheableUser) {
		const blocking = await this.blockingsRepository.findOneBy({
			blockerId: blocker.id,
			blockeeId: blockee.id,
		});
	
		if (blocking == null) {
			logger.warn('ブロック解除がリクエストされましたがブロックしていませんでした');
			return;
		}
	
		// Since we already have the blocker and blockee, we do not need to fetch
		// them in the query above and can just manually insert them here.
		blocking.blocker = blocker;
		blocking.blockee = blockee;
	
		await this.blockingsRepository.delete(blocking.id);
	
		// deliver if remote bloking
		if (this.userEntityService.isLocalUser(blocker) && this.userEntityService.isRemoteUser(blockee)) {
			const content = this.apRendererService.renderActivity(this.apRendererService.renderUndo(this.apRendererService.renderBlock(blocking), blocker));
			this.queueService.deliver(blocker, content, blockee.inbox);
		}
	}	
}
