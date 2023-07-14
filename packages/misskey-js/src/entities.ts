export type ID = string;
export type DateString = string;

type TODO = Record<string, any>;

// NOTE: 極力この型を使うのは避け、UserLite か UserDetailed か明示するように
export type User = UserLite | UserDetailed;

export type UserLite = {
	id: ID;
	username: string;
	host: string | null;
	name: string;
	onlineStatus: 'online' | 'active' | 'offline' | 'unknown';
	avatarUrl: string;
	avatarBlurhash: string;
	emojis: {
		name: string;
		url: string;
	}[];
	instance?: {
		name: Instance['name'];
		softwareName: Instance['softwareName'];
		softwareVersion: Instance['softwareVersion'];
		iconUrl: Instance['iconUrl'];
		faviconUrl: Instance['faviconUrl'];
		themeColor: Instance['themeColor'];
	};
};

export type UserDetailed = UserLite & {
	alsoKnownAs: string[];
	bannerBlurhash: string | null;
	bannerColor: string | null;
	bannerUrl: string | null;
	birthday: string | null;
	createdAt: DateString;
	description: string | null;
	ffVisibility: 'public' | 'followers' | 'private';
	fields: {name: string; value: string}[];
	followersCount: number;
	followingCount: number;
	hasPendingFollowRequestFromYou: boolean;
	hasPendingFollowRequestToYou: boolean;
	isAdmin: boolean;
	isBlocked: boolean;
	isBlocking: boolean;
	isBot: boolean;
	isCat: boolean;
	isFollowed: boolean;
	isFollowing: boolean;
	isLocked: boolean;
	isModerator: boolean;
	isMuted: boolean;
	isSilenced: boolean;
	isSuspended: boolean;
	lang: string | null;
	lastFetchedAt?: DateString;
	location: string | null;
	movedTo: string;
	notesCount: number;
	pinnedNoteIds: ID[];
	pinnedNotes: Note[];
	pinnedPage: Page | null;
	pinnedPageId: string | null;
	publicReactions: boolean;
	securityKeys: boolean;
	twoFactorEnabled: boolean;
	updatedAt: DateString | null;
	uri: string | null;
	url: string | null;
};

export type UserGroup = TODO;

export type UserList = {
	id: ID;
	createdAt: DateString;
	name: string;
	userIds: User['id'][];
};

export type MeDetailed = UserDetailed & {
	avatarId: DriveFile['id'];
	bannerId: DriveFile['id'];
	autoAcceptFollowed: boolean;
	alwaysMarkNsfw: boolean;
	carefulBot: boolean;
	emailNotificationTypes: string[];
	hasPendingReceivedFollowRequest: boolean;
	hasUnreadAnnouncement: boolean;
	hasUnreadAntenna: boolean;
	hasUnreadMentions: boolean;
	hasUnreadMessagingMessage: boolean;
	hasUnreadNotification: boolean;
	hasUnreadSpecifiedNotes: boolean;
	hideOnlineStatus: boolean;
	injectFeaturedNote: boolean;
	integrations: Record<string, any>;
	isDeleted: boolean;
	isExplorable: boolean;
	mutedWords: string[][];
	mutingNotificationTypes: string[];
	noCrawle: boolean;
	receiveAnnouncementEmail: boolean;
	usePasswordLessLogin: boolean;
	[other: string]: any;
};

export type MeDetailedWithSecret = MeDetailed & {
	email: string;
	emailVerified: boolean;
	securityKeysList: {
		id: string;
		name: string;
		lastUsed: string;
	}[];
};

export type MeSignup = MeDetailedWithSecret & {
	token: string;
};

export type DriveFile = {
	id: ID;
	createdAt: DateString;
	isSensitive: boolean;
	name: string;
	thumbnailUrl: string;
	url: string;
	type: string;
	size: number;
	md5: string;
	blurhash: string;
	comment: string | null;
	properties: Record<string, any>;
};

export type DriveFolder = TODO;

export type GalleryPost = {
	id: ID;
	createdAt: DateString;
	updatedAt: DateString;
	userId: User['id'];
	user: User;
	title: string;
	description: string | null;
	fileIds: DriveFile['id'][];
	files: DriveFile[];
	isSensitive: boolean;
	likedCount: number;
	isLiked?: boolean;
};

