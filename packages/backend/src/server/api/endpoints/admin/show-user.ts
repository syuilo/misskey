/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository, SigninsRepository, UserProfilesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
import { RoleEntityService } from '@/core/entities/RoleEntityService.js';
import { IdService } from '@/core/IdService.js';
import { notificationRecieveConfig } from '@/models/json-schema/user.js';
import { ApDbResolverService } from '@/core/activitypub/ApDbResolverService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { UserKeypairService } from '@/core/UserKeypairService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:show-user',

	res: {
		type: 'object',
		nullable: false, optional: false,
		properties: {
			email: {
				type: 'string',
				optional: false, nullable: true,
			},
			emailVerified: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			followedMessage: {
				type: 'string',
				optional: false, nullable: true,
			},
			autoAcceptFollowed: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			noCrawle: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			preventAiLearning: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			alwaysMarkNsfw: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			autoSensitive: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			carefulBot: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			injectFeaturedNote: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			receiveAnnouncementEmail: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			mutedWords: {
				type: 'array',
				optional: false, nullable: false,
				items: {
					anyOf: [
						{
							type: 'string',
						},
						{
							type: 'array',
							items: {
								type: 'string',
							},
						},
					],
				},
			},
			mutedInstances: {
				type: 'array',
				optional: false, nullable: false,
				items: {
					type: 'string',
				},
			},
			notificationRecieveConfig: {
				type: 'object',
				optional: false, nullable: false,
				properties: {
					note: { optional: true, ...notificationRecieveConfig },
					follow: { optional: true, ...notificationRecieveConfig },
					mention: { optional: true, ...notificationRecieveConfig },
					reply: { optional: true, ...notificationRecieveConfig },
					renote: { optional: true, ...notificationRecieveConfig },
					quote: { optional: true, ...notificationRecieveConfig },
					reaction: { optional: true, ...notificationRecieveConfig },
					pollEnded: { optional: true, ...notificationRecieveConfig },
					receiveFollowRequest: { optional: true, ...notificationRecieveConfig },
					followRequestAccepted: { optional: true, ...notificationRecieveConfig },
					roleAssigned: { optional: true, ...notificationRecieveConfig },
					achievementEarned: { optional: true, ...notificationRecieveConfig },
					app: { optional: true, ...notificationRecieveConfig },
					test: { optional: true, ...notificationRecieveConfig },
				},
			},
			isModerator: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			isSilenced: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			isSuspended: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			isHibernated: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			lastActiveDate: {
				type: 'string',
				optional: false, nullable: true,
			},
			moderationNote: {
				type: 'string',
				optional: false, nullable: false,
			},
			signins: {
				type: 'array',
				optional: false, nullable: false,
				items: {
					ref: 'Signin',
				},
			},
			policies: {
				type: 'object',
				optional: false, nullable: false,
				ref: 'RolePolicies',
			},
			roles: {
				type: 'array',
				optional: false, nullable: false,
				items: {
					type: 'object',
					ref: 'Role',
				},
			},
			roleAssigns: {
				type: 'array',
				optional: false, nullable: false,
				items: {
					type: 'object',
					properties: {
						createdAt: {
							type: 'string',
							optional: false, nullable: false,
						},
						expiresAt: {
							type: 'string',
							optional: false, nullable: true,
						},
						roleId: {
							type: 'string',
							optional: false, nullable: false,
						},
					},
				},
			},
			publicKeys: {
				type: 'array',
				optional: false, nullable: true,
				items: {
					type: 'object',
					properties: {
						userId: {
							type: 'string',
							optional: false, nullable: false,
						},
						keyId: {
							type: 'string',
							optional: false, nullable: false,
						},
						keyPem: {
							type: 'string',
							optional: false, nullable: false,
						},
					},
				},
			},
			keyPairs: {
				type: 'object',
				optional: false, nullable: true,
				properties: {
					userId: {
						type: 'string',
						optional: false, nullable: false,
					},
					publicKey: {
						type: 'string',
						optional: false, nullable: false,
					},
					privateKey: {
						type: 'string',
						optional: false, nullable: false,
					},
					ed25519PublicKey: {
						type: 'string',
						optional: false, nullable: true,
					},
					ed25519PrivateKey: {
						type: 'string',
						optional: false, nullable: true,
					},
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.signinsRepository)
		private signinsRepository: SigninsRepository,

		private roleService: RoleService,
		private roleEntityService: RoleEntityService,
		private idService: IdService,
		private apDbResolverService: ApDbResolverService,
		private userEntityService: UserEntityService,
		private userKeypairService: UserKeypairService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const [user, profile] = await Promise.all([
				this.usersRepository.findOneBy({ id: ps.userId }),
				this.userProfilesRepository.findOneBy({ userId: ps.userId }),
			]);

			if (user == null || profile == null) {
				throw new Error('user not found');
			}

			const isModerator = await this.roleService.isModerator(user);
			const isSilenced = !(await this.roleService.getUserPolicies(user.id)).canPublicNote;

			const _me = await this.usersRepository.findOneByOrFail({ id: me.id });
			if (!await this.roleService.isAdministrator(_me) && await this.roleService.isAdministrator(user)) {
				throw new Error('cannot show info of admin');
			}

			const signins = await this.signinsRepository.findBy({ userId: user.id });

			const roleAssigns = await this.roleService.getUserAssigns(user.id);
			const roles = await this.roleService.getUserRoles(user.id);

			return {
				email: profile.email,
				emailVerified: profile.emailVerified,
				followedMessage: profile.followedMessage,
				autoAcceptFollowed: profile.autoAcceptFollowed,
				noCrawle: profile.noCrawle,
				preventAiLearning: profile.preventAiLearning,
				alwaysMarkNsfw: profile.alwaysMarkNsfw,
				autoSensitive: profile.autoSensitive,
				carefulBot: profile.carefulBot,
				injectFeaturedNote: profile.injectFeaturedNote,
				receiveAnnouncementEmail: profile.receiveAnnouncementEmail,
				mutedWords: profile.mutedWords,
				mutedInstances: profile.mutedInstances,
				notificationRecieveConfig: profile.notificationRecieveConfig,
				isModerator: isModerator,
				isSilenced: isSilenced,
				isSuspended: user.isSuspended,
				isHibernated: user.isHibernated,
				lastActiveDate: user.lastActiveDate ? user.lastActiveDate.toISOString() : null,
				moderationNote: profile.moderationNote ?? '',
				signins,
				policies: await this.roleService.getUserPolicies(user.id),
				roles: await this.roleEntityService.packMany(roles, me),
				roleAssigns: roleAssigns.map(a => ({
					createdAt: this.idService.parse(a.id).date.toISOString(),
					expiresAt: a.expiresAt ? a.expiresAt.toISOString() : null,
					roleId: a.roleId,
				})),
				publicKeys: this.userEntityService.isRemoteUser(user) ? await this.apDbResolverService.getPublicKeyByUserId(user.id) : null,
				keyPairs: this.userEntityService.isLocalUser(user) ? await this.userKeypairService.getUserKeypair(user.id) : null,
			};
		});
	}
}
