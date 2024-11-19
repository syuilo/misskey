/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Antenna } from '@/server/api/endpoints/i/import-antennas.js';
import type { MiDriveFile } from '@/models/DriveFile.js';
import type { MiNote } from '@/models/Note.js';
import type { MiUser } from '@/models/User.js';
import type { MiWebhook } from '@/models/Webhook.js';
import type { IActivity } from '@/core/activitypub/type.js';
import type { ParsedSignature, PrivateKeyWithPem } from '@misskey-dev/node-http-message-signatures';

/**
 * @peertube/http-signature 時代の古いデータにも対応しておく
 * TODO: 2026年ぐらいには消す
 */
export interface OldParsedSignature {
	scheme: 'Signature';
	params: {
		keyId: string;
		algorithm: string;
		headers: string[];
		signature: string;
	};
	signingString: string;
	algorithm: string;
	keyId: string;
}

export type DeliverJobData = {
	/** Actor */
	user: ThinUser;
	/** Activity */
	content: string;
	/** Digest header */
	digest: string;
	/** inbox URL to deliver */
	to: string;
	/** whether it is sharedInbox */
	isSharedInbox: boolean;
	/** force to use main (rsa) key */
	privateKey?: PrivateKeyWithPem;
};

export type InboxJobData = {
	activity: IActivity;
	signature: ParsedSignature | OldParsedSignature | null;
};

export type RelationshipJobData = {
	from: ThinUser;
	to: ThinUser;
	silent?: boolean;
	requestId?: string;
	withReplies?: boolean;
}

export type DbJobData<T extends keyof DbJobMap> = DbJobMap[T];

export type DbJobMap = {
	deleteDriveFiles: DbJobDataWithUser;
	exportCustomEmojis: DbJobDataWithUser;
	exportAntennas: DBExportAntennasData;
	exportNotes: DbJobDataWithUser;
	exportFavorites: DbJobDataWithUser;
	exportFollowing: DbExportFollowingData;
	exportMuting: DbJobDataWithUser;
	exportBlocking: DbJobDataWithUser;
	exportUserLists: DbJobDataWithUser;
	importAntennas: DBAntennaImportJobData;
	importFollowing: DbUserImportJobData;
	importFollowingToDb: DbUserImportToDbJobData;
	importMuting: DbUserImportJobData;
	importBlocking: DbUserImportJobData;
	importBlockingToDb: DbUserImportToDbJobData;
	importUserLists: DbUserImportJobData;
	importCustomEmojis: DbUserImportJobData;
	deleteAccount: DbUserDeleteJobData;
}

export type DbJobDataWithUser = {
	user: ThinUser;
}

export type DbExportFollowingData = {
	user: ThinUser;
	excludeMuting: boolean;
	excludeInactive: boolean;
};

export type DBExportAntennasData = {
	user: ThinUser
}

export type DbUserDeleteJobData = {
	user: ThinUser;
	soft?: boolean;
};

export type DbUserImportJobData = {
	user: ThinUser;
	fileId: MiDriveFile['id'];
	withReplies?: boolean;
};

export type DBAntennaImportJobData = {
	user: ThinUser,
	antenna: Antenna
}

export type DbUserImportToDbJobData = {
	user: ThinUser;
	target: string;
	withReplies?: boolean;
};

export type ObjectStorageJobData = ObjectStorageFileJobData | Record<string, unknown>;

export type ObjectStorageFileJobData = {
	key: string;
};

export type EndedPollNotificationJobData = {
	noteId: MiNote['id'];
};

export type SystemWebhookDeliverJobData = {
	type: string;
	content: unknown;
	webhookId: MiWebhook['id'];
	to: string;
	secret: string;
	createdAt: number;
	eventId: string;
};

export type UserWebhookDeliverJobData = {
	type: string;
	content: unknown;
	webhookId: MiWebhook['id'];
	userId: MiUser['id'];
	to: string;
	secret: string;
	createdAt: number;
	eventId: string;
};

export type ThinUser = {
	id: MiUser['id'];
};
