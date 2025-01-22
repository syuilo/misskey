/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Not } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { PagesRepository, DriveFilesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';
import { MAX_PAGE_CONTENT_BYTES } from '@/const.js';
import { pageNameSchema } from '@/models/Page.js';
import { PageService } from '@/core/PageService.js';

export const meta = {
	tags: ['pages'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:pages',

	limit: {
		duration: ms('1hour'),
		max: 300,
	},

	errors: {
		noSuchPage: {
			message: 'No such page.',
			code: 'NO_SUCH_PAGE',
			id: '21149b9e-3616-4778-9592-c4ce89f5a864',
		},

		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '3c15cd52-3b4b-4274-967d-6456fc4f792b',
		},

		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'cfc23c7c-3887-490e-af30-0ed576703c82',
		},
		nameAlreadyExists: {
			message: 'Specified name already exists.',
			code: 'NAME_ALREADY_EXISTS',
			id: '2298a392-d4a1-44c5-9ebb-ac1aeaa5a9ab',
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
		pageId: { type: 'string', format: 'misskey:id' },
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
		font: { type: 'string', enum: ['serif', 'sans-serif'] },
		alignCenter: { type: 'boolean' },
		hideTitleWhenPinned: { type: 'boolean' },
	},
	required: ['pageId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private pageService: PageService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const page = await this.pagesRepository.findOneBy({ id: ps.pageId });
			if (page == null) {
				throw new ApiError(meta.errors.noSuchPage);
			}
			if (page.userId !== me.id) {
				throw new ApiError(meta.errors.accessDenied);
			}

			if (ps.content != null) {
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
			}

			if (ps.eyeCatchingImageId != null) {
				const eyeCatchingImage = await this.driveFilesRepository.findOneBy({
					id: ps.eyeCatchingImageId,
					userId: me.id,
				});

				if (eyeCatchingImage == null) {
					throw new ApiError(meta.errors.noSuchFile);
				}
			}

			if (ps.name != null) {
				await this.pagesRepository.findBy({
					id: Not(ps.pageId),
					userId: me.id,
					name: ps.name,
				}).then(result => {
					if (result.length > 0) {
						throw new ApiError(meta.errors.nameAlreadyExists);
					}
				});
			}

			await this.pagesRepository.update(page.id, {
				updatedAt: new Date(),
				title: ps.title,
				name: ps.name,
				summary: ps.summary === undefined ? page.summary : ps.summary,
				content: ps.content,
				//variables: ps.variables,  もう使用されていない（動的ページ）
				//script: ps.script,        もう使用されていない（動的ページ）
				alignCenter: ps.alignCenter,
				hideTitleWhenPinned: ps.hideTitleWhenPinned,
				font: ps.font,
				eyeCatchingImageId: ps.eyeCatchingImageId,
			});
		});
	}
}
