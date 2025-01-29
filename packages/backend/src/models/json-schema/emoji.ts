/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const packedEmojiSimpleSchema = {
	type: 'object',
	properties: {
		aliases: {
			type: 'array',
			optional: false, nullable: false,
			items: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
		},
		name: {
			type: 'string',
			optional: false, nullable: false,
		},
		category: {
			type: 'string',
			optional: false, nullable: true,
		},
		url: {
			type: 'string',
			optional: false, nullable: false,
		},
		localOnly: {
			type: 'boolean',
			optional: true, nullable: false,
		},
		isSensitive: {
			type: 'boolean',
			optional: true, nullable: false,
		},
		roleIdsThatCanBeUsedThisEmojiAsReaction: {
			type: 'array',
			optional: true, nullable: false,
			items: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
		},
	},
} as const;

export const packedEmojiDetailedSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		aliases: {
			type: 'array',
			optional: false, nullable: false,
			items: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
		},
		name: {
			type: 'string',
			optional: false, nullable: false,
		},
		category: {
			type: 'string',
			optional: false, nullable: true,
		},
		host: {
			type: 'string',
			optional: false, nullable: true,
			description: 'The local host is represented with `null`.',
		},
		url: {
			type: 'string',
			optional: false, nullable: false,
		},
		license: {
			type: 'string',
			optional: false, nullable: true,
		},
		isSensitive: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		localOnly: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		roleIdsThatCanBeUsedThisEmojiAsReaction: {
			type: 'array',
			optional: false, nullable: false,
			items: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
		},
	},
} as const;

export const packedEmojiDetailedAdminSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			format: 'id',
			optional: false, nullable: false,
		},
		updatedAt: {
			type: 'string',
			format: 'date-time',
			optional: false, nullable: true,
		},
		name: {
			type: 'string',
			optional: false, nullable: false,
		},
		host: {
			type: 'string',
			optional: false, nullable: true,
			description: 'The local host is represented with `null`.',
		},
		publicUrl: {
			type: 'string',
			optional: false, nullable: false,
		},
		originalUrl: {
			type: 'string',
			optional: false, nullable: false,
		},
		uri: {
			type: 'string',
			optional: false, nullable: true,
		},
		type: {
			type: 'string',
			optional: false, nullable: true,
		},
		aliases: {
			type: 'array',
			optional: false, nullable: false,
			items: {
				type: 'string',
				format: 'id',
				optional: false, nullable: false,
			},
		},
		category: {
			type: 'string',
			optional: false, nullable: true,
		},
		license: {
			type: 'string',
			optional: false, nullable: true,
		},
		localOnly: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		isSensitive: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		roleIdsThatCanBeUsedThisEmojiAsReaction: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: {
						type: 'string',
						format: 'misskey:id',
						optional: false, nullable: false,
					},
					name: {
						type: 'string',
						optional: false, nullable: false,
					},
				},
			},
		},
	},
} as const;
