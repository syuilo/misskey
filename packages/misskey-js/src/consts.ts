import type { operations } from './autogen/types.js';
import type {
	AbuseReportNotificationRecipient,
	Ad,
	Announcement,
	EmojiDetailed,
	Flash,
	GalleryPost,
	InviteCode,
	MetaDetailed,
	Note,
	Page,
	Role,
	ReversiGameDetailed,
	SystemWebhook,
	UserLite,
} from './autogen/models.js';

export const notificationTypes = ['note', 'follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollVote', 'pollEnded', 'receiveFollowRequest', 'followRequestAccepted', 'groupInvited', 'app', 'roleAssigned', 'achievementEarned'] as const;

export const noteVisibilities = ['public', 'home', 'followers', 'specified'] as const;

export const mutedNoteReasons = ['word', 'manual', 'spam', 'other'] as const;

export const followingVisibilities = ['public', 'followers', 'private'] as const;

export const followersVisibilities = ['public', 'followers', 'private'] as const;

export const permissions = [
	'read:account',
	'write:account',
	'read:blocks',
	'write:blocks',
	'read:drive',
	'write:drive',
	'read:favorites',
	'write:favorites',
	'read:following',
	'write:following',
	'read:messaging',
	'write:messaging',
	'read:mutes',
	'write:mutes',
	'write:notes',
	'read:notifications',
	'write:notifications',
	'read:reactions',
	'write:reactions',
	'write:votes',
	'read:pages',
	'write:pages',
	'write:page-likes',
	'read:page-likes',
	'read:user-groups',
	'write:user-groups',
	'read:channels',
	'write:channels',
	'read:gallery',
	'write:gallery',
	'read:gallery-likes',
	'write:gallery-likes',
	'read:flash',
	'write:flash',
	'read:flash-likes',
	'write:flash-likes',
	'read:admin:abuse-user-reports',
	'write:admin:delete-account',
	'write:admin:delete-all-files-of-a-user',
	'read:admin:index-stats',
	'read:admin:table-stats',
	'read:admin:user-ips',
	'read:admin:meta',
	'write:admin:update-proxy-account',
	'write:admin:reset-password',
	'write:admin:resolve-abuse-user-report',
	'write:admin:send-email',
	'read:admin:server-info',
	'read:admin:show-moderation-log',
	'read:admin:show-user',
	'write:admin:suspend-user',
	'write:admin:unset-user-avatar',
	'write:admin:unset-user-banner',
	'write:admin:unsuspend-user',
	'write:admin:meta',
	'write:admin:user-note',
	'write:admin:roles',
	'read:admin:roles',
	'write:admin:relays',
	'read:admin:relays',
	'write:admin:invite-codes',
	'read:admin:invite-codes',
	'write:admin:announcements',
	'read:admin:announcements',
	'write:admin:avatar-decorations',
	'read:admin:avatar-decorations',
	'write:admin:federation',
	'write:admin:account',
	'read:admin:account',
	'write:admin:emoji',
	'read:admin:emoji',
	'write:admin:queue',
	'read:admin:queue',
	'write:admin:promo',
	'write:admin:drive',
	'read:admin:drive',
	'write:admin:ad',
	'read:admin:ad',
	'write:invite-codes',
	'read:invite-codes',
	'write:clip-favorite',
	'read:clip-favorite',
	'read:federation',
	'write:report-abuse',
] as const;

