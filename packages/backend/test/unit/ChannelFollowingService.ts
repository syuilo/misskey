/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable */

import { afterEach, beforeEach, describe, expect } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { GlobalModule } from '@/GlobalModule.js';
import { CoreModule } from '@/core/CoreModule.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { IdService } from '@/core/IdService.js';
import {
	type ChannelFollowingsRepository,
	ChannelsRepository,
	DriveFilesRepository,
	MiChannel,
	MiChannelFollowing,
	MiDriveFile,
	MiUser,
	UserProfilesRepository,
	UsersRepository,
} from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { ChannelFollowingService } from "@/core/ChannelFollowingService.js";
import { MiLocalUser } from "@/models/User.js";

describe('ChannelFollowingService', () => {
	let app: TestingModule;
	let service: ChannelFollowingService;
	let channelsRepository: ChannelsRepository;
	let channelFollowingsRepository: ChannelFollowingsRepository;
	let usersRepository: UsersRepository;
	let userProfilesRepository: UserProfilesRepository;
	let driveFilesRepository: DriveFilesRepository;
	let idService: IdService;

	let alice: MiLocalUser;
	let bob: MiLocalUser;
	let channel1: MiChannel;
	let channel2: MiChannel;
	let channel3: MiChannel;
	let driveFile1: MiDriveFile;
	let driveFile2: MiDriveFile;

	async function createUser(data: Partial<MiUser> = {}) {
		const user = await usersRepository
			.insert({
				id: idService.gen(),
				username: 'username',
				usernameLower: 'username',
				...data,
			})
			.then(x => usersRepository.findOneByOrFail(x.identifiers[0]));

		await userProfilesRepository.insert({
			userId: user.id,
		});

		return user;
	}

	async function createChannel(data: Partial<MiChannel> = {}) {
		return await channelsRepository
			.insert({
				id: idService.gen(),
				...data,
			})
			.then(x => channelsRepository.findOneByOrFail(x.identifiers[0]));
	}

	async function createChannelFollowing(data: Partial<MiChannelFollowing> = {}) {
		return await channelFollowingsRepository
			.insert({
				id: idService.gen(),
				...data,
			})
			.then(x => channelFollowingsRepository.findOneByOrFail(x.identifiers[0]));
	}

	async function fetchChannelFollowing() {
		return await channelFollowingsRepository.findBy({});
	}

	async function createDriveFile(data: Partial<MiDriveFile> = {}) {
		return await driveFilesRepository
			.insert({
				id: idService.gen(),
				md5: 'md5',
				name: 'name',
				size: 0,
				type: 'type',
				storedInternal: false,
				url: 'url',
				...data,
			})
			.then(x => driveFilesRepository.findOneByOrFail(x.identifiers[0]));
	}

	beforeAll(async () => {
		app = await Test.createTestingModule({
			imports: [
				GlobalModule,
				CoreModule,
			],
			providers: [
				GlobalEventService,
				IdService,
				ChannelFollowingService,
			],
		}).compile();

		app.enableShutdownHooks();

		service = app.get<ChannelFollowingService>(ChannelFollowingService);
		idService = app.get<IdService>(IdService);
		channelsRepository = app.get<ChannelsRepository>(DI.channelsRepository);
		channelFollowingsRepository = app.get<ChannelFollowingsRepository>(DI.channelFollowingsRepository);
		usersRepository = app.get<UsersRepository>(DI.usersRepository);
		userProfilesRepository = app.get<UserProfilesRepository>(DI.userProfilesRepository);
		driveFilesRepository = app.get<DriveFilesRepository>(DI.driveFilesRepository);
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		alice = { ...await createUser({ username: 'alice' }), host: null, uri: null };
		bob = { ...await createUser({ username: 'bob' }), host: null, uri: null };
		driveFile1 = await createDriveFile();
		driveFile2 = await createDriveFile();
		channel1 = await createChannel({ name: 'channel1', userId: alice.id, bannerId: driveFile1.id });
		channel2 = await createChannel({ name: 'channel2', userId: alice.id, bannerId: driveFile2.id });
		channel3 = await createChannel({ name: 'channel3', userId: alice.id, bannerId: driveFile2.id });
	});

	afterEach(async () => {
		await channelFollowingsRepository.delete({});
		await channelsRepository.delete({});
		await userProfilesRepository.delete({});
		await usersRepository.delete({});
	});

	describe('list', () => {
		test('default', async () => {
			await createChannelFollowing({ followerId: alice.id, followeeId: channel1.id });
			await createChannelFollowing({ followerId: alice.id, followeeId: channel2.id });
			await createChannelFollowing({ followerId: bob.id, followeeId: channel3.id });

			const followings = await service.list({ requestUserId: alice.id });

			expect(followings).toHaveLength(2);
			expect(followings[0].id).toBe(channel1.id);
			expect(followings[0].userId).toBe(alice.id);
			expect(followings[0].user).toBeFalsy();
			expect(followings[0].bannerId).toBe(driveFile1.id);
			expect(followings[0].banner).toBeFalsy();
			expect(followings[1].id).toBe(channel2.id);
			expect(followings[1].userId).toBe(alice.id);
			expect(followings[1].user).toBeFalsy();
			expect(followings[1].bannerId).toBe(driveFile2.id);
			expect(followings[1].banner).toBeFalsy();
		});

		test('idOnly', async () => {
			await createChannelFollowing({ followerId: alice.id, followeeId: channel1.id });
			await createChannelFollowing({ followerId: alice.id, followeeId: channel2.id });
			await createChannelFollowing({ followerId: bob.id, followeeId: channel3.id });

			const followings = await service.list({ requestUserId: alice.id }, { idOnly: true });

			expect(followings).toHaveLength(2);
			expect(followings[0].id).toBe(channel1.id);
			expect(followings[1].id).toBe(channel2.id);
		});

		test('joinUser', async () => {
			await createChannelFollowing({ followerId: alice.id, followeeId: channel1.id });
			await createChannelFollowing({ followerId: alice.id, followeeId: channel2.id });
			await createChannelFollowing({ followerId: bob.id, followeeId: channel3.id });

			const followings = await service.list({ requestUserId: alice.id }, { joinUser: true });

			expect(followings).toHaveLength(2);
			expect(followings[0].id).toBe(channel1.id);
			expect(followings[0].user).toEqual(alice);
			expect(followings[0].banner).toBeFalsy();
			expect(followings[1].id).toBe(channel2.id);
			expect(followings[1].user).toEqual(alice);
			expect(followings[1].banner).toBeFalsy();
		});

		test('joinBannerFile', async () => {
			await createChannelFollowing({ followerId: alice.id, followeeId: channel1.id });
			await createChannelFollowing({ followerId: alice.id, followeeId: channel2.id });
			await createChannelFollowing({ followerId: bob.id, followeeId: channel3.id });

			const followings = await service.list({ requestUserId: alice.id }, { joinBannerFile: true });

			expect(followings).toHaveLength(2);
			expect(followings[0].id).toBe(channel1.id);
			expect(followings[0].user).toBeFalsy();
			expect(followings[0].banner).toEqual(driveFile1);
			expect(followings[1].id).toBe(channel2.id);
			expect(followings[1].user).toBeFalsy();
			expect(followings[1].banner).toEqual(driveFile2);
		});
	});

	describe('follow', () => {
		test('default', async () => {
			await service.follow(alice, channel1);

			const followings = await fetchChannelFollowing();

			expect(followings).toHaveLength(1);
			expect(followings[0].followeeId).toBe(channel1.id);
			expect(followings[0].followerId).toBe(alice.id);
		});
	});

	describe('unfollow', () => {
		test('default', async () => {
			await createChannelFollowing({ followerId: alice.id, followeeId: channel1.id });

			await service.unfollow(alice, channel1);

			const followings = await fetchChannelFollowing();

			expect(followings).toHaveLength(0);
		});
	});
});
