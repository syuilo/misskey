import { Injectable, Inject } from '@nestjs/common';
import type { AppLockService } from '@/services/AppLockService.js';
import { DI_SYMBOLS } from '@/di-symbols.js';
import Chart from '../core.js';
import { name, schema } from './entities/test-intersection.js';
import type { DataSource , DataSource } from 'typeorm';
import type { KVs } from '../core.js';

/**
 * For testing
 */
// eslint-disable-next-line import/no-default-export
@Injectable()
export default class TestIntersectionChart extends Chart<typeof schema> {
	constructor(
		@Inject(DI_SYMBOLS.db)
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

	public async addA(key: string): Promise<void> {
		await this.commit({
			a: [key],
		});
	}

	public async addB(key: string): Promise<void> {
		await this.commit({
			b: [key],
		});
	}
}
