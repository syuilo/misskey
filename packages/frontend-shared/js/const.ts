/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// ブラウザで直接表示することを許可するファイルの種類のリスト
// ここに含まれないものは application/octet-stream としてレスポンスされる
// SVGはXSSを生むので許可しない
export const FILE_TYPE_BROWSERSAFE = [
	// Images
	'image/png',
	'image/gif',
	'image/jpeg',
	'image/webp',
	'image/avif',
	'image/apng',
	'image/bmp',
	'image/tiff',
	'image/x-icon',

	// OggS
	'audio/opus',
	'video/ogg',
	'audio/ogg',
	'application/ogg',

	// ISO/IEC base media file format
	'video/quicktime',
	'video/mp4',
	'audio/mp4',
	'video/x-m4v',
	'audio/x-m4a',
	'video/3gpp',
	'video/3gpp2',

	'video/mpeg',
	'audio/mpeg',

	'video/webm',
	'audio/webm',

	'audio/aac',

	// see https://github.com/misskey-dev/misskey/pull/10686
	'audio/flac',
	'audio/wav',
	// backward compatibility
	'audio/x-flac',
	'audio/vnd.wave',
];
/*
https://github.com/sindresorhus/file-type/blob/main/supported.js
https://github.com/sindresorhus/file-type/blob/main/core.js
https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Containers
*/

export const notificationTypes = [
	'note',
	'follow',
	'mention',
	'reply',
	'renote',
	'quote',
	'reaction',
	'pollEnded',
	'receiveFollowRequest',
	'followRequestAccepted',
	'roleAssigned',
	'achievementEarned',
	'exportCompleted',
	'login',
	'test',
	'app',
] as const;
export const obsoleteNotificationTypes = ['pollVote', 'groupInvited'] as const;

export const ROLE_POLICIES = [
	'gtlAvailable',
	'ltlAvailable',
	'canPublicNote',
	'mentionLimit',
	'canInvite',
	'inviteLimit',
	'inviteLimitCycle',
	'inviteExpirationTime',
	'canManageCustomEmojis',
	'canManageAvatarDecorations',
	'canSearchNotes',
	'canUseTranslator',
	'canHideAds',
	'driveCapacityMb',
	'alwaysMarkNsfw',
	'canUpdateBioMedia',
	'pinLimit',
	'antennaLimit',
	'wordMuteLimit',
	'webhookLimit',
	'clipLimit',
	'noteEachClipsLimit',
	'userListLimit',
	'userEachUserListsLimit',
	'rateLimitFactor',
	'avatarDecorationLimit',
	'canImportAntennas',
	'canImportBlocking',
	'canImportFollowing',
	'canImportMuting',
	'canImportUserLists',
	'isModeratorInactivityCheckTarget',
] as const;

// なんか動かない
//export const CURRENT_STICKY_TOP = Symbol('CURRENT_STICKY_TOP');
//export const CURRENT_STICKY_BOTTOM = Symbol('CURRENT_STICKY_BOTTOM');
export const CURRENT_STICKY_TOP = 'CURRENT_STICKY_TOP';
export const CURRENT_STICKY_BOTTOM = 'CURRENT_STICKY_BOTTOM';

export const DEFAULT_SERVER_ERROR_IMAGE_URL = 'https://xn--931a.moe/assets/error.jpg';
export const DEFAULT_NOT_FOUND_IMAGE_URL = 'https://xn--931a.moe/assets/not-found.jpg';
export const DEFAULT_INFO_IMAGE_URL = 'https://xn--931a.moe/assets/info.jpg';

export const MFM_TAGS = ['tada', 'jelly', 'twitch', 'shake', 'spin', 'jump', 'bounce', 'flip', 'x2', 'x3', 'x4', 'scale', 'position', 'fg', 'bg', 'border', 'font', 'blur', 'rainbow', 'sparkle', 'rotate', 'ruby', 'unixtime'];
export const MFM_PARAMS: Record<typeof MFM_TAGS[number], string[]> = {
	tada: ['speed=', 'delay='],
	jelly: ['speed=', 'delay='],
	twitch: ['speed=', 'delay='],
	shake: ['speed=', 'delay='],
	spin: ['speed=', 'delay=', 'left', 'alternate', 'x', 'y'],
	jump: ['speed=', 'delay='],
	bounce: ['speed=', 'delay='],
	flip: ['h', 'v'],
	x2: [],
	x3: [],
	x4: [],
	scale: ['x=', 'y='],
	position: ['x=', 'y='],
	fg: ['color='],
	bg: ['color='],
	border: ['width=', 'style=', 'color=', 'radius=', 'noclip'],
	font: ['serif', 'monospace', 'cursive', 'fantasy', 'emoji', 'math'],
	blur: [],
	rainbow: ['speed=', 'delay='],
	rotate: ['deg='],
	ruby: [],
	unixtime: [],
};
