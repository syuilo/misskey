/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import * as lolex from '@sinonjs/fake-timers';
import { addHours, addSeconds, subDays, subHours, subSeconds } from 'date-fns';
import { CheckModeratorsActivityProcessorService } from '@/queue/processors/CheckModeratorsActivityProcessorService.js';
import {
	MiRole,
	MiRoleAssignment,
	MiSystemWebhook,
	MiUser,
	MiUserProfile,
	RoleAssignmentsRepository,
	RolesRepository,
	UserProfilesRepository,
	UsersRepository,
} from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { RoleService } from '@/core/RoleService.js';
import { GlobalModule } from '@/GlobalModule.js';
import { MetaService } from '@/core/MetaService.js';
import { DI } from '@/di-symbols.js';
import { QueueLoggerService } from '@/queue/QueueLoggerService.js';
import { EmailService } from '@/core/EmailService.js';
import { SystemWebhookService } from '@/core/SystemWebhookService.js';
import { AnnouncementService } from '@/core/AnnouncementService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { FanoutTimelineService } from '@/core/FanoutTimelineService.js';
import { genAidx } from '@/misc/id/aidx.js';
import { CacheService } from '@/core/CacheService.js';

const baseDate = new Date(Date.UTC(2000, 11, 15, 12, 0, 0));

