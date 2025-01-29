/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AISCRIPT_VERSION } from '@syuilo/aiscript';
import type { entities } from 'misskey-js'
import { date, imageDataUrl, text } from "./fake-utils.js";

export function abuseUserReport() {
	return {
		id: 'someabusereportid',
		createdAt: '2016-12-28T22:49:51.000Z',
		comment: 'This user is a spammer!',
		resolved: false,
		reporterId: 'reporterid',
		targetUserId: 'targetuserid',
		assigneeId: 'assigneeid',
		reporter: userDetailed('reporterid', 'reporter', 'misskey-hub.net', 'Reporter'),
		targetUser: userDetailed('targetuserid', 'target', 'misskey-hub.net', 'Target'),
		assignee: userDetailed('assigneeid', 'assignee', 'misskey-hub.net', 'Assignee'),
		me: null,
		forwarded: false,
	};
}

export function channel(id = 'somechannelid', name = 'Some Channel', bannerUrl: string | null = 'https://github.com/misskey-dev/misskey/blob/master/packages/frontend/assets/fedi.jpg?raw=true'): entities.Channel {
	return {
		id,
		createdAt: '2016-12-28T22:49:51.000Z',
		lastNotedAt: '2016-12-28T22:49:51.000Z',
		name,
		description: null,
		userId: null,
		bannerUrl,
		pinnedNoteIds: [],
		color: '#000',
		isArchived: false,
		usersCount: 1,
		notesCount: 1,
		isSensitive: false,
		allowRenoteToExternal: false,
	};
}

export function clip(id = 'someclipid', name = 'Some Clip'): entities.Clip {
	return {
		id,
		createdAt: '2016-12-28T22:49:51.000Z',
		lastClippedAt: null,
		userId: 'someuserid',
		user: userLite(),
		notesCount: undefined,
		name,
		description: 'Some clip description',
		isPublic: false,
		favoritedCount: 0,
	};
}

export function emojiDetailed(id = 'someemojiid', name = 'some_emoji'): entities.EmojiDetailed {
	return {
		id,
		aliases: ['alias1', 'alias2'],
		name,
		category: 'emojiCategory',
		host: null,
		url: '/client-assets/about-icon.png',
		license: null,
		isSensitive: false,
		localOnly: false,
		roleIdsThatCanBeUsedThisEmojiAsReaction: ['roleId1', 'roleId2'],
	};
}

export function galleryPost(isSensitive = false) {
	return {
		id: 'somepostid',
		createdAt: '2016-12-28T22:49:51.000Z',
		updatedAt: '2016-12-28T22:49:51.000Z',
		userId: 'someuserid',
		user: userDetailed(),
		title: 'Some post title',
		description: 'Some post description',
		fileIds: ['somefileid'],
		files: [
			file(isSensitive),
		],
		isSensitive,
		likedCount: 0,
		isLiked: false,
	}
}

export function file(isSensitive = false) {
	return {
		id: 'somefileid',
		createdAt: '2016-12-28T22:49:51.000Z',
		name: 'somefile.jpg',
		type: 'image/jpeg',
		md5: 'f6fc51c73dc21b1fb85ead2cdf57530a',
		size: 77752,
		isSensitive,
		blurhash: 'eQAmoa^-MH8w9ZIvNLSvo^$*MwRPbwtSxutRozjEiwR.RjWBoeozog',
		properties: {
			width: 1024,
			height: 270
		},
		url: 'https://github.com/misskey-dev/misskey/blob/master/packages/frontend/assets/fedi.jpg?raw=true',
		thumbnailUrl: 'https://github.com/misskey-dev/misskey/blob/master/packages/frontend/assets/fedi.jpg?raw=true',
		comment: null,
		folderId: null,
		folder: null,
		userId: null,
		user: null,
	};
}

const script = `/// @ ${AISCRIPT_VERSION}

var name = ""

Ui:render([
	Ui:C:textInput({
		label: "Your name"
		onInput: @(v) { name = v }
	})
	Ui:C:button({
		text: "Hello"
		onClick: @() {
			Mk:dialog(null, \`Hello, {name}!\`)
		}
	})
])
`;

