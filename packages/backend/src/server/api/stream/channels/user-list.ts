import { Inject, Injectable } from '@nestjs/common';
import type { Notes, UserListJoinings, UserLists } from '@/models/index.js';
import type { User } from '@/models/entities/User.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import type { Packed } from '@/misc/schema.js';
import { NoteEntityService } from '@/services/entities/NoteEntityService.js';
import Channel from '../channel.js';

class UserListChannel extends Channel {
	public readonly chName = 'userList';
	public static shouldShare = false;
	public static requireCredential = false;
	private listId: string;
	public listUsers: User['id'][] = [];
	private listUsersClock: NodeJS.Timer;

	constructor(
		private userListsRepository: typeof UserLists,
		private userListJoiningsRepository: typeof UserListJoinings,
		private noteEntityService: NoteEntityService,
		
		id: string,
		connection: Channel['connection'],
	) {
		super(id, connection);
		this.updateListUsers = this.updateListUsers.bind(this);
		this.onNote = this.onNote.bind(this);
	}

	public async init(params: any) {
		this.listId = params.listId as string;

		// Check existence and owner
		const list = await this.userListsRepository.findOneBy({
			id: this.listId,
			userId: this.user!.id,
		});
		if (!list) return;

		// Subscribe stream
		this.subscriber.on(`userListStream:${this.listId}`, this.send);

		this.subscriber.on('notesStream', this.onNote);

		this.updateListUsers();
		this.listUsersClock = setInterval(this.updateListUsers, 5000);
	}

	private async updateListUsers() {
		const users = await this.userListJoiningsRepository.find({
			where: {
				userListId: this.listId,
			},
			select: ['userId'],
		});

		this.listUsers = users.map(x => x.userId);
	}

	private async onNote(note: Packed<'Note'>) {
		if (!this.listUsers.includes(note.userId)) return;

		if (['followers', 'specified'].includes(note.visibility)) {
			note = await this.noteEntityService.pack(note.id, this.user, {
				detail: true,
			});

			if (note.isHidden) {
				return;
			}
		} else {
			// リプライなら再pack
			if (note.replyId != null) {
				note.reply = await this.noteEntityService.pack(note.replyId, this.user, {
					detail: true,
				});
			}
			// Renoteなら再pack
			if (note.renoteId != null) {
				note.renote = await this.noteEntityService.pack(note.renoteId, this.user, {
					detail: true,
				});
			}
		}

		// 流れてきたNoteがミュートしているユーザーが関わるものだったら無視する
		if (isUserRelated(note, this.muting)) return;
		// 流れてきたNoteがブロックされているユーザーが関わるものだったら無視する
		if (isUserRelated(note, this.blocking)) return;

		this.send('note', note);
	}

	public dispose() {
		// Unsubscribe events
		this.subscriber.off(`userListStream:${this.listId}`, this.send);
		this.subscriber.off('notesStream', this.onNote);

		clearInterval(this.listUsersClock);
	}
}

@Injectable()
export class UserListChannelService {
	public readonly shouldShare = UserListChannel.shouldShare;
	public readonly requireCredential = UserListChannel.requireCredential;

	constructor(
		@Inject('userListsRepository')
		private userListsRepository: typeof UserLists,

		@Inject('userListJoiningsRepository')
		private userListJoiningsRepository: typeof UserListJoinings,

		private noteEntityService: NoteEntityService,
	) {
	}

	public create(id: string, connection: Channel['connection']): UserListChannel {
		return new UserListChannel(
			this.userListsRepository,
			this.userListJoiningsRepository,
			this.noteEntityService,
			id,
			connection,
		);
	}
}
