import { Inject, Injectable } from '@nestjs/common';
import type { UserLists } from '@/models/index.js';
import { IdService } from '@/services/IdService.js';
import type { UserList } from '@/models/entities/UserList.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserListEntityService } from '@/services/entities/UserListEntityService.js';

export const meta = {
	tags: ['lists'],

	requireCredential: true,

	kind: 'write:account',

	description: 'Create a new list of users.',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'UserList',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string', minLength: 1, maxLength: 100 },
	},
	required: ['name'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('userListsRepository')
		private userListsRepository: typeof UserLists,

		private userListEntityService: UserListEntityService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const userList = await this.userListsRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				userId: me.id,
				name: ps.name,
			} as UserList).then(x => this.userListsRepository.findOneByOrFail(x.identifiers[0]));

			return await this.userListEntityService.pack(userList);
		});
	}
}
