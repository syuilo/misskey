/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import type { Packed } from '@/misc/json-schema.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { MiUser, MiNote, MiNoteDraft } from '@/models/_.js';
import type { NoteDraftsRepository, ChannelsRepository } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { DebounceLoader } from '@/misc/loader.js';
import { IdService } from '@/core/IdService.js';
import type { OnModuleInit } from '@nestjs/common';
import type { UserEntityService } from './UserEntityService.js';
import type { DriveFileEntityService } from './DriveFileEntityService.js';
import type { NoteEntityService } from './NoteEntityService.js';

@Injectable()
export class NoteDraftEntityService implements OnModuleInit {
	private userEntityService: UserEntityService;
	private driveFileEntityService: DriveFileEntityService;
	private idService: IdService;
	private noteEntityService: NoteEntityService;
	private noteDraftLoader = new DebounceLoader(this.findNoteDraftOrFail);

	constructor(
		private moduleRef: ModuleRef,

		@Inject(DI.noteDraftsRepository)
		private noteDraftsRepository: NoteDraftsRepository,

		@Inject(DI.channelsRepository)
		private channelsRepository: ChannelsRepository,
	) {
	}

	onModuleInit() {
		this.userEntityService = this.moduleRef.get('UserEntityService');
		this.driveFileEntityService = this.moduleRef.get('DriveFileEntityService');
		this.idService = this.moduleRef.get('IdService');
		this.noteEntityService = this.moduleRef.get('NoteEntityService');
	}

	@bindThis
	public async packAttachedFiles(fileIds: MiNote['fileIds'], packedFiles: Map<MiNote['fileIds'][number], Packed<'DriveFile'> | null>): Promise<Packed<'DriveFile'>[]> {
		const missingIds = [];
		for (const id of fileIds) {
			if (!packedFiles.has(id)) missingIds.push(id);
		}
		if (missingIds.length) {
			const additionalMap = await this.driveFileEntityService.packManyByIdsMap(missingIds);
			for (const [k, v] of additionalMap) {
				packedFiles.set(k, v);
			}
		}
		return fileIds.map(id => packedFiles.get(id)).filter(x => x != null);
	}

	@bindThis
	public async pack(
		src: MiNoteDraft['id'] | MiNoteDraft,
		me?: { id: MiUser['id'] } | null | undefined,
		options?: {
			detail?: boolean;
			skipHide?: boolean;
			withReactionAndUserPairCache?: boolean;
			_hint_?: {
				packedFiles: Map<MiNote['fileIds'][number], Packed<'DriveFile'> | null>;
				packedUsers: Map<MiUser['id'], Packed<'UserLite'>>
			};
		},
	): Promise<Packed<'NoteDraft'>> {
		const opts = Object.assign({
			detail: true,
		}, options);

		const noteDraft = typeof src === 'object' ? src : await this.noteDraftLoader.load(src);

		const text = noteDraft.text;

		const channel = noteDraft.channelId
			? noteDraft.channel
				? noteDraft.channel
				: await this.channelsRepository.findOneBy({ id: noteDraft.channelId })
			: null;

		const packedFiles = options?._hint_?.packedFiles;
		const packedUsers = options?._hint_?.packedUsers;

		const packed: Packed<'NoteDraft'> = await awaitAll({
			id: noteDraft.id,
			createdAt: this.idService.parse(noteDraft.id).date.toISOString(),
			userId: noteDraft.userId,
			user: packedUsers?.get(noteDraft.userId) ?? this.userEntityService.pack(noteDraft.user ?? noteDraft.userId, me),
			text: text,
			cw: noteDraft.cw,
			visibility: noteDraft.visibility,
			localOnly: noteDraft.localOnly,
			reactionAcceptance: noteDraft.reactionAcceptance,
			visibleUserIds: noteDraft.visibility === 'specified' ? noteDraft.visibleUserIds : undefined,
			hashtag: noteDraft.hashtag,
			fileIds: noteDraft.fileIds,
			files: packedFiles != null ? this.packAttachedFiles(noteDraft.fileIds, packedFiles) : this.driveFileEntityService.packManyByIds(noteDraft.fileIds),
			replyId: noteDraft.replyId,
			renoteId: noteDraft.renoteId,
			channelId: noteDraft.channelId ?? undefined,
			channel: channel ? {
				id: channel.id,
				name: channel.name,
				color: channel.color,
				isSensitive: channel.isSensitive,
				allowRenoteToExternal: channel.allowRenoteToExternal,
				userId: channel.userId,
			} : undefined,

			...(opts.detail ? {
				reply: noteDraft.replyId ? this.noteEntityService.pack(noteDraft.replyId, me, {
					detail: false,
					skipHide: opts.skipHide,
				}) : undefined,

				renote: noteDraft.renoteId ? this.noteEntityService.pack(noteDraft.renoteId, me, {
					detail: true,
					skipHide: opts.skipHide,
				}) : undefined,

				poll: noteDraft.hasPoll ? {
					choices: noteDraft.pollChoices,
					multiple: noteDraft.pollMultiple,
					expiresAt: noteDraft.pollExpiresAt?.toISOString(),
					expiredAfter: noteDraft.pollExpiredAfter,
				} : undefined,
			} : {} ),
		});

		return packed;
	}

	@bindThis
	public async packMany(
		noteDrafts: MiNoteDraft[],
		me?: { id: MiUser['id'] } | null | undefined,
		options?: {
			detail?: boolean;
		},
	) {
		if (noteDrafts.length === 0) return [];

		// TODO: 本当は renote とか reply がないのに renoteId とか replyId があったらここで解決しておく
		const fileIds = noteDrafts.map(n => [n.fileIds, n.renote?.fileIds, n.reply?.fileIds]).flat(2).filter(x => x != null);
		const packedFiles = fileIds.length > 0 ? await this.driveFileEntityService.packManyByIdsMap(fileIds) : new Map();
		const users = [
			...noteDrafts.map(({ user, userId }) => user ?? userId),
		];
		const packedUsers = await this.userEntityService.packMany(users, me)
			.then(users => new Map(users.map(u => [u.id, u])));

		return await Promise.all(noteDrafts.map(n => this.pack(n, me, {
			...options,
			_hint_: {
				packedFiles,
				packedUsers,
			},
		})));
	}

	@bindThis
	private findNoteDraftOrFail(id: string): Promise<MiNoteDraft> {
		return this.noteDraftsRepository.findOneOrFail({
			where: { id },
			relations: ['user'],
		});
	}
}