export type Note = {
	id: ID;
	createdAt: DateString;
	text: string | null;
	cw: string | null;
	user: User;
	userId: User['id'];
	reply?: Note;
	replyId: Note['id'];
	renote?: Note;
	renoteId: Note['id'];
	files: DriveFile[];
	fileIds: DriveFile['id'][];
	visibility: 'public' | 'home' | 'followers' | 'specified';
	visibleUserIds?: User['id'][];
	localOnly?: boolean;
	myReaction?: string;
	reactions: Record<string, number>;
	renoteCount: number;
	repliesCount: number;
	poll?: {
		expiresAt: DateString | null;
		multiple: boolean;
		choices: {
			isVoted: boolean;
			text: string;
			votes: number;
		}[];
	};
	emojis: {
		name: string;
		url: string;
	}[];
	uri?: string;
	url?: string;
	isHidden?: boolean;
};

export type NoteReaction = {
	id: ID;
	createdAt: DateString;
	user: UserLite;
	type: string;
};

export type Notification = {
	id: ID;
	createdAt: DateString;
	isRead: boolean;
} & ({
	type: 'reaction';
	reaction: string;
	user: User;
	userId: User['id'];
	note: Note;
} | {
	type: 'reply';
	user: User;
	userId: User['id'];
	note: Note;
} | {
	type: 'renote';
	user: User;
	userId: User['id'];
	note: Note;
} | {
	type: 'quote';
	user: User;
	userId: User['id'];
	note: Note;
} | {
	type: 'mention';
	user: User;
	userId: User['id'];
	note: Note;
} | {
	type: 'pollVote';
	user: User;
	userId: User['id'];
	note: Note;
} | {
	type: 'follow';
	user: User;
	userId: User['id'];
} | {
	type: 'followRequestAccepted';
	user: User;
	userId: User['id'];
} | {
	type: 'receiveFollowRequest';
	user: User;
	userId: User['id'];
} | {
	type: 'groupInvited';
	invitation: UserGroup;
	user: User;
	userId: User['id'];
} | {
	type: 'app';
	header?: string | null;
	body: string;
	icon?: string | null;
});

export type MessagingMessage = {
	id: ID;
	createdAt: DateString;
	file: DriveFile | null;
	fileId: DriveFile['id'] | null;
	isRead: boolean;
	reads: User['id'][];
	text: string | null;
	user: User;
	userId: User['id'];
	recipient?: User | null;
	recipientId: User['id'] | null;
	group?: UserGroup | null;
	groupId: UserGroup['id'] | null;
};

export type CustomEmoji = {
	id: string;
	name: string;
	url: string;
	category: string;
	aliases: string[];
};

export type LiteInstanceMetadata = {
	maintainerName: string | null;
	maintainerEmail: string | null;
	version: string;
	name: string | null;
	uri: string;
	description: string | null;
	langs: string[];
	tosUrl: string | null;
	repositoryUrl: string;
	feedbackUrl: string;
	disableRegistration: boolean;
	disableLocalTimeline: boolean;
	disableGlobalTimeline: boolean;
	driveCapacityPerLocalUserMb: number;
	driveCapacityPerRemoteUserMb: number;
	emailRequiredForSignup: boolean;
	enableHcaptcha: boolean;
	hcaptchaSiteKey: string | null;
	enableRecaptcha: boolean;
	recaptchaSiteKey: string | null;
	enableTurnstile: boolean;
	turnstileSiteKey: string | null;
	swPublickey: string | null;
	themeColor: string | null;
	mascotImageUrl: string | null;
	bannerUrl: string | null;
	serverErrorImageUrl: string | null;
	infoImageUrl: string | null;
	notFoundImageUrl: string | null;
	iconUrl: string | null;
	backgroundImageUrl: string | null;
	logoImageUrl: string | null;
	maxNoteTextLength: number;
	enableEmail: boolean;
	enableTwitterIntegration: boolean;
	enableGithubIntegration: boolean;
	enableDiscordIntegration: boolean;
	enableServiceWorker: boolean;
	emojis: CustomEmoji[];
	defaultDarkTheme: string | null;
	defaultLightTheme: string | null;
	ads: {
		id: ID;
		ratio: number;
		place: string;
		url: string;
		imageUrl: string;
	}[];
	translatorAvailable: boolean;
	serverRules: string[];
};

