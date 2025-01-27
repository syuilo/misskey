import { ModerationLogPayloads } from './consts.js';
import {
	Announcement,
	EmojiDetailed,
	MeDetailed,
	Note,
	Page,
	Role,
	RolePolicies,
	User,
	UserDetailedNotMe,
} from './autogen/models.js';
import type { AuthenticationResponseJSON, PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/types';

export * from './autogen/entities.js';
export * from './autogen/models.js';

export type ID = string;
export type DateString = string;

type NonNullableRecord<T> = {
	[P in keyof T]-?: NonNullable<T[P]>;
};
type AllNullRecord<T> = {
	[P in keyof T]: null;
};

export type PureRenote =
	Omit<Note, 'renote' | 'renoteId' | 'reply' | 'replyId' | 'text' | 'cw' | 'files' | 'fileIds' | 'poll'>
	& AllNullRecord<Pick<Note, 'reply' | 'replyId' | 'text' | 'cw' | 'poll'>>
	& { files: []; fileIds: []; }
	& NonNullableRecord<Pick<Note, 'renote' | 'renoteId'>>;

export type PageEvent = {
	pageId: Page['id'];
	event: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	var: any;
	userId: User['id'];
	user: User;
};

export type ModerationLog = {
	id: ID;
	createdAt: DateString;
	userId: User['id'];
	user: UserDetailedNotMe | null;
} & ({
	type: 'updateServerSettings';
	info: ModerationLogPayloads['updateServerSettings'];
} | {
	type: 'suspend';
	info: ModerationLogPayloads['suspend'];
} | {
	type: 'unsuspend';
	info: ModerationLogPayloads['unsuspend'];
} | {
	type: 'updateUserNote';
	info: ModerationLogPayloads['updateUserNote'];
} | {
	type: 'addCustomEmoji';
	info: ModerationLogPayloads['addCustomEmoji'];
} | {
	type: 'updateCustomEmoji';
	info: ModerationLogPayloads['updateCustomEmoji'];
} | {
	type: 'deleteCustomEmoji';
	info: ModerationLogPayloads['deleteCustomEmoji'];
} | {
	type: 'assignRole';
	info: ModerationLogPayloads['assignRole'];
} | {
	type: 'unassignRole';
	info: ModerationLogPayloads['unassignRole'];
} | {
	type: 'createRole';
	info: ModerationLogPayloads['createRole'];
} | {
	type: 'updateRole';
	info: ModerationLogPayloads['updateRole'];
} | {
	type: 'deleteRole';
	info: ModerationLogPayloads['deleteRole'];
} | {
	type: 'clearQueue';
	info: ModerationLogPayloads['clearQueue'];
} | {
	type: 'promoteQueue';
	info: ModerationLogPayloads['promoteQueue'];
} | {
	type: 'deleteDriveFile';
	info: ModerationLogPayloads['deleteDriveFile'];
} | {
	type: 'deleteNote';
	info: ModerationLogPayloads['deleteNote'];
} | {
	type: 'createGlobalAnnouncement';
	info: ModerationLogPayloads['createGlobalAnnouncement'];
} | {
	type: 'createUserAnnouncement';
	info: ModerationLogPayloads['createUserAnnouncement'];
} | {
	type: 'updateGlobalAnnouncement';
	info: ModerationLogPayloads['updateGlobalAnnouncement'];
} | {
	type: 'updateUserAnnouncement';
	info: ModerationLogPayloads['updateUserAnnouncement'];
} | {
	type: 'deleteGlobalAnnouncement';
	info: ModerationLogPayloads['deleteGlobalAnnouncement'];
} | {
	type: 'deleteUserAnnouncement';
	info: ModerationLogPayloads['deleteUserAnnouncement'];
} | {
	type: 'resetPassword';
	info: ModerationLogPayloads['resetPassword'];
} | {
	type: 'suspendRemoteInstance';
	info: ModerationLogPayloads['suspendRemoteInstance'];
} | {
	type: 'unsuspendRemoteInstance';
	info: ModerationLogPayloads['unsuspendRemoteInstance'];
} | {
	type: 'updateRemoteInstanceNote';
	info: ModerationLogPayloads['updateRemoteInstanceNote'];
} | {
	type: 'markSensitiveDriveFile';
	info: ModerationLogPayloads['markSensitiveDriveFile'];
} | {
	type: 'unmarkSensitiveDriveFile';
	info: ModerationLogPayloads['unmarkSensitiveDriveFile'];
} | {
	type: 'createInvitation';
	info: ModerationLogPayloads['createInvitation'];
} | {
	type: 'createAd';
	info: ModerationLogPayloads['createAd'];
} | {
	type: 'updateAd';
	info: ModerationLogPayloads['updateAd'];
} | {
	type: 'deleteAd';
	info: ModerationLogPayloads['deleteAd'];
} | {
	type: 'createAvatarDecoration';
	info: ModerationLogPayloads['createAvatarDecoration'];
} | {
	type: 'updateAvatarDecoration';
	info: ModerationLogPayloads['updateAvatarDecoration'];
} | {
	type: 'deleteAvatarDecoration';
	info: ModerationLogPayloads['deleteAvatarDecoration'];
} | {
	type: 'resolveAbuseReport';
	info: ModerationLogPayloads['resolveAbuseReport'];
} | {
	type: 'forwardAbuseReport';
	info: ModerationLogPayloads['forwardAbuseReport'];
} | {
	type: 'updateAbuseReportNote';
	info: ModerationLogPayloads['updateAbuseReportNote'];
} | {
	type: 'unsetUserAvatar';
	info: ModerationLogPayloads['unsetUserAvatar'];
} | {
	type: 'unsetUserBanner';
	info: ModerationLogPayloads['unsetUserBanner'];
} | {
	type: 'createSystemWebhook';
	info: ModerationLogPayloads['createSystemWebhook'];
} | {
	type: 'updateSystemWebhook';
	info: ModerationLogPayloads['updateSystemWebhook'];
} | {
	type: 'deleteSystemWebhook';
	info: ModerationLogPayloads['deleteSystemWebhook'];
} | {
	type: 'createAbuseReportNotificationRecipient';
	info: ModerationLogPayloads['createAbuseReportNotificationRecipient'];
} | {
	type: 'updateAbuseReportNotificationRecipient';
	info: ModerationLogPayloads['updateAbuseReportNotificationRecipient'];
} | {
	type: 'deleteAbuseReportNotificationRecipient';
	info: ModerationLogPayloads['deleteAbuseReportNotificationRecipient'];
} | {
	type: 'deleteAccount';
	info: ModerationLogPayloads['deleteAccount'];
} | {
	type: 'deletePage';
	info: ModerationLogPayloads['deletePage'];
} | {
	type: 'deleteFlash';
	info: ModerationLogPayloads['deleteFlash'];
} | {
	type: 'deleteGalleryPost';
	info: ModerationLogPayloads['deleteGalleryPost'];
});

export type ServerStats = {
	cpu: number;
	mem: {
		used: number;
		active: number;
	};
	net: {
		rx: number;
		tx: number;
	};
	fs: {
		r: number;
		w: number;
	}
};

export type ServerStatsLog = ServerStats[];

export type QueueStats = {
	deliver: {
		activeSincePrevTick: number;
		active: number;
		waiting: number;
		delayed: number;
	};
	inbox: {
		activeSincePrevTick: number;
		active: number;
		waiting: number;
		delayed: number;
	};
};

export type QueueStatsLog = QueueStats[];

export type EmojiAdded = {
	emoji: EmojiDetailed
};

export type EmojiUpdated = {
	emojis: EmojiDetailed[]
};

export type EmojiDeleted = {
	emojis: EmojiDetailed[]
};

export type AnnouncementCreated = {
	announcement: Announcement;
};

export type SignupRequest = {
	username: string;
	password: string;
	host?: string;
	invitationCode?: string;
	emailAddress?: string;
	'hcaptcha-response'?: string | null;
	'g-recaptcha-response'?: string | null;
	'turnstile-response'?: string | null;
	'm-captcha-response'?: string | null;
};

export type SignupResponse = MeDetailed & {
	token: string;
};

export type SignupPendingRequest = {
	code: string;
};

export type SignupPendingResponse = {
	id: User['id'],
	i: string,
};

export type SigninFlowRequest = {
	username: string;
	password?: string;
	token?: string;
	credential?: AuthenticationResponseJSON;
	'hcaptcha-response'?: string | null;
	'g-recaptcha-response'?: string | null;
	'turnstile-response'?: string | null;
	'm-captcha-response'?: string | null;
};

export type SigninFlowResponse = {
	finished: true;
	id: User['id'];
	i: string;
} | {
	finished: false;
	next: 'captcha' | 'password' | 'totp';
} | {
	finished: false;
	next: 'passkey';
	authRequest: PublicKeyCredentialRequestOptionsJSON;
};

export type SigninWithPasskeyRequest = {
	credential?: AuthenticationResponseJSON;
	context?: string;
};

export type SigninWithPasskeyInitResponse = {
	option: PublicKeyCredentialRequestOptionsJSON;
	context: string;
};

export type SigninWithPasskeyResponse = {
	signinResponse: SigninFlowResponse & { finished: true };
};

type Values<T extends Record<PropertyKey, unknown>> = T[keyof T];

export type PartialRolePolicyOverride = Partial<{ [k in keyof RolePolicies]: Omit<Values<Role['policies']>, 'value'> & { value: RolePolicies[k] } }>;
