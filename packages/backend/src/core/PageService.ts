/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import _Ajv from 'ajv';
import { type PagesRepository } from '@/models/_.js';
import { pageBlockSchema } from '@/models/Page.js';

/**
 * ページ関係のService
 */
@Injectable()
export class PageService {
	constructor(
		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,
	) {
	}

	/**
	 * ページのコンテンツを検証する.
	 * @param content コンテンツ
	 */
	public validatePageContent(content: unknown[]) {
		const Ajv = _Ajv.default;
		const ajv = new Ajv({
			useDefaults: true,
		});
		ajv.addFormat('misskey:id', /^[a-zA-Z0-9]+$/);
		const validator = ajv.compile({
			type: 'array',
			items: pageBlockSchema,
		});
		const valid = validator(content);

		if (valid) {
			return {
				valid: true,
				errors: [],
			};
		} else {
			return {
				valid: false,
				errors: validator.errors,
			};
		}
	}

	/**
	 * 人気のあるページ一覧を取得する.
	 */
	public async featured(opts?: { offset?: number, limit: number }) {
		const builder = this.pagesRepository.createQueryBuilder('page')
			.andWhere('page.likedCount > 0')
			.andWhere('page.visibility = :visibility', { visibility: 'public' })
			.addOrderBy('page.likedCount', 'DESC')
			.addOrderBy('page.updatedAt', 'DESC')
			.addOrderBy('page.id', 'DESC');

		if (opts?.offset) {
			builder.skip(opts.offset);
		}

		builder.take(opts?.limit ?? 10);

		return await builder.getMany();
	}
}
