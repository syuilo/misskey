/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, beforeAll, describe, test } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { CustomEmojiService } from '@/core/CustomEmojiService.js';
import { EmojiEntityService } from '@/core/entities/EmojiEntityService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { IdService } from '@/core/IdService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { UtilityService } from '@/core/UtilityService.js';
import { DI } from '@/di-symbols.js';
import { GlobalModule } from '@/GlobalModule.js';
import { EmojisRepository } from '@/models/_.js';
import { MiEmoji } from '@/models/Emoji.js';

describe('CustomEmojiService', () => {
	let app: TestingModule;
	let service: CustomEmojiService;

	let emojisRepository: EmojisRepository;
	let idService: IdService;

	beforeAll(async () => {
		app = await Test
			.createTestingModule({
				imports: [
					GlobalModule,
				],
				providers: [
					CustomEmojiService,
					UtilityService,
					IdService,
					EmojiEntityService,
					ModerationLogService,
					GlobalEventService,
				],
			})
			.compile();
		app.enableShutdownHooks();

		service = app.get<CustomEmojiService>(CustomEmojiService);
		emojisRepository = app.get<EmojisRepository>(DI.emojisRepository);
		idService = app.get<IdService>(IdService);
	});

	describe('fetchEmojis', () => {
		async function insert(data: Partial<MiEmoji>[]) {
			for (const d of data) {
				const id = idService.gen();
				await emojisRepository.insert({
					id: id,
					updatedAt: new Date(),
					...d,
				});
			}
		}

		function call(params: Parameters<CustomEmojiService['fetchEmojis']>['0']) {
			return service.fetchEmojis(
				params,
				{
					// テスト向けに
					sortKeys: ['+id'],
				},
			);
		}

		function defaultData(suffix: string, override?: Partial<MiEmoji>): Partial<MiEmoji> {
			return {
				name: `emoji${suffix}`,
				host: null,
				category: 'default',
				originalUrl: `https://example.com/emoji${suffix}.png`,
				publicUrl: `https://example.com/emoji${suffix}.png`,
				type: 'image/png',
				aliases: [`emoji${suffix}`],
				license: 'CC0',
				isSensitive: false,
				localOnly: false,
				roleIdsThatCanBeUsedThisEmojiAsReaction: [],
				...override,
			};
		}

		afterEach(async () => {
			await emojisRepository.delete({});
		});

		describe('単独', () => {
			test('updatedAtFrom', async () => {
				await insert([
					defaultData('001', { updatedAt: new Date('2021-01-01T00:00:00.000Z') }),
					defaultData('002', { updatedAt: new Date('2021-01-02T00:00:00.000Z') }),
					defaultData('003', { updatedAt: new Date('2021-01-03T00:00:00.000Z') }),
				]);

				const actual = await call({
					query: {
						updatedAtFrom: '2021-01-02T00:00:00.000Z',
					},
				});

				expect(actual.allCount).toBe(2);
				expect(actual.emojis[0].name).toBe('emoji002');
				expect(actual.emojis[1].name).toBe('emoji003');
			});

			test('updatedAtTo', async () => {
				await insert([
					defaultData('001', { updatedAt: new Date('2021-01-01T00:00:00.000Z') }),
					defaultData('002', { updatedAt: new Date('2021-01-02T00:00:00.000Z') }),
					defaultData('003', { updatedAt: new Date('2021-01-03T00:00:00.000Z') }),
				]);

				const actual = await call({
					query: {
						updatedAtTo: '2021-01-02T00:00:00.000Z',
					},
				});

				expect(actual.allCount).toBe(2);
				expect(actual.emojis[0].name).toBe('emoji001');
				expect(actual.emojis[1].name).toBe('emoji002');
			});

			describe('name', () => {
				test('single', async () => {
					await insert([
						defaultData('001'),
						defaultData('002'),
					]);

					const actual = await call({
						query: {
							name: 'emoji001',
						},
					});

					expect(actual.allCount).toBe(1);
					expect(actual.emojis[0].name).toBe('emoji001');
				});

				test('multi', async () => {
					await insert([
						defaultData('001'),
						defaultData('002'),
					]);

					const actual = await call({
						query: {
							name: 'emoji001 emoji002',
						},
					});

					expect(actual.allCount).toBe(2);
					expect(actual.emojis[0].name).toBe('emoji001');
					expect(actual.emojis[1].name).toBe('emoji002');
				});

				test('keyword', async () => {
					await insert([
						defaultData('001'),
						defaultData('002'),
						defaultData('003', { name: 'em003' }),
					]);

					const actual = await call({
						query: {
							name: 'oji',
						},
					});

					expect(actual.allCount).toBe(2);
					expect(actual.emojis[0].name).toBe('emoji001');
					expect(actual.emojis[1].name).toBe('emoji002');
				});

				test('escape', async () => {
					await insert([
						defaultData('001'),
					]);

					const actual = await call({
						query: {
							name: '%',
						},
					});

					expect(actual.allCount).toBe(0);
				});
			});

			describe('host', () => {
				test('single', async () => {
					await insert([
						defaultData('001', { host: 'example.com' }),
						defaultData('002', { host: 'example.com' }),
						defaultData('003', { host: '1.example.com' }),
						defaultData('004', { host: '2.example.com' }),
					]);

					const actual = await call({
						query: {
							host: 'example.com',
							hostType: 'remote',
						},
					});

					expect(actual.allCount).toBe(4);
				});

				test('multi', async () => {
					await insert([
						defaultData('001', { host: 'example.com' }),
						defaultData('002', { host: 'example.com' }),
						defaultData('003', { host: '1.example.com' }),
						defaultData('004', { host: '2.example.com' }),
					]);

					const actual = await call({
						query: {
							host: '1.example.com 2.example.com',
							hostType: 'remote',
						},
					});

					expect(actual.allCount).toBe(2);
					expect(actual.emojis[0].name).toBe('emoji003');
					expect(actual.emojis[1].name).toBe('emoji004');
				});

				test('keyword', async () => {
					await insert([
						defaultData('001', { host: 'example.com' }),
						defaultData('002', { host: 'example.com' }),
						defaultData('003', { host: '1.example.com' }),
						defaultData('004', { host: '2.example.com' }),
					]);

					const actual = await call({
						query: {
							host: 'example',
							hostType: 'remote',
						},
					});

					expect(actual.allCount).toBe(4);
				});

				test('escape', async () => {
					await insert([
						defaultData('001', { host: 'example.com' }),
					]);

					const actual = await call({
						query: {
							host: '%',
							hostType: 'remote',
						},
					});

					expect(actual.allCount).toBe(0);
				});
			});

			describe('uri', () => {
				test('single', async () => {
					await insert([
						defaultData('001', { uri: 'uri001' }),
						defaultData('002', { uri: 'uri002' }),
						defaultData('003', { uri: 'uri003' }),
					]);

					const actual = await call({
						query: {
							uri: 'uri002',
						},
					});

					expect(actual.allCount).toBe(1);
					expect(actual.emojis[0].name).toBe('emoji002');
				});

				test('multi', async () => {
					await insert([
						defaultData('001', { uri: 'uri001' }),
						defaultData('002', { uri: 'uri002' }),
						defaultData('003', { uri: 'uri003' }),
					]);

					const actual = await call({
						query: {
							uri: 'uri001 uri003',
						},
					});

					expect(actual.allCount).toBe(2);
					expect(actual.emojis[0].name).toBe('emoji001');
					expect(actual.emojis[1].name).toBe('emoji003');
				});

				test('keyword', async () => {
					await insert([
						defaultData('001', { uri: 'uri001' }),
						defaultData('002', { uri: 'uri002' }),
						defaultData('003', { uri: 'uri003' }),
					]);

					const actual = await call({
						query: {
							uri: 'ri',
						},
					});

					expect(actual.allCount).toBe(3);
				});

				test('escape', async () => {
					await insert([
						defaultData('001', { uri: 'uri001' }),
					]);

					const actual = await call({
						query: {
							uri: '%',
						},
					});

					expect(actual.allCount).toBe(0);
				});
			});

			describe('publicUrl', () => {
				test('single', async () => {
					await insert([
						defaultData('001', { publicUrl: 'publicUrl001' }),
						defaultData('002', { publicUrl: 'publicUrl002' }),
						defaultData('003', { publicUrl: 'publicUrl003' }),
					]);

					const actual = await call({
						query: {
							publicUrl: 'publicUrl002',
						},
					});

					expect(actual.allCount).toBe(1);
					expect(actual.emojis[0].name).toBe('emoji002');
				});

				test('multi', async () => {
					await insert([
						defaultData('001', { publicUrl: 'publicUrl001' }),
						defaultData('002', { publicUrl: 'publicUrl002' }),
						defaultData('003', { publicUrl: 'publicUrl003' }),
					]);

					const actual = await call({
						query: {
							publicUrl: 'publicUrl001 publicUrl003',
						},
					});

					expect(actual.allCount).toBe(2);
					expect(actual.emojis[0].name).toBe('emoji001');
					expect(actual.emojis[1].name).toBe('emoji003');
				});

				test('keyword', async () => {
					await insert([
						defaultData('001', { publicUrl: 'publicUrl001' }),
						defaultData('002', { publicUrl: 'publicUrl002' }),
						defaultData('003', { publicUrl: 'publicUrl003' }),
					]);

					const actual = await call({
						query: {
							publicUrl: 'Url',
						},
					});

					expect(actual.allCount).toBe(3);
				});

				test('escape', async () => {
					await insert([
						defaultData('001', { publicUrl: 'publicUrl001' }),
					]);

					const actual = await call({
						query: {
							publicUrl: '%',
						},
					});

					expect(actual.allCount).toBe(0);
				});
			});

			describe('type', () => {
				test('single', async () => {
					await insert([
						defaultData('001', { type: 'type001' }),
						defaultData('002', { type: 'type002' }),
						defaultData('003', { type: 'type003' }),
					]);

					const actual = await call({
						query: {
							type: 'type002',
						},
					});

					expect(actual.allCount).toBe(1);
					expect(actual.emojis[0].name).toBe('emoji002');
				});

				test('multi', async () => {
					await insert([
						defaultData('001', { type: 'type001' }),
						defaultData('002', { type: 'type002' }),
						defaultData('003', { type: 'type003' }),
					]);

					const actual = await call({
						query: {
							type: 'type001 type003',
						},
					});

					expect(actual.allCount).toBe(2);
					expect(actual.emojis[0].name).toBe('emoji001');
					expect(actual.emojis[1].name).toBe('emoji003');
				});

				test('keyword', async () => {
					await insert([
						defaultData('001', { type: 'type001' }),
						defaultData('002', { type: 'type002' }),
						defaultData('003', { type: 'type003' }),
					]);

					const actual = await call({
						query: {
							type: 'pe',
						},
					});

					expect(actual.allCount).toBe(3);
				});

				test('escape', async () => {
					await insert([
						defaultData('001', { type: 'type001' }),
					]);

					const actual = await call({
						query: {
							type: '%',
						},
					});

					expect(actual.allCount).toBe(0);
				});
			});

			describe('aliases', () => {
				test('single', async () => {
					await insert([
						defaultData('001', { aliases: ['alias001', 'alias002'] }),
						defaultData('002', { aliases: ['alias002'] }),
						defaultData('003', { aliases: ['alias003'] }),
					]);

					const actual = await call({
						query: {
							aliases: 'alias002',
						},
					});

					expect(actual.allCount).toBe(2);
					expect(actual.emojis[0].name).toBe('emoji001');
					expect(actual.emojis[1].name).toBe('emoji002');
				});

				test('multi', async () => {
					await insert([
						defaultData('001', { aliases: ['alias001', 'alias002'] }),
						defaultData('002', { aliases: ['alias002', 'alias004'] }),
						defaultData('003', { aliases: ['alias003'] }),
						defaultData('004', { aliases: ['alias004'] }),
					]);

					const actual = await call({
						query: {
							aliases: 'alias001 alias004',
						},
					});

					expect(actual.allCount).toBe(3);
					expect(actual.emojis[0].name).toBe('emoji001');
					expect(actual.emojis[1].name).toBe('emoji002');
					expect(actual.emojis[2].name).toBe('emoji004');
				});

				test('keyword', async () => {
					await insert([
						defaultData('001', { aliases: ['alias001', 'alias002'] }),
						defaultData('002', { aliases: ['alias002', 'alias004'] }),
						defaultData('003', { aliases: ['alias003'] }),
						defaultData('004', { aliases: ['alias004'] }),
					]);

					const actual = await call({
						query: {
							aliases: 'ias',
						},
					});

					expect(actual.allCount).toBe(4);
				});

				test('escape', async () => {
					await insert([
						defaultData('001', { aliases: ['alias001', 'alias002'] }),
					]);

					const actual = await call({
						query: {
							aliases: '%',
						},
					});

					expect(actual.allCount).toBe(0);
				});
			});

			describe('category', () => {
				test('single', async () => {
					await insert([
						defaultData('001', { category: 'category001' }),
						defaultData('002', { category: 'category002' }),
						defaultData('003', { category: 'category003' }),
					]);

					const actual = await call({
						query: {
							category: 'category002',
						},
					});

					expect(actual.allCount).toBe(1);
					expect(actual.emojis[0].name).toBe('emoji002');
				});

				test('multi', async () => {
					await insert([
						defaultData('001', { category: 'category001' }),
						defaultData('002', { category: 'category002' }),
						defaultData('003', { category: 'category003' }),
					]);

					const actual = await call({
						query: {
							category: 'category001 category003',
						},
					});

					expect(actual.allCount).toBe(2);
					expect(actual.emojis[0].name).toBe('emoji001');
					expect(actual.emojis[1].name).toBe('emoji003');
				});

				test('keyword', async () => {
					await insert([
						defaultData('001', { category: 'category001' }),
						defaultData('002', { category: 'category002' }),
						defaultData('003', { category: 'category003' }),
					]);

					const actual = await call({
						query: {
							category: 'egory',
						},
					});

					expect(actual.allCount).toBe(3);
				});

				test('escape', async () => {
					await insert([
						defaultData('001', { category: 'category001' }),
					]);

					const actual = await call({
						query: {
							category: '%',
						},
					});

					expect(actual.allCount).toBe(0);
				});
			});

			describe('license', () => {
				test('single', async () => {
					await insert([
						defaultData('001', { license: 'license001' }),
						defaultData('002', { license: 'license002' }),
						defaultData('003', { license: 'license003' }),
					]);

					const actual = await call({
						query: {
							license: 'license002',
						},
					});

					expect(actual.allCount).toBe(1);
					expect(actual.emojis[0].name).toBe('emoji002');
				});

				test('multi', async () => {
					await insert([
						defaultData('001', { license: 'license001' }),
						defaultData('002', { license: 'license002' }),
						defaultData('003', { license: 'license003' }),
					]);

					const actual = await call({
						query: {
							license: 'license001 license003',
						},
					});

					expect(actual.allCount).toBe(2);
					expect(actual.emojis[0].name).toBe('emoji001');
					expect(actual.emojis[1].name).toBe('emoji003');
				});

				test('keyword', async () => {
					await insert([
						defaultData('001', { license: 'license001' }),
						defaultData('002', { license: 'license002' }),
						defaultData('003', { license: 'license003' }),
					]);

					const actual = await call({
						query: {
							license: 'cense',
						},
					});

					expect(actual.allCount).toBe(3);
				});

				test('escape', async () => {
					await insert([
						defaultData('001', { license: 'license001' }),
					]);

					const actual = await call({
						query: {
							license: '%',
						},
					});

					expect(actual.allCount).toBe(0);
				});
			});

			describe('isSensitive', () => {
				test('true', async () => {
					await insert([
						defaultData('001', { isSensitive: true }),
						defaultData('002', { isSensitive: false }),
						defaultData('003', { isSensitive: true }),
					]);

					const actual = await call({
						query: {
							isSensitive: true,
						},
					});

					expect(actual.allCount).toBe(2);
					expect(actual.emojis[0].name).toBe('emoji001');
					expect(actual.emojis[1].name).toBe('emoji003');
				});

				test('false', async () => {
					await insert([
						defaultData('001', { isSensitive: true }),
						defaultData('002', { isSensitive: false }),
						defaultData('003', { isSensitive: true }),
					]);

					const actual = await call({
						query: {
							isSensitive: false,
						},
					});

					expect(actual.allCount).toBe(1);
					expect(actual.emojis[0].name).toBe('emoji002');
				});

				test('null', async () => {
					await insert([
						defaultData('001', { isSensitive: true }),
						defaultData('002', { isSensitive: false }),
						defaultData('003', { isSensitive: true }),
					]);

					const actual = await call({
						query: {},
					});

					expect(actual.allCount).toBe(3);
				});
			});

			describe('localOnly', () => {
				test('true', async () => {
					await insert([
						defaultData('001', { localOnly: true }),
						defaultData('002', { localOnly: false }),
						defaultData('003', { localOnly: true }),
					]);

					const actual = await call({
						query: {
							localOnly: true,
						},
					});

					expect(actual.allCount).toBe(2);
					expect(actual.emojis[0].name).toBe('emoji001');
					expect(actual.emojis[1].name).toBe('emoji003');
				});

				test('false', async () => {
					await insert([
						defaultData('001', { localOnly: true }),
						defaultData('002', { localOnly: false }),
						defaultData('003', { localOnly: true }),
					]);

					const actual = await call({
						query: {
							localOnly: false,
						},
					});

					expect(actual.allCount).toBe(1);
					expect(actual.emojis[0].name).toBe('emoji002');
				});

				test('null', async () => {
					await insert([
						defaultData('001', { localOnly: true }),
						defaultData('002', { localOnly: false }),
						defaultData('003', { localOnly: true }),
					]);

					const actual = await call({
						query: {},
					});

					expect(actual.allCount).toBe(3);
				});
			});

			describe('roleId', () => {
				test('single', async () => {
					await insert([
						defaultData('001', { roleIdsThatCanBeUsedThisEmojiAsReaction: ['role001'] }),
						defaultData('002', { roleIdsThatCanBeUsedThisEmojiAsReaction: ['role002'] }),
						defaultData('003', { roleIdsThatCanBeUsedThisEmojiAsReaction: ['role003'] }),
					]);

					const actual = await call({
						query: {
							roleIds: ['role002'],
						},
					});

					expect(actual.allCount).toBe(1);
					expect(actual.emojis[0].name).toBe('emoji002');
				});

				test('multi', async () => {
					await insert([
						defaultData('001', { roleIdsThatCanBeUsedThisEmojiAsReaction: ['role001'] }),
						defaultData('002', { roleIdsThatCanBeUsedThisEmojiAsReaction: ['role002', 'role003'] }),
						defaultData('003', { roleIdsThatCanBeUsedThisEmojiAsReaction: ['role003'] }),
						defaultData('004', { roleIdsThatCanBeUsedThisEmojiAsReaction: ['role004'] }),
					]);

					const actual = await call({
						query: {
							roleIds: ['role001', 'role003'],
						},
					});

					expect(actual.allCount).toBe(3);
					expect(actual.emojis[0].name).toBe('emoji001');
					expect(actual.emojis[1].name).toBe('emoji002');
					expect(actual.emojis[2].name).toBe('emoji003');
				});
			});
		});
	});
});
