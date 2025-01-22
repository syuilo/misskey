/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import type { DriveFilesRepository, PagesRepository } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { MiPage, pageNameSchema } from '@/models/Page.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { PageService } from '@/core/PageService.js';
import { PageEntityService } from '@/core/entities/PageEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';
import { MAX_PAGE_CONTENT_BYTES } from '@/const.js';

export const meta = {
	tags: ['pages'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:pages',

	limit: {
		duration: ms('1hour'),
		max: 10,
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Page',
	},

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'b7b97489-0f66-4b12-a5ff-b21bd63f6e1c',
		},
		nameAlreadyExists: {
			message: 'Specified name already exists.',
			code: 'NAME_ALREADY_EXISTS',
			id: '4650348e-301c-499a-83c9-6aa988c66bc1',
		},
		contentTooLarge: {
			message: 'Content is too large.',
			code: 'CONTENT_TOO_LARGE',
			id: '2a93fcc9-4cd7-4885-9e5b-be56ed8f4d4f',
		},
		invalidParam: {
			message: 'Invalid param.',
			code: 'INVALID_PARAM',
			id: '3d81ceae-475f-4600-b2a8-2bc116157532',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		title: { type: 'string' },
		name: { ...pageNameSchema, minLength: 1 },
		summary: { type: 'string', nullable: true },
		content: { type: 'array', items: {
			// misskey-jsの型生成に対応していないスキーマを使用しているため別途バリデーションする
			type: 'object', additionalProperties: true,
		} },
		variables: { type: 'array', items: {
			type: 'object', additionalProperties: true,
		} },
		script: { type: 'string' },
		eyeCatchingImageId: { type: 'string', format: 'misskey:id', nullable: true },
		font: { type: 'string', enum: ['serif', 'sans-serif'], default: 'sans-serif' },
		alignCenter: { type: 'boolean', default: false },
		hideTitleWhenPinned: { type: 'boolean', default: false },
	},
	required: ['title', 'name', 'content'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private pageService: PageService,
		private pageEntityService: PageEntityService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			if (new Blob([JSON.stringify(ps.content)]).size > MAX_PAGE_CONTENT_BYTES) {
				throw new ApiError(meta.errors.contentTooLarge);
			}

			const validateResult = this.pageService.validatePageContent(ps.content);
			if (!validateResult.valid) {
				const errors = validateResult.errors!;
				throw new ApiError(meta.errors.invalidParam, {
					param: errors[0].schemaPath,
					reason: errors[0].message,
				});
			}

			let eyeCatchingImage = null;
			if (ps.eyeCatchingImageId != null) {
				eyeCatchingImage = await this.driveFilesRepository.findOneBy({
					id: ps.eyeCatchingImageId,
					userId: me.id,
				});

				if (eyeCatchingImage == null) {
					throw new ApiError(meta.errors.noSuchFile);
				}
			}

			await this.pagesRepository.findBy({
				userId: me.id,
				name: ps.name,
			}).then(result => {
				if (result.length > 0) {
					throw new ApiError(meta.errors.nameAlreadyExists);
				}
			});

			const page = await this.pagesRepository.insertOne(new MiPage({
				id: this.idService.gen(),
				updatedAt: new Date(),
				title: ps.title,
				name: ps.name,
				summary: ps.summary,
				content: ps.content,
				//variables: ps.variables,  もう使用されていない（動的ページ）
				//script: ps.script,        もう使用されていない（動的ページ）
				eyeCatchingImageId: eyeCatchingImage ? eyeCatchingImage.id : null,
				userId: me.id,
				visibility: 'public',
				alignCenter: ps.alignCenter,
				hideTitleWhenPinned: ps.hideTitleWhenPinned,
				font: ps.font,
			}));

			return await this.pageEntityService.pack(page);
		});
	}
}
