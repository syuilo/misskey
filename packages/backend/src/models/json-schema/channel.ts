/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const packedChannelSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: 'string',
			optional: false, nullable: false,
			format: 'date-time',
		},
		lastNotedAt: {
			type: 'string',
			nullable: true, optional: false,
			format: 'date-time',
		},
		name: {
			type: 'string',
			optional: false, nullable: false,
		},
		description: {
			type: 'string',
			optional: false, nullable: true,
		},
		userId: {
			type: 'string',
			nullable: true, optional: false,
			format: 'id',
		},
		bannerUrl: {
			type: 'string',
			format: 'url',
			nullable: true, optional: false,
		},
		pinnedNoteIds: {
			type: 'array',
			nullable: false, optional: false,
			items: {
				type: 'string',
				format: 'id',
			},
		},
		color: {
			type: 'string',
			optional: false, nullable: false,
		},
		isArchived: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		usersCount: {
			type: 'number',
			nullable: false, optional: false,
		},
		notesCount: {
			type: 'number',
			nullable: false, optional: false,
		},
		isSensitive: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		allowRenoteToExternal: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		isFollowing: {
			type: 'boolean',
			optional: true, nullable: false,
		},
		isFavorited: {
			type: 'boolean',
			optional: true, nullable: false,
		},
		isMuting: {
			type: 'boolean',
			optional: true, nullable: false,
		},
		pinnedNotes: {
			type: 'array',
			optional: true, nullable: false,
			items: {
				type: 'object',
				optional: false, nullable: false,
				ref: 'Note',
			},
		},
	},
} as const;
