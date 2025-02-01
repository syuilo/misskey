/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { In } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { FollowRequestsRepository, NotesRepository, MiUser, UsersRepository } from '@/models/_.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { MiGroupedNotification, MiNotification } from '@/models/Notification.js';
import type { MiNote } from '@/models/Note.js';
import type { Packed } from '@/misc/json-schema.js';
import { bindThis } from '@/decorators.js';
import { FilterUnionByProperty, groupedNotificationTypes } from '@/types.js';
import { CacheService } from '@/core/CacheService.js';
import { RoleEntityService } from './RoleEntityService.js';
import type { OnModuleInit } from '@nestjs/common';
import type { UserEntityService } from './UserEntityService.js';
import type { NoteEntityService } from './NoteEntityService.js';

const NOTE_REQUIRED_NOTIFICATION_TYPES = new Set(['note', 'mention', 'reply', 'renote', 'renote:grouped', 'quote', 'reaction', 'reaction:grouped', 'pollEnded'] as (typeof groupedNotificationTypes[number])[]);

@Injectable()
export class NotificationEntityService implements OnModuleInit {
	private userEntityService: UserEntityService;
	private noteEntityService: NoteEntityService;
	private roleEntityService: RoleEntityService;

	constructor(
		private moduleRef: ModuleRef,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.followRequestsRepository)
		private followRequestsRepository: FollowRequestsRepository,

		private cacheService: CacheService,