export const moderationLogTypes = [
	'updateServerSettings',
	'suspend',
	'unsuspend',
	'updateUser',
	'updateUserNote',
	'addCustomEmoji',
	'updateCustomEmoji',
	'deleteCustomEmoji',
	'assignRole',
	'unassignRole',
	'createRole',
	'updateRole',
	'deleteRole',
	'clearQueue',
	'promoteQueue',
	'deleteDriveFile',
	'deleteNote',
	'createGlobalAnnouncement',
	'createUserAnnouncement',
	'updateGlobalAnnouncement',
	'updateUserAnnouncement',
	'deleteGlobalAnnouncement',
	'deleteUserAnnouncement',
	'resetPassword',
	'suspendRemoteInstance',
	'unsuspendRemoteInstance',
	'updateRemoteInstanceNote',
	'markSensitiveDriveFile',
	'unmarkSensitiveDriveFile',
	'resolveAbuseReport',
	'forwardAbuseReport',
	'updateAbuseReportNote',
	'createInvitation',
	'createAd',
	'updateAd',
	'deleteAd',
	'createAvatarDecoration',
	'updateAvatarDecoration',
	'deleteAvatarDecoration',
	'unsetUserAvatar',
	'unsetUserBanner',
	'createSystemWebhook',
	'updateSystemWebhook',
	'deleteSystemWebhook',
	'createAbuseReportNotificationRecipient',
	'updateAbuseReportNotificationRecipient',
	'deleteAbuseReportNotificationRecipient',
	'deleteAccount',
	'deletePage',
	'deleteFlash',
	'deleteGalleryPost',
] as const;

// See: packages/backend/src/core/ReversiService.ts@L410
export const reversiUpdateKeys = [
	'map',
	'bw',
	'isLlotheo',
	'canPutEverywhere',
	'loopedBoard',
	'timeLimitForEachTurn',
] as const satisfies (keyof ReversiGameDetailed)[];

export type ReversiUpdateKey = typeof reversiUpdateKeys[number];

type AvatarDecoration = UserLite['avatarDecorations'][number];

type ReceivedAbuseReport = {
	reportId: AbuseReportNotificationRecipient['id'];
	report: operations['admin___abuse-user-reports']['responses'][200]['content']['application/json'];
	forwarded: boolean;
};

