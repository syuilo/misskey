import { In, IsNull } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { resolveUser } from '@/services/remote/resolve-user.js';
import type { Users } from '@/models/index.js';
import type { User } from '@/models/entities/user.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { apiLogger } from '../../logger.js';
import { ApiError } from '../../error.js';
import type { FindOptionsWhere } from 'typeorm';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	description: 'Show the properties of a user.',

	res: {
		optional: false, nullable: false,
		oneOf: [
			{
				type: 'object',
				ref: 'UserDetailed',
			},
			{
				type: 'array',
				items: {
					type: 'object',
					ref: 'UserDetailed',
				},
			},
		],
	},

	errors: {
		failedToResolveRemoteUser: {
			message: 'Failed to resolve remote user.',
			code: 'FAILED_TO_RESOLVE_REMOTE_USER',
			id: 'ef7b9be4-9cba-4e6f-ab41-90ed171c7d3c',
			kind: 'server',
		},

		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '4362f8dc-731f-4ad8-a694-be5a88922a24',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	anyOf: [
		{
			properties: {
				userId: { type: 'string', format: 'misskey:id' },
			},
			required: ['userId'],
		},
		{
			properties: {
				userIds: { type: 'array', uniqueItems: true, items: {
					type: 'string', format: 'misskey:id',
				} },
			},
			required: ['userIds'],
		},
		{
			properties: {
				username: { type: 'string' },
				host: {
					type: 'string',
					nullable: true,
					description: 'The local host is represented with `null`.',
				},
			},
			required: ['username'],
		},
	],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('usersRepository')
		private usersRepository: typeof Users,

		@Inject('notesRepository')
		private notesRepository: typeof Notes,
	) {
		super(meta, paramDef, async (ps, me) => {
			let user;

			const isAdminOrModerator = me && (me.isAdmin || me.isModerator);

			if (ps.userIds) {
				if (ps.userIds.length === 0) {
					return [];
				}

				const users = await this.usersRepository.findBy(isAdminOrModerator ? {
					id: In(ps.userIds),
				} : {
					id: In(ps.userIds),
					isSuspended: false,
				});

				// リクエストされた通りに並べ替え
				const _users: User[] = [];
				for (const id of ps.userIds) {
					_users.push(users.find(x => x.id === id)!);
				}

				return await Promise.all(_users.map(u => this.usersRepository.pack(u, me, {
					detail: true,
				})));
			} else {
				// Lookup user
				if (typeof ps.host === 'string' && typeof ps.username === 'string') {
					user = await resolveUser(ps.username, ps.host).catch(e => {
						apiLogger.warn(`failed to resolve remote user: ${e}`);
						throw new ApiError(meta.errors.failedToResolveRemoteUser);
					});
				} else {
					const q: FindOptionsWhere<User> = ps.userId != null
						? { id: ps.userId }
						: { usernameLower: ps.username!.toLowerCase(), host: IsNull() };

					user = await this.usersRepository.findOneBy(q);
				}

				if (user == null || (!isAdminOrModerator && user.isSuspended)) {
					throw new ApiError(meta.errors.noSuchUser);
				}

				return await this.usersRepository.pack(user, me, {
					detail: true,
				});
			}
		});
	}
}
