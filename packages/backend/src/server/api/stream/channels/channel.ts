/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type { Packed } from '@/misc/json-schema.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { bindThis } from '@/decorators.js';
import { isRenotePacked, isQuotePacked } from '@/misc/is-renote.js';
import type { JsonObject } from '@/misc/json-value.js';
import Channel, { type MiChannelService } from '../channel.js';

class ChannelChannel extends Channel {
	public readonly chName = 'channel';
	public static shouldShare = false;
	public static requireCredential = false as const;
	private channelId: string;
	private minimize: boolean;

	constructor(
		private noteEntityService: NoteEntityService,

		id: string,
		connection: Channel['connection'],
	) {
		super(id, connection);
		//this.onNote = this.onNote.bind(this);
	}

	@bindThis
	public async init(params: JsonObject) {
		if (typeof params.channelId !== 'string') return;
		this.channelId = params.channelId as string;
		this.minimize = !!(params.minimize ?? false);

		// Subscribe stream
		this.subscriber.on('notesStream', this.onNote);
	}

	@bindThis
	private async onNote(note: Packed<'Note'>) {
		if (note.channelId !== this.channelId) return;

		if (this.isNoteMutedOrBlocked(note)) return;

		if (this.user && isRenotePacked(note) && !isQuotePacked(note)) {
			if (note.renote && Object.keys(note.renote.reactions).length > 0) {
				const myRenoteReaction = await this.noteEntityService.populateMyReaction(note.renote, this.user.id);
				note.renote.myReaction = myRenoteReaction;
			}
		}

		if (this.minimize) {
			if (this.noteEntityService.canCache(note)) {
				this.send('note', {
					id: note.id, myReaction: note.myReaction,
					poll: note.poll?.choices ? { choices: note.poll.choices } : undefined,
					reply: note.reply?.myReaction ? { myReaction: note.reply.myReaction } : undefined,
					renote: note.renote?.myReaction ? { myReaction: note.renote.myReaction } : undefined,
					_allowCached_: true,
				});
			} else {
				this.send('note', {
					id: note.id,
					_allowCached_: false,
				});
			}
		} else {
			this.connection.cacheNote(note);
			this.send('note', note);
		}
	}

	@bindThis
	public dispose() {
		// Unsubscribe events
		this.subscriber.off('notesStream', this.onNote);
	}
}

@Injectable()
export class ChannelChannelService implements MiChannelService<false> {
	public readonly shouldShare = ChannelChannel.shouldShare;
	public readonly requireCredential = ChannelChannel.requireCredential;
	public readonly kind = ChannelChannel.kind;

	constructor(
		private noteEntityService: NoteEntityService,
	) {
	}

	@bindThis
	public create(id: string, connection: Channel['connection']): ChannelChannel {
		return new ChannelChannel(
			this.noteEntityService,
			id,
			connection,
		);
	}
}