export function flash(): entities.Flash {
	return {
		id: 'someflashid',
		createdAt: '2016-12-28T22:49:51.000Z',
		updatedAt: '2016-12-28T22:49:51.000Z',
		userId: 'someuserid',
		user: userLite(),
		title: 'Some Play title',
		summary: 'Some Play summary',
		script,
		visibility: 'public',
		likedCount: 0,
		isLiked: false,
	};
}

export function folder(id = 'somefolderid', name = 'Some Folder', parentId: string | null = null): entities.DriveFolder {
	return {
		id,
		createdAt: '2016-12-28T22:49:51.000Z',
		name,
		parentId,
	};
}

export function federationInstance(): entities.FederationInstance {
	return {
		id: 'someinstanceid',
		firstRetrievedAt: '2021-01-01T00:00:00.000Z',
		host: 'misskey-hub.net',
		usersCount: 10,
		notesCount: 20,
		followingCount: 5,
		followersCount: 15,
		isNotResponding: false,
		isSuspended: false,
		suspensionState: 'none',
		isBlocked: false,
		softwareName: 'misskey',
		softwareVersion: '2024.5.0',
		openRegistrations: false,
		name: 'Misskey Hub',
		description: '',
		maintainerName: '',
		maintainerEmail: '',
		isSilenced: false,
		iconUrl: 'https://github.com/misskey-dev/misskey/blob/master/packages/frontend/assets/about-icon.png?raw=true',
		faviconUrl: '',
		themeColor: '',
		infoUpdatedAt: '',
		latestRequestReceivedAt: '',
	};
}

export function note(id = 'somenoteid'): entities.Note {
	return {
		id,
		createdAt: '2016-12-28T22:49:51.000Z',
		deletedAt: null,
		text: 'some note',
		cw: null,
		userId: 'someuserid',
		user: userLite(),
		visibility: 'public',
		reactionAcceptance: 'nonSensitiveOnly',
		reactionEmojis: {},
		reactions: {},
		myReaction: null,
		reactionCount: 0,
		renoteCount: 0,
		repliesCount: 0,
	};
}

export function userLite(id = 'someuserid', username = 'miskist', host: entities.UserDetailed['host'] = 'misskey-hub.net', name: entities.UserDetailed['name'] = 'Misskey User'): entities.UserLite {
	return {
		id,
		username,
		host,
		name,
		onlineStatus: 'unknown',
		avatarUrl: 'https://github.com/misskey-dev/misskey/blob/master/packages/frontend/assets/about-icon.png?raw=true',
		avatarBlurhash: 'eQFRshof5NWBRi},juayfPju53WB?0ofs;s*a{ofjuay^SoMEJR%ay',
		avatarDecorations: [],
		emojis: {},
	};
}

export function userDetailed(id = 'someuserid', username = 'miskist', host: entities.UserDetailed['host'] = 'misskey-hub.net', name: entities.UserDetailed['name'] = 'Misskey User'): entities.UserDetailed {
	return {
		...userLite(id, username, host, name),
		bannerBlurhash: 'eQA^IW^-MH8w9tE8I=S^o{$*R4RikXtSxutRozjEnNR.RQadoyozog',
		bannerUrl: 'https://github.com/misskey-dev/misskey/blob/master/packages/frontend/assets/fedi.jpg?raw=true',
		birthday: '2014-06-20',
		createdAt: '2016-12-28T22:49:51.000Z',
		description: 'I am a cool user!',
		followingVisibility: 'public',
		followersVisibility: 'public',
		roles: [],
		fields: [
			{
				name: 'Website',
				value: 'https://misskey-hub.net',
			},
		],
		verifiedLinks: [],
		followersCount: 1024,
		followingCount: 16,
		hasPendingFollowRequestFromYou: false,
		hasPendingFollowRequestToYou: false,
		isAdmin: false,
		isBlocked: false,
		isBlocking: false,
		isBot: false,
		isCat: false,
		isFollowed: false,
		isFollowing: false,
		isLocked: false,
		isModerator: false,
		isMuted: false,
		isSilenced: false,
		isSuspended: false,
		lang: 'en',
		location: 'Fediverse',
		notesCount: 65536,
		pinnedNoteIds: [],
		pinnedNotes: [],
		pinnedPage: null,
		pinnedPageId: null,
		publicReactions: false,
		securityKeys: false,
		twoFactorEnabled: false,
		usePasswordLessLogin: false,
		twoFactorBackupCodesStock: 'none',
		updatedAt: null,
		lastFetchedAt: null,
		uri: null,
		url: null,
		movedTo: null,
		alsoKnownAs: null,
		notify: 'none',
		memo: null,
	};
}

