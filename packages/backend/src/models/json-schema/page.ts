/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * ページブロックのスキーマを変更したら、併せてpageBlockSchemaも更新すること
 * （そっちは入力バリデーション用の定義なので以下の定義とは若干異なる）
 *
 * packages/backend/src/models/Page.ts
 */

const packedBlockBaseSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
		},
		type: {
			type: 'string',
			optional: false, nullable: false,
		},
	},
} as const;

const packedTextBlockSchema = {
	type: 'object',
	properties: {
		...packedBlockBaseSchema.properties,
		type: {
			type: 'string',
			optional: false, nullable: false,
			enum: ['text'],
		},
		text: {
			type: 'string',
			optional: false, nullable: false,
		},
	},
} as const;

const packedHeadingBlockSchema = {
	type: 'object',
	properties: {
		...packedBlockBaseSchema.properties,
		type: {
			type: 'string',
			optional: false, nullable: false,
			enum: ['heading'],
		},
		level: {
			type: 'number',
			optional: false, nullable: false,
		},
		text: {
			type: 'string',
			optional: false, nullable: false,
		},
	},
} as const;

/** @deprecated 要素を入れ子にする必要が（一旦）なくなったので非推奨。headingBlockを使用すること */
const packedSectionBlockSchema = {
	type: 'object',
	properties: {
		...packedBlockBaseSchema.properties,
		type: {
			type: 'string',
			optional: false, nullable: false,
			enum: ['section'],
		},
		title: {
			type: 'string',
			optional: false, nullable: false,
		},
		children: {
			type: 'array',
			optional: false, nullable: false,
			items: {
				type: 'object',
				optional: false, nullable: false,
				ref: 'PageBlock',
				selfRef: true,
			},
		},
	},
} as const;

const packedImageBlockSchema = {
	type: 'object',
	properties: {
		...packedBlockBaseSchema.properties,
		type: {
			type: 'string',
			optional: false, nullable: false,
			enum: ['image'],
		},
		fileId: {
			type: 'string',
			optional: false, nullable: true,
		},
	},
} as const;

const packedNoteBlockSchema = {
	type: 'object',
	properties: {
		...packedBlockBaseSchema.properties,
		type: {
			type: 'string',
			optional: false, nullable: false,
			enum: ['note'],
		},
		detailed: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		note: {
			type: 'string',
			optional: false, nullable: true,
		},
	},
} as const;

export const packedPageBlockSchema = {
	type: 'object',
	oneOf: [
		packedTextBlockSchema,
		packedSectionBlockSchema,
		packedHeadingBlockSchema,
		packedImageBlockSchema,
		packedNoteBlockSchema,
	],
} as const;

export const packedPageSchema = {
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
		updatedAt: {
			type: 'string',
			optional: false, nullable: false,
			format: 'date-time',
		},
		userId: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		user: {
			type: 'object',
			ref: 'UserLite',
			optional: false, nullable: false,
		},
		content: {
			type: 'array',
			optional: false, nullable: false,
			items: {
				type: 'object',
				optional: false, nullable: false,
				ref: 'PageBlock',
			},
		},
		variables: {
			type: 'array',
			optional: false, nullable: false,
			items: {
				type: 'object',
				optional: false, nullable: false,
			},
		},
		title: {
			type: 'string',
			optional: false, nullable: false,
		},
		name: {
			type: 'string',
			optional: false, nullable: false,
		},
		summary: {
			type: 'string',
			optional: false, nullable: true,
		},
		hideTitleWhenPinned: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		alignCenter: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		font: {
			type: 'string',
			optional: false, nullable: false,
		},
		script: {
			type: 'string',
			optional: false, nullable: false,
		},
		eyeCatchingImageId: {
			type: 'string',
			optional: false, nullable: true,
		},
		eyeCatchingImage: {
			type: 'object',
			optional: false, nullable: true,
			ref: 'DriveFile',
		},
		attachedFiles: {
			type: 'array',
			optional: false, nullable: false,
			items: {
				type: 'object',
				optional: false, nullable: false,
				ref: 'DriveFile',
			},
		},
		likedCount: {
			type: 'number',
			optional: false, nullable: false,
		},
		isLiked: {
			type: 'boolean',
			optional: true, nullable: false,
		},
	},
} as const;
