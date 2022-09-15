import { Inject, Injectable } from '@nestjs/common';
import type { UserGroupInvitations , UserGroupJoinings } from '@/models/index.js';
import { IdService } from '@/services/IdService.js';
import type { UserGroupJoining } from '@/models/entities/user-group-joining.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '../../../../error.js';

export const meta = {
	tags: ['groups', 'users'],

	requireCredential: true,

	kind: 'write:user-groups',

	description: 'Join a group the authenticated user has been invited to.',

	errors: {
		noSuchInvitation: {
			message: 'No such invitation.',
			code: 'NO_SUCH_INVITATION',
			id: '98c11eca-c890-4f42-9806-c8c8303ebb5e',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		invitationId: { type: 'string', format: 'misskey:id' },
	},
	required: ['invitationId'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('userGroupInvitationsRepository')
		private userGroupInvitationsRepository: typeof UserGroupInvitations,

		@Inject('userGroupJoiningRepository')
		private userGroupJoiningRepository: typeof UserGroupJoinings,

		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Fetch the invitation
			const invitation = await this.userGroupInvitationsRepository.findOneBy({
				id: ps.invitationId,
			});

			if (invitation == null) {
				throw new ApiError(meta.errors.noSuchInvitation);
			}

			if (invitation.userId !== me.id) {
				throw new ApiError(meta.errors.noSuchInvitation);
			}

			// Push the user
			await this.userGroupJoiningRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				userId: me.id,
				userGroupId: invitation.userGroupId,
			} as UserGroupJoining);

			this.userGroupInvitationsRepository.delete(invitation.id);
		});
	}
}
