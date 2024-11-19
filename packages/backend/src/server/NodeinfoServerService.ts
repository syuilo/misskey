/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { MetaService } from '@/core/MetaService.js';
import { MAX_NOTE_TEXT_LENGTH } from '@/const.js';
import { MemorySingleCache } from '@/misc/cache.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import NotesChart from '@/core/chart/charts/notes.js';
import UsersChart from '@/core/chart/charts/users.js';
import { DEFAULT_POLICIES } from '@/core/RoleService.js';
import type { FastifyInstance, FastifyPluginOptions } from 'fastify';

const nodeinfo2_1path = '/nodeinfo/2.1';
const nodeinfo2_0path = '/nodeinfo/2.0';
const nodeinfo_homepage = 'https://misskey-hub.net';

@Injectable()
export class NodeinfoServerService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		private userEntityService: UserEntityService,
		private metaService: MetaService,
		private notesChart: NotesChart,
		private usersChart: UsersChart,
	) {
		//this.createServer = this.createServer.bind(this);
	}

	@bindThis
	public getLinks() {
		return [{
			rel: 'http://nodeinfo.diaspora.software/ns/schema/2.1',
			href: this.config.url + nodeinfo2_1path,
		}, {
			rel: 'http://nodeinfo.diaspora.software/ns/schema/2.0',
			href: this.config.url + nodeinfo2_0path,
		}];
	}

	@bindThis
	public createServer(fastify: FastifyInstance, options: FastifyPluginOptions, done: (err?: Error) => void) {
		const nodeinfo2 = async (version: number) => {
			const now = Date.now();

			const notesChart = await this.notesChart.getChart('hour', 1, null);
			const localPosts = notesChart.local.total[0];

			const usersChart = await this.usersChart.getChart('hour', 1, null);
			const total = usersChart.local.total[0];

			const [
				meta,
				//activeHalfyear,
				//activeMonth,
			] = await Promise.all([
				this.metaService.fetch(true),
				// 重い
				//this.usersRepository.count({ where: { host: IsNull(), lastActiveDate: MoreThan(new Date(now - 15552000000)) } }),
				//this.usersRepository.count({ where: { host: IsNull(), lastActiveDate: MoreThan(new Date(now - 2592000000)) } }),
			]);

			const activeHalfyear = null;
			const activeMonth = null;

			const proxyAccount = meta.proxyAccountId ? await this.userEntityService.pack(meta.proxyAccountId).catch(() => null) : null;

			const basePolicies = { ...DEFAULT_POLICIES, ...meta.policies };

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const document: any = {
				software: {
					name: 'misskey',
					version: this.config.version,
					homepage: nodeinfo_homepage,
					repository: meta.repositoryUrl,
				},
				protocols: ['activitypub'],
				services: {
					inbound: [] as string[],
					outbound: ['atom1.0', 'rss2.0'],
				},
				openRegistrations: !meta.disableRegistration,
				usage: {
					users: { total, activeHalfyear, activeMonth },
					localPosts,
					localComments: 0,
				},
				metadata: {
					/**
					 * '00': Draft, RSA only
					 * '01': Draft, Ed25519 suported
					 * '11': RFC 9421, Ed25519 supported
					 */
					httpMessageSignaturesImplementationLevel: '01',

					nodeName: meta.name,
					nodeDescription: meta.description,
					nodeAdmins: [{
						name: meta.maintainerName,
						email: meta.maintainerEmail,
					}],
					// deprecated
					maintainer: {
						name: meta.maintainerName,
						email: meta.maintainerEmail,
					},
					langs: meta.langs,
					tosUrl: meta.termsOfServiceUrl,
					privacyPolicyUrl: meta.privacyPolicyUrl,
					inquiryUrl: meta.inquiryUrl,
					impressumUrl: meta.impressumUrl,
					repositoryUrl: meta.repositoryUrl,
					feedbackUrl: meta.feedbackUrl,
					disableRegistration: meta.disableRegistration,
					disableLocalTimeline: !basePolicies.ltlAvailable,
					disableGlobalTimeline: !basePolicies.gtlAvailable,
					emailRequiredForSignup: meta.emailRequiredForSignup,
					enableHcaptcha: meta.enableHcaptcha,
					enableRecaptcha: meta.enableRecaptcha,
					enableMcaptcha: meta.enableMcaptcha,
					enableTurnstile: meta.enableTurnstile,
					maxNoteTextLength: MAX_NOTE_TEXT_LENGTH,
					enableEmail: meta.enableEmail,
					enableServiceWorker: meta.enableServiceWorker,
					proxyAccountName: proxyAccount ? proxyAccount.username : null,
					themeColor: meta.themeColor ?? '#86b300',
				},
			};
			if (version >= 21) {
				document.software.repository = meta.repositoryUrl;
				document.software.homepage = meta.repositoryUrl;
			}
			return document;
		};

		const cache = new MemorySingleCache<Awaited<ReturnType<typeof nodeinfo2>>>(1000 * 60 * 10); // 10m

		fastify.get(nodeinfo2_1path, async (request, reply) => {
			const base = await cache.fetch(() => nodeinfo2(21));

			reply
				.type(
					'application/json; profile="http://nodeinfo.diaspora.software/ns/schema/2.1#"',
				)
				.header('Cache-Control', 'public, max-age=600')
				.header('Access-Control-Allow-Headers', 'Accept')
				.header('Access-Control-Allow-Methods', 'GET, OPTIONS')
				.header('Access-Control-Allow-Origin', '*')
				.header('Access-Control-Expose-Headers', 'Vary');
			return { version: '2.1', ...base };
		});

		fastify.get(nodeinfo2_0path, async (request, reply) => {
			const base = await cache.fetch(() => nodeinfo2(20));

			delete (base as any).software.repository;

			reply
				.type(
					'application/json; profile="http://nodeinfo.diaspora.software/ns/schema/2.0#"',
				)
				.header('Cache-Control', 'public, max-age=600')
				.header('Access-Control-Allow-Headers', 'Accept')
				.header('Access-Control-Allow-Methods', 'GET, OPTIONS')
				.header('Access-Control-Allow-Origin', '*')
				.header('Access-Control-Expose-Headers', 'Vary');
			return { version: '2.0', ...base };
		});

		done();
	}
}
