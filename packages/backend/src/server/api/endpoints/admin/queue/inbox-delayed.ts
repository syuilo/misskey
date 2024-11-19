/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { URL } from 'node:url';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { InboxQueue } from '@/core/QueueModule.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:queue',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'array',
			optional: false, nullable: false,
			prefixItems: [
				{
					type: 'string',
				},
				{
					type: 'number',
				},
			],
			unevaluatedItems: false,
		},
		example: [[
			'example.com',
			12,
		]],
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject('queue:inbox') public inboxQueue: InboxQueue,
	) {
		super(meta, paramDef, async (ps, me) => {
			const jobs = await this.inboxQueue.getJobs(['delayed']);

			const res = [] as [string, number][];

			for (const job of jobs) {
				const signature = job.data.signature ? 'version' in job.data.signature ? job.data.signature.value : job.data.signature : null;
				const host = signature ? Array.isArray(signature) ? 'TODO' : new URL(signature.keyId).host : new URL(job.data.activity.actor).host;
				if (res.find(x => x[0] === host)) {
					res.find(x => x[0] === host)![1]++;
				} else {
					res.push([host, 1]);
				}
			}

			res.sort((a, b) => b[1] - a[1]);

			return res;
		});
	}
}
