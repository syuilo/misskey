/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { MiUser } from '@/models/User.js';
import { AppLockService } from '@/core/AppLockService.js';
import { addTime, dateUTC, subtractTime } from '@/misc/prelude/time.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import Chart from '../core.js';
import { ChartLoggerService } from '../ChartLoggerService.js';
import { name, schema } from './entities/per-user-pv.js';
import type { KVs } from '../core.js';

/**
 * ユーザーごとのプロフィール被閲覧数に関するチャート
 */
@Injectable()
export default class PerUserPvChart extends Chart<typeof schema> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		private appLockService: AppLockService,
		private chartLoggerService: ChartLoggerService,
	) {
		super(db, (k) => appLockService.getChartInsertLock(k), chartLoggerService.logger, name, schema, true);
	}

	protected async tickMajor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	@bindThis
	public async commitByUser(user: { id: MiUser['id'] }, key: string): Promise<void> {
		await this.commit({
			'upv.user': [key],
			'pv.user': 1,
		}, user.id);
	}

	@bindThis
	public async commitByVisitor(user: { id: MiUser['id'] }, key: string): Promise<void> {
		await this.commit({
			'upv.visitor': [key],
			'pv.visitor': 1,
		}, user.id);
	}

	@bindThis
	public async getUsersRanking(span: 'hour' | 'day', order: 'ASC' | 'DESC', amount: number, cursor: Date | null, limit = 0, offset = 0): Promise<{ userId: string; count: number; }[]> {
		const [y, m, d, h, _m, _s, _ms] = cursor ? Chart.parseDate(subtractTime(addTime(cursor, 1, span), 1)) : Chart.getCurrentDate();
		const [y2, m2, d2, h2] = cursor ? Chart.parseDate(addTime(cursor, 1, span)) : [] as never;

		const lt = dateUTC([y, m, d, h, _m, _s, _ms]);

		const gt =
			span === 'day' ? subtractTime(cursor ? dateUTC([y2, m2, d2, 0]) : dateUTC([y, m, d, 0]), amount - 1, 'day') :
			span === 'hour' ? subtractTime(cursor ? dateUTC([y2, m2, d2, h2]) : dateUTC([y, m, d, h]), amount - 1, 'hour') :
				new Error('not happen') as never;

		const repository =
			span === 'hour' ? this.repositoryForHour :
			span === 'day' ? this.repositoryForDay :
				new Error('not happen') as never;

		// ログ取得
		return await repository.createQueryBuilder()
			.select('"group" as "userId", sum("___upv_user" + "___upv_visitor") as "count"')
			.where('date BETWEEN :gt AND :lt', { gt: Chart.dateToTimestamp(gt), lt: Chart.dateToTimestamp(lt) })
			.groupBy('"userId"')
			.orderBy('"count"', order)
			.offset(offset)
			.limit(limit)
			.getRawMany<{ userId: string, count: number }>();
	}
}
