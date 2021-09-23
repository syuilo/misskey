import autobind from 'autobind-decorator';
import Channel from '../channel';
import { Notes, Users } from '@/models/index';
import { isMutedUserRelated } from '@/misc/is-muted-user-related';
import { isBlockerUserRelated } from '@/misc/is-blocker-user-related';
import { User } from '@/models/entities/user';
import { StreamMessages } from '../types';
import { Packed } from '@/misc/schema';

export default class extends Channel {
	public readonly chName = 'channel';
	public static shouldShare = false;
	public static requireCredential = false;
	private channelId: string;
	private typers: Record<User['id'], Date> = {};
	private emitTypersIntervalId: ReturnType<typeof setInterval>;

	@autobind
	public async init(params: any) {
		this.channelId = params.channelId as string;

		// Subscribe stream
		this.subscriber.on('notesStream', this.onNote);
		this.subscriber.on(`channelStream:${this.channelId}`, this.onEvent);
		this.emitTypersIntervalId = setInterval(this.emitTypers, 5000);
	}

	@autobind
	private async onNote(note: Packed<'Note'>) {
		if (note.channelId !== this.channelId) return;

		// リプライなら再pack
		if (note.replyId != null) {
			note.reply = await Notes.pack(note.replyId, this.user, {
				detail: true
			});
		}
		// Renoteなら再pack
		if (note.renoteId != null) {
			note.renote = await Notes.pack(note.renoteId, this.user, {
				detail: true
			});
		}

		// 流れてきたNoteがミュートしているユーザーが関わるものだったら無視する
		if (isMutedUserRelated(note, this.muting)) return;
		// 流れてきたNoteがブロックされているユーザーが関わるものだったら無視する
		if (isBlockerUserRelated(note, this.blocking)) return;

		this.connection.cacheNote(note);

		this.send('note', note);
	}

	@autobind
	private onEvent(data: StreamMessages['channel']['spec']) {
		if (data.type === 'typing') {
			const id = data.body;
			const begin = this.typers[id] == null;
			this.typers[id] = new Date();
			if (begin) {
				this.emitTypers();
			}
		}
	}

	@autobind
	private async emitTypers() {
		const now = new Date();

		// Remove not typing users
		for (const [userId, date] of Object.entries(this.typers)) {
			if (now.getTime() - date.getTime() > 5000) delete this.typers[userId];
		}

		const users = await Users.packMany(Object.keys(this.typers), null, { detail: false });

		this.send({
			type: 'typers',
			body: users,
		});
	}

	@autobind
	public dispose() {
		// Unsubscribe events
		this.subscriber.off('notesStream', this.onNote);
		this.subscriber.off(`channelStream:${this.channelId}`, this.onEvent);

		clearInterval(this.emitTypersIntervalId);
	}
}
