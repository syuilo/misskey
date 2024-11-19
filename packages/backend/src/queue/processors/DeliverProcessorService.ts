/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Bull from 'bullmq';
import { Not } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { InstancesRepository, MiMeta } from '@/models/_.js';
import type Logger from '@/logger.js';
import { ApRequestService } from '@/core/activitypub/ApRequestService.js';
import { FederatedInstanceService } from '@/core/FederatedInstanceService.js';
import { FetchInstanceMetadataService } from '@/core/FetchInstanceMetadataService.js';
import { MemorySingleCache } from '@/misc/cache.js';
import type { MiInstance } from '@/models/Instance.js';
import InstanceChart from '@/core/chart/charts/instance.js';
import ApRequestChart from '@/core/chart/charts/ap-request.js';
import FederationChart from '@/core/chart/charts/federation.js';
import { StatusError } from '@/misc/status-error.js';
import { UtilityService } from '@/core/UtilityService.js';
import { bindThis } from '@/decorators.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type { DeliverJobData } from '../types.js';

@Injectable()
export class DeliverProcessorService {
	private logger: Logger;
	private suspendedHostsCache: MemorySingleCache<MiInstance[]>;
	private latest: string | null;

	constructor(
		@Inject(DI.meta)
		private meta: MiMeta,

		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		private utilityService: UtilityService,
		private federatedInstanceService: FederatedInstanceService,
		private fetchInstanceMetadataService: FetchInstanceMetadataService,
		private apRequestService: ApRequestService,
		private instanceChart: InstanceChart,
		private apRequestChart: ApRequestChart,
		private federationChart: FederationChart,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('deliver');
		this.suspendedHostsCache = new MemorySingleCache<MiInstance[]>(1000 * 60 * 60); // 1h
	}

	@bindThis
	public async process(job: Bull.Job<DeliverJobData>): Promise<string> {
		const { host } = new URL(job.data.to);

		if (!this.utilityService.isFederationAllowedUri(job.data.to)) {
			return 'skip (blocked)';
		}

		// isSuspendedなら中断
		let suspendedHosts = this.suspendedHostsCache.get();
		if (suspendedHosts == null) {
			suspendedHosts = await this.instancesRepository.find({
				where: {
					suspensionState: Not('none'),
				},
			});
			this.suspendedHostsCache.set(suspendedHosts);
		}
		if (suspendedHosts.map(x => x.host).includes(this.utilityService.toPuny(host))) {
			return 'skip (suspended)';
		}

		try {
			const server = await (this.meta.enableStatsForFederatedInstances
				? this.federatedInstanceService.fetchOrRegister(host)
				: this.federatedInstanceService.fetch(host));

			await this.apRequestService.signedPost(
				job.data.user,
				job.data.to,
				job.data.content,
				server?.httpMessageSignaturesImplementationLevel ?? '00',
				job.data.digest,
				job.data.privateKey,
			);

			// Update stats
			this.apRequestChart.deliverSucc();
			this.federationChart.deliverd(host, true);

			if (server == null) return 'Success';

			if (server.isNotResponding) {
				this.federatedInstanceService.update(server.id, {
					isNotResponding: false,
					notRespondingSince: null,
				});
			}

			if (this.meta.enableChartsForFederatedInstances) {
				this.instanceChart.requestSent(server.host, true);
			}

			return 'Success';
		} catch (res) {
			this.apRequestChart.deliverFail();
			this.federationChart.deliverd(host, false);

			// Update instance stats
			this.federatedInstanceService.fetchOrRegister(host).then(i => {
				if (!i.isNotResponding) {
					this.federatedInstanceService.update(i.id, {
						isNotResponding: true,
						notRespondingSince: new Date(),
					});
				} else if (i.notRespondingSince) {
					// 1週間以上不通ならサスペンド
					if (i.suspensionState === 'none' && i.notRespondingSince.getTime() <= Date.now() - 1000 * 60 * 60 * 24 * 7) {
						this.federatedInstanceService.update(i.id, {
							suspensionState: 'autoSuspendedForNotResponding',
						});
					}
				} else {
					// isNotRespondingがtrueでnotRespondingSinceがnullの場合はnotRespondingSinceをセット
					// notRespondingSinceは新たな機能なので、それ以前のデータにはnotRespondingSinceがない場合がある
					this.federatedInstanceService.update(i.id, {
						notRespondingSince: new Date(),
					});
				}

				if (this.meta.enableChartsForFederatedInstances) {
					this.instanceChart.requestSent(i.host, false);
				}
			});

			if (res instanceof StatusError) {
				if (res.statusCode === 401) {
					// 401 Unauthorized: this may be caused by a time difference between the server and the target server.
					// Let the job be retried.
					throw new Error(`${res.statusCode} ${res.statusMessage}\n* 401 may be caused by a time difference between the server and the target server.`);
				}
				// 4xx
				if (!res.isRetryable) {
					// 相手が閉鎖していることを明示しているため、配送停止する
					if (job.data.isSharedInbox && res.statusCode === 410) {
						this.federatedInstanceService.fetchOrRegister(host).then(i => {
							this.federatedInstanceService.update(i.id, {
								suspensionState: 'goneSuspended',
							});
						});
						throw new Bull.UnrecoverableError(`${host} is gone`);
					}
					throw new Bull.UnrecoverableError(`${res.statusCode} ${res.statusMessage}`);
				}

				// 5xx etc.
				throw new Error(`${res.statusCode} ${res.statusMessage}`);
			} else {
				// DNS error, socket error, timeout ...
				throw res;
			}
		}
	}
}
