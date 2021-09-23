import { EventEmitter } from 'events';
import Emitter from 'strict-event-emitter-types';
import { Channel } from '@/models/entities/channel';
import { User } from '@/models/entities/user';
import { UserProfile } from '@/models/entities/user-profile';
import { Note } from '@/models/entities/note';
import { Antenna } from '@/models/entities/antenna';
import { DriveFile } from '@/models/entities/drive-file';
import { DriveFolder } from '@/models/entities/drive-folder';
import { Emoji } from '@/models/entities/emoji';
import { UserList } from '@/models/entities/user-list';
import { MessagingMessage } from '@/models/entities/messaging-message';
import { UserGroup } from '@/models/entities/user-group';
import { ReversiGame } from '@/models/entities/games/reversi/game';
import { AbuseUserReport } from '@/models/entities/abuse-user-report';
import { Signin } from '@/models/entities/signin';
import { Page } from '@/models/entities/page';
import { Packed } from '@/misc/schema';

//#region Stream type-body definitions
export interface InternalStreamTypes {
	antennaCreated: Antenna;
	antennaDeleted: Antenna;
	antennaUpdated: Antenna;
}

export interface BroadcastTypes {
	emojiAdded: {
		emoji: Packed<'Emoji'>;
	};
}

export interface UserStreamTypes {
	terminate: {};
	followChannel: Channel;
	unfollowChannel: Channel;
	updateUserProfile: UserProfile;
	mute: User;
	unmute: User;
	follow: Packed<'User'>;
	unfollow: Packed<'User'>;
	userAdded: Packed<'User'>;
}

export interface MainStreamTypes {
	notification: Packed<'Notification'>;
	mention: Packed<'Note'>;
	reply: Packed<'Note'>;
	renote: Packed<'Note'>;
	follow: Packed<'User'>;
	followed: Packed<'User'>;
	unfollow: Packed<'User'>;
	meUpdated: Packed<'User'>;
	pageEvent: {
		pageId: Page['id'];
		event: string;
		var: any;
		userId: User['id'];
		user: Packed<'User'>;
	};
	urlUploadFinished: {
		marker?: string | null;
		file: Packed<'DriveFile'>;
	};
	readAllNotifications: undefined;
	unreadNotification: Packed<'Notification'>;
	unreadMention: Note['id'];
	readAllUnreadMentions: undefined;
	unreadSpecifiedNote: Note['id'];
	readAllUnreadSpecifiedNotes: undefined;
	readAllMessagingMessages: undefined;
	messagingMessage: Packed<'MessagingMessage'>;
	unreadMessagingMessage: Packed<'MessagingMessage'>;
	readAllAntennas: undefined;
	unreadAntenna: Antenna;
	readAllAnnouncements: undefined;
	readAllChannels: undefined;
	unreadChannel: Note['id'];
	myTokenRegenerated: undefined;
	reversiNoInvites: undefined;
	reversiInvited: Packed<'ReversiMatching'>;
	signin: Signin;
	registryUpdated: {
		scope?: string[];
		key: string;
		value: any | null;
	};
	driveFileCreated: Packed<'DriveFile'>;
	readAntenna: Antenna;
}

export interface DriveStreamTypes {
	fileCreated: Packed<'DriveFile'>;
	fileDeleted: DriveFile['id'];
	fileUpdated: Packed<'DriveFile'>;
	folderCreated: Packed<'DriveFolder'>;
	folderDeleted: DriveFolder['id'];
	folderUpdated: Packed<'DriveFolder'>;
}

export interface NoteStreamTypes {
	pollVoted: {
		choice: number;
		userId: User['id'];
	};
	deleted: {
		deletedAt: Date;
	};
	reacted: {
		reaction: string;
		emoji?: Emoji;
		userId: User['id'];
	};
	unreacted: {
		reaction: string;
		userId: User['id'];
	};
}
type NoteStreamEventTypes = {
	[key in keyof NoteStreamTypes]: {
		id: Note['id'];
		body: NoteStreamTypes[key];
	};
};

export interface ChannelStreamTypes {
	typing: User['id'];
}

export interface UserListStreamTypes {
	userAdded: Packed<'User'>;
	userRemoved: Packed<'User'>;
}

export interface AntennaStreamTypes {
	note: Note;
}

export interface MessagingStreamTypes {
	read: MessagingMessage['id'][];
	typing: User['id'];
	message: Packed<'MessagingMessage'>;
	deleted: MessagingMessage['id'];
}

export interface GroupMessagingStreamTypes {
	read: {
		ids: MessagingMessage['id'][];
		userId: User['id'];
	};
	typing: User['id'];
	message: Packed<'MessagingMessage'>;
	deleted: MessagingMessage['id'];
}