describe('CheckModeratorsActivityProcessorService', () => {
	let app: TestingModule;
	let clock: lolex.InstalledClock;
	let service: CheckModeratorsActivityProcessorService;

	// --------------------------------------------------------------------------------------

	let usersRepository: UsersRepository;
	let userProfilesRepository: UserProfilesRepository;
	let idService: IdService;
	let roleService: jest.Mocked<RoleService>;
	let announcementService: jest.Mocked<AnnouncementService>;
	let emailService: jest.Mocked<EmailService>;
	let systemWebhookService: jest.Mocked<SystemWebhookService>;

	let systemWebhook1: MiSystemWebhook;
	let systemWebhook2: MiSystemWebhook;
	let systemWebhook3: MiSystemWebhook;

	// --------------------------------------------------------------------------------------

	async function createUser(data: Partial<MiUser> = {}, profile: Partial<MiUserProfile> = {}): Promise<MiUser> {
		const id = idService.gen();
		const user = await usersRepository
			.insert({
				id: id,
				username: `user_${id}`,
				usernameLower: `user_${id}`.toLowerCase(),
				...data,
			})
			.then(x => usersRepository.findOneByOrFail(x.identifiers[0]));

		await userProfilesRepository.insert({
			userId: user.id,
			...profile,
		});

		return user;
	}

	function crateSystemWebhook(data: Partial<MiSystemWebhook> = {}): MiSystemWebhook {
		return {
			id: idService.gen(),
			isActive: true,
			updatedAt: new Date(),
			latestSentAt: null,
			latestStatus: null,
			name: 'test',
			url: 'https://example.com',
			secret: 'test',
			on: [],
			...data,
		};
	}

	function mockModeratorRole(users: MiUser[]) {
		roleService.getModerators.mockReset();
		roleService.getModerators.mockResolvedValue(users);
	}

	// --------------------------------------------------------------------------------------

	beforeAll(async () => {
		app = await Test
			.createTestingModule({
				imports: [
					GlobalModule,
				],
				providers: [
					CheckModeratorsActivityProcessorService,
					IdService,
					{
						provide: RoleService, useFactory: () => ({
							getModerators: jest.fn(),
							getRoles: () => Promise.resolve([]),
						}),
					},
					{
						provide: MetaService, useFactory: () => ({ fetch: jest.fn() }),
					},
					{
						provide: AnnouncementService, useFactory: () => ({ create: jest.fn() }),
					},
					{
						provide: EmailService, useFactory: () => ({ sendEmail: jest.fn() }),
					},
					{
						provide: SystemWebhookService, useFactory: () => ({
							fetchActiveSystemWebhooks: jest.fn(),
							enqueueSystemWebhook: jest.fn(),
						}),
					},
					{
						provide: QueueLoggerService, useFactory: () => ({
							logger: ({
								createSubLogger: () => ({
									info: jest.fn(),
									warn: jest.fn(),
									succ: jest.fn(),
								}),
							}),
						}),
					},
				],
			})
			.compile();

		usersRepository = app.get(DI.usersRepository);
		userProfilesRepository = app.get(DI.userProfilesRepository);

		service = app.get(CheckModeratorsActivityProcessorService);
		idService = app.get(IdService);
		roleService = app.get(RoleService) as jest.Mocked<RoleService>;
		announcementService = app.get(AnnouncementService) as jest.Mocked<AnnouncementService>;
		emailService = app.get(EmailService) as jest.Mocked<EmailService>;
		systemWebhookService = app.get(SystemWebhookService) as jest.Mocked<SystemWebhookService>;

		app.enableShutdownHooks();
	});

	beforeEach(async () => {
		clock = lolex.install({
			now: new Date(baseDate),
			shouldClearNativeTimers: true,
		});

		systemWebhook1 = crateSystemWebhook({ on: ['inactiveModeratorsWarning'] });
		systemWebhook2 = crateSystemWebhook({ on: ['inactiveModeratorsWarning', 'inactiveModeratorsInvitationOnlyChanged'] });
		systemWebhook3 = crateSystemWebhook({ on: ['abuseReport'] });

		emailService.sendEmail.mockReturnValue(Promise.resolve());
		announcementService.create.mockReturnValue(Promise.resolve({} as never));
		systemWebhookService.fetchActiveSystemWebhooks.mockResolvedValue([systemWebhook1, systemWebhook2, systemWebhook3]);
		systemWebhookService.enqueueSystemWebhook.mockReturnValue(Promise.resolve({} as never));
	});

	afterEach(async () => {
		clock.uninstall();
		await usersRepository.delete({});
		await userProfilesRepository.delete({});
		roleService.getModerators.mockReset();
		announcementService.create.mockReset();
		emailService.sendEmail.mockReset();
		systemWebhookService.enqueueSystemWebhook.mockReset();
	});

	afterAll(async () => {
		await app.close();
	});

	// --------------------------------------------------------------------------------------

	describe('evaluateModeratorsInactiveDays', () => {
		test('[isModeratorsInactive] inactiveなモデレーターがいても他のモデレーターがアクティブなら"運営が非アクティブ"としてみなされない', async () => {
			const [user1, user2, user3, user4] = await Promise.all([
				// 期限よりも1秒新しいタイミングでアクティブ化（セーフ）
				createUser({ lastActiveDate: subDays(addSeconds(baseDate, 1), 7) }),
				// 期限ちょうどにアクティブ化（セーフ）
				createUser({ lastActiveDate: subDays(baseDate, 7) }),
				// 期限よりも1秒古いタイミングでアクティブ化（アウト）
				createUser({ lastActiveDate: subDays(subSeconds(baseDate, 1), 7) }),
				// 対象外
				createUser({ lastActiveDate: null }),
			]);

			mockModeratorRole([user1, user2, user3, user4]);

			const result = await service.evaluateModeratorsInactiveDays();
			expect(result.isModeratorsInactive).toBe(false);
			expect(result.inactiveModerators).toEqual([user3]);
		});

		test('[isModeratorsInactive] 全員非アクティブなら"運営が非アクティブ"としてみなされる', async () => {
			const [user1, user2] = await Promise.all([
				// 期限よりも1秒古いタイミングでアクティブ化（アウト）
				createUser({ lastActiveDate: subDays(subSeconds(baseDate, 1), 7) }),
				// 対象外
				createUser({ lastActiveDate: null }),
			]);

			mockModeratorRole([user1, user2]);

			const result = await service.evaluateModeratorsInactiveDays();
			expect(result.isModeratorsInactive).toBe(true);
			expect(result.inactiveModerators).toEqual([user1]);
		});

		test('[remainingTime] 猶予まで24時間ある場合、猶予1日として計算される', async () => {
			const [user1, user2] = await Promise.all([
				createUser({ lastActiveDate: subDays(baseDate, 8) }),
				// 猶予はこのユーザ基準で計算される想定。
				// 期限まで残り24時間->猶予1日として計算されるはずである
				createUser({ lastActiveDate: subDays(baseDate, 6) }),
			]);

			mockModeratorRole([user1, user2]);

			const result = await service.evaluateModeratorsInactiveDays();
			expect(result.isModeratorsInactive).toBe(false);
			expect(result.inactiveModerators).toEqual([user1]);
			expect(result.remainingTime.asDays).toBe(1);
			expect(result.remainingTime.asHours).toBe(24);
		});

		test('[remainingTime] 猶予まで25時間ある場合、猶予1日として計算される', async () => {
			const [user1, user2] = await Promise.all([
				createUser({ lastActiveDate: subDays(baseDate, 8) }),
				// 猶予はこのユーザ基準で計算される想定。
				// 期限まで残り25時間->猶予1日として計算されるはずである
				createUser({ lastActiveDate: subDays(addHours(baseDate, 1), 6) }),
			]);

			mockModeratorRole([user1, user2]);

			const result = await service.evaluateModeratorsInactiveDays();
			expect(result.isModeratorsInactive).toBe(false);
			expect(result.inactiveModerators).toEqual([user1]);
			expect(result.remainingTime.asDays).toBe(1);
			expect(result.remainingTime.asHours).toBe(25);
		});

		test('[remainingTime] 猶予まで23時間ある場合、猶予0日として計算される', async () => {
			const [user1, user2] = await Promise.all([
				createUser({ lastActiveDate: subDays(baseDate, 8) }),
				// 猶予はこのユーザ基準で計算される想定。
				// 期限まで残り23時間->猶予0日として計算されるはずである
				createUser({ lastActiveDate: subDays(subHours(baseDate, 1), 6) }),
			]);

			mockModeratorRole([user1, user2]);

			const result = await service.evaluateModeratorsInactiveDays();
			expect(result.isModeratorsInactive).toBe(false);
			expect(result.inactiveModerators).toEqual([user1]);
			expect(result.remainingTime.asDays).toBe(0);
			expect(result.remainingTime.asHours).toBe(23);
		});

		test('[remainingTime] 期限ちょうどの場合、猶予0日として計算される', async () => {
			const [user1, user2] = await Promise.all([
				createUser({ lastActiveDate: subDays(baseDate, 8) }),
				// 猶予はこのユーザ基準で計算される想定。
				// 期限ちょうど->猶予0日として計算されるはずである
				createUser({ lastActiveDate: subDays(baseDate, 7) }),
			]);

			mockModeratorRole([user1, user2]);

			const result = await service.evaluateModeratorsInactiveDays();
			expect(result.isModeratorsInactive).toBe(false);
			expect(result.inactiveModerators).toEqual([user1]);
			expect(result.remainingTime.asDays).toBe(0);
			expect(result.remainingTime.asHours).toBe(0);
		});

		test('[remainingTime] 期限より1時間超過している場合、猶予-1日として計算される', async () => {
			const [user1, user2] = await Promise.all([
				createUser({ lastActiveDate: subDays(baseDate, 8) }),
				// 猶予はこのユーザ基準で計算される想定。
				// 期限より1時間超過->猶予-1日として計算されるはずである
				createUser({ lastActiveDate: subDays(subHours(baseDate, 1), 7) }),
			]);

			mockModeratorRole([user1, user2]);

			const result = await service.evaluateModeratorsInactiveDays();
			expect(result.isModeratorsInactive).toBe(true);
			expect(result.inactiveModerators).toEqual([user1, user2]);
			expect(result.remainingTime.asDays).toBe(-1);
			expect(result.remainingTime.asHours).toBe(-1);
		});

		test('[remainingTime] 期限より25時間超過している場合、猶予-2日として計算される', async () => {
			const [user1, user2] = await Promise.all([
				createUser({ lastActiveDate: subDays(baseDate, 10) }),
				// 猶予はこのユーザ基準で計算される想定。
				// 期限より1時間超過->猶予-1日として計算されるはずである
				createUser({ lastActiveDate: subDays(subHours(baseDate, 25), 7) }),
			]);

			mockModeratorRole([user1, user2]);

			const result = await service.evaluateModeratorsInactiveDays();
			expect(result.isModeratorsInactive).toBe(true);
			expect(result.inactiveModerators).toEqual([user1, user2]);
			expect(result.remainingTime.asDays).toBe(-2);
			expect(result.remainingTime.asHours).toBe(-25);
		});
	});

	describe('notifyInactiveModeratorsWarning', () => {
		test('[notification + mail] 通知はモデレータ全員に発信され、メールはメールアドレスが存在＋認証済みの場合のみ', async () => {
			const [user1, user2, user3, user4, root] = await Promise.all([
				createUser({}, { email: 'user1@example.com', emailVerified: true }),
				createUser({}, { email: 'user2@example.com', emailVerified: false }),
				createUser({}, { email: null, emailVerified: false }),
				createUser({}, { email: 'user4@example.com', emailVerified: true }),
				createUser({ isRoot: true }, { email: 'root@example.com', emailVerified: true }),
			]);

			mockModeratorRole([user1, user2, user3, root]);
			await service.notifyInactiveModeratorsWarning({ time: 1, asDays: 0, asHours: 0 });

			expect(emailService.sendEmail).toHaveBeenCalledTimes(2);
			expect(emailService.sendEmail.mock.calls[0][0]).toBe('user1@example.com');
			expect(emailService.sendEmail.mock.calls[1][0]).toBe('root@example.com');
		});

		test('[systemWebhook] "inactiveModeratorsWarning"が有効なSystemWebhookに対して送信される', async () => {
			const [user1] = await Promise.all([
				createUser({}, { email: 'user1@example.com', emailVerified: true }),
			]);

			mockModeratorRole([user1]);
			await service.notifyInactiveModeratorsWarning({ time: 1, asDays: 0, asHours: 0 });

			expect(systemWebhookService.enqueueSystemWebhook).toHaveBeenCalledTimes(2);
			expect(systemWebhookService.enqueueSystemWebhook.mock.calls[0][0]).toEqual(systemWebhook1);
			expect(systemWebhookService.enqueueSystemWebhook.mock.calls[1][0]).toEqual(systemWebhook2);
		});
	});

	describe('notifyChangeToInvitationOnly', () => {
		test('[notification + mail] 通知はモデレータ全員に発信され、メールはメールアドレスが存在＋認証済みの場合のみ', async () => {
			const [user1, user2, user3, user4, root] = await Promise.all([
				createUser({}, { email: 'user1@example.com', emailVerified: true }),
				createUser({}, { email: 'user2@example.com', emailVerified: false }),
				createUser({}, { email: null, emailVerified: false }),
				createUser({}, { email: 'user4@example.com', emailVerified: true }),
				createUser({ isRoot: true }, { email: 'root@example.com', emailVerified: true }),
			]);

			mockModeratorRole([user1, user2, user3, root]);
			await service.notifyChangeToInvitationOnly();

			expect(announcementService.create).toHaveBeenCalledTimes(4);
			expect(announcementService.create.mock.calls[0][0].userId).toBe(user1.id);
			expect(announcementService.create.mock.calls[1][0].userId).toBe(user2.id);
			expect(announcementService.create.mock.calls[2][0].userId).toBe(user3.id);
			expect(announcementService.create.mock.calls[3][0].userId).toBe(root.id);

			expect(emailService.sendEmail).toHaveBeenCalledTimes(2);
			expect(emailService.sendEmail.mock.calls[0][0]).toBe('user1@example.com');
			expect(emailService.sendEmail.mock.calls[1][0]).toBe('root@example.com');
		});

		test('[systemWebhook] "inactiveModeratorsInvitationOnlyChanged"が有効なSystemWebhookに対して送信される', async () => {
			const [user1] = await Promise.all([
				createUser({}, { email: 'user1@example.com', emailVerified: true }),
			]);

			mockModeratorRole([user1]);
			await service.notifyChangeToInvitationOnly();

			expect(systemWebhookService.enqueueSystemWebhook).toHaveBeenCalledTimes(1);
			expect(systemWebhookService.enqueueSystemWebhook.mock.calls[0][0]).toEqual(systemWebhook2);
		});
	});
});

