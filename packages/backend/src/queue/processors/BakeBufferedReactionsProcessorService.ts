/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';
import { ReactionsBufferingService } from '@/core/ReactionsBufferingService.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type * as Bull from 'bullmq';

@Injectable()
export class BakeBufferedReactionsProcessorService {
	private logger: Logger;

	constructor(
		private reactionsBufferingService: ReactionsBufferingService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('bake-buffered-reactions');
	}

	@bindThis
	public async process(): Promise<void> {
		this.logger.info('Baking buffered reactions...');

		await this.reactionsBufferingService.bake();

		this.logger.succ('All buffered reactions baked.');
	}
}
