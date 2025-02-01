/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ACHIEVEMENT_TYPES } from '@/core/AchievementService.js';
import { notificationTypes, userExportableEntities } from '@/types.js';

const baseSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		createdAt: {
			type: 'string',
			optional: false, nullable: false,
			format: 'date-time',
		},
		type: {
			type: 'string',
			optional: false, nullable: false,
			enum: [...notificationTypes, 'reaction:grouped', 'renote:grouped'],
		},
	},
} as const;

export const packedNotificationSchema = {
	type: 'object',
	oneOf: [{
		type: 'object',
		properties: {
			...baseSchema.properties,
			type: {
				type: 'string',
				optional: false, nullable: false,
				enum: ['note'],
			},
			user: {
				type: 'object',
				ref: 'UserLite',
				optional: false, nullable: false,
			},
			userId: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
			note: {
				type: 'object',
				ref: 'Note',
				optional: false, nullable: false,
			},
		},
	}, {
		type: 'object',
		properties: {
			...baseSchema.properties,
			type: {
				type: 'string',
				optional: false, nullable: false,
				enum: ['mention'],
			},
			user: {
				type: 'object',
				ref: 'UserLite',
				optional: false, nullable: false,
			},
			userId: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
			note: {
				type: 'object',
				ref: 'Note',
				optional: false, nullable: false,
			},
		},
	}, {
		type: 'object',
		properties: {
			...baseSchema.properties,
			type: {
				type: 'string',
				optional: false, nullable: false,
				enum: ['reply'],
			},
			user: {
				type: 'object',
				ref: 'UserLite',
				optional: false, nullable: false,
			},
			userId: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
			note: {
				type: 'object',
				ref: 'Note',
				optional: false, nullable: false,
			},
		},
	}, {
		type: 'object',
		properties: {
			...baseSchema.properties,
			type: {
				type: 'string',
				optional: false, nullable: false,
				enum: ['renote'],
			},
			user: {
				type: 'object',
				ref: 'UserLite',
				optional: false, nullable: false,
			},
			userId: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
			note: {
				type: 'object',
				ref: 'Note',
				optional: false, nullable: false,
			},
		},
	}, {
		type: 'object',
		properties: {
			...baseSchema.properties,
			type: {
				type: 'string',
				optional: false, nullable: false,
				enum: ['quote'],
			},
			user: {
				type: 'object',
				ref: 'UserLite',
				optional: false, nullable: false,
			},
			userId: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
			note: {
				type: 'object',
				ref: 'Note',
				optional: false, nullable: false,
			},
		},
	}, {
		type: 'object',
		properties: {
			...baseSchema.properties,
			type: {
				type: 'string',
				optional: false, nullable: false,
				enum: ['reaction'],
			},
			user: {
				type: 'object',
				ref: 'UserLite',
				optional: false, nullable: false,
			},
			userId: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
			note: {
				type: 'object',
				ref: 'Note',
				optional: false, nullable: false,
			},
			reaction: {
				type: 'string',
				optional: false, nullable: false,
			},
		},
	}, {
		type: 'object',
		properties: {
			...baseSchema.properties,
			type: {
				type: 'string',
				optional: false, nullable: false,
				enum: ['pollEnded'],
			},
			user: {
				type: 'object',
				ref: 'UserLite',
				optional: false, nullable: false,
			},
			userId: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
			note: {
				type: 'object',
				ref: 'Note',
				optional: false, nullable: false,
			},
		},
	}, {
		type: 'object',
		properties: {
			...baseSchema.properties,
			type: {
				type: 'string',
				optional: false, nullable: false,
				enum: ['follow'],
			},
			user: {
				type: 'object',
				ref: 'UserLite',
				optional: false, nullable: false,
			},
			userId: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
		},
	}, {
		type: 'object',
		properties: {
			...baseSchema.properties,
			type: {
				type: 'string',
				optional: false, nullable: false,
				enum: ['receiveFollowRequest'],
			},
			user: {
				type: 'object',
				ref: 'UserLite',
				optional: false, nullable: false,
			},
			userId: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
		},
	}, {
		type: 'object',
		properties: {
			...baseSchema.properties,
			type: {
				type: 'string',
				optional: false, nullable: false,
				enum: ['followRequestAccepted'],
			},
			user: {
				type: 'object',
				ref: 'UserLite',
				optional: false, nullable: false,
			},
			userId: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
			message: {
				type: 'string',
				optional: false, nullable: true,
			},
		},
	}, {
		type: 'object',
		properties: {
			...baseSchema.properties,
			type: {
				type: 'string',
				optional: false, nullable: false,
				enum: ['roleAssigned'],
			},
			role: {
				type: 'object',
				ref: 'Role',
				optional: false, nullable: false,
			},
		},
	}, {
		type: 'object',
		properties: {
			...baseSchema.properties,
			type: {
				type: 'string',
				optional: false, nullable: false,
				enum: ['achievementEarned'],
			},
			achievement: {
				type: 'string',
				optional: false, nullable: false,
				enum: ACHIEVEMENT_TYPES,
			},
		},
	}, {
		type: 'object',
		properties: {
			...baseSchema.properties,
			type: {
				type: 'string',
				optional: false, nullable: false,
				enum: ['exportCompleted'],
			},
			exportedEntity: {
				type: 'string',
				optional: false, nullable: false,
				enum: userExportableEntities,
			},
			fileId: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
		},
	}, {
		type: 'object',
		properties: {
			...baseSchema.properties,
			type: {
				type: 'string',
				optional: false, nullable: false,
				enum: ['login'],
			},
			ip: {
				type: 'string',
				optional: false, nullable: false,
			},
		},
	}, {
		type: 'object',
		properties: {
			...baseSchema.properties,
			type: {
				type: 'string',
				optional: false, nullable: false,
				enum: ['loginFailed'],
			},
			ip: {
				type: 'string',
				optional: false, nullable: false,
			},
		},
	}, {
		type: 'object',
		properties: {
			...baseSchema.properties,
			type: {
				type: 'string',
				optional: false, nullable: false,
				enum: ['app'],
			},
			body: {
				type: 'string',
				optional: false, nullable: false,
			},
			header: {
				type: 'string',
				optional: false, nullable: true,
			},
			icon: {
				type: 'string',
				optional: false, nullable: true,
			},
		},
	}, {
		type: 'object',
		properties: {
			...baseSchema.properties,
			type: {
				type: 'string',
				optional: false, nullable: false,
				enum: ['reaction:grouped'],
			},
			note: {
				type: 'object',
				ref: 'Note',
				optional: false, nullable: false,
			},
			reactions: {
				type: 'array',
				optional: false, nullable: false,
				items: {
					type: 'object',
					properties: {
						user: {
							type: 'object',
							ref: 'UserLite',
							optional: false, nullable: false,
						},
						reaction: {
							type: 'string',
							optional: false, nullable: false,
						},
					},
					required: ['user', 'reaction'],
				},
			},
		},
	}, {
		type: 'object',
		properties: {
			...baseSchema.properties,
			type: {
				type: 'string',
				optional: false, nullable: false,
				enum: ['renote:grouped'],
			},
			note: {
				type: 'object',
				ref: 'Note',
				optional: false, nullable: false,
			},
			users: {
				type: 'array',
				optional: false, nullable: false,
				items: {
					type: 'object',
					ref: 'UserLite',
					optional: false, nullable: false,
				},
			},
		},
	}, {
		type: 'object',
		properties: {
			...baseSchema.properties,
			type: {
				type: 'string',
				optional: false, nullable: false,
				enum: ['test'],
			},
		},
	}],
} as const;
