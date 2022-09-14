import { Inject, Injectable } from '@nestjs/common';
import { IsNull, MoreThan } from 'typeorm';
import { DI_SYMBOLS } from '@/di-symbols.js';
import type { Webhooks } from '@/models/index.js';
import { Config } from '@/config/types.js';
import type Logger from '@/logger.js';
import { HttpRequestService } from '@/services/HttpRequestService.js';
import { StatusError } from '@/misc/status-error.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type Bull from 'bull';
import type { WebhookDeliverJobData } from '../types.js';

@Injectable()
export class WebhookDeliverProcessorService {
	#logger: Logger;

	constructor(
		@Inject(DI_SYMBOLS.config)
		private config: Config,

		@Inject('webhooksRepository')
		private webhooksRepository: typeof Webhooks,

		private httpRequestService: HttpRequestService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.queueLoggerService.logger.createSubLogger('webhook');
	}

	public async process(job: Bull.Job<WebhookDeliverJobData>): Promise<string> {
		try {
			this.#logger.debug(`delivering ${job.data.webhookId}`);
	
			const res = await this.httpRequestService.getResponse({
				url: job.data.to,
				method: 'POST',
				headers: {
					'User-Agent': 'Misskey-Hooks',
					'X-Misskey-Host': this.config.host,
					'X-Misskey-Hook-Id': job.data.webhookId,
					'X-Misskey-Hook-Secret': job.data.secret,
				},
				body: JSON.stringify({
					hookId: job.data.webhookId,
					userId: job.data.userId,
					eventId: job.data.eventId,
					createdAt: job.data.createdAt,
					type: job.data.type,
					body: job.data.content,
				}),
			});
	
			this.webhooksRepository.update({ id: job.data.webhookId }, {
				latestSentAt: new Date(),
				latestStatus: res.status,
			});
	
			return 'Success';
		} catch (res) {
			this.webhooksRepository.update({ id: job.data.webhookId }, {
				latestSentAt: new Date(),
				latestStatus: res instanceof StatusError ? res.statusCode : 1,
			});
	
			if (res instanceof StatusError) {
				// 4xx
				if (res.isClientError) {
					return `${res.statusCode} ${res.statusMessage}`;
				}
	
				// 5xx etc.
				throw `${res.statusCode} ${res.statusMessage}`;
			} else {
				// DNS error, socket error, timeout ...
				throw res;
			}
		}
	}
}