		//private userEntityService: UserEntityService,
		//private noteEntityService: NoteEntityService,
	) {
	}

	onModuleInit() {
		this.userEntityService = this.moduleRef.get('UserEntityService');
		this.noteEntityService = this.moduleRef.get('NoteEntityService');
		this.roleEntityService = this.moduleRef.get('RoleEntityService');
	}

	/**
	 * 通知をパックする共通処理
	*/
	async #packInternal <T extends MiNotification | MiGroupedNotification> (
		src: T,
		meId: MiUser['id'],

		options: {
			checkValidNotifier?: boolean;
		},
		hint?: {
			packedNotes: Map<MiNote['id'], Packed<'Note'>>;
			packedUsers: Map<MiUser['id'], Packed<'UserLite'>>;
		},
	): Promise<Packed<'Notification'> | null> {
		const notification = src;

		if (options.checkValidNotifier !== false && !(await this.#isValidNotifier(notification, meId))) return null;

		const needsNote = NOTE_REQUIRED_NOTIFICATION_TYPES.has(notification.type) && 'noteId' in notification;
		const noteIfNeed = needsNote ? (
			hint?.packedNotes != null
				? hint.packedNotes.get(notification.noteId)
				: this.noteEntityService.pack(notification.noteId, { id: meId }, {
					detail: true,
				})
		) : undefined;
		// if the note has been deleted, don't show this notification
		if (needsNote && !noteIfNeed) return null;

		const needsUser = 'notifierId' in notification;
		const userIfNeed = needsUser ? (
			hint?.packedUsers != null
				? hint.packedUsers.get(notification.notifierId)
				: this.userEntityService.pack(notification.notifierId, { id: meId })
		) : undefined;
		// if the user has been deleted, don't show this notification
		if (needsUser && !userIfNeed) return null;

		// #region Grouped notifications
		if (notification.type === 'reaction:grouped') {
			const reactions = (await Promise.all(notification.reactions.map(async reaction => {
				const user = hint?.packedUsers != null
					? hint.packedUsers.get(reaction.userId)!
					: await this.userEntityService.pack(reaction.userId, { id: meId });
				return {
					user,
					reaction: reaction.reaction,
				};
			}))).filter(r => r.user != null);
			// if all users have been deleted, don't show this notification
			if (reactions.length === 0) {
				return null;
			}

			return await awaitAll({
				id: notification.id,
				createdAt: new Date(notification.createdAt).toISOString(),
				type: notification.type,
				note: noteIfNeed,
				reactions,
			});
		} else if (notification.type === 'renote:grouped') {
			const users = (await Promise.all(notification.userIds.map(userId => {
				const packedUser = hint?.packedUsers != null ? hint.packedUsers.get(userId) : null;
				if (packedUser) {
					return packedUser;
				}

				return this.userEntityService.pack(userId, { id: meId });
			}))).filter(x => x != null);
			// if all users have been deleted, don't show this notification
			if (users.length === 0) {
				return null;
			}

			return await awaitAll({
				id: notification.id,
				createdAt: new Date(notification.createdAt).toISOString(),
				type: notification.type,
				note: noteIfNeed,
				users,
			});
		}
		// #endregion

		const needsRole = notification.type === 'roleAssigned';
		const role = needsRole ? await this.roleEntityService.pack(notification.roleId) : undefined;
		// if the role has been deleted, don't show this notification
		if (needsRole && !role) {
			return null;
		}

		return await awaitAll({
			id: notification.id,
			createdAt: new Date(notification.createdAt).toISOString(),
			type: notification.type,
			userId: 'notifierId' in notification ? notification.notifierId : undefined,
			...(userIfNeed != null ? { user: userIfNeed } : {}),
			...(noteIfNeed != null ? { note: noteIfNeed } : {}),
			...(notification.type === 'reaction' ? {
				reaction: notification.reaction,
			} : {}),
			...(notification.type === 'roleAssigned' ? {
				role: role,
			} : {}),
			...(notification.type === 'followRequestAccepted' ? {
				message: notification.message,
			} : {}),
			...(notification.type === 'achievementEarned' ? {
				achievement: notification.achievement,
			} : {}),
			...(notification.type === 'exportCompleted' ? {
				exportedEntity: notification.exportedEntity,
				fileId: notification.fileId,
			} : {}),
			...(notification.type === 'login' ? {
				ip: notification.userIp,
			} : {}),
			...(notification.type === 'loginFailed' ? {
				ip: notification.userIp,
			} : {}),
			...(notification.type === 'app' ? {
				body: notification.customBody,
				header: notification.customHeader,
				icon: notification.customIcon,
			} : {}),
		});
	}

	async #packManyInternal <T extends MiNotification | MiGroupedNotification>	(
		notifications: T[],
		meId: MiUser['id'],
	): Promise<T[]> {
		if (notifications.length === 0) return [];

		let validNotifications = notifications;

		validNotifications = await this.#filterValidNotifier(validNotifications, meId);

		const noteIds = validNotifications.map(x => 'noteId' in x ? x.noteId : null).filter(x => x != null);
		const notes = noteIds.length > 0 ? await this.notesRepository.find({
			where: { id: In(noteIds) },
			relations: ['user', 'reply', 'reply.user', 'renote', 'renote.user'],
		}) : [];
		const packedNotesArray = await this.noteEntityService.packMany(notes, { id: meId }, {
			detail: true,
		});
		const packedNotes = new Map(packedNotesArray.map(p => [p.id, p]));

		validNotifications = validNotifications.filter(x => !('noteId' in x) || packedNotes.has(x.noteId));

		const userIds = [];
		for (const notification of validNotifications) {
			if ('notifierId' in notification) userIds.push(notification.notifierId);
			if (notification.type === 'reaction:grouped') userIds.push(...notification.reactions.map(x => x.userId));
			if (notification.type === 'renote:grouped') userIds.push(...notification.userIds);
		}
		const users = userIds.length > 0 ? await this.usersRepository.find({
			where: { id: In(userIds) },
		}) : [];
		const packedUsersArray = await this.userEntityService.packMany(users, { id: meId });
		const packedUsers = new Map(packedUsersArray.map(p => [p.id, p]));

		// 既に解決されたフォローリクエストの通知を除外
		const followRequestNotifications = validNotifications.filter((x): x is FilterUnionByProperty<T, 'type', 'receiveFollowRequest'> => x.type === 'receiveFollowRequest');
		if (followRequestNotifications.length > 0) {
			const reqs = await this.followRequestsRepository.find({
				where: { followerId: In(followRequestNotifications.map(x => x.notifierId)) },
			});
			validNotifications = validNotifications.filter(x => (x.type !== 'receiveFollowRequest') || reqs.some(r => r.followerId === x.notifierId));
		}

		const packPromises = validNotifications.map(x => {
			return this.pack(
				x,
				meId,
				{ checkValidNotifier: false },
				{ packedNotes, packedUsers },
			);
		});

		return (await Promise.all(packPromises)).filter(x => x != null);
	}

	@bindThis
	public async pack(
		src: MiNotification | MiGroupedNotification,
		meId: MiUser['id'],

		options: {
			checkValidNotifier?: boolean;
		},
		hint?: {
			packedNotes: Map<MiNote['id'], Packed<'Note'>>;
			packedUsers: Map<MiUser['id'], Packed<'UserLite'>>;
		},
	): Promise<Packed<'Notification'> | null> {
		return await this.#packInternal(src, meId, options, hint);
	}

	@bindThis
	public async packMany(
		notifications: MiNotification[],
		meId: MiUser['id'],
	): Promise<MiNotification[]> {
		return await this.#packManyInternal(notifications, meId);
	}

	@bindThis
	public async packGroupedMany(
		notifications: MiGroupedNotification[],
		meId: MiUser['id'],
	): Promise<MiGroupedNotification[]> {
		return await this.#packManyInternal(notifications, meId);
	}

	/**
	 * notifierが存在するか、ミュートされていないか、サスペンドされていないかを確認するvalidator
	 */
	#validateNotifier <T extends MiNotification | MiGroupedNotification> (
		notification: T,
		userIdsWhoMeMuting: Set<MiUser['id']>,
		userMutedInstances: Set<string>,
		notifiers: MiUser[],
	): boolean {
		if (!('notifierId' in notification)) return true;
		if (userIdsWhoMeMuting.has(notification.notifierId)) return false;

		const notifier = notifiers.find(x => x.id === notification.notifierId) ?? null;

		if (notifier == null) return false;
		if (notifier.host && userMutedInstances.has(notifier.host)) return false;

		if (notifier.isSuspended) return false;

		return true;
	}

	/**
	 * notifierが存在するか、ミュートされていないか、サスペンドされていないかを実際に確認する
	 */
	async #isValidNotifier(
		notification: MiNotification | MiGroupedNotification,
		meId: MiUser['id'],
	): Promise<boolean> {
		return (await this.#filterValidNotifier([notification], meId)).length === 1;
	}

	/**
	 * notifierが存在するか、ミュートされていないか、サスペンドされていないかを実際に複数確認する
	 */
	async #filterValidNotifier <T extends MiNotification | MiGroupedNotification> (
		notifications: T[],
		meId: MiUser['id'],
	): Promise<T[]> {
		const [
			userIdsWhoMeMuting,
			userMutedInstances,
		] = await Promise.all([
			this.cacheService.userMutingsCache.fetch(meId),
			this.cacheService.userProfileCache.fetch(meId).then(p => new Set(p.mutedInstances)),
		]);

		const notifierIds = notifications.map(notification => 'notifierId' in notification ? notification.notifierId : null).filter(x => x != null);
		const notifiers = notifierIds.length > 0 ? await this.usersRepository.find({
			where: { id: In(notifierIds) },
		}) : [];

		const filteredNotifications = ((await Promise.all(notifications.map(async (notification) => {
			const isValid = this.#validateNotifier(notification, userIdsWhoMeMuting, userMutedInstances, notifiers);
			return isValid ? notification : null;
		}))) as [T | null] ).filter(x => x != null);

		return filteredNotifications;
	}
}