export interface MessagingIndexStreamTypes {
	read: MessagingMessage['id'][];
	message: Packed<'MessagingMessage'>;
}

export interface ReversiStreamTypes {
	matched: Packed<'ReversiGame'>;
	invited: Packed<'ReversiMatching'>;
}

export interface ReversiGameStreamTypes {
	started: Packed<'ReversiGame'>;
	ended: {
		winnerId?: User['id'] | null,
		game: Packed<'ReversiGame'>;
	};
	updateSettings: {
		key: string;
		value: FIXME;
	};
	initForm: {
		userId: User['id'];
		form: FIXME;
	};
	updateForm: {
		userId: User['id'];
		id: string;
		value: FIXME;
	};
	message: {
		userId: User['id'];
		message: FIXME;
	};
	changeAccepts: {
		user1: boolean;
		user2: boolean;
	};
	set: {
		at: Date;
		color: boolean;
		pos: number;
		next: boolean;
	};
	watching: User['id'];
}

export interface AdminStreamTypes {
	newAbuseUserReport: {
		id: AbuseUserReport['id'];
		targetUserId: User['id'],
		reporterId: User['id'],
		comment: string;
	};
}
//#endregion

// 辞書(interface or type)から{ type, body }ユニオンを定義
// https://stackoverflow.com/questions/49311989/can-i-infer-the-type-of-a-value-using-extends-keyof-type
// VS Codeの展開を防止するためにEvents型を定義
type Events<T extends object> = { [K in keyof T]: { type: K; body: T[K]; } };
type EventUnionFromDictionary<
	T extends object,
	U = Events<T>
> = U[keyof U];

// name/messages(spec) pairs dictionary
export type StreamMessages = {
	internal: {
		name: 'internal';
		spec: EventUnionFromDictionary<InternalStreamTypes>;
	};
	broadcast: {
		name: 'broadcast';
		spec: EventUnionFromDictionary<BroadcastTypes>;
	};
	user: {
		name: `user:${User['id']}`;
		spec: EventUnionFromDictionary<UserStreamTypes>;
	};
	main: {
		name: `mainStream:${User['id']}`;
		spec: EventUnionFromDictionary<MainStreamTypes>;
	};
	drive: {
		name: `driveStream:${User['id']}`;
		spec: EventUnionFromDictionary<DriveStreamTypes>;
	};
	note: {
		name: `noteStream:${Note['id']}`;
		spec: EventUnionFromDictionary<NoteStreamEventTypes>;
	};
	channel: {
		name: `channelStream:${Channel['id']}`;
		spec: EventUnionFromDictionary<ChannelStreamTypes>;
	};
	userList: {
		name: `userListStream:${UserList['id']}`;
		spec: EventUnionFromDictionary<UserListStreamTypes>;
	};
	antenna: {
		name: `antennaStream:${Antenna['id']}`;
		spec: EventUnionFromDictionary<AntennaStreamTypes>;
	};
	messaging: {
		name: `messagingStream:${User['id']}-${User['id']}`;
		spec: EventUnionFromDictionary<MessagingStreamTypes>;
	};
	groupMessaging: {
		name: `messagingStream:${UserGroup['id']}`;
		spec: EventUnionFromDictionary<GroupMessagingStreamTypes>;
	};
	messagingIndex: {
		name: `messagingIndexStream:${User['id']}`;
		spec: EventUnionFromDictionary<MessagingIndexStreamTypes>;
	};
	reversi: {
		name: `reversiStream:${User['id']}`;
		spec: EventUnionFromDictionary<ReversiStreamTypes>;
	};
	reversiGame: {
		name: `reversiGameStream:${ReversiGame['id']}`;
		spec: EventUnionFromDictionary<ReversiGameStreamTypes>;
	};
	admin: {
		name: `adminStream:${User['id']}`;
		spec: EventUnionFromDictionary<AdminStreamTypes>;
	};
	notes: {
		name: 'notesStream';
		spec: Packed<'Note'>;
	};
};

// API event definitions
// ストリームごとのEmitterの辞書を用意
type EventEmitterDictionary = { [x in keyof StreamMessages]: Emitter<EventEmitter, { [y in StreamMessages[x]['name']]: (e: StreamMessages[x]['spec']) => void }> };
// 共用体型を交差型にする型 https://stackoverflow.com/questions/54938141/typescript-convert-union-to-intersection
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;
// Emitter辞書から共用体型を作り、UnionToIntersectionで交差型にする
export type StreamEventEmitter = UnionToIntersection<EventEmitterDictionary[keyof StreamMessages]>;
// { [y in name]: (e: spec) => void }をまとめてその交差型をEmitterにかけるとts(2590)にひっかかる

// provide stream channels union
export type StreamChannels = StreamMessages[keyof StreamMessages]['name'];
