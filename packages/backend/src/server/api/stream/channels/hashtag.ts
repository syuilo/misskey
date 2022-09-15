import { Inject, Injectable } from '@nestjs/common';
import type { Notes } from '@/models/index.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import type { Packed } from '@/misc/schema.js';
import { NoteEntityService } from '@/services/entities/NoteEntityService.js';
import Channel from '../channel.js';

class HashtagChannel extends Channel {
	public readonly chName = 'hashtag';
	public static shouldShare = false;
	public static requireCredential = false;
	private q: string[][];

	constructor(
		private noteEntityService: NoteEntityService,

		id: string,
		connection: Channel['connection'],
	) {
		super(id, connection);
		this.onNote = this.onNote.bind(this);
	}

	public async init(params: any) {
		this.q = params.q;

		if (this.q == null) return;

		// Subscribe stream
		this.subscriber.on('notesStream', this.onNote);
	}

	private async onNote(note: Packed<'Note'>) {
		const noteTags = note.tags ? note.tags.map((t: string) => t.toLowerCase()) : [];
		const matched = this.q.some(tags => tags.every(tag => noteTags.includes(normalizeForSearch(tag))));
		if (!matched) return;

		// Renoteなら再pack
		if (note.renoteId != null) {
			note.renote = await this.noteEntityService.pack(note.renoteId, this.user, {
				detail: true,
			});
		}

		// 流れてきたNoteがミュートしているユーザーが関わるものだったら無視する
		if (isUserRelated(note, this.muting)) return;
		// 流れてきたNoteがブロックされているユーザーが関わるものだったら無視する
		if (isUserRelated(note, this.blocking)) return;

		this.connection.cacheNote(note);

		this.send('note', note);
	}

	public dispose() {
		// Unsubscribe events
		this.subscriber.off('notesStream', this.onNote);
	}
}

@Injectable()
export class HashtagChannelService {
	public readonly shouldShare = HashtagChannel.shouldShare;
	public readonly requireCredential = HashtagChannel.requireCredential;

	constructor(
		private noteEntityService: NoteEntityService,
	) {
	}

	public create(id: string, connection: Channel['connection']): HashtagChannel {
		return new HashtagChannel(
			this.noteEntityService,
			id,
			connection,
		);
	}
}