export type ModerationLogPayloads = {
	updateServerSettings: {
		before: MetaDetailed | null;
		after: MetaDetailed | null;
	};
	suspend: {
		userId: string;
		userUsername: string;
		userHost: string | null;
	};
	unsuspend: {
		userId: string;
		userUsername: string;
		userHost: string | null;
	};
	updateUser: {
		userId: string;
		userUsername: string;
		userHost: string | null;
		before: MetaDetailed | null;
		after: MetaDetailed | null;
	};
	updateUserNote: {
		userId: string;
		userUsername: string;
		userHost: string | null;
		before: string | null;
		after: string | null;
	};
	addCustomEmoji: {
		emojiId: string;
		emoji: EmojiDetailed;
	};
	updateCustomEmoji: {
		emojiId: string;
		before: EmojiDetailed;
		after: EmojiDetailed;
	};
	deleteCustomEmoji: {
		emojiId: string;
		emoji: EmojiDetailed;
	};
	assignRole: {
		userId: string;
		userUsername: string;
		userHost: string | null;
		roleId: string;
		roleName: string;
		expiresAt: string | null;
	};
	unassignRole: {
		userId: string;
		userUsername: string;
		userHost: string | null;
		roleId: string;
		roleName: string;
	};
	createRole: {
		roleId: string;
		role: Role;
	};
	updateRole: {
		roleId: string;
		before: Role;
		after: Role;
	};
	deleteRole: {
		roleId: string;
		role: Role;
	};
	clearQueue: Record<string, never>;
	promoteQueue: Record<string, never>;
	deleteDriveFile: {
		fileId: string;
		fileUserId: string | null;
		fileUserUsername: string | null;
		fileUserHost: string | null;
	};
	deleteNote: {
		noteId: string;
		noteUserId: string;
		noteUserUsername: string;
		noteUserHost: string | null;
		note: Note;
	};
	createGlobalAnnouncement: {
		announcementId: string;
		announcement: Announcement;
	};
	createUserAnnouncement: {
		announcementId: string;
		announcement: Announcement;
		userId: string;
		userUsername: string;
		userHost: string | null;
	};
	updateGlobalAnnouncement: {
		announcementId: string;
		before: Announcement;
		after: Announcement;
	};
	updateUserAnnouncement: {
		announcementId: string;
		before: Announcement;
		after: Announcement;
		userId: string;
		userUsername: string;
		userHost: string | null;
	};
	deleteGlobalAnnouncement: {
		announcementId: string;
		announcement: Announcement;
	};
	deleteUserAnnouncement: {
		announcementId: string;
		announcement: Announcement;
		userId: string;
		userUsername: string;
		userHost: string | null;
	};
	resetPassword: {
		userId: string;
		userUsername: string;
		userHost: string | null;
	};
	suspendRemoteInstance: {
		id: string;
		host: string;
	};
	unsuspendRemoteInstance: {
		id: string;
		host: string;
	};
	updateRemoteInstanceNote: {
		id: string;
		host: string;
		before: string | null;
		after: string | null;
	};
	markSensitiveDriveFile: {
		fileId: string;
		fileUserId: string | null;
		fileUserUsername: string | null;
		fileUserHost: string | null;
	};
	unmarkSensitiveDriveFile: {
		fileId: string;
		fileUserId: string | null;
		fileUserUsername: string | null;
		fileUserHost: string | null;
	};
	resolveAbuseReport: {
		reportId: string;
		report: ReceivedAbuseReport;
		forwarded?: boolean;
		resolvedAs?: string | null;
	};
	forwardAbuseReport: {
		reportId: string;
		report: ReceivedAbuseReport;
	};
	updateAbuseReportNote: {
		reportId: string;
		report: ReceivedAbuseReport;
		before: string;
		after: string;
	};
	createInvitation: {
		invitations: InviteCode[];
	};
	createAd: {
		adId: string;
		ad: Ad;
	};
	updateAd: {
		adId: string;
		before: Ad;
		after: Ad;
	};
	deleteAd: {
		adId: string;
		ad: Ad;
	};
	createAvatarDecoration: {
		avatarDecorationId: string;
		avatarDecoration: AvatarDecoration;
	};
	updateAvatarDecoration: {
		avatarDecorationId: string;
		before: AvatarDecoration;
		after: AvatarDecoration;
	};
	deleteAvatarDecoration: {
		avatarDecorationId: string;
		avatarDecoration: AvatarDecoration;
	};
	unsetUserAvatar: {
		userId: string;
		userUsername: string;
		userHost: string | null;
		fileId: string;
	};
	unsetUserBanner: {
		userId: string;
		userUsername: string;
		userHost: string | null;
		fileId: string;
	};
	createSystemWebhook: {
		systemWebhookId: string;
		webhook: SystemWebhook;
	};
	updateSystemWebhook: {
		systemWebhookId: string;
		before: SystemWebhook;
		after: SystemWebhook;
	};
	deleteSystemWebhook: {
		systemWebhookId: string;
		webhook: SystemWebhook;
	};
	createAbuseReportNotificationRecipient: {
		recipientId: string;
		recipient: AbuseReportNotificationRecipient;
	};
	updateAbuseReportNotificationRecipient: {
		recipientId: string;
		before: AbuseReportNotificationRecipient;
		after: AbuseReportNotificationRecipient;
	};
	deleteAbuseReportNotificationRecipient: {
		recipientId: string;
		recipient: AbuseReportNotificationRecipient;
	};
	deleteAccount: {
		userId: string;
		userUsername: string;
		userHost: string | null;
	};
	deletePage: {
		pageId: string;
		pageUserId: string;
		pageUserUsername: string;
		page: Page;
	};
	deleteFlash: {
		flashId: string;
		flashUserId: string;
		flashUserUsername: string;
		flash: Flash;
	};
	deleteGalleryPost: {
		postId: string;
		postUserId: string;
		postUserUsername: string;
		post: GalleryPost;
	};
};
