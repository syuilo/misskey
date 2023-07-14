import type {
	Ad, Announcement, Antenna, App, AuthSession, Blocking, Channel, Clip, DateString, DetailedInstanceMetadata, DriveFile, DriveFolder, Following, FollowingFolloweePopulated, FollowingFollowerPopulated, FollowRequest, GalleryPost, Instance,
	LiteInstanceMetadata,
	MeDetailed,
	Note, NoteFavorite, OriginType, Page, ServerInfo, Stats, User, UserDetailed, MeSignup, UserGroup, UserList, UserSorting, Notification, NoteReaction, Signin, MessagingMessage,
} from './entities.js';

type TODO = Record<string, any> | null;

type NoParams = Record<string, never>;

type ShowUserReq = { username: string; host?: string; } | { userId: User['id']; };

export type Endpoints = {
	// admin
	'admin/abuse-user-reports': { req: TODO; res: TODO; };
	'admin/delete-all-files-of-a-user': { req: { userId: User['id']; }; res: null; };
	'admin/delete-logs': { req: NoParams; res: null; };
	'admin/get-index-stats': { req: TODO; res: TODO; };
	'admin/get-table-stats': { req: TODO; res: TODO; };
	'admin/invite': { req: TODO; res: TODO; };
	'admin/logs': { req: TODO; res: TODO; };
	'admin/meta': { req: TODO; res: TODO; };
	'admin/reset-password': { req: TODO; res: TODO; };
	'admin/resolve-abuse-user-report': { req: TODO; res: TODO; };
	'admin/resync-chart': { req: TODO; res: TODO; };
	'admin/send-email': { req: TODO; res: TODO; };
	'admin/server-info': { req: TODO; res: TODO; };
	'admin/show-moderation-logs': { req: TODO; res: TODO; };
	'admin/show-user': { req: TODO; res: TODO; };
	'admin/show-users': { req: TODO; res: TODO; };
	'admin/silence-user': { req: TODO; res: TODO; };
	'admin/suspend-user': { req: TODO; res: TODO; };
	'admin/unsilence-user': { req: TODO; res: TODO; };
	'admin/unsuspend-user': { req: TODO; res: TODO; };
	'admin/update-meta': { req: TODO; res: TODO; };
	'admin/vacuum': { req: TODO; res: TODO; };
	'admin/accounts/create': { req: TODO; res: TODO; };
	'admin/ad/create': { req: TODO; res: TODO; };
	'admin/ad/delete': { req: { id: Ad['id']; }; res: null; };
	'admin/ad/list': { req: TODO; res: TODO; };
	'admin/ad/update': { req: TODO; res: TODO; };
	'admin/announcements/create': { req: TODO; res: TODO; };
	'admin/announcements/delete': { req: { id: Announcement['id'] }; res: null; };
	'admin/announcements/list': { req: TODO; res: TODO; };
	'admin/announcements/update': { req: TODO; res: TODO; };
	'admin/drive/clean-remote-files': { req: TODO; res: TODO; };
	'admin/drive/cleanup': { req: TODO; res: TODO; };
	'admin/drive/files': { req: TODO; res: TODO; };
	'admin/drive/show-file': { req: TODO; res: TODO; };
	'admin/emoji/add': { req: TODO; res: TODO; };
	'admin/emoji/copy': { req: TODO; res: TODO; };
	'admin/emoji/list-remote': { req: TODO; res: TODO; };
	'admin/emoji/list': { req: TODO; res: TODO; };
	'admin/emoji/remove': { req: TODO; res: TODO; };
	'admin/emoji/update': { req: TODO; res: TODO; };
	'admin/federation/delete-all-files': { req: { host: string; }; res: null; };
	'admin/federation/refresh-remote-instance-metadata': { req: TODO; res: TODO; };
	'admin/federation/remove-all-following': { req: TODO; res: TODO; };
	'admin/federation/update-instance': { req: TODO; res: TODO; };
	'admin/moderators/add': { req: TODO; res: TODO; };
	'admin/moderators/remove': { req: TODO; res: TODO; };
	'admin/promo/create': { req: TODO; res: TODO; };
	'admin/queue/clear': { req: TODO; res: TODO; };
	'admin/queue/deliver-delayed': { req: TODO; res: TODO; };
	'admin/queue/inbox-delayed': { req: TODO; res: TODO; };
	'admin/queue/jobs': { req: TODO; res: TODO; };
	'admin/queue/stats': { req: TODO; res: TODO; };
	'admin/relays/add': { req: TODO; res: TODO; };
	'admin/relays/list': { req: TODO; res: TODO; };
	'admin/relays/remove': { req: TODO; res: TODO; };

	// announcements
	'announcements': { req: { limit?: number; withUnreads?: boolean; sinceId?: Announcement['id']; untilId?: Announcement['id']; }; res: Announcement[]; };

	// antennas
	'antennas/create': { req: TODO; res: Antenna; };
	'antennas/delete': { req: { antennaId: Antenna['id']; }; res: null; };
	'antennas/list': { req: NoParams; res: Antenna[]; };
	'antennas/notes': { req: { antennaId: Antenna['id']; limit?: number; sinceId?: Note['id']; untilId?: Note['id']; }; res: Note[]; };
	'antennas/show': { req: { antennaId: Antenna['id']; }; res: Antenna; };
	'antennas/update': { req: TODO; res: Antenna; };

	// ap
	'ap/get': { req: { uri: string; }; res: Record<string, any>; };
	'ap/show': { req: { uri: string; }; res: {
		type: 'Note';
		object: Note;
	} | {
		type: 'User';
		object: UserDetailed;
	}; };

	// app
	'app/create': { req: TODO; res: App; };
	'app/show': { req: { appId: App['id']; }; res: App; };

	// auth
	'auth/accept': { req: { token: string; }; res: null; };
	'auth/session/generate': { req: { appSecret: string; }; res: { token: string; url: string; }; };
	'auth/session/show': { req: { token: string; }; res: AuthSession; };
	'auth/session/userkey': { req: { appSecret: string; token: string; }; res: { accessToken: string; user: User }; };

	// blocking
	'blocking/create': { req: { userId: User['id'] }; res: UserDetailed; };
	'blocking/delete': { req: { userId: User['id'] }; res: UserDetailed; };
	'blocking/list': { req: { limit?: number; sinceId?: Blocking['id']; untilId?: Blocking['id']; }; res: Blocking[]; };

	// channels
	'channels/create': { req: TODO; res: TODO; };
	'channels/featured': { req: TODO; res: TODO; };
	'channels/follow': { req: TODO; res: TODO; };
	'channels/followed': { req: TODO; res: TODO; };
	'channels/owned': { req: TODO; res: TODO; };
	'channels/pin-note': { req: TODO; res: TODO; };
	'channels/show': { req: TODO; res: TODO; };
	'channels/timeline': { req: TODO; res: TODO; };
	'channels/unfollow': { req: TODO; res: TODO; };
	'channels/update': { req: TODO; res: TODO; };

	// charts
	'charts/active-users': { req: { span: 'day' | 'hour'; limit?: number; offset?: number | null; }; res: {
		local: {
			users: number[];
		};
		remote: {
			users: number[];
		};
	}; };
	'charts/drive': { req: { span: 'day' | 'hour'; limit?: number; offset?: number | null; }; res: {
		local: {
			decCount: number[];
			decSize: number[];
			incCount: number[];
			incSize: number[];
			totalCount: number[];
			totalSize: number[];
		};
		remote: {
			decCount: number[];
			decSize: number[];
			incCount: number[];
			incSize: number[];
			totalCount: number[];
			totalSize: number[];
		};
	}; };
	'charts/federation': { req: { span: 'day' | 'hour'; limit?: number; offset?: number | null; }; res: {
		instance: {
			dec: number[];
			inc: number[];
			total: number[];
		};
	}; };
	'charts/hashtag': { req: { span: 'day' | 'hour'; limit?: number; offset?: number | null; }; res: TODO; };
	'charts/instance': { req: { span: 'day' | 'hour'; limit?: number; offset?: number | null; host: string; }; res: {
		drive: {
			decFiles: number[];
			decUsage: number[];
			incFiles: number[];
			incUsage: number[];
			totalFiles: number[];
			totalUsage: number[];
		};
		followers: {
			dec: number[];
			inc: number[];
			total: number[];
		};
		following: {
			dec: number[];
			inc: number[];
			total: number[];
		};
		notes: {
			dec: number[];
			inc: number[];
			total: number[];
			diffs: {
				normal: number[];
				renote: number[];
				reply: number[];
			};
		};
		requests: {
			failed: number[];
			received: number[];
			succeeded: number[];
		};
		users: {
			dec: number[];
			inc: number[];
			total: number[];
		};
	}; };
	'charts/network': { req: { span: 'day' | 'hour'; limit?: number; offset?: number | null; }; res: TODO; };
	'charts/notes': { req: { span: 'day' | 'hour'; limit?: number; offset?: number | null; }; res: {
		local: {
			dec: number[];
			inc: number[];
			total: number[];
			diffs: {
				normal: number[];
				renote: number[];
				reply: number[];
			};
		};
		remote: {
			dec: number[];
			inc: number[];
			total: number[];
			diffs: {
				normal: number[];
				renote: number[];
				reply: number[];
			};
		};
	}; };
	'charts/user/drive': { req: { span: 'day' | 'hour'; limit?: number; offset?: number | null; userId: User['id']; }; res: {
		decCount: number[];
		decSize: number[];
		incCount: number[];
		incSize: number[];
		totalCount: number[];
		totalSize: number[];
	}; };
	'charts/user/following': { req: { span: 'day' | 'hour'; limit?: number; offset?: number | null; userId: User['id']; }; res: TODO; };
	'charts/user/notes': { req: { span: 'day' | 'hour'; limit?: number; offset?: number | null; userId: User['id']; }; res: {
		dec: number[];
		inc: number[];
		total: number[];
		diffs: {
			normal: number[];
			renote: number[];
			reply: number[];
		};
	}; };
	'charts/user/reactions': { req: { span: 'day' | 'hour'; limit?: number; offset?: number | null; userId: User['id']; }; res: TODO; };
	'charts/users': { req: { span: 'day' | 'hour'; limit?: number; offset?: number | null; }; res: {
		local: {
			dec: number[];
			inc: number[];
			total: number[];
		};
		remote: {
			dec: number[];
			inc: number[];
			total: number[];
		};
	}; };

	// clips
	'clips/add-note': { req: TODO; res: TODO; };
	'clips/create': { req: TODO; res: TODO; };
	'clips/delete': { req: { clipId: Clip['id']; }; res: null; };
	'clips/list': { req: TODO; res: TODO; };
	'clips/notes': { req: TODO; res: TODO; };
	'clips/show': { req: TODO; res: TODO; };
	'clips/update': { req: TODO; res: TODO; };

	// drive
	'drive': { req: NoParams; res: { capacity: number; usage: number; }; };
	'drive/files': { req: { folderId?: DriveFolder['id'] | null; type?: DriveFile['type'] | null; limit?: number; sinceId?: DriveFile['id']; untilId?: DriveFile['id']; }; res: DriveFile[]; };
	'drive/files/attached-notes': { req: TODO; res: TODO; };
	'drive/files/check-existence': { req: TODO; res: TODO; };
	'drive/files/create': {
		req: {
			folderId?: string,
			name?: string,
			comment?: string,
			isSentisive?: boolean,
			force?: boolean,
		};
		res: DriveFile;
	};
	'drive/files/delete': { req: { fileId: DriveFile['id']; }; res: null; };
	'drive/files/find-by-hash': { req: TODO; res: TODO; };
	'drive/files/find': { req: { name: string; folderId?: DriveFolder['id'] | null; }; res: DriveFile[]; };
	'drive/files/show': { req: { fileId?: DriveFile['id']; url?: string; }; res: DriveFile; };
	'drive/files/update': { req: { fileId: DriveFile['id']; folderId?: DriveFolder['id'] | null; name?: string; isSensitive?: boolean; comment?: string | null; }; res: DriveFile; };
	'drive/files/upload-from-url': { req: { url: string; folderId?: DriveFolder['id'] | null; isSensitive?: boolean; comment?: string | null; marker?: string | null; force?: boolean; }; res: null; };
	'drive/folders': { req: { folderId?: DriveFolder['id'] | null; limit?: number; sinceId?: DriveFile['id']; untilId?: DriveFile['id']; }; res: DriveFolder[]; };
	'drive/folders/create': { req: { name?: string; parentId?: DriveFolder['id'] | null; }; res: DriveFolder; };
	'drive/folders/delete': { req: { folderId: DriveFolder['id']; }; res: null; };
	'drive/folders/find': { req: { name: string; parentId?: DriveFolder['id'] | null; }; res: DriveFolder[]; };
	'drive/folders/show': { req: { folderId: DriveFolder['id']; }; res: DriveFolder; };
	'drive/folders/update': { req: { folderId: DriveFolder['id']; name?: string; parentId?: DriveFolder['id'] | null; }; res: DriveFolder; };
	'drive/stream': { req: { type?: DriveFile['type'] | null; limit?: number; sinceId?: DriveFile['id']; untilId?: DriveFile['id']; }; res: DriveFile[]; };

	// endpoint
	'endpoint': { req: { endpoint: string; }; res: { params: { name: string; type: string; }[]; }; };

	// endpoints
	'endpoints': { req: NoParams; res: string[]; };

	// federation
	'federation/dns': { req: { host: string; }; res: {
		a: string[];
		aaaa: string[];
		cname: string[];
		txt: string[];
	}; };
	'federation/followers': { req: { host: string; limit?: number; sinceId?: Following['id']; untilId?: Following['id']; }; res: FollowingFolloweePopulated[]; };
	'federation/following': { req: { host: string; limit?: number; sinceId?: Following['id']; untilId?: Following['id']; }; res: FollowingFolloweePopulated[]; };
	'federation/instances': { req: {
		host?: string | null;
		blocked?: boolean | null;
		notResponding?: boolean | null;
		suspended?: boolean | null;
		federating?: boolean | null;
		subscribing?: boolean | null;
		publishing?: boolean | null;
		limit?: number;
		offset?: number;
		sort?: '+pubSub' | '-pubSub' | '+notes' | '-notes' | '+users' | '-users' | '+following' | '-following' | '+followers' | '-followers' | '+caughtAt' | '-caughtAt' | '+lastCommunicatedAt' | '-lastCommunicatedAt' | '+driveUsage' | '-driveUsage' | '+driveFiles' | '-driveFiles';
	}; res: Instance[]; };
	'federation/show-instance': { req: { host: string; }; res: Instance; };
	'federation/update-remote-user': { req: { userId: User['id']; }; res: null; };
	'federation/users': { req: { host: string; limit?: number; sinceId?: User['id']; untilId?: User['id']; }; res: UserDetailed[]; };

	// following
	'following/create': { req: { userId: User['id'] }; res: User; };
	'following/delete': { req: { userId: User['id'] }; res: User; };
	'following/requests/accept': { req: { userId: User['id'] }; res: null; };
	'following/requests/cancel': { req: { userId: User['id'] }; res: User; };
	'following/requests/list': { req: NoParams; res: FollowRequest[]; };
	'following/requests/reject': { req: { userId: User['id'] }; res: null; };

	// gallery
	'gallery/featured': { req: null; res: GalleryPost[]; };
	'gallery/popular': { req: null; res: GalleryPost[]; };
	'gallery/posts': { req: { limit?: number; sinceId?: GalleryPost['id']; untilId?: GalleryPost['id']; }; res: GalleryPost[]; };
	'gallery/posts/create': { req: { title: GalleryPost['title']; description?: GalleryPost['description']; fileIds: GalleryPost['fileIds']; isSensitive?: GalleryPost['isSensitive'] }; res: GalleryPost; };
	'gallery/posts/delete': { req: { postId: GalleryPost['id'] }; res: null; };
	'gallery/posts/like': { req: { postId: GalleryPost['id'] }; res: null; };
	'gallery/posts/show': { req: { postId: GalleryPost['id'] }; res: GalleryPost; };
	'gallery/posts/unlike': { req: { postId: GalleryPost['id'] }; res: null; };
	'gallery/posts/update': { req: { postId: GalleryPost['id']; title: GalleryPost['title']; description?: GalleryPost['description']; fileIds: GalleryPost['fileIds']; isSensitive?: GalleryPost['isSensitive'] }; res: GalleryPost; };

	// games
	'games/reversi/games': { req: TODO; res: TODO; };
	'games/reversi/games/show': { req: TODO; res: TODO; };
	'games/reversi/games/surrender': { req: TODO; res: TODO; };
	'games/reversi/invitations': { req: TODO; res: TODO; };
	'games/reversi/match': { req: TODO; res: TODO; };
	'games/reversi/match/cancel': { req: TODO; res: TODO; };

	// get-online-users-count
	'get-online-users-count': { req: NoParams; res: { count: number; }; };

	// hashtags
	'hashtags/list': { req: TODO; res: TODO; };
	'hashtags/search': { req: TODO; res: TODO; };
	'hashtags/show': { req: TODO; res: TODO; };
	'hashtags/trend': { req: TODO; res: TODO; };
	'hashtags/users': { req: TODO; res: TODO; };

	// i
	'i': { req: NoParams; res: User; };
	'i/apps': { req: TODO; res: TODO; };
	'i/authorized-apps': { req: TODO; res: TODO; };
	'i/change-password': { req: TODO; res: TODO; };
	'i/delete-account': { req: { password: string; }; res: null; };
	'i/export-blocking': { req: TODO; res: TODO; };
	'i/export-following': { req: TODO; res: TODO; };
	'i/export-mute': { req: TODO; res: TODO; };
	'i/export-notes': { req: TODO; res: TODO; };
	'i/export-user-lists': { req: TODO; res: TODO; };
	'i/favorites': { req: { limit?: number; sinceId?: NoteFavorite['id']; untilId?: NoteFavorite['id']; }; res: NoteFavorite[]; };
	'i/gallery/likes': { req: TODO; res: TODO; };
	'i/gallery/posts': { req: TODO; res: TODO; };
	'i/get-word-muted-notes-count': { req: TODO; res: TODO; };
	'i/import-following': { req: TODO; res: TODO; };
	'i/import-user-lists': { req: TODO; res: TODO; };
	'i/move': { req: TODO; res: TODO; };
	'i/notifications': { req: {
		limit?: number;
		sinceId?: Notification['id'];
		untilId?: Notification['id'];
		following?: boolean;
		markAsRead?: boolean;
		includeTypes?: Notification['type'][];
		excludeTypes?: Notification['type'][];
	}; res: Notification[]; };
	'i/page-likes': { req: TODO; res: TODO; };
	'i/pages': { req: TODO; res: TODO; };
	'i/pin': { req: { noteId: Note['id']; }; res: MeDetailed; };
	'i/read-all-messaging-messages': { req: TODO; res: TODO; };
	'i/read-all-unread-notes': { req: TODO; res: TODO; };
	'i/read-announcement': { req: TODO; res: TODO; };
	'i/regenerate-token': { req: { password: string; }; res: null; };
	'i/registry/get-all': { req: { scope?: string[]; }; res: Record<string, any>; };
	'i/registry/get-detail': { req: { key: string; scope?: string[]; }; res: { updatedAt: DateString; value: any; }; };
	'i/registry/get': { req: { key: string; scope?: string[]; }; res: any; };
	'i/registry/keys-with-type': { req: { scope?: string[]; }; res: Record<string, 'null' | 'array' | 'number' | 'string' | 'boolean' | 'object'>; };
	'i/registry/keys': { req: { scope?: string[]; }; res: string[]; };
	'i/registry/remove': { req: { key: string; scope?: string[]; }; res: null; };
	'i/registry/scopes': { req: NoParams; res: string[][]; };
	'i/registry/set': { req: { key: string; value: any; scope?: string[]; }; res: null; };
	'i/revoke-token': { req: TODO; res: TODO; };
	'i/signin-history': { req: { limit?: number; sinceId?: Signin['id']; untilId?: Signin['id']; }; res: Signin[]; };
	'i/unpin': { req: { noteId: Note['id']; }; res: MeDetailed; };
	'i/update-email': { req: {
		password: string;
		email?: string | null;
	}; res: MeDetailed; };
	'i/update': { req: {
		name?: string | null;
		description?: string | null;
		lang?: string | null;
		location?: string | null;
		birthday?: string | null;
		avatarId?: DriveFile['id'] | null;
		bannerId?: DriveFile['id'] | null;
		fields?: {
			name: string;
			value: string;
		}[];
		isLocked?: boolean;
		isExplorable?: boolean;
		hideOnlineStatus?: boolean;
		carefulBot?: boolean;
		autoAcceptFollowed?: boolean;
		noCrawle?: boolean;
		isBot?: boolean;
		isCat?: boolean;
		injectFeaturedNote?: boolean;
		receiveAnnouncementEmail?: boolean;
		alwaysMarkNsfw?: boolean;
		mutedWords?: string[][];
		mutingNotificationTypes?: Notification['type'][];
		emailNotificationTypes?: string[];
		alsoKnownAs?: string[];
	}; res: MeDetailed; };
	'i/user-group-invites': { req: TODO; res: TODO; };
	'i/2fa/done': { req: TODO; res: TODO; };
	'i/2fa/key-done': { req: TODO; res: TODO; };
	'i/2fa/password-less': { req: TODO; res: TODO; };
	'i/2fa/register-key': { req: TODO; res: TODO; };
	'i/2fa/register': { req: TODO; res: TODO; };
	'i/2fa/remove-key': { req: TODO; res: TODO; };
	'i/2fa/unregister': { req: TODO; res: TODO; };

	// messaging
	'messaging/history': { req: { limit?: number; group?: boolean; }; res: MessagingMessage[]; };
	'messaging/messages': { req: { userId?: User['id']; groupId?: UserGroup['id']; limit?: number; sinceId?: MessagingMessage['id']; untilId?: MessagingMessage['id']; markAsRead?: boolean; }; res: MessagingMessage[]; };
	'messaging/messages/create': { req: { userId?: User['id']; groupId?: UserGroup['id']; text?: string; fileId?: DriveFile['id']; }; res: MessagingMessage; };
	'messaging/messages/delete': { req: { messageId: MessagingMessage['id']; }; res: null; };
	'messaging/messages/read': { req: { messageId: MessagingMessage['id']; }; res: null; };

	// meta
	'meta': { req: { detail?: boolean; }; res: {
		$switch: {
			$cases: [[
				{ detail: true; },
				DetailedInstanceMetadata,
			], [
				{ detail: false; },
				LiteInstanceMetadata,
			], [
				{ detail: boolean; },
				LiteInstanceMetadata | DetailedInstanceMetadata,
			]];
			$default: LiteInstanceMetadata;
		};
	}; };

	// miauth
	'miauth/gen-token': { req: TODO; res: TODO; };

	// mute
	'mute/create': { req: TODO; res: TODO; };
	'mute/delete': { req: { userId: User['id'] }; res: null; };
	'mute/list': { req: TODO; res: TODO; };

	// my
	'my/apps': { req: TODO; res: TODO; };

	// notes
	'notes': { req: { limit?: number; sinceId?: Note['id']; untilId?: Note['id']; }; res: Note[]; };
	'notes/children': { req: { noteId: Note['id']; limit?: number; sinceId?: Note['id']; untilId?: Note['id']; }; res: Note[]; };
	'notes/clips': { req: TODO; res: TODO; };
	'notes/conversation': { req: TODO; res: TODO; };
	'notes/create': { req: {
		visibility?: 'public' | 'home' | 'followers' | 'specified',
		visibleUserIds?: User['id'][];
		text?: null | string;
		cw?: null | string;
		viaMobile?: boolean;
		localOnly?: boolean;
		fileIds?: DriveFile['id'][];
		replyId?: null | Note['id'];
		renoteId?: null | Note['id'];
		channelId?: null | Channel['id'];
		poll?: null | {
			choices: string[];
			multiple?: boolean;
			expiresAt?: null | number;
			expiredAfter?: null | number;
		};
	}; res: { createdNote: Note }; };
	'notes/delete': { req: { noteId: Note['id']; }; res: null; };
	'notes/favorites/create': { req: { noteId: Note['id']; }; res: null; };
	'notes/favorites/delete': { req: { noteId: Note['id']; }; res: null; };
	'notes/featured': { req: TODO; res: Note[]; };
	'notes/global-timeline': { req: { limit?: number; sinceId?: Note['id']; untilId?: Note['id']; sinceDate?: number; untilDate?: number; }; res: Note[]; };
	'notes/hybrid-timeline': { req: { limit?: number; sinceId?: Note['id']; untilId?: Note['id']; sinceDate?: number; untilDate?: number; }; res: Note[]; };
	'notes/local-timeline': { req: { limit?: number; sinceId?: Note['id']; untilId?: Note['id']; sinceDate?: number; untilDate?: number; }; res: Note[]; };
	'notes/mentions': { req: { following?: boolean; limit?: number; sinceId?: Note['id']; untilId?: Note['id']; }; res: Note[]; };
	'notes/polls/recommendation': { req: TODO; res: TODO; };
	'notes/polls/vote': { req: { noteId: Note['id']; choice: number; }; res: null; };
	'notes/reactions': { req: { noteId: Note['id']; type?: string | null; limit?: number; }; res: NoteReaction[]; };
	'notes/reactions/create': { req: { noteId: Note['id']; reaction: string; }; res: null; };
	'notes/reactions/delete': { req: { noteId: Note['id']; }; res: null; };
	'notes/renotes': { req: { limit?: number; sinceId?: Note['id']; untilId?: Note['id']; noteId: Note['id']; }; res: Note[]; };
	'notes/replies': { req: { limit?: number; sinceId?: Note['id']; untilId?: Note['id']; noteId: Note['id']; }; res: Note[]; };
	'notes/search-by-tag': { req: TODO; res: TODO; };
	'notes/search': { req: TODO; res: TODO; };
	'notes/show': { req: { noteId: Note['id']; }; res: Note; };
	'notes/state': { req: TODO; res: TODO; };
	'notes/timeline': { req: { limit?: number; sinceId?: Note['id']; untilId?: Note['id']; sinceDate?: number; untilDate?: number; }; res: Note[]; };
	'notes/unrenote': { req: { noteId: Note['id']; }; res: null; };
	'notes/user-list-timeline': { req: { listId: UserList['id']; limit?: number; sinceId?: Note['id']; untilId?: Note['id']; sinceDate?: number; untilDate?: number; }; res: Note[]; };
	'notes/watching/create': { req: TODO; res: TODO; };
	'notes/watching/delete': { req: { noteId: Note['id']; }; res: null; };

	// notifications
	'notifications/create': { req: { body: string; header?: string | null; icon?: string | null; }; res: null; };
	'notifications/mark-all-as-read': { req: NoParams; res: null; };

	// page-push
	'page-push': { req: { pageId: Page['id']; event: string; var?: any; }; res: null; };

	// pages
	'pages/create': { req: TODO; res: Page; };
	'pages/delete': { req: { pageId: Page['id']; }; res: null; };
	'pages/featured': { req: NoParams; res: Page[]; };
	'pages/like': { req: { pageId: Page['id']; }; res: null; };
	'pages/show': { req: { pageId?: Page['id']; name?: string; username?: string; }; res: Page; };
	'pages/unlike': { req: { pageId: Page['id']; }; res: null; };
	'pages/update': { req: TODO; res: null; };

	// ping
	'ping': { req: NoParams; res: { pong: number; }; };

	// pinned-users
	'pinned-users': { req: TODO; res: TODO; };

	// promo
	'promo/read': { req: TODO; res: TODO; };

	// request-reset-password
	'request-reset-password': { req: { username: string; email: string; }; res: null; };

	// reset-password
	'reset-password': { req: { token: string; password: string; }; res: null; };

	// room
	'room/show': { req: TODO; res: TODO; };
	'room/update': { req: TODO; res: TODO; };

	// signup
	'signup': {
		req: {
			username: string;
			password: string;
			host?: string;
			invitationCode?: string;
			emailAddress?: string;
			'hcaptcha-response'?: string;
			'g-recaptcha-response'?: string;
			'turnstile-response'?: string;
		};
		res: MeSignup | null;
	};

	// stats
	'stats': { req: NoParams; res: Stats; };

	// server-info
	'server-info': { req: NoParams; res: ServerInfo; };

	// sw
	'sw/register': { req: TODO; res: TODO; };

	// username
	'username/available': { req: { username: string; }; res: { available: boolean; }; };

	// users
	'users': { req: { limit?: number; offset?: number; sort?: UserSorting; origin?: OriginType; }; res: User[]; };
	'users/clips': { req: TODO; res: TODO; };
	'users/followers': { req: { userId?: User['id']; username?: User['username']; host?: User['host'] | null; limit?: number; sinceId?: Following['id']; untilId?: Following['id']; }; res: FollowingFollowerPopulated[]; };
	'users/following': { req: { userId?: User['id']; username?: User['username']; host?: User['host'] | null; limit?: number; sinceId?: Following['id']; untilId?: Following['id']; }; res: FollowingFolloweePopulated[]; };
	'users/gallery/posts': { req: TODO; res: TODO; };
	'users/get-frequently-replied-users': { req: TODO; res: TODO; };
	'users/groups/create': { req: TODO; res: TODO; };
	'users/groups/delete': { req: { groupId: UserGroup['id'] }; res: null; };
	'users/groups/invitations/accept': { req: TODO; res: TODO; };
	'users/groups/invitations/reject': { req: TODO; res: TODO; };
	'users/groups/invite': { req: TODO; res: TODO; };
	'users/groups/joined': { req: TODO; res: TODO; };
	'users/groups/owned': { req: TODO; res: TODO; };
	'users/groups/pull': { req: TODO; res: TODO; };
	'users/groups/show': { req: TODO; res: TODO; };
	'users/groups/transfer': { req: TODO; res: TODO; };
	'users/groups/update': { req: TODO; res: TODO; };
	'users/lists/create': { req: { name: string; }; res: UserList; };
	'users/lists/delete': { req: { listId: UserList['id']; }; res: null; };
	'users/lists/list': { req: NoParams; res: UserList[]; };
	'users/lists/pull': { req: { listId: UserList['id']; userId: User['id']; }; res: null; };
	'users/lists/push': { req: { listId: UserList['id']; userId: User['id']; }; res: null; };
	'users/lists/show': { req: { listId: UserList['id']; }; res: UserList; };
	'users/lists/update': { req: { listId: UserList['id']; name: string; }; res: UserList; };
	'users/notes': { req: { userId: User['id']; limit?: number; sinceId?: Note['id']; untilId?: Note['id']; sinceDate?: number; untilDate?: number; }; res: Note[]; };
	'users/pages': { req: TODO; res: TODO; };
	'users/recommendation': { req: TODO; res: TODO; };
	'users/relation': { req: TODO; res: TODO; };
	'users/report-abuse': { req: TODO; res: TODO; };
	'users/search-by-username-and-host': { req: TODO; res: TODO; };
	'users/search': { req: TODO; res: TODO; };
	'users/show': { req: ShowUserReq | { userIds: User['id'][]; }; res: {
		$switch: {
			$cases: [[
				{ userIds: User['id'][]; },
				UserDetailed[],
			]];
			$default: UserDetailed;
		};
	}; };
};
