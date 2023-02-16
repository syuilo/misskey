import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { EmojisRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';
import { EmojiEntityService } from '@/core/entities/EmojiEntityService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireRolePolicy: 'canManageCustomEmojis',

	errors: {
		noSuchEmoji: {
			message: 'No such emoji.',
			code: 'NO_SUCH_EMOJI',
			id: '684dec9d-a8c2-4364-9aa8-456c49cb1dc8',
		},		
		inappropriateEmojiName: {
			message: 'Inappropriate emoji name',
			code: 'INAPPROPRIATE_EMOJI_NAME',
			id: '50733374-0f01-555f-1675-87382494561f',
		},
		alreadyexistsemoji: {
			message: 'Emoji already exists',
			code: 'EMOJI_ALREADY_EXISTS',
			id: '7180fe9d-1ee3-bff9-647d-fe9896d2ffb8',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		id: { type: 'string', format: 'misskey:id' },
		name: { type: 'string' },
		category: {
			type: 'string',
			nullable: true,
			description: 'Use `null` to reset the category.',
		},
		aliases: { type: 'array', items: {
			type: 'string',
		} },
	},
	required: ['id', 'name', 'aliases'],
} as const;

// TODO: ロジックをサービスに切り出す

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.emojisRepository)
		private emojisRepository: EmojisRepository,

		private emojiEntityService: EmojiEntityService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const emoji = await this.emojisRepository.findOneBy({ id: ps.id });
			const emojiname = await this.emojisRepository.findOneBy({name:ps.name})
			if (emoji == null) throw new ApiError(meta.errors.noSuchEmoji);
			if (ps.name.match(/^[a-zA-Z0-9_]+$/)) == null) throw new ApiError(meta.errors.inappropriateEmojiName);
			if (emojiname != null) throw new ApiError(meta.errors.alreadyexistsemoji);
			await this.emojisRepository.update(emoji.id, {
				updatedAt: new Date(),
				name: ps.name,
				category: ps.category,
				aliases: ps.aliases,
			});

			await this.db.queryResultCache!.remove(['meta_emojis']);

			const updated = await this.emojiEntityService.pack(emoji.id);

			if (emoji.name === ps.name) {
				this.globalEventService.publishBroadcastStream('emojiUpdated', {
					emojis: [ updated ],
				});
			} else {
				this.globalEventService.publishBroadcastStream('emojiDeleted', {
					emojis: [ await this.emojiEntityService.pack(emoji) ],
				});

				this.globalEventService.publishBroadcastStream('emojiAdded', {
					emoji: updated,
				});	
			}
		});
	}
}