// 本物のRoleServiceと結合しないと出来ないテスト
describe('CheckModeratorsActivityProcessorService with RoleService', () => {
	let app: TestingModule;
	let clock: lolex.InstalledClock;
	let service: CheckModeratorsActivityProcessorService;

	// --------------------------------------------------------------------------------------

	let usersRepository: UsersRepository;
	let userProfilesRepository: UserProfilesRepository;
	let rolesRepository: RolesRepository;
	let roleAssignmentsRepository: RoleAssignmentsRepository;
	let idService: IdService;
	let roleService: RoleService;

	let root: MiUser;

	// --------------------------------------------------------------------------------------

	async function createUser(data: Partial<MiUser> = {}, profile: Partial<MiUserProfile> = {}): Promise<MiUser> {
		const id = idService.gen();
		const user = await usersRepository
			.insert({
				id: id,
				username: `user_${id}`,
				usernameLower: `user_${id}`.toLowerCase(),
				...data,
			})
			.then(x => usersRepository.findOneByOrFail(x.identifiers[0]));

		await userProfilesRepository.insert({
			userId: user.id,
			...profile,
		});

		return user;
	}

	async function createRole(data: Partial<MiRole> = {}) {
		const x = await rolesRepository.insert({
			id: genAidx(Date.now()),
			updatedAt: new Date(),
			lastUsedAt: new Date(),
			name: '',
			description: '',
			...data,
		});
		return await rolesRepository.findOneByOrFail(x.identifiers[0]);
	}

	async function assignRole(args: Partial<MiRoleAssignment>) {
		const id = genAidx(Date.now());
		await roleAssignmentsRepository.insert({
			id,
			...args,
		});

		return await roleAssignmentsRepository.findOneByOrFail({ id });
	}

	// --------------------------------------------------------------------------------------

	beforeAll(async () => {
		app = await Test
			.createTestingModule({
				imports: [
					GlobalModule,
				],
				providers: [
					CheckModeratorsActivityProcessorService,
					IdService,
					RoleService,
					GlobalEventService,
					CacheService,
					{
						provide: ModerationLogService, useFactory: () => ({ log: jest.fn() }),
					},
					{
						provide: FanoutTimelineService, useFactory: () => ({ push: jest.fn() }),
					},
					{
						provide: UserEntityService, useFactory: () => ({ pack: jest.fn() }),
					},
					{
						provide: MetaService, useFactory: () => ({ fetch: jest.fn() }),
					},
					{
						provide: AnnouncementService, useFactory: () => ({ create: jest.fn() }),
					},
					{
						provide: EmailService, useFactory: () => ({ sendEmail: jest.fn() }),
					},
					{
						provide: SystemWebhookService, useFactory: () => ({
							fetchActiveSystemWebhooks: jest.fn(),
							enqueueSystemWebhook: jest.fn(),
						}),
					},
					{
						provide: QueueLoggerService, useFactory: () => ({
							logger: ({
								createSubLogger: () => ({
									info: jest.fn(),
									warn: jest.fn(),
									succ: jest.fn(),
								}),
							}),
						}),
					},
				],
			})
			.compile();

		usersRepository = app.get(DI.usersRepository);
		userProfilesRepository = app.get(DI.userProfilesRepository);
		rolesRepository = app.get<RolesRepository>(DI.rolesRepository);
		roleAssignmentsRepository = app.get<RoleAssignmentsRepository>(DI.roleAssignmentsRepository);

		service = app.get(CheckModeratorsActivityProcessorService);
		idService = app.get(IdService);
		roleService = app.get(RoleService);

		app.enableShutdownHooks();
	});

	beforeEach(async () => {
		clock = lolex.install({
			now: new Date(baseDate),
			shouldClearNativeTimers: true,
		});

		root = await createUser({ isRoot: true, lastActiveDate: new Date() });
	});

	afterEach(async () => {
		clock.uninstall();
		await usersRepository.delete({});
		await userProfilesRepository.delete({});
		await roleAssignmentsRepository.delete({});
		await rolesRepository.delete({});

		roleService.flushCaches();
	});

	afterAll(async () => {
		await app.close();
	});

	// --------------------------------------------------------------------------------------

	describe('fetchModerators', () => {
		function expectUsers(users: MiUser[], expected: MiUser[]) {
			expect(users.sort((x, y) => x.id.localeCompare(y.id)))
				.toEqual(expected.sort((x, y) => x.id.localeCompare(y.id)));
		}

		test('モデレーターロール無し -> root', async () => {
			const [user1, user2, user3] = await Promise.all([
				createUser(),
				createUser(),
				createUser(),
			]);

			const [role1, role2] = await Promise.all([
				createRole({ isModerator: false }),
				createRole({ isModerator: false }),
			]);

			await Promise.all([
				assignRole({ userId: user1.id, roleId: role1.id }),
				assignRole({ userId: user2.id, roleId: role2.id }),
				assignRole({ userId: user3.id, roleId: role1.id }),
				assignRole({ userId: user3.id, roleId: role2.id }),
			]);

			const result = await service.fetchModerators();
			expectUsers(result, [root]);
		});

		test('モデレーターロール有り -> root, user2, user3', async () => {
			const [user1, user2, user3] = await Promise.all([
				createUser(),
				createUser(),
				createUser(),
			]);

			const [role1, role2] = await Promise.all([
				createRole({ isModerator: false }),
				createRole({ isModerator: true }),
			]);

			await Promise.all([
				assignRole({ userId: user1.id, roleId: role1.id }),
				assignRole({ userId: user2.id, roleId: role2.id }),
				assignRole({ userId: user3.id, roleId: role1.id }),
				assignRole({ userId: user3.id, roleId: role2.id }),
			]);

			const result = await service.fetchModerators();
			expectUsers(result, [root, user2, user3]);
		});

		test('モデレーターロール無し + 特殊ポリシーロール -> root, user1, user3', async () => {
			const [user1, user2, user3] = await Promise.all([
				createUser(),
				createUser(),
				createUser(),
			]);

			const [role1, role2] = await Promise.all([
				createRole({
					isModerator: false, policies: {
						isModeratorInactivityCheckTarget: {
							useDefault: false,
							value: true,
							priority: 0,
						},
					},
				}),
				createRole({ isModerator: false }),
			]);

			await Promise.all([
				assignRole({ userId: user1.id, roleId: role1.id }),
				assignRole({ userId: user2.id, roleId: role2.id }),
				assignRole({ userId: user3.id, roleId: role1.id }),
				assignRole({ userId: user3.id, roleId: role2.id }),
			]);

			const result = await service.fetchModerators();
			expectUsers(result, [root, user1, user3]);
		});

		test('モデレーターロールあり + 特殊ポリシーロール -> root, user1, user2, user3', async () => {
			const [user1, user2, user3] = await Promise.all([
				createUser(),
				createUser(),
				createUser(),
			]);

			const [role1, role2] = await Promise.all([
				createRole({
					isModerator: false, policies: {
						isModeratorInactivityCheckTarget: {
							useDefault: false,
							value: true,
							priority: 0,
						},
					},
				}),
				createRole({ isModerator: true }),
			]);

			await Promise.all([
				assignRole({ userId: user1.id, roleId: role1.id }),
				assignRole({ userId: user2.id, roleId: role2.id }),
				assignRole({ userId: user3.id, roleId: role1.id }),
				assignRole({ userId: user3.id, roleId: role2.id }),
			]);

			const result = await service.fetchModerators();
			expectUsers(result, [root, user1, user2, user3]);
		});
	});
});
