/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type { Packed } from '@/misc/json-schema.js';
import { MetaService } from '@/core/MetaService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { bindThis } from '@/decorators.js';
import { RoleService } from '@/core/RoleService.js';
import { isQuotePacked, isRenotePacked } from '@/misc/is-renote.js';
import type { JsonObject } from '@/misc/json-value.js';
import Channel, { type MiChannelService } from '../channel.js';

class LocalTimelineChannel extends Channel {
	public readonly chName = 'localTimeline';
	public static shouldShare = false;
	public static requireCredential = false as const;
	private withRenotes: boolean;
	private withReplies: boolean;
	private withFiles: boolean;

	constructor(
		private metaService: MetaService,
		private roleService: RoleService,
		private noteEntityService: NoteEntityService,

		id: string,
		connection: Channel['connection'],
	) {
		super(id, connection);
		//this.onNote = this.onNote.bind(this);
	}

	@bindThis
	public async init(params: JsonObject) {
		const policies = await this.roleService.getUserPolicies(this.user ? this.user.id : null);
		if (!policies.ltlAvailable) return;

		this.withRenotes = !!(params.withRenotes ?? true);
		this.withReplies = !!(params.withReplies ?? false);
		this.withFiles = !!(params.withFiles ?? false);

		// Subscribe events
		this.subscriber.on('notesStream', this.onNote);
	}

	@bindThis
	private async onNote(note: Packed<'Note'>) {
		if (this.withFiles && (note.fileIds == null || note.fileIds.length === 0)) return;

		if (note.user.host !== null) return;
		if (note.visibility !== 'public') return;
		if (note.channelId != null) return;

		// 関係ない返信は除外
		if (note.reply && this.user && !this.following[note.userId]?.withReplies && !this.withReplies) {
			const reply = note.reply;
			// 「チャンネル接続主への返信」でもなければ、「チャンネル接続主が行った返信」でもなければ、「投稿者の投稿者自身への返信」でもない場合
			if (reply.userId !== this.user.id && note.userId !== this.user.id && reply.userId !== note.userId) return;
		}

		if (isRenotePacked(note) && !isQuotePacked(note) && !this.withRenotes) return;

		if (this.isNoteMutedOrBlocked(note)) return;

		const clonedNote = await this.assignMyReaction(note, this.noteEntityService);

		this.connection.cacheNote(clonedNote);

		this.send('note', clonedNote);
	}

	@bindThis
	public dispose() {
		// Unsubscribe events
		this.subscriber.off('notesStream', this.onNote);
	}
}

@Injectable()
export class LocalTimelineChannelService implements MiChannelService<false> {
	public readonly shouldShare = LocalTimelineChannel.shouldShare;
	public readonly requireCredential = LocalTimelineChannel.requireCredential;
	public readonly kind = LocalTimelineChannel.kind;

	constructor(
		private metaService: MetaService,
		private roleService: RoleService,
		private noteEntityService: NoteEntityService,
	) {
	}

	@bindThis
	public create(id: string, connection: Channel['connection']): LocalTimelineChannel {
		return new LocalTimelineChannel(
			this.metaService,
			this.roleService,
			this.noteEntityService,
			id,
			connection,
		);
	}
}
