/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Config } from '@/config.js';
import type { ApDbResolverService } from '@/core/activitypub/ApDbResolverService.js';
import type { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import type { ApRequestService } from '@/core/activitypub/ApRequestService.js';
import { Resolver } from '@/core/activitypub/ApResolverService.js';
import type { IObject } from '@/core/activitypub/type.js';
import type { HttpRequestService } from '@/core/HttpRequestService.js';
import type { InstanceActorService } from '@/core/InstanceActorService.js';
import type { LoggerService } from '@/core/LoggerService.js';
import type { MetaService } from '@/core/MetaService.js';
import type { UtilityService } from '@/core/UtilityService.js';
import type { FederatedInstanceService } from '@/core/FederatedInstanceService.js';
import { bindThis } from '@/decorators.js';
import type {
	FollowRequestsRepository,
	MiMeta,
	NoteReactionsRepository,
	NotesRepository,
	PollsRepository,
	UsersRepository,
} from '@/models/_.js';

type MockResponse = {
	type: string;
	content: string;
};

export class MockResolver extends Resolver {
	#responseMap = new Map<string, MockResponse>();
	#remoteGetTrials: string[] = [];

	constructor(loggerService: LoggerService) {
		super(
			{} as Config,
			{} as MiMeta,
			{} as UsersRepository,
			{} as NotesRepository,
			{} as PollsRepository,
			{} as NoteReactionsRepository,
			{} as FollowRequestsRepository,
			{} as UtilityService,
			{} as InstanceActorService,
			{} as ApRequestService,
			{} as HttpRequestService,
			{} as ApRendererService,
			{} as ApDbResolverService,
			{} as FederatedInstanceService,
			loggerService,
		);
	}

	public register(uri: string, content: string | Record<string, any>, type = 'application/activity+json'): void {
		this.#responseMap.set(uri, {
			type,
			content: typeof content === 'string' ? content : JSON.stringify(content),
		});
	}

	public clear(): void {
		this.#responseMap.clear();
		this.#remoteGetTrials.length = 0;
	}

	public remoteGetTrials(): string[] {
		return this.#remoteGetTrials;
	}

	@bindThis
	public async resolve(value: string | IObject): Promise<IObject> {
		if (typeof value !== 'string') return value;

		this.#remoteGetTrials.push(value);
		const r = this.#responseMap.get(value);

		if (!r) {
			throw new Error('Not registed for mock');
		}

		const object = JSON.parse(r.content);

		return object;
	}
}
