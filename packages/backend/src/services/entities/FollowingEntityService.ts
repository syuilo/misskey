import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { Followings } from '@/models/index.js';
import { awaitAll } from '@/prelude/await-all.js';
import type { Packed } from '@/misc/schema.js';
import type { } from '@/models/entities/Blocking.js';
import type { User } from '@/models/entities/User.js';
import type { Following } from '@/models/entities/Following.js';
import { UserEntityService } from './UserEntityService.js';

type LocalFollowerFollowing = Following & {
	followerHost: null;
	followerInbox: null;
	followerSharedInbox: null;
};

type RemoteFollowerFollowing = Following & {
	followerHost: string;
	followerInbox: string;
	followerSharedInbox: string;
};

type LocalFolloweeFollowing = Following & {
	followeeHost: null;
	followeeInbox: null;
	followeeSharedInbox: null;
};

type RemoteFolloweeFollowing = Following & {
	followeeHost: string;
	followeeInbox: string;
	followeeSharedInbox: string;
};

@Injectable()
export class FollowingEntityService {
	constructor(
		@Inject('followingsRepository')
		private followingsRepository: typeof Followings,

		private userEntityService: UserEntityService,
	) {
	}

	public isLocalFollower(following: Following): following is LocalFollowerFollowing {
		return following.followerHost == null;
	}

	public isRemoteFollower(following: Following): following is RemoteFollowerFollowing {
		return following.followerHost != null;
	}

	public isLocalFollowee(following: Following): following is LocalFolloweeFollowing {
		return following.followeeHost == null;
	}

	public isRemoteFollowee(following: Following): following is RemoteFolloweeFollowing {
		return following.followeeHost != null;
	}

	public async pack(
		src: Following['id'] | Following,
		me?: { id: User['id'] } | null | undefined,
		opts?: {
			populateFollowee?: boolean;
			populateFollower?: boolean;
		},
	): Promise<Packed<'Following'>> {
		const following = typeof src === 'object' ? src : await this.followingsRepository.findOneByOrFail({ id: src });

		if (opts == null) opts = {};

		return await awaitAll({
			id: following.id,
			createdAt: following.createdAt.toISOString(),
			followeeId: following.followeeId,
			followerId: following.followerId,
			followee: opts.populateFollowee ? this.userEntityService.pack(following.followee || following.followeeId, me, {
				detail: true,
			}) : undefined,
			follower: opts.populateFollower ? this.userEntityService.pack(following.follower || following.followerId, me, {
				detail: true,
			}) : undefined,
		});
	}

	public packMany(
		followings: any[],
		me?: { id: User['id'] } | null | undefined,
		opts?: {
			populateFollowee?: boolean;
			populateFollower?: boolean;
		},
	) {
		return Promise.all(followings.map(x => this.pack(x, me, opts)));
	}
}

