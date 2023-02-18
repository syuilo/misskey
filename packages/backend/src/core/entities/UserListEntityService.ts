import { Inject, Injectable } from '@/di-decorators.js';
import { DI } from '@/di-symbols.js';
import type { UserListJoiningsRepository, UserListsRepository } from '@/models/index.js';
import type { Packed } from '@/misc/schema.js';
import type { } from '@/models/entities/Blocking.js';
import type { UserList } from '@/models/entities/UserList.js';
import { UserEntityService } from './UserEntityService.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class UserListEntityService {
	constructor(
		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,

		@Inject(DI.userListJoiningsRepository)
		private userListJoiningsRepository: UserListJoiningsRepository,

		@Inject(DI.UserEntityService)
		private userEntityService: UserEntityService,
	) {
	}

	@bindThis
	public async pack(
		src: UserList['id'] | UserList,
	): Promise<Packed<'UserList'>> {
		const userList = typeof src === 'object' ? src : await this.userListsRepository.findOneByOrFail({ id: src });

		const users = await this.userListJoiningsRepository.findBy({
			userListId: userList.id,
		});

		return {
			id: userList.id,
			createdAt: userList.createdAt.toISOString(),
			name: userList.name,
			userIds: users.map(x => x.userId),
		};
	}
}