export type DetailedInstanceMetadata = LiteInstanceMetadata & {
	pinnedPages: string[];
	pinnedClipId: string | null;
	cacheRemoteFiles: boolean;
	cacheRemoteSensitiveFiles: boolean;
	requireSetup: boolean;
	proxyAccountName: string | null;
	features: Record<string, any>;
};

export type InstanceMetadata = LiteInstanceMetadata | DetailedInstanceMetadata;

export type ServerInfo = {
	machine: string;
	cpu: {
		model: string;
		cores: number;
	};
	mem: {
		total: number;
	};
	fs: {
		total: number;
		used: number;
	};
};

export type Stats = {
	notesCount: number;
	originalNotesCount: number;
	usersCount: number;
	originalUsersCount: number;
	instances: number;
	driveUsageLocal: number;
	driveUsageRemote: number;
};

export type Page = {
	id: ID;
	createdAt: DateString;
	updatedAt: DateString;
	userId: User['id'];
	user: User;
	content: Record<string, any>[];
	variables: Record<string, any>[];
	title: string;
	name: string;
	summary: string | null;
	hideTitleWhenPinned: boolean;
	alignCenter: boolean;
	font: string;
	script: string;
	eyeCatchingImageId: DriveFile['id'] | null;
	eyeCatchingImage: DriveFile | null;
	attachedFiles: any;
	likedCount: number;
	isLiked?: boolean;
};

export type PageEvent = {
	pageId: Page['id'];
	event: string;
	var: any;
	userId: User['id'];
	user: User;
};

export type Announcement = {
	id: ID;
	createdAt: DateString;
	updatedAt: DateString | null;
	text: string;
	title: string;
	imageUrl: string | null;
	isRead?: boolean;
};

export type Antenna = {
	id: ID;
	createdAt: DateString;
	name: string;
	keywords: string[][]; // TODO
	excludeKeywords: string[][]; // TODO
	src: 'home' | 'all' | 'users' | 'list' | 'group';
	userListId: ID | null; // TODO
	userGroupId: ID | null; // TODO
	users: string[]; // TODO
	caseSensitive: boolean;
	notify: boolean;
	withReplies: boolean;
	withFile: boolean;
	hasUnreadNote: boolean;
};

export type App = TODO;

export type AuthSession = {
	id: ID;
	app: App;
	token: string;
};

export type Ad = TODO;

export type Clip = TODO;

export type NoteFavorite = {
	id: ID;
	createdAt: DateString;
	noteId: Note['id'];
	note: Note;
};

export type FollowRequest = {
	id: ID;
	follower: User;
	followee: User;
};

export type Channel = {
	id: ID;
	// TODO
};

export type Following = {
	id: ID;
	createdAt: DateString;
	followerId: User['id'];
	followeeId: User['id'];
};

export type FollowingFolloweePopulated = Following & {
	followee: UserDetailed;
};

export type FollowingFollowerPopulated = Following & {
	follower: UserDetailed;
};

export type Blocking = {
	id: ID;
	createdAt: DateString;
	blockeeId: User['id'];
	blockee: UserDetailed;
};

export type Instance = {
	id: ID;
	caughtAt: DateString;
	host: string;
	usersCount: number;
	notesCount: number;
	followingCount: number;
	followersCount: number;
	driveUsage: number;
	driveFiles: number;
	latestRequestSentAt: DateString | null;
	latestStatus: number | null;
	latestRequestReceivedAt: DateString | null;
	lastCommunicatedAt: DateString;
	isNotResponding: boolean;
	isSuspended: boolean;
	softwareName: string | null;
	softwareVersion: string | null;
	openRegistrations: boolean | null;
	name: string | null;
	description: string | null;
	maintainerName: string | null;
	maintainerEmail: string | null;
	iconUrl: string | null;
	faviconUrl: string | null;
	themeColor: string | null;
	infoUpdatedAt: DateString | null;
};

export type Signin = {
	id: ID;
	createdAt: DateString;
	ip: string;
	headers: Record<string, any>;
	success: boolean;
};

export type UserSorting =
	| '+follower'
	| '-follower'
	| '+createdAt'
	| '-createdAt'
	| '+updatedAt'
	| '-updatedAt';
export type OriginType = 'combined' | 'local' | 'remote';
