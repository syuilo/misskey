/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AsyncComponentLoader, defineAsyncComponent } from 'vue';
import type { IRouter, RouteDef } from '@/nirax.js';
import { Router } from '@/nirax.js';
import { $i, iAmModerator } from '@/account.js';
import MkLoading from '@/pages/_loading_.vue';
import MkError from '@/pages/_error_.vue';

export const page = (loader: AsyncComponentLoader) => defineAsyncComponent({
	loader: loader,
	loadingComponent: MkLoading,
	errorComponent: MkError,
});

const routes: RouteDef[] = [{
	path: '/@:initUser/pages/:initPageName/view-source',
	component: page(() => import('@/pages/page-editor/page-editor.vue')),
}, {
	path: '/@:username/pages/:pageName',
	component: page(() => import('@/pages/page.vue')),
}, {
	path: '/@:acct/following',
	component: page(() => import('@/pages/user/following.vue')),
}, {
	path: '/@:acct/followers',
	component: page(() => import('@/pages/user/followers.vue')),
}, {
	name: 'user',
	path: '/@:acct/:page?',
	component: page(() => import('@/pages/user/index.vue')),
}, {
	name: 'note',
	path: '/notes/:noteId/:initialTab?',
	component: page(() => import('@/pages/note.vue')),
}, {
	name: 'list',
	path: '/list/:listId',
	component: page(() => import('@/pages/list.vue')),
}, {
	path: '/clips/:clipId',
	component: page(() => import('@/pages/clip.vue')),
}, {
	path: '/instance-info/:host',
	component: page(() => import('@/pages/instance-info.vue')),
}, {
	name: 'settings',
	path: '/settings',
	component: page(() => import('@/pages/settings/index.vue')),
	loginRequired: true,
	children: [{
		path: '/profile',
		name: 'profile',
		component: page(() => import('@/pages/settings/profile.vue')),
	}, {
		path: '/avatar-decoration',
		name: 'avatarDecoration',
		component: page(() => import('@/pages/settings/avatar-decoration.vue')),
	}, {
		path: '/roles',
		name: 'roles',
		component: page(() => import('@/pages/settings/roles.vue')),
	}, {
		path: '/privacy',
		name: 'privacy',
		component: page(() => import('@/pages/settings/privacy.vue')),
	}, {
		path: '/emoji-picker',
		name: 'emojiPicker',
		component: page(() => import('@/pages/settings/emoji-picker.vue')),
	}, {
		path: '/drive',
		name: 'drive',
		component: page(() => import('@/pages/settings/drive.vue')),
	}, {
		path: '/drive/cleaner',
		name: 'drive',
		component: page(() => import('@/pages/settings/drive-cleaner.vue')),
	}, {
		path: '/notifications',
		name: 'notifications',
		component: page(() => import('@/pages/settings/notifications.vue')),
	}, {
		path: '/email',
		name: 'email',
		component: page(() => import('@/pages/settings/email.vue')),
	}, {
		path: '/security',
		name: 'security',
		component: page(() => import('@/pages/settings/security.vue')),
	}, {
		path: '/general',
		name: 'general',
		component: page(() => import('@/pages/settings/general.vue')),
	}, {
		path: '/theme/install',
		name: 'theme',
		component: page(() => import('@/pages/settings/theme.install.vue')),
	}, {
		path: '/theme/manage',
		name: 'theme',
		component: page(() => import('@/pages/settings/theme.manage.vue')),
	}, {
		path: '/theme',
		name: 'theme',
		component: page(() => import('@/pages/settings/theme.vue')),
	}, {
		path: '/navbar',
		name: 'navbar',
		component: page(() => import('@/pages/settings/navbar.vue')),
	}, {
		path: '/statusbar',
		name: 'statusbar',
		component: page(() => import('@/pages/settings/statusbar.vue')),
	}, {
		path: '/sounds',
		name: 'sounds',
		component: page(() => import('@/pages/settings/sounds.vue')),
	}, {
		path: '/plugin/install',
		name: 'plugin',
		component: page(() => import('@/pages/settings/plugin.install.vue')),
	}, {
		path: '/plugin',
		name: 'plugin',
		component: page(() => import('@/pages/settings/plugin.vue')),
	}, {
		path: '/import-export',
		name: 'import-export',
		component: page(() => import('@/pages/settings/import-export.vue')),
	}, {
		path: '/mute-block',
		name: 'mute-block',
		component: page(() => import('@/pages/settings/mute-block.vue')),
	}, {
		path: '/api',
		name: 'api',
		component: page(() => import('@/pages/settings/api.vue')),
	}, {
		path: '/apps',
		name: 'api',
		component: page(() => import('@/pages/settings/apps.vue')),
	}, {
		path: '/webhook/edit/:webhookId',
		name: 'webhook',
		component: page(() => import('@/pages/settings/webhook.edit.vue')),
	}, {
		path: '/webhook/new',
		name: 'webhook',
		component: page(() => import('@/pages/settings/webhook.new.vue')),
	}, {
		path: '/webhook',
		name: 'webhook',
		component: page(() => import('@/pages/settings/webhook.vue')),
	}, {
		path: '/deck',
		name: 'deck',
		component: page(() => import('@/pages/settings/deck.vue')),
	}, {
		path: '/preferences-backups',
		name: 'preferences-backups',
		component: page(() => import('@/pages/settings/preferences-backups.vue')),
	}, {
		path: '/migration',
		name: 'migration',
		component: page(() => import('@/pages/settings/migration.vue')),
	}, {
		path: '/custom-css',
		name: 'general',
		component: page(() => import('@/pages/settings/custom-css.vue')),
	}, {
		path: '/accounts',
		name: 'profile',
		component: page(() => import('@/pages/settings/accounts.vue')),
	}, {
		path: '/other',
		name: 'other',
		component: page(() => import('@/pages/settings/other.vue')),
	}, {
		path: '/',
		component: page(() => import('@/pages/_empty_.vue')),
	}],
}, {
	path: '/reset-password/:token?',
	component: page(() => import('@/pages/reset-password.vue')),
}, {
	path: '/signup-complete/:code',
	component: page(() => import('@/pages/signup-complete.vue')),
}, {
	path: '/announcements',
	component: page(() => import('@/pages/announcements.vue')),
}, {
	path: '/announcements/:announcementId',
	component: page(() => import('@/pages/announcement.vue')),
}, {
	path: '/about',
	component: page(() => import('@/pages/about.vue')),
	hash: 'initialTab',
}, {
	path: '/contact',
	component: page(() => import('@/pages/contact.vue')),
}, {
	path: '/about-misskey',
	component: page(() => import('@/pages/about-misskey.vue')),
}, {
	path: '/invite',
	name: 'invite',
	component: page(() => import('@/pages/invite.vue')),
}, {
	path: '/ads',
	component: page(() => import('@/pages/ads.vue')),
}, {
	path: '/theme-editor',
	component: page(() => import('@/pages/theme-editor.vue')),
	loginRequired: true,
}, {
	path: '/roles/:roleId',
	component: page(() => import('@/pages/role.vue')),
}, {
	path: '/user-tags/:tag',
	component: page(() => import('@/pages/user-tag.vue')),
}, {
	path: '/explore',
	component: page(() => import('@/pages/explore.vue')),
	hash: 'initialTab',
}, {
	path: '/search',
	component: page(() => import('@/pages/search.vue')),
	query: {
		q: 'query',
		userId: 'userId',
		username: 'username',
		host: 'host',
		channel: 'channel',
		type: 'type',
		origin: 'origin',
	},
}, {
	// Legacy Compatibility
	path: '/authorize-follow',
	redirect: '/lookup',
	loginRequired: true,
}, {
	// Mastodon Compatibility
	path: '/authorize_interaction',
	redirect: '/lookup',
	loginRequired: true,
}, {
	path: '/lookup',
	component: page(() => import('@/pages/lookup.vue')),
	loginRequired: true,
}, {
	path: '/share',
	component: page(() => import('@/pages/share.vue')),
	loginRequired: true,
}, {
	path: '/api-console',
	component: page(() => import('@/pages/api-console.vue')),
	loginRequired: true,
}, {
	path: '/scratchpad',
	component: page(() => import('@/pages/scratchpad.vue')),
}, {
	path: '/preview',
	component: page(() => import('@/pages/preview.vue')),
}, {
	path: '/auth/:token',
	component: page(() => import('@/pages/auth.vue')),
}, {
	path: '/miauth/:session',
	component: page(() => import('@/pages/miauth.vue')),
	query: {
		callback: 'callback',
		name: 'name',
		icon: 'icon',
		permission: 'permission',
	},
}, {
	path: '/oauth/authorize',
	component: page(() => import('@/pages/oauth.vue')),
}, {
	path: '/tags/:tag',
	component: page(() => import('@/pages/tag.vue')),
}, {
	path: '/pages/new',
	component: page(() => import('@/pages/page-editor/page-editor.vue')),
	loginRequired: true,
}, {
	path: '/pages/edit/:initPageId',
	component: page(() => import('@/pages/page-editor/page-editor.vue')),
	loginRequired: true,
}, {
	path: '/pages',
	component: page(() => import('@/pages/pages.vue')),
}, {
	path: '/play/:id/edit',
	component: page(() => import('@/pages/flash/flash-edit.vue')),
	loginRequired: true,
}, {
	path: '/play/new',
	component: page(() => import('@/pages/flash/flash-edit.vue')),
	loginRequired: true,
}, {
	path: '/play/:id',
	component: page(() => import('@/pages/flash/flash.vue')),
}, {
	path: '/play',
	component: page(() => import('@/pages/flash/flash-index.vue')),
}, {
	path: '/gallery/:postId/edit',
	component: page(() => import('@/pages/gallery/edit.vue')),
	loginRequired: true,
}, {
	path: '/gallery/new',
	component: page(() => import('@/pages/gallery/edit.vue')),
	loginRequired: true,
}, {
	path: '/gallery/:postId',
	component: page(() => import('@/pages/gallery/post.vue')),
}, {
	path: '/gallery',
	component: page(() => import('@/pages/gallery/index.vue')),
}, {
	path: '/channels/:channelId/edit',
	component: page(() => import('@/pages/channel-editor.vue')),
	loginRequired: true,
}, {
	path: '/channels/new',
	component: page(() => import('@/pages/channel-editor.vue')),
	loginRequired: true,
}, {
	path: '/channels/:channelId',
	component: page(() => import('@/pages/channel.vue')),
}, {
	path: '/channels',
	component: page(() => import('@/pages/channels.vue')),
}, {
	path: '/custom-emojis-manager',
	component: page(() => import('@/pages/custom-emojis-manager.vue')),
}, {
	path: '/avatar-decorations',
	name: 'avatarDecorations',
	component: page(() => import('@/pages/avatar-decorations.vue')),
}, {
	path: '/registry/keys/:domain/:path(*)?',
	component: page(() => import('@/pages/registry.keys.vue')),
}, {
	path: '/registry/value/:domain/:path(*)?',
	component: page(() => import('@/pages/registry.value.vue')),
}, {
	path: '/registry',
	component: page(() => import('@/pages/registry.vue')),
}, {
	path: '/install-extentions',
	redirect: '/install-extensions',
	loginRequired: true,
}, {
	path: '/install-extensions',
	component: page(() => import('@/pages/install-extensions.vue')),
	loginRequired: true,
}, {
	path: '/admin/user/:userId',
	component: iAmModerator ? page(() => import('@/pages/admin-user.vue')) : page(() => import('@/pages/not-found.vue')),
}, {
	path: '/admin/file/:fileId',
	component: iAmModerator ? page(() => import('@/pages/admin-file.vue')) : page(() => import('@/pages/not-found.vue')),
}, {
	path: '/admin',
	component: iAmModerator ? page(() => import('@/pages/admin/index.vue')) : page(() => import('@/pages/not-found.vue')),
	children: [{
		path: '/overview',
		name: 'overview',
		component: page(() => import('@/pages/admin/overview.vue')),
	}, {
		path: '/users',
		name: 'users',
		component: page(() => import('@/pages/admin/users.vue')),
	}, {
		path: '/emojis',
		name: 'emojis',
		component: page(() => import('@/pages/custom-emojis-manager.vue')),
	}, {
		path: '/avatar-decorations',
		name: 'avatarDecorations',
		component: page(() => import('@/pages/avatar-decorations.vue')),
	}, {
		path: '/queue',
		name: 'queue',
		component: page(() => import('@/pages/admin/queue.vue')),
	}, {
		path: '/files',
		name: 'files',
		component: page(() => import('@/pages/admin/files.vue')),
	}, {
		path: '/federation',
		name: 'federation',
		component: page(() => import('@/pages/admin/federation.vue')),
	}, {
		path: '/announcements',
		name: 'announcements',
		component: page(() => import('@/pages/admin/announcements.vue')),
	}, {
		path: '/ads',
		name: 'ads',
		component: page(() => import('@/pages/admin/ads.vue')),
	}, {
		path: '/roles/:id/edit',
		name: 'roles',
		component: page(() => import('@/pages/admin/roles.edit.vue')),
	}, {
		path: '/roles/new',
		name: 'roles',
		component: page(() => import('@/pages/admin/roles.edit.vue')),
	}, {
		path: '/roles/:id',
		name: 'roles',
		component: page(() => import('@/pages/admin/roles.role.vue')),
	}, {
		path: '/roles',
		name: 'roles',
		component: page(() => import('@/pages/admin/roles.vue')),
	}, {
		path: '/database',
		name: 'database',
		component: page(() => import('@/pages/admin/database.vue')),
	}, {
		path: '/abuses',
		name: 'abuses',
		component: page(() => import('@/pages/admin/abuses.vue')),
	}, {
		path: '/modlog',
		name: 'modlog',
		component: page(() => import('@/pages/admin/modlog.vue')),
	}, {
		path: '/settings',
		name: 'settings',
		component: page(() => import('@/pages/admin/settings.vue')),
	}, {
		path: '/branding',
		name: 'branding',
		component: page(() => import('@/pages/admin/branding.vue')),
	}, {
		path: '/moderation',
		name: 'moderation',
		component: page(() => import('@/pages/admin/moderation.vue')),
	}, {
		path: '/email-settings',
		name: 'email-settings',
		component: page(() => import('@/pages/admin/email-settings.vue')),
	}, {
		path: '/object-storage',
		name: 'object-storage',
		component: page(() => import('@/pages/admin/object-storage.vue')),
	}, {
		path: '/security',
		name: 'security',
		component: page(() => import('@/pages/admin/security.vue')),
	}, {
		path: '/relays',
		name: 'relays',
		component: page(() => import('@/pages/admin/relays.vue')),
	}, {
		path: '/external-services',
		name: 'external-services',
		component: page(() => import('@/pages/admin/external-services.vue')),
	}, {
		path: '/performance',
		name: 'performance',
		component: page(() => import('@/pages/admin/performance.vue')),
	}, {
		path: '/server-rules',
		name: 'server-rules',
		component: page(() => import('@/pages/admin/server-rules.vue')),
	}, {
		path: '/invites',
		name: 'invites',
		component: page(() => import('@/pages/admin/invites.vue')),
	}, {
		path: '/abuse-report-notification-recipient',
		name: 'abuse-report-notification-recipient',
		component: page(() => import('@/pages/admin/abuse-report/notification-recipient.vue')),
	}, {
		path: '/system-webhook',
		name: 'system-webhook',
		component: page(() => import('@/pages/admin/system-webhook.vue')),
	}, {
		path: '/',
		component: page(() => import('@/pages/_empty_.vue')),
	}],
}, {
	path: '/my/notifications',
	component: page(() => import('@/pages/notifications.vue')),
	loginRequired: true,
}, {
	path: '/my/favorites',
	component: page(() => import('@/pages/favorites.vue')),
	loginRequired: true,
}, {
	path: '/my/achievements',
	component: page(() => import('@/pages/achievements.vue')),
	loginRequired: true,
}, {
	path: '/my/drive/folder/:folder',
	component: page(() => import('@/pages/drive.vue')),
	loginRequired: true,
}, {
	path: '/my/drive',
	component: page(() => import('@/pages/drive.vue')),
	loginRequired: true,
}, {
	path: '/my/drive/file/:fileId',
	component: page(() => import('@/pages/drive.file.vue')),
	loginRequired: true,
}, {
	path: '/my/follow-requests',
	component: page(() => import('@/pages/follow-requests.vue')),
	loginRequired: true,
}, {
	path: '/my/lists/:listId',
	component: page(() => import('@/pages/my-lists/list.vue')),
	loginRequired: true,
}, {
	path: '/my/lists',
	component: page(() => import('@/pages/my-lists/index.vue')),
	loginRequired: true,
}, {
	path: '/my/clips',
	component: page(() => import('@/pages/my-clips/index.vue')),
	loginRequired: true,
}, {
	path: '/my/antennas/create',
	component: page(() => import('@/pages/my-antennas/create.vue')),
	loginRequired: true,
}, {
	path: '/my/antennas/:antennaId',
	component: page(() => import('@/pages/my-antennas/edit.vue')),
	loginRequired: true,
}, {
	path: '/my/antennas',
	component: page(() => import('@/pages/my-antennas/index.vue')),
	loginRequired: true,
}, {
	path: '/timeline/list/:listId',
	component: page(() => import('@/pages/user-list-timeline.vue')),
	loginRequired: true,
}, {
	path: '/timeline/antenna/:antennaId',
	component: page(() => import('@/pages/antenna-timeline.vue')),
	loginRequired: true,
}, {
	path: '/clicker',
	component: page(() => import('@/pages/clicker.vue')),
	loginRequired: true,
}, {
	path: '/games',
	component: page(() => import('@/pages/games.vue')),
	loginRequired: false,
}, {
	path: '/bubble-game',
	component: page(() => import('@/pages/drop-and-fusion.vue')),
	loginRequired: true,
}, {
	path: '/reversi',
	component: page(() => import('@/pages/reversi/index.vue')),
	loginRequired: false,
}, {
	path: '/reversi/g/:gameId',
	component: page(() => import('@/pages/reversi/game.vue')),
	loginRequired: false,
}, {
	path: '/timeline',
	component: page(() => import('@/pages/timeline.vue')),
}, {
	name: 'index',
	path: '/',
	component: $i ? page(() => import('@/pages/timeline.vue')) : page(() => import('@/pages/welcome.vue')),
	globalCacheKey: 'index',
}, {
	// テスト用リダイレクト設定。ログイン中ユーザのプロフィールにリダイレクトする
	path: '/redirect-test',
	redirect: $i ? `@${$i.username}` : '/',
	loginRequired: true,
}, {
	path: '/:(*)',
	component: page(() => import('@/pages/not-found.vue')),
}];

export function createMainRouter(path: string): IRouter {
	return new Router(routes, path, !!$i, page(() => import('@/pages/not-found.vue')));
}
