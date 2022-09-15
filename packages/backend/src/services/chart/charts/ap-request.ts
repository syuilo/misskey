import { Injectable, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppLockService } from '@/services/AppLockService.js';
import { DI } from '@/di-symbols.js';
import Chart from '../core.js';
import { name, schema } from './entities/ap-request.js';
import type { KVs } from '../core.js';

/**
 * Chart about ActivityPub requests
 */
// eslint-disable-next-line import/no-default-export
@Injectable()
export default class ApRequestChart extends Chart<typeof schema> {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		private appLockService: AppLockService,
	) {
		super(db, appLockService.getChartInsertLock, name, schema);
	}

	protected async tickMajor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	public async deliverSucc(): Promise<void> {
		await this.commit({
			'deliverSucceeded': 1,
		});
	}

	public async deliverFail(): Promise<void> {
		await this.commit({
			'deliverFailed': 1,
		});
	}

	public async inbox(): Promise<void> {
		await this.commit({
			'inboxReceived': 1,
		});
	}
}