export function inviteCode(isUsed = false, hasExpiration = false, isExpired = false, isCreatedBySystem = false) {
	const date = new Date();
	const createdAt = new Date();
	createdAt.setDate(date.getDate() - 1)
	const expiresAt = new Date();

	if (isExpired) {
		expiresAt.setHours(date.getHours() - 1)
	} else {
		expiresAt.setHours(date.getHours() + 1)
	}

	return {
		id: "9gyqzizw77",
		code: "SLF3JKF7UV2H9",
		expiresAt: hasExpiration ? expiresAt.toISOString() : null,
		createdAt: createdAt.toISOString(),
		createdBy: isCreatedBySystem ? null : userDetailed('8i3rvznx32'),
		usedBy: isUsed ? userDetailed('3i3r2znx1v') : null,
		usedAt: isUsed ? date.toISOString() : null,
		used: isUsed,
	}
}

export function role(params: {
	id?: string,
	name?: string,
	color?: string | null,
	iconUrl?: string | null,
	description?: string,
	isModerator?: boolean,
	isAdministrator?: boolean,
	displayOrder?: number,
	createdAt?: string,
	updatedAt?: string,
	target?: 'manual' | 'conditional',
	isPublic?: boolean,
	isExplorable?: boolean,
	asBadge?: boolean,
	canEditMembersByModerator?: boolean,
	usersCount?: number,
}, seed?: string): entities.Role {
	const prefix = params.displayOrder ? params.displayOrder.toString().padStart(3, '0') + '-' : '';
	const genId = text(36, seed);
	const createdAt = params.createdAt ?? date({}, seed).toISOString();
	const updatedAt = params.updatedAt ?? date({}, seed).toISOString();

	return {
		id: params.id ?? genId,
		name: params.name ?? `${prefix}TestRole-${genId}`,
		color: params.color ?? '#445566',
		iconUrl: params.iconUrl ?? null,
		description: params.description ?? '',
		isModerator: params.isModerator ?? false,
		isAdministrator: params.isAdministrator ?? false,
		displayOrder: params.displayOrder ?? 0,
		createdAt: createdAt,
		updatedAt: updatedAt,
		target: params.target ?? 'manual',
		isPublic: params.isPublic ?? true,
		isExplorable: params.isExplorable ?? true,
		asBadge: params.asBadge ?? true,
		canEditMembersByModerator: params.canEditMembersByModerator ?? false,
		usersCount: params.usersCount ?? 10,
		condFormula: {
			id: '',
			type: 'or',
			values: []
		},
		policies: {},
	}
}

export function emoji(params?: {
	id?: string,
	name?: string,
	host?: string,
	uri?: string,
	publicUrl?: string,
	originalUrl?: string,
	type?: string,
	aliases?: string[],
	category?: string,
	license?: string,
	isSensitive?: boolean,
	localOnly?: boolean,
	roleIdsThatCanBeUsedThisEmojiAsReaction?: {id:string, name:string}[],
	updatedAt?: string,
}, seed?: string): entities.EmojiDetailedAdmin {
	const _seed = seed ?? (params?.id ?? "DEFAULT_SEED");
	const id = params?.id ?? text(32, _seed);
	const name = params?.name ?? text(8, _seed);
	const updatedAt = params?.updatedAt ?? date({}, _seed).toISOString();

	const image = imageDataUrl({}, _seed)

	return {
		id: id,
		name: name,
		host: params?.host ?? null,
		uri: params?.uri ?? null,
		publicUrl: params?.publicUrl ?? image,
		originalUrl: params?.originalUrl ?? image,
		type: params?.type ?? 'image/png',
		aliases: params?.aliases ?? [`alias1-${name}`, `alias2-${name}`],
		category: params?.category ?? null,
		license: params?.license ?? null,
		isSensitive: params?.isSensitive ?? false,
		localOnly: params?.localOnly ?? false,
		roleIdsThatCanBeUsedThisEmojiAsReaction: params?.roleIdsThatCanBeUsedThisEmojiAsReaction ?? [],
		updatedAt: updatedAt,
	}
}
