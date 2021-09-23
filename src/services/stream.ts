import { redisClient } from '../db/redis';
import { User } from '@/models/entities/user';
import { Note } from '@/models/entities/note';
import { UserList } from '@/models/entities/user-list';
import { ReversiGame } from '@/models/entities/games/reversi/game';
import { UserGroup } from '@/models/entities/user-group';
import config from '@/config/index';
import { Antenna } from '@/models/entities/antenna';
import { Channel } from '@/models/entities/channel';
import {
	StreamChannels,
	AdminStreamTypes,
	AntennaStreamTypes,
	BroadcastTypes,
	ChannelStreamTypes,
	DriveStreamTypes,
	GroupMessagingStreamTypes,
	InternalStreamTypes,
	MainStreamTypes,
	MessagingIndexStreamTypes,
	MessagingStreamTypes,
	NoteStreamTypes,
	ReversiGameStreamTypes,
	ReversiStreamTypes,
	UserListStreamTypes,
	UserStreamTypes
} from '@/server/api/stream/types';
import { Packed } from '@/misc/schema';

class Publisher {
	private publish = (channel: StreamChannels, type: string | null, value?: any): void => {
		const message = type == null ? value : value == null ?
			{ type: type, body: null } :
			{ type: type, body: value };

		redisClient.publish(config.host, JSON.stringify({
			channel: channel,
			message: message
		}));
	}

	public publishInternalEvent = <K extends keyof InternalStreamTypes>(type: K, value?: InternalStreamTypes[K]): void => {
		this.publish('internal', type, typeof value === 'undefined' ? null : value);
	}

	public publishUserEvent = <K extends keyof UserStreamTypes>(userId: User['id'], type: K, value?: UserStreamTypes[K]): void => {
		this.publish(`user:${userId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishBroadcastStream = <K extends keyof BroadcastTypes>(type: K, value?: BroadcastTypes[K]): void => {
		this.publish('broadcast', type, typeof value === 'undefined' ? null : value);
	}

	public publishMainStream = <K extends keyof MainStreamTypes>(userId: User['id'], type: K, value?: MainStreamTypes[K]): void => {
		this.publish(`mainStream:${userId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishDriveStream = <K extends keyof DriveStreamTypes>(userId: User['id'], type: K, value?: DriveStreamTypes[K]): void => {
		this.publish(`driveStream:${userId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishNoteStream = <K extends keyof NoteStreamTypes>(noteId: Note['id'], type: K, value?: NoteStreamTypes[K]): void => {
		this.publish(`noteStream:${noteId}`, type, {
			id: noteId,
			body: value
		});
	}

	public publishChannelStream = <K extends keyof ChannelStreamTypes>(channelId: Channel['id'], type: K, value?: ChannelStreamTypes[K]): void => {
		this.publish(`channelStream:${channelId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishUserListStream = <K extends keyof UserListStreamTypes>(listId: UserList['id'], type: K, value?: UserListStreamTypes[K]): void => {
		this.publish(`userListStream:${listId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishAntennaStream = <K extends keyof AntennaStreamTypes>(antennaId: Antenna['id'], type: K, value?: AntennaStreamTypes[K]): void => {
		this.publish(`antennaStream:${antennaId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishMessagingStream = <K extends keyof MessagingStreamTypes>(userId: User['id'], otherpartyId: User['id'], type: K, value?: MessagingStreamTypes[K]): void => {
		this.publish(`messagingStream:${userId}-${otherpartyId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishGroupMessagingStream = <K extends keyof GroupMessagingStreamTypes>(groupId: UserGroup['id'], type: K, value?: GroupMessagingStreamTypes[K]): void => {
		this.publish(`messagingStream:${groupId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishMessagingIndexStream = <K extends keyof MessagingIndexStreamTypes>(userId: User['id'], type: K, value?: MessagingIndexStreamTypes[K]): void => {
		this.publish(`messagingIndexStream:${userId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishReversiStream = <K extends keyof ReversiStreamTypes>(userId: User['id'], type: K, value?: ReversiStreamTypes[K]): void => {
		this.publish(`reversiStream:${userId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishReversiGameStream = <K extends keyof ReversiGameStreamTypes>(gameId: ReversiGame['id'], type: K, value?: ReversiGameStreamTypes[K]): void => {
		this.publish(`reversiGameStream:${gameId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishNotesStream = (note: Packed<'Note'>): void => {
		this.publish('notesStream', null, note);
	}

	public publishAdminStream = <K extends keyof AdminStreamTypes>(userId: User['id'], type: K, value?: AdminStreamTypes[K]): void => {
		this.publish(`adminStream:${userId}`, type, typeof value === 'undefined' ? null : value);
	}
}

const publisher = new Publisher();

export default publisher;

export const publishInternalEvent = publisher.publishInternalEvent;
export const publishUserEvent = publisher.publishUserEvent;
export const publishBroadcastStream = publisher.publishBroadcastStream;
export const publishMainStream = publisher.publishMainStream;
export const publishDriveStream = publisher.publishDriveStream;
export const publishNoteStream = publisher.publishNoteStream;
export const publishNotesStream = publisher.publishNotesStream;
export const publishChannelStream = publisher.publishChannelStream;
export const publishUserListStream = publisher.publishUserListStream;
export const publishAntennaStream = publisher.publishAntennaStream;
export const publishMessagingStream = publisher.publishMessagingStream;
export const publishGroupMessagingStream = publisher.publishGroupMessagingStream;
export const publishMessagingIndexStream = publisher.publishMessagingIndexStream;
export const publishReversiStream = publisher.publishReversiStream;
export const publishReversiGameStream = publisher.publishReversiGameStream;
export const publishAdminStream = publisher.publishAdminStream;
