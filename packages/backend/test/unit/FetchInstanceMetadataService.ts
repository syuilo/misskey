/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import { jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { Redis } from 'ioredis';
import type { TestingModule } from '@nestjs/testing';
import { GlobalModule } from '@/GlobalModule.js';
import { FetchInstanceMetadataService } from '@/core/FetchInstanceMetadataService.js';
import { FederatedInstanceService } from '@/core/FederatedInstanceService.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { UtilityService } from '@/core/UtilityService.js';
import { IdService } from '@/core/IdService.js';
import { DI } from '@/di-symbols.js';

function mockRedis() {
	const hash = {} as any;
	const set = jest.fn((key: string, value) => {
		const ret = hash[key];
		hash[key] = value;
		return ret;
	});
	return set;
}

describe('FetchInstanceMetadataService', () => {
	let app: TestingModule;
	let fetchInstanceMetadataService: jest.Mocked<FetchInstanceMetadataService>;
	let federatedInstanceService: jest.Mocked<FederatedInstanceService>;
	let httpRequestService: jest.Mocked<HttpRequestService>;
	let redisClient: jest.Mocked<Redis>;

	beforeEach(async () => {
		app = await Test
			.createTestingModule({
				imports: [
					GlobalModule,
				],
				providers: [
					FetchInstanceMetadataService,
					LoggerService,
					UtilityService,
					IdService,
				],
			})
			.useMocker((token) => {
				if (token === HttpRequestService) {
					return { getJson: jest.fn(), getHtml: jest.fn(), send: jest.fn() };
				} else if (token === FederatedInstanceService) {
					return { fetchOrRegister: jest.fn() };
				} else if (token === DI.redis) {
					return mockRedis;
				}
				return null;
			})
			.compile();

		app.enableShutdownHooks();

		fetchInstanceMetadataService = app.get<FetchInstanceMetadataService>(FetchInstanceMetadataService) as jest.Mocked<FetchInstanceMetadataService>;
		federatedInstanceService = app.get<FederatedInstanceService>(FederatedInstanceService) as jest.Mocked<FederatedInstanceService>;
		redisClient = app.get<Redis>(DI.redis) as jest.Mocked<Redis>;
		httpRequestService = app.get<HttpRequestService>(HttpRequestService) as jest.Mocked<HttpRequestService>;
	});

	afterEach(async () => {
		await app.close();
	});

	test('Lock and update', async () => {
		redisClient.set = mockRedis();
		const now = Date.now();
		federatedInstanceService.fetchOrRegister.mockResolvedValue({ infoUpdatedAt: new Date(now - 10 * 1000 * 60 * 60 * 24) } as any);
		httpRequestService.getJson.mockImplementation(() => { throw Error(); });
		const tryLockSpy = jest.spyOn(fetchInstanceMetadataService, 'tryLock');
		const unlockSpy = jest.spyOn(fetchInstanceMetadataService, 'unlock');

		await fetchInstanceMetadataService.fetchInstanceMetadata({ host: 'example.com' } as any);
		expect(federatedInstanceService.fetchOrRegister).toHaveBeenCalledTimes(1);
		expect(tryLockSpy).toHaveBeenCalledTimes(1);
		expect(unlockSpy).toHaveBeenCalledTimes(1);
		expect(httpRequestService.getJson).toHaveBeenCalled();
	});

	test('Don\'t lock and update if recently updated', async () => {
		redisClient.set = mockRedis();
		federatedInstanceService.fetchOrRegister.mockResolvedValue({ infoUpdatedAt: new Date() } as any);
		httpRequestService.getJson.mockImplementation(() => { throw Error(); });
		const tryLockSpy = jest.spyOn(fetchInstanceMetadataService, 'tryLock');
		const unlockSpy = jest.spyOn(fetchInstanceMetadataService, 'unlock');

		await fetchInstanceMetadataService.fetchInstanceMetadata({ host: 'example.com' } as any);
		expect(federatedInstanceService.fetchOrRegister).toHaveBeenCalledTimes(1);
		expect(tryLockSpy).toHaveBeenCalledTimes(0);
		expect(unlockSpy).toHaveBeenCalledTimes(0);
		expect(httpRequestService.getJson).toHaveBeenCalledTimes(0);
	});

	test('Do nothing when lock not acquired', async () => {
		redisClient.set = mockRedis();
		const now = Date.now();
		federatedInstanceService.fetchOrRegister.mockResolvedValue({ infoUpdatedAt: new Date(now - 10 * 1000 * 60 * 60 * 24) } as any);
		httpRequestService.getJson.mockImplementation(() => { throw Error(); });
		await fetchInstanceMetadataService.tryLock('example.com');
		const tryLockSpy = jest.spyOn(fetchInstanceMetadataService, 'tryLock');
		const unlockSpy = jest.spyOn(fetchInstanceMetadataService, 'unlock');

		await fetchInstanceMetadataService.fetchInstanceMetadata({ host: 'example.com' } as any);
		expect(federatedInstanceService.fetchOrRegister).toHaveBeenCalledTimes(1);
		expect(tryLockSpy).toHaveBeenCalledTimes(1);
		expect(unlockSpy).toHaveBeenCalledTimes(0);
		expect(httpRequestService.getJson).toHaveBeenCalledTimes(0);
	});

	test('Do when forced', async () => {
		redisClient.set = mockRedis();
		const now = Date.now();
		federatedInstanceService.fetchOrRegister.mockResolvedValue({ infoUpdatedAt: new Date(now - 10 * 1000 * 60 * 60 * 24) } as any);
		httpRequestService.getJson.mockImplementation(() => { throw Error(); });
		await fetchInstanceMetadataService.tryLock('example.com');
		const tryLockSpy = jest.spyOn(fetchInstanceMetadataService, 'tryLock');
		const unlockSpy = jest.spyOn(fetchInstanceMetadataService, 'unlock');

		await fetchInstanceMetadataService.fetchInstanceMetadata({ host: 'example.com' } as any, true);
		expect(federatedInstanceService.fetchOrRegister).toHaveBeenCalledTimes(0);
		expect(tryLockSpy).toHaveBeenCalledTimes(0);
		expect(unlockSpy).toHaveBeenCalledTimes(1);
		expect(httpRequestService.getJson).toHaveBeenCalled();
	});
});
