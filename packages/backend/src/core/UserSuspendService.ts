/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Not, IsNull } from 'typeorm';
import type { FollowingsRepository, FollowRequestsRepository, UsersRepository } from '@/models/_.js';
import type { MiUser } from '@/models/User.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import { UserKeypairService } from './UserKeypairService.js';
import { ApDeliverManagerService } from './activitypub/ApDeliverManagerService.js';
import { RelationshipJobData } from '@/queue/types.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { QueueService } from '@/core/QueueService.js';

@Injectable()
export class UserSuspendService {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		@Inject(DI.followRequestsRepository)
		private followRequestsRepository: FollowRequestsRepository,

		private userEntityService: UserEntityService,
		private queueService: QueueService,
		private globalEventService: GlobalEventService,
		private apRendererService: ApRendererService,
		private userKeypairService: UserKeypairService,
		private apDeliverManagerService: ApDeliverManagerService,
		private moderationLogService: ModerationLogService,
	) {
	}

	@bindThis
	public async suspend(user: MiUser, moderator: MiUser): Promise<void> {
		await this.usersRepository.update(user.id, {
			isSuspended: true,
		});

		this.moderationLogService.log(moderator, 'suspend', {
			userId: user.id,
			userUsername: user.username,
			userHost: user.host,
		});

		(async () => {
			await this.postSuspend(user).catch(e => {});
			await this.unFollowAll(user).catch(e => {});
		})();
	}

	@bindThis
	public async unsuspend(user: MiUser, moderator: MiUser): Promise<void> {
		await this.usersRepository.update(user.id, {
			isSuspended: false,
		});

		this.moderationLogService.log(moderator, 'unsuspend', {
			userId: user.id,
			userUsername: user.username,
			userHost: user.host,
		});

		(async () => {
			await this.postUnsuspend(user).catch(e => {});
		})();
	}

	@bindThis
	private async postSuspend(user: { id: MiUser['id']; host: MiUser['host'] }): Promise<void> {
		this.globalEventService.publishInternalEvent('userChangeSuspendedState', { id: user.id, isSuspended: true });

		this.followRequestsRepository.delete({
			followeeId: user.id,
		});
		this.followRequestsRepository.delete({
			followerId: user.id,
		});

		if (this.userEntityService.isLocalUser(user)) {
			const content = this.apRendererService.addContext(this.apRendererService.renderDelete(this.userEntityService.genLocalUserUri(user.id), user));
			const manager = this.apDeliverManagerService.createDeliverManager(user, content);
			manager.addAllKnowingSharedInboxRecipe();
			// process deliver時にはキーペアが消去されているはずなので、ここで挿入する
			const privateKey = await this.userKeypairService.getLocalUserPrivateKeyPem(user.id, 'main');
			manager.execute({ privateKey });
		}
	}

	@bindThis
	private async postUnsuspend(user: MiUser): Promise<void> {
		this.globalEventService.publishInternalEvent('userChangeSuspendedState', { id: user.id, isSuspended: false });

		if (this.userEntityService.isLocalUser(user)) {
			const content = this.apRendererService.addContext(this.apRendererService.renderUndo(this.apRendererService.renderDelete(this.userEntityService.genLocalUserUri(user.id), user), user));
			const manager = this.apDeliverManagerService.createDeliverManager(user, content);
			manager.addAllKnowingSharedInboxRecipe();
			// process deliver時にはキーペアが消去されているはずなので、ここで挿入する
			const privateKey = await this.userKeypairService.getLocalUserPrivateKeyPem(user.id, 'main');
			manager.execute({ privateKey });
		}
	}

	@bindThis
	private async unFollowAll(follower: MiUser) {
		const followings = await this.followingsRepository.find({
			where: {
				followerId: follower.id,
				followeeId: Not(IsNull()),
			},
		});

		const jobs: RelationshipJobData[] = [];
		for (const following of followings) {
			if (following.followeeId && following.followerId) {
				jobs.push({
					from: { id: following.followerId },
					to: { id: following.followeeId },
					silent: true,
				});
			}
		}
		this.queueService.createUnfollowJob(jobs);
	}
}
