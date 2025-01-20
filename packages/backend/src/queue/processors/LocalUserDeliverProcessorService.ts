/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { Config } from '@/config.js';
import { bindThis } from '@/decorators.js';
import { DI } from '@/di-symbols.js';
import type Logger from '@/logger.js';
import type { LocalUserDeliverJobData } from '@/queue/types.js';
import { NoteCreateService } from '@/core/NoteCreateService.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type * as Bull from 'bullmq';

@Injectable()
export class LocalUserDeliverProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		private noteCreateService: NoteCreateService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('clean');
	}

	@bindThis
	public async process(job: Bull.Job<LocalUserDeliverJobData>): Promise<void> {
		try {
			switch (job.data.type) {
				case 'postNoteCreated': {
					const data = job.data;
					await this.noteCreateService.postNoteCreated(data.data);
					break;
				}
			}
		} catch (e) {
			if (e instanceof Error) {
				this.logger.error(`Failed to process job. ${job.data}`, e);
			}

			this.logger.error(`Failed to process. ${job.data}`, new Error(`unknown: ${e}`));
		}
	}
}
