import {
	Antenna,
	DriveFile,
	DriveFolder,
	Note,
	Notification,
	Signin,
	User,
	UserDetailed,
	UserDetailedNotMe,
	UserLite,
} from './autogen/models.js';
import {
	AnnouncementCreated,
	EmojiAdded, EmojiDeleted,
	EmojiUpdated,
	PageEvent,
	QueueStats,
	QueueStatsLog,
	ServerStats,
	ServerStatsLog,
	StreamNote,
	ReversiGameDetailed,
} from './entities.js';
import {
	ReversiUpdateKey,
} from './consts.js';

type ReversiUpdateSettings<K extends ReversiUpdateKey> = {
	key: K;
	value: ReversiGameDetailed[K];
};

export type Channels = {
	main: {
		params: null;
		events: {
			notification: (payload: Notification) => void;
			mention: (payload: Note) => void;
			reply: (payload: Note) => void;
			renote: (payload: Note) => void;
			follow: (payload: UserDetailedNotMe) => void; // 自分が他人をフォローしたとき
			followed: (payload: UserDetailed | UserLite) => void; // 他人が自分をフォローしたとき
			unfollow: (payload: UserDetailed) => void; // 自分が他人をフォロー解除したとき
			meUpdated: (payload: UserDetailed) => void;
			pageEvent: (payload: PageEvent) => void;
			urlUploadFinished: (payload: { marker: string; file: DriveFile; }) => void;
			readAllNotifications: () => void;
			unreadNotification: (payload: Notification) => void;
			unreadMention: (payload: Note['id']) => void;
			readAllUnreadMentions: () => void;
			notificationFlushed: () => void;
			unreadSpecifiedNote: (payload: Note['id']) => void;
			readAllUnreadSpecifiedNotes: () => void;
			readAllAntennas: () => void;
			unreadAntenna: (payload: Antenna) => void;
			readAllAnnouncements: () => void;
			myTokenRegenerated: () => void;
			signin: (payload: Signin) => void;
			registryUpdated: (payload: {
				scope?: string[];
				key: string;
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				value: any | null;
			}) => void;
			driveFileCreated: (payload: DriveFile) => void;
			readAntenna: (payload: Antenna) => void;
			receiveFollowRequest: (payload: User) => void;
			announcementCreated: (payload: AnnouncementCreated) => void;
		};
		receives: null;
	};
	homeTimeline: {
		params: {
			withRenotes?: boolean;
			withFiles?: boolean;
			minimize?: boolean;
		};
		events: {
			note: (payload: Note | StreamNote) => void;
		};
		receives: null;
	};
	localTimeline: {
		params: {
			withRenotes?: boolean;
			withReplies?: boolean;
			withFiles?: boolean;
			minimize?: boolean;
		};
		events: {
			note: (payload: Note | StreamNote) => void;
		};
		receives: null;
	};
	hybridTimeline: {
		params: {
			withRenotes?: boolean;
			withReplies?: boolean;
			withFiles?: boolean;
			minimize?: boolean;
		};
		events: {
			note: (payload: Note | StreamNote) => void;
		};
		receives: null;
	};
	globalTimeline: {
		params: {
			withRenotes?: boolean;
			withFiles?: boolean;
			minimize?: boolean;
		};
		events: {
			note: (payload: Note | StreamNote) => void;
		};
		receives: null;
	};
	userList: {
		params: {
			listId: string;
			withFiles?: boolean;
			withRenotes?: boolean;
			minimize?: boolean;
		};
		events: {
			note: (payload: Note | StreamNote) => void;
		};
		receives: null;
	};
	hashtag: {
		params: {
			q: string[][];
		};
		events: {
			note: (payload: Note) => void;
		};
		receives: null;
	};
	roleTimeline: {
		params: {
			roleId: string;
			minimize?: boolean;
		};
		events: {
			note: (payload: Note | StreamNote) => void;
		};
		receives: null;
	};
	antenna: {
		params: {
			antennaId: string;
			minimize?: boolean;
		};
		events: {
			note: (payload: Note | StreamNote) => void;
		};
		receives: null;
	};
	channel: {
		params: {
			channelId: string;
			minimize?: boolean;
		};
		events: {
			note: (payload: Note | StreamNote) => void;
		};
		receives: null;
	};
	drive: {
		params: null;
		events: {
			fileCreated: (payload: DriveFile) => void;
			fileDeleted: (payload: DriveFile['id']) => void;
			fileUpdated: (payload: DriveFile) => void;
			folderCreated: (payload: DriveFolder) => void;
			folderDeleted: (payload: DriveFolder['id']) => void;
			folderUpdated: (payload: DriveFolder) => void;
		};
		receives: null;
	};
	serverStats: {
		params: null;
		events: {
			stats: (payload: ServerStats) => void;
			statsLog: (payload: ServerStatsLog) => void;
		};
		receives: {
			requestLog: {
				id: string | number;
				length: number;
			};
		};
	};
	queueStats: {
		params: null;
		events: {
			stats: (payload: QueueStats) => void;
			statsLog: (payload: QueueStatsLog) => void;
		};
		receives: {
			requestLog: {
				id: string | number;
				length: number;
			};
		};
	};
	admin: {
		params: null;
		events: {
			newAbuseUserReport: {
				id: string;
				targetUserId: string;
				reporterId: string;
				comment: string;
			}
		};
		receives: null;
	};
	reversiGame: {
		params: {
			gameId: string;
		};
		events: {
			started: (payload: { game: ReversiGameDetailed; }) => void;
			ended: (payload: { winnerId: User['id'] | null; game: ReversiGameDetailed; }) => void;
			canceled: (payload: { userId: User['id']; }) => void;
			changeReadyStates: (payload: { user1: boolean; user2: boolean; }) => void;
			updateSettings: <K extends ReversiUpdateKey>(payload: { userId: User['id']; key: K; value: ReversiGameDetailed[K]; }) => void;
			log: (payload: Record<string, unknown>) => void;
		};
		receives: {
			putStone: {
				pos: number;
				id: string;
			};
			ready: boolean;
			cancel: null | Record<string, never>;
			updateSettings: ReversiUpdateSettings<ReversiUpdateKey>;
			claimTimeIsUp: null | Record<string, never>;
		}
	}
};

export type NoteUpdatedEvent = { id: Note['id'] } & ({
	type: 'reacted';
	body: {
		reaction: string;
		emoji: string | null;
		userId: User['id'];
	};
} | {
	type: 'unreacted';
	body: {
		reaction: string;
		userId: User['id'];
	};
} | {
	type: 'deleted';
	body: {
		deletedAt: string;
	};
} | {
	type: 'pollVoted';
	body: {
		choice: number;
		userId: User['id'];
	};
});

export type BroadcastEvents = {
	noteUpdated: (payload: NoteUpdatedEvent) => void;
	emojiAdded: (payload: EmojiAdded) => void;
	emojiUpdated: (payload: EmojiUpdated) => void;
	emojiDeleted: (payload: EmojiDeleted) => void;
	announcementCreated: (payload: AnnouncementCreated) => void;
};
