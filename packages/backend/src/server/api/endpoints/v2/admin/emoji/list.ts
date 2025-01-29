/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { EmojiEntityService } from '@/core/entities/EmojiEntityService.js';
import { CustomEmojiService, fetchEmojisHostTypes, fetchEmojisSortKeys } from '@/core/CustomEmojiService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireRolePolicy: 'canManageCustomEmojis',
	kind: 'read:admin:emoji',

	res: {
		type: 'object',
		properties: {
			emojis: {
				type: 'array',
				items: {
					type: 'object',
					ref: 'EmojiDetailedAdmin',
				},
			},
			count: { type: 'integer' },
			allCount: { type: 'integer' },
			allPages: { type: 'integer' },
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		query: {
			type: 'object',
			nullable: true,
			properties: {
				updatedAtFrom: { type: 'string' },
				updatedAtTo: { type: 'string' },
				name: { type: 'string' },
				host: { type: 'string' },
				uri: { type: 'string' },
				publicUrl: { type: 'string' },
				originalUrl: { type: 'string' },
				type: { type: 'string' },
				aliases: { type: 'string' },
				category: { type: 'string' },
				license: { type: 'string' },
				isSensitive: { type: 'boolean' },
				localOnly: { type: 'boolean' },
				hostType: {
					type: 'string',
					enum: fetchEmojisHostTypes,
					default: 'all',
				},
				roleIds: {
					type: 'array',
					items: { type: 'string', format: 'misskey:id' },
				},
			},
		},
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		page: { type: 'integer' },
		sortKeys: {
			type: 'array',
			default: ['-id'],
			items: {
				type: 'string',
				enum: fetchEmojisSortKeys,
			},
		},
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private customEmojiService: CustomEmojiService,
		private emojiEntityService: EmojiEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const q = ps.query;
			const result = await this.customEmojiService.fetchEmojis(
				{
					query: {
						updatedAtFrom: q?.updatedAtFrom,
						updatedAtTo: q?.updatedAtTo,
						name: q?.name,
						host: q?.host,
						uri: q?.uri,
						publicUrl: q?.publicUrl,
						type: q?.type,
						aliases: q?.aliases,
						category: q?.category,
						license: q?.license,
						isSensitive: q?.isSensitive,
						localOnly: q?.localOnly,
						hostType: q?.hostType,
						roleIds: q?.roleIds,
					},
					sinceId: ps.sinceId,
					untilId: ps.untilId,
				},
				{
					limit: ps.limit,
					page: ps.page,
					sortKeys: ps.sortKeys,
				},
			);

			return {
				emojis: await this.emojiEntityService.packDetailedAdminMany(result.emojis),
				count: result.count,
				allCount: result.allCount,
				allPages: result.allPages,
			};
		});
	}
}
