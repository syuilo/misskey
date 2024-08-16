/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { permissions } from 'misskey-js';
import type { KeyOf, Schema } from '@/misc/json-schema.js';

import * as ep___admin_abuseReport_notificationRecipient_list
	from '@/server/api/endpoints/admin/abuse-report/notification-recipient/list.js';
import * as ep___admin_abuseReport_notificationRecipient_show
	from '@/server/api/endpoints/admin/abuse-report/notification-recipient/show.js';
import * as ep___admin_abuseReport_notificationRecipient_create
	from '@/server/api/endpoints/admin/abuse-report/notification-recipient/create.js';
import * as ep___admin_abuseReport_notificationRecipient_update
	from '@/server/api/endpoints/admin/abuse-report/notification-recipient/update.js';
import * as ep___admin_abuseReport_notificationRecipient_delete
	from '@/server/api/endpoints/admin/abuse-report/notification-recipient/delete.js';
import * as ep___admin_abuseUserReports from './endpoints/admin/abuse-user-reports.js';
import * as ep___admin_meta from './endpoints/admin/meta.js';
import * as ep___admin_accounts_create from './endpoints/admin/accounts/create.js';
import * as ep___admin_accounts_delete from './endpoints/admin/accounts/delete.js';
import * as ep___admin_accounts_findByEmail from './endpoints/admin/accounts/find-by-email.js';
import * as ep___admin_ad_create from './endpoints/admin/ad/create.js';
import * as ep___admin_ad_delete from './endpoints/admin/ad/delete.js';
import * as ep___admin_ad_list from './endpoints/admin/ad/list.js';
import * as ep___admin_ad_update from './endpoints/admin/ad/update.js';
import * as ep___admin_announcements_create from './endpoints/admin/announcements/create.js';
import * as ep___admin_announcements_delete from './endpoints/admin/announcements/delete.js';
import * as ep___admin_announcements_list from './endpoints/admin/announcements/list.js';
import * as ep___admin_announcements_update from './endpoints/admin/announcements/update.js';
import * as ep___admin_avatarDecorations_create from './endpoints/admin/avatar-decorations/create.js';
import * as ep___admin_avatarDecorations_delete from './endpoints/admin/avatar-decorations/delete.js';
import * as ep___admin_avatarDecorations_list from './endpoints/admin/avatar-decorations/list.js';
import * as ep___admin_avatarDecorations_update from './endpoints/admin/avatar-decorations/update.js';
import * as ep___admin_deleteAllFilesOfAUser from './endpoints/admin/delete-all-files-of-a-user.js';
import * as ep___admin_unsetUserAvatar from './endpoints/admin/unset-user-avatar.js';
import * as ep___admin_unsetUserBanner from './endpoints/admin/unset-user-banner.js';
import * as ep___admin_drive_cleanRemoteFiles from './endpoints/admin/drive/clean-remote-files.js';
import * as ep___admin_drive_cleanup from './endpoints/admin/drive/cleanup.js';
import * as ep___admin_drive_files from './endpoints/admin/drive/files.js';
import * as ep___admin_drive_showFile from './endpoints/admin/drive/show-file.js';
import * as ep___admin_emoji_addAliasesBulk from './endpoints/admin/emoji/add-aliases-bulk.js';
import * as ep___admin_emoji_add from './endpoints/admin/emoji/add.js';
import * as ep___admin_emoji_copy from './endpoints/admin/emoji/copy.js';
import * as ep___admin_emoji_deleteBulk from './endpoints/admin/emoji/delete-bulk.js';
import * as ep___admin_emoji_delete from './endpoints/admin/emoji/delete.js';
import * as ep___admin_emoji_importZip from './endpoints/admin/emoji/import-zip.js';
import * as ep___admin_emoji_listRemote from './endpoints/admin/emoji/list-remote.js';
import * as ep___admin_emoji_list from './endpoints/admin/emoji/list.js';
import * as ep___admin_emoji_removeAliasesBulk from './endpoints/admin/emoji/remove-aliases-bulk.js';
import * as ep___admin_emoji_setAliasesBulk from './endpoints/admin/emoji/set-aliases-bulk.js';
import * as ep___admin_emoji_setCategoryBulk from './endpoints/admin/emoji/set-category-bulk.js';
import * as ep___admin_emoji_setLicenseBulk from './endpoints/admin/emoji/set-license-bulk.js';
import * as ep___admin_emoji_update from './endpoints/admin/emoji/update.js';
import * as ep___admin_federation_deleteAllFiles from './endpoints/admin/federation/delete-all-files.js';
import * as ep___admin_federation_refreshRemoteInstanceMetadata
	from './endpoints/admin/federation/refresh-remote-instance-metadata.js';
import * as ep___admin_federation_removeAllFollowing from './endpoints/admin/federation/remove-all-following.js';
import * as ep___admin_federation_updateInstance from './endpoints/admin/federation/update-instance.js';
import * as ep___admin_getIndexStats from './endpoints/admin/get-index-stats.js';
import * as ep___admin_getTableStats from './endpoints/admin/get-table-stats.js';
import * as ep___admin_getUserIps from './endpoints/admin/get-user-ips.js';
import * as ep___admin_invite_create from './endpoints/admin/invite/create.js';
import * as ep___admin_invite_list from './endpoints/admin/invite/list.js';
import * as ep___admin_promo_create from './endpoints/admin/promo/create.js';
import * as ep___admin_queue_clear from './endpoints/admin/queue/clear.js';
import * as ep___admin_queue_deliverDelayed from './endpoints/admin/queue/deliver-delayed.js';
import * as ep___admin_queue_inboxDelayed from './endpoints/admin/queue/inbox-delayed.js';
import * as ep___admin_queue_promote from './endpoints/admin/queue/promote.js';
import * as ep___admin_queue_stats from './endpoints/admin/queue/stats.js';
import * as ep___admin_relays_add from './endpoints/admin/relays/add.js';
import * as ep___admin_relays_list from './endpoints/admin/relays/list.js';
import * as ep___admin_relays_remove from './endpoints/admin/relays/remove.js';
import * as ep___admin_resetPassword from './endpoints/admin/reset-password.js';
import * as ep___admin_resolveAbuseUserReport from './endpoints/admin/resolve-abuse-user-report.js';
import * as ep___admin_sendEmail from './endpoints/admin/send-email.js';
import * as ep___admin_serverInfo from './endpoints/admin/server-info.js';
import * as ep___admin_showModerationLogs from './endpoints/admin/show-moderation-logs.js';
import * as ep___admin_showUser from './endpoints/admin/show-user.js';
import * as ep___admin_showUsers from './endpoints/admin/show-users.js';
import * as ep___admin_suspendUser from './endpoints/admin/suspend-user.js';
import * as ep___admin_unsuspendUser from './endpoints/admin/unsuspend-user.js';
import * as ep___admin_updateMeta from './endpoints/admin/update-meta.js';
import * as ep___admin_deleteAccount from './endpoints/admin/delete-account.js';
import * as ep___admin_updateUserNote from './endpoints/admin/update-user-note.js';
import * as ep___admin_roles_create from './endpoints/admin/roles/create.js';
import * as ep___admin_roles_delete from './endpoints/admin/roles/delete.js';
import * as ep___admin_roles_list from './endpoints/admin/roles/list.js';
import * as ep___admin_roles_show from './endpoints/admin/roles/show.js';
import * as ep___admin_roles_update from './endpoints/admin/roles/update.js';
import * as ep___admin_roles_assign from './endpoints/admin/roles/assign.js';
import * as ep___admin_roles_unassign from './endpoints/admin/roles/unassign.js';
import * as ep___admin_roles_updateDefaultPolicies from './endpoints/admin/roles/update-default-policies.js';
import * as ep___admin_roles_users from './endpoints/admin/roles/users.js';
import * as ep___admin_systemWebhook_create from './endpoints/admin/system-webhook/create.js';
import * as ep___admin_systemWebhook_delete from './endpoints/admin/system-webhook/delete.js';
import * as ep___admin_systemWebhook_list from './endpoints/admin/system-webhook/list.js';
import * as ep___admin_systemWebhook_show from './endpoints/admin/system-webhook/show.js';
import * as ep___admin_systemWebhook_update from './endpoints/admin/system-webhook/update.js';
import * as ep___announcements from './endpoints/announcements.js';
import * as ep___announcements_show from './endpoints/announcements/show.js';
import * as ep___antennas_create from './endpoints/antennas/create.js';
import * as ep___antennas_delete from './endpoints/antennas/delete.js';
import * as ep___antennas_list from './endpoints/antennas/list.js';
import * as ep___antennas_notes from './endpoints/antennas/notes.js';
import * as ep___antennas_show from './endpoints/antennas/show.js';
import * as ep___antennas_update from './endpoints/antennas/update.js';
import * as ep___ap_get from './endpoints/ap/get.js';
import * as ep___ap_show from './endpoints/ap/show.js';
import * as ep___app_create from './endpoints/app/create.js';
import * as ep___app_show from './endpoints/app/show.js';
import * as ep___auth_accept from './endpoints/auth/accept.js';
import * as ep___auth_session_generate from './endpoints/auth/session/generate.js';
import * as ep___auth_session_show from './endpoints/auth/session/show.js';
import * as ep___auth_session_userkey from './endpoints/auth/session/userkey.js';
import * as ep___blocking_create from './endpoints/blocking/create.js';
import * as ep___blocking_delete from './endpoints/blocking/delete.js';
import * as ep___blocking_list from './endpoints/blocking/list.js';
import * as ep___channels_create from './endpoints/channels/create.js';
import * as ep___channels_featured from './endpoints/channels/featured.js';
import * as ep___channels_follow from './endpoints/channels/follow.js';
import * as ep___channels_followed from './endpoints/channels/followed.js';
import * as ep___channels_owned from './endpoints/channels/owned.js';
import * as ep___channels_show from './endpoints/channels/show.js';
import * as ep___channels_timeline from './endpoints/channels/timeline.js';
import * as ep___channels_unfollow from './endpoints/channels/unfollow.js';
import * as ep___channels_update from './endpoints/channels/update.js';
import * as ep___channels_favorite from './endpoints/channels/favorite.js';
import * as ep___channels_unfavorite from './endpoints/channels/unfavorite.js';
import * as ep___channels_myFavorites from './endpoints/channels/my-favorites.js';
import * as ep___channels_search from './endpoints/channels/search.js';
import * as ep___charts_activeUsers from './endpoints/charts/active-users.js';
import * as ep___charts_apRequest from './endpoints/charts/ap-request.js';
import * as ep___charts_drive from './endpoints/charts/drive.js';
import * as ep___charts_federation from './endpoints/charts/federation.js';
import * as ep___charts_instance from './endpoints/charts/instance.js';
import * as ep___charts_notes from './endpoints/charts/notes.js';
import * as ep___charts_user_drive from './endpoints/charts/user/drive.js';
import * as ep___charts_user_following from './endpoints/charts/user/following.js';
import * as ep___charts_user_notes from './endpoints/charts/user/notes.js';
import * as ep___charts_user_pv from './endpoints/charts/user/pv.js';
import * as ep___charts_user_reactions from './endpoints/charts/user/reactions.js';
import * as ep___charts_users from './endpoints/charts/users.js';
import * as ep___clips_addNote from './endpoints/clips/add-note.js';
import * as ep___clips_removeNote from './endpoints/clips/remove-note.js';
import * as ep___clips_create from './endpoints/clips/create.js';
import * as ep___clips_delete from './endpoints/clips/delete.js';
import * as ep___clips_list from './endpoints/clips/list.js';
import * as ep___clips_notes from './endpoints/clips/notes.js';
import * as ep___clips_show from './endpoints/clips/show.js';
import * as ep___clips_update from './endpoints/clips/update.js';
import * as ep___clips_favorite from './endpoints/clips/favorite.js';
import * as ep___clips_unfavorite from './endpoints/clips/unfavorite.js';
import * as ep___clips_myFavorites from './endpoints/clips/my-favorites.js';
import * as ep___drive from './endpoints/drive.js';
import * as ep___drive_files from './endpoints/drive/files.js';
import * as ep___drive_files_attachedNotes from './endpoints/drive/files/attached-notes.js';
import * as ep___drive_files_checkExistence from './endpoints/drive/files/check-existence.js';
import * as ep___drive_files_create from './endpoints/drive/files/create.js';
import * as ep___drive_files_delete from './endpoints/drive/files/delete.js';
import * as ep___drive_files_findByHash from './endpoints/drive/files/find-by-hash.js';
import * as ep___drive_files_find from './endpoints/drive/files/find.js';
import * as ep___drive_files_show from './endpoints/drive/files/show.js';
import * as ep___drive_files_update from './endpoints/drive/files/update.js';
import * as ep___drive_files_uploadFromUrl from './endpoints/drive/files/upload-from-url.js';
import * as ep___drive_folders from './endpoints/drive/folders.js';
import * as ep___drive_folders_create from './endpoints/drive/folders/create.js';
import * as ep___drive_folders_delete from './endpoints/drive/folders/delete.js';
import * as ep___drive_folders_find from './endpoints/drive/folders/find.js';
import * as ep___drive_folders_show from './endpoints/drive/folders/show.js';
import * as ep___drive_folders_update from './endpoints/drive/folders/update.js';
import * as ep___drive_stream from './endpoints/drive/stream.js';
import * as ep___emailAddress_available from './endpoints/email-address/available.js';
import * as ep___endpoint from './endpoints/endpoint.js';
import * as ep___endpoints from './endpoints/endpoints.js';
import * as ep___exportCustomEmojis from './endpoints/export-custom-emojis.js';
import * as ep___federation_followers from './endpoints/federation/followers.js';
import * as ep___federation_following from './endpoints/federation/following.js';
import * as ep___federation_instances from './endpoints/federation/instances.js';
import * as ep___federation_showInstance from './endpoints/federation/show-instance.js';
import * as ep___federation_updateRemoteUser from './endpoints/federation/update-remote-user.js';
import * as ep___federation_users from './endpoints/federation/users.js';
import * as ep___federation_stats from './endpoints/federation/stats.js';
import * as ep___following_create from './endpoints/following/create.js';
import * as ep___following_delete from './endpoints/following/delete.js';
import * as ep___following_update from './endpoints/following/update.js';
import * as ep___following_update_all from './endpoints/following/update-all.js';
import * as ep___following_invalidate from './endpoints/following/invalidate.js';
import * as ep___following_requests_accept from './endpoints/following/requests/accept.js';
import * as ep___following_requests_cancel from './endpoints/following/requests/cancel.js';
import * as ep___following_requests_list from './endpoints/following/requests/list.js';
import * as ep___following_requests_reject from './endpoints/following/requests/reject.js';
import * as ep___gallery_featured from './endpoints/gallery/featured.js';
import * as ep___gallery_popular from './endpoints/gallery/popular.js';
import * as ep___gallery_posts from './endpoints/gallery/posts.js';
import * as ep___gallery_posts_create from './endpoints/gallery/posts/create.js';
import * as ep___gallery_posts_delete from './endpoints/gallery/posts/delete.js';
import * as ep___gallery_posts_like from './endpoints/gallery/posts/like.js';
import * as ep___gallery_posts_show from './endpoints/gallery/posts/show.js';
import * as ep___gallery_posts_unlike from './endpoints/gallery/posts/unlike.js';
import * as ep___gallery_posts_update from './endpoints/gallery/posts/update.js';
import * as ep___getOnlineUsersCount from './endpoints/get-online-users-count.js';
import * as ep___getAvatarDecorations from './endpoints/get-avatar-decorations.js';
import * as ep___hashtags_list from './endpoints/hashtags/list.js';
import * as ep___hashtags_search from './endpoints/hashtags/search.js';
import * as ep___hashtags_show from './endpoints/hashtags/show.js';
import * as ep___hashtags_trend from './endpoints/hashtags/trend.js';
import * as ep___hashtags_users from './endpoints/hashtags/users.js';
import * as ep___i from './endpoints/i.js';
import * as ep___i_2fa_done from './endpoints/i/2fa/done.js';
import * as ep___i_2fa_keyDone from './endpoints/i/2fa/key-done.js';
import * as ep___i_2fa_passwordLess from './endpoints/i/2fa/password-less.js';
import * as ep___i_2fa_registerKey from './endpoints/i/2fa/register-key.js';
import * as ep___i_2fa_register from './endpoints/i/2fa/register.js';
import * as ep___i_2fa_updateKey from './endpoints/i/2fa/update-key.js';
import * as ep___i_2fa_removeKey from './endpoints/i/2fa/remove-key.js';
import * as ep___i_2fa_unregister from './endpoints/i/2fa/unregister.js';
import * as ep___i_apps from './endpoints/i/apps.js';
import * as ep___i_authorizedApps from './endpoints/i/authorized-apps.js';
import * as ep___i_claimAchievement from './endpoints/i/claim-achievement.js';
import * as ep___i_changePassword from './endpoints/i/change-password.js';
import * as ep___i_deleteAccount from './endpoints/i/delete-account.js';
import * as ep___i_exportBlocking from './endpoints/i/export-blocking.js';
import * as ep___i_exportFollowing from './endpoints/i/export-following.js';
import * as ep___i_exportMute from './endpoints/i/export-mute.js';
import * as ep___i_exportNotes from './endpoints/i/export-notes.js';
import * as ep___i_exportClips from './endpoints/i/export-clips.js';
import * as ep___i_exportFavorites from './endpoints/i/export-favorites.js';
import * as ep___i_exportUserLists from './endpoints/i/export-user-lists.js';
import * as ep___i_exportAntennas from './endpoints/i/export-antennas.js';
import * as ep___i_favorites from './endpoints/i/favorites.js';
import * as ep___i_gallery_likes from './endpoints/i/gallery/likes.js';
import * as ep___i_gallery_posts from './endpoints/i/gallery/posts.js';
import * as ep___i_importBlocking from './endpoints/i/import-blocking.js';
import * as ep___i_importFollowing from './endpoints/i/import-following.js';
import * as ep___i_importMuting from './endpoints/i/import-muting.js';
import * as ep___i_importUserLists from './endpoints/i/import-user-lists.js';
import * as ep___i_importAntennas from './endpoints/i/import-antennas.js';
import * as ep___i_notifications from './endpoints/i/notifications.js';
import * as ep___i_notificationsGrouped from './endpoints/i/notifications-grouped.js';
import * as ep___i_pageLikes from './endpoints/i/page-likes.js';
import * as ep___i_pages from './endpoints/i/pages.js';
import * as ep___i_pin from './endpoints/i/pin.js';
import * as ep___i_readAllUnreadNotes from './endpoints/i/read-all-unread-notes.js';
import * as ep___i_readAnnouncement from './endpoints/i/read-announcement.js';
import * as ep___i_regenerateToken from './endpoints/i/regenerate-token.js';
import * as ep___i_registry_getAll from './endpoints/i/registry/get-all.js';
import * as ep___i_registry_getDetail from './endpoints/i/registry/get-detail.js';
import * as ep___i_registry_get from './endpoints/i/registry/get.js';
import * as ep___i_registry_keysWithType from './endpoints/i/registry/keys-with-type.js';
import * as ep___i_registry_keys from './endpoints/i/registry/keys.js';
import * as ep___i_registry_remove from './endpoints/i/registry/remove.js';
import * as ep___i_registry_scopesWithDomain from './endpoints/i/registry/scopes-with-domain.js';
import * as ep___i_registry_set from './endpoints/i/registry/set.js';
import * as ep___i_revokeToken from './endpoints/i/revoke-token.js';
import * as ep___i_signinHistory from './endpoints/i/signin-history.js';
import * as ep___i_unpin from './endpoints/i/unpin.js';
import * as ep___i_updateEmail from './endpoints/i/update-email.js';
import * as ep___i_update from './endpoints/i/update.js';
import * as ep___i_move from './endpoints/i/move.js';
import * as ep___i_webhooks_create from './endpoints/i/webhooks/create.js';
import * as ep___i_webhooks_show from './endpoints/i/webhooks/show.js';
import * as ep___i_webhooks_list from './endpoints/i/webhooks/list.js';
import * as ep___i_webhooks_update from './endpoints/i/webhooks/update.js';
import * as ep___i_webhooks_delete from './endpoints/i/webhooks/delete.js';
import * as ep___invite_create from './endpoints/invite/create.js';
import * as ep___invite_delete from './endpoints/invite/delete.js';
import * as ep___invite_list from './endpoints/invite/list.js';
import * as ep___invite_limit from './endpoints/invite/limit.js';
import * as ep___meta from './endpoints/meta.js';
import * as ep___emojis from './endpoints/emojis.js';
import * as ep___emoji from './endpoints/emoji.js';
import * as ep___miauth_genToken from './endpoints/miauth/gen-token.js';
import * as ep___mute_create from './endpoints/mute/create.js';
import * as ep___mute_delete from './endpoints/mute/delete.js';
import * as ep___mute_list from './endpoints/mute/list.js';
import * as ep___renoteMute_create from './endpoints/renote-mute/create.js';
import * as ep___renoteMute_delete from './endpoints/renote-mute/delete.js';
import * as ep___renoteMute_list from './endpoints/renote-mute/list.js';
import * as ep___my_apps from './endpoints/my/apps.js';
import * as ep___notes from './endpoints/notes.js';
import * as ep___notes_children from './endpoints/notes/children.js';
import * as ep___notes_clips from './endpoints/notes/clips.js';
import * as ep___notes_conversation from './endpoints/notes/conversation.js';
import * as ep___notes_create from './endpoints/notes/create.js';
import * as ep___notes_delete from './endpoints/notes/delete.js';
import * as ep___notes_favorites_create from './endpoints/notes/favorites/create.js';
import * as ep___notes_favorites_delete from './endpoints/notes/favorites/delete.js';
import * as ep___notes_featured from './endpoints/notes/featured.js';
import * as ep___notes_globalTimeline from './endpoints/notes/global-timeline.js';
import * as ep___notes_hybridTimeline from './endpoints/notes/hybrid-timeline.js';
import * as ep___notes_localTimeline from './endpoints/notes/local-timeline.js';
import * as ep___notes_mentions from './endpoints/notes/mentions.js';
import * as ep___notes_polls_recommendation from './endpoints/notes/polls/recommendation.js';
import * as ep___notes_polls_vote from './endpoints/notes/polls/vote.js';
import * as ep___notes_reactions from './endpoints/notes/reactions.js';
import * as ep___notes_reactions_create from './endpoints/notes/reactions/create.js';
import * as ep___notes_reactions_delete from './endpoints/notes/reactions/delete.js';
import * as ep___notes_renotes from './endpoints/notes/renotes.js';
import * as ep___notes_replies from './endpoints/notes/replies.js';
import * as ep___notes_searchByTag from './endpoints/notes/search-by-tag.js';
import * as ep___notes_search from './endpoints/notes/search.js';
import * as ep___notes_show from './endpoints/notes/show.js';
import * as ep___notes_state from './endpoints/notes/state.js';
import * as ep___notes_threadMuting_create from './endpoints/notes/thread-muting/create.js';
import * as ep___notes_threadMuting_delete from './endpoints/notes/thread-muting/delete.js';
import * as ep___notes_timeline from './endpoints/notes/timeline.js';
import * as ep___notes_translate from './endpoints/notes/translate.js';
import * as ep___notes_unrenote from './endpoints/notes/unrenote.js';
import * as ep___notes_userListTimeline from './endpoints/notes/user-list-timeline.js';
import * as ep___notifications_create from './endpoints/notifications/create.js';
import * as ep___notifications_flush from './endpoints/notifications/flush.js';
import * as ep___notifications_markAllAsRead from './endpoints/notifications/mark-all-as-read.js';
import * as ep___notifications_testNotification from './endpoints/notifications/test-notification.js';
import * as ep___pagePush from './endpoints/page-push.js';
import * as ep___pages_create from './endpoints/pages/create.js';
import * as ep___pages_delete from './endpoints/pages/delete.js';
import * as ep___pages_featured from './endpoints/pages/featured.js';
import * as ep___pages_like from './endpoints/pages/like.js';
import * as ep___pages_show from './endpoints/pages/show.js';
import * as ep___pages_unlike from './endpoints/pages/unlike.js';
import * as ep___pages_update from './endpoints/pages/update.js';
import * as ep___flash_create from './endpoints/flash/create.js';
import * as ep___flash_delete from './endpoints/flash/delete.js';
import * as ep___flash_featured from './endpoints/flash/featured.js';
import * as ep___flash_like from './endpoints/flash/like.js';
import * as ep___flash_show from './endpoints/flash/show.js';
import * as ep___flash_unlike from './endpoints/flash/unlike.js';
import * as ep___flash_update from './endpoints/flash/update.js';
import * as ep___flash_my from './endpoints/flash/my.js';
import * as ep___flash_myLikes from './endpoints/flash/my-likes.js';
import * as ep___ping from './endpoints/ping.js';
import * as ep___pinnedUsers from './endpoints/pinned-users.js';
import * as ep___promo_read from './endpoints/promo/read.js';
import * as ep___roles_list from './endpoints/roles/list.js';
import * as ep___roles_show from './endpoints/roles/show.js';
import * as ep___roles_users from './endpoints/roles/users.js';
import * as ep___roles_notes from './endpoints/roles/notes.js';
import * as ep___requestResetPassword from './endpoints/request-reset-password.js';
import * as ep___resetDb from './endpoints/reset-db.js';
import * as ep___resetPassword from './endpoints/reset-password.js';
import * as ep___serverInfo from './endpoints/server-info.js';
import * as ep___stats from './endpoints/stats.js';
import * as ep___sw_show_registration from './endpoints/sw/show-registration.js';
import * as ep___sw_update_registration from './endpoints/sw/update-registration.js';
import * as ep___sw_register from './endpoints/sw/register.js';
import * as ep___sw_unregister from './endpoints/sw/unregister.js';
import * as ep___test from './endpoints/test.js';
import * as ep___username_available from './endpoints/username/available.js';
import * as ep___users from './endpoints/users.js';
import * as ep___users_clips from './endpoints/users/clips.js';
import * as ep___users_followers from './endpoints/users/followers.js';
import * as ep___users_following from './endpoints/users/following.js';
import * as ep___users_gallery_posts from './endpoints/users/gallery/posts.js';
import * as ep___users_getFrequentlyRepliedUsers from './endpoints/users/get-frequently-replied-users.js';
import * as ep___users_featuredNotes from './endpoints/users/featured-notes.js';
import * as ep___users_lists_create from './endpoints/users/lists/create.js';
import * as ep___users_lists_delete from './endpoints/users/lists/delete.js';
import * as ep___users_lists_list from './endpoints/users/lists/list.js';
import * as ep___users_lists_pull from './endpoints/users/lists/pull.js';
import * as ep___users_lists_push from './endpoints/users/lists/push.js';
import * as ep___users_lists_show from './endpoints/users/lists/show.js';
import * as ep___users_lists_favorite from './endpoints/users/lists/favorite.js';
import * as ep___users_lists_unfavorite from './endpoints/users/lists/unfavorite.js';
import * as ep___users_lists_createFromPublic from './endpoints/users/lists/create-from-public.js';
import * as ep___users_lists_update from './endpoints/users/lists/update.js';
import * as ep___users_lists_updateMembership from './endpoints/users/lists/update-membership.js';
import * as ep___users_lists_getMemberships from './endpoints/users/lists/get-memberships.js';
import * as ep___users_notes from './endpoints/users/notes.js';
import * as ep___users_pages from './endpoints/users/pages.js';
import * as ep___users_flashs from './endpoints/users/flashs.js';
import * as ep___users_reactions from './endpoints/users/reactions.js';
import * as ep___users_recommendation from './endpoints/users/recommendation.js';
import * as ep___users_relation from './endpoints/users/relation.js';
import * as ep___users_reportAbuse from './endpoints/users/report-abuse.js';
import * as ep___users_searchByUsernameAndHost from './endpoints/users/search-by-username-and-host.js';
import * as ep___users_search from './endpoints/users/search.js';
import * as ep___users_show from './endpoints/users/show.js';
import * as ep___users_achievements from './endpoints/users/achievements.js';
import * as ep___users_updateMemo from './endpoints/users/update-memo.js';
import * as ep___fetchRss from './endpoints/fetch-rss.js';
import * as ep___fetchExternalResources from './endpoints/fetch-external-resources.js';
import * as ep___retention from './endpoints/retention.js';
import * as ep___bubbleGame_register from './endpoints/bubble-game/register.js';
import * as ep___bubbleGame_ranking from './endpoints/bubble-game/ranking.js';
import * as ep___reversi_cancelMatch from './endpoints/reversi/cancel-match.js';
import * as ep___reversi_games from './endpoints/reversi/games.js';
import * as ep___reversi_match from './endpoints/reversi/match.js';
import * as ep___reversi_invitations from './endpoints/reversi/invitations.js';
import * as ep___reversi_showGame from './endpoints/reversi/show-game.js';
import * as ep___reversi_surrender from './endpoints/reversi/surrender.js';
import * as ep___reversi_verify from './endpoints/reversi/verify.js';
import * as ep___mahjong_createRoom from './endpoints/mahjong/create-room.js';
import * as ep___mahjong_joinRoom from './endpoints/mahjong/join-room.js';
import * as ep___mahjong_showRoom from './endpoints/mahjong/show-room.js';

const eps = [
	['admin/meta', ep___admin_meta],
	['admin/abuse-user-reports', ep___admin_abuseUserReports],
	['admin/abuse-report/notification-recipient/list', ep___admin_abuseReport_notificationRecipient_list],
	['admin/abuse-report/notification-recipient/show', ep___admin_abuseReport_notificationRecipient_show],
	['admin/abuse-report/notification-recipient/create', ep___admin_abuseReport_notificationRecipient_create],
	['admin/abuse-report/notification-recipient/update', ep___admin_abuseReport_notificationRecipient_update],
	['admin/abuse-report/notification-recipient/delete', ep___admin_abuseReport_notificationRecipient_delete],
	['admin/accounts/create', ep___admin_accounts_create],
	['admin/accounts/delete', ep___admin_accounts_delete],
	['admin/accounts/find-by-email', ep___admin_accounts_findByEmail],
	['admin/ad/create', ep___admin_ad_create],
	['admin/ad/delete', ep___admin_ad_delete],
	['admin/ad/list', ep___admin_ad_list],
	['admin/ad/update', ep___admin_ad_update],
	['admin/announcements/create', ep___admin_announcements_create],
	['admin/announcements/delete', ep___admin_announcements_delete],
	['admin/announcements/list', ep___admin_announcements_list],
	['admin/announcements/update', ep___admin_announcements_update],
	['admin/avatar-decorations/create', ep___admin_avatarDecorations_create],
	['admin/avatar-decorations/delete', ep___admin_avatarDecorations_delete],
	['admin/avatar-decorations/list', ep___admin_avatarDecorations_list],
	['admin/avatar-decorations/update', ep___admin_avatarDecorations_update],
	['admin/delete-all-files-of-a-user', ep___admin_deleteAllFilesOfAUser],
	['admin/unset-user-avatar', ep___admin_unsetUserAvatar],
	['admin/unset-user-banner', ep___admin_unsetUserBanner],
	['admin/drive/clean-remote-files', ep___admin_drive_cleanRemoteFiles],
	['admin/drive/cleanup', ep___admin_drive_cleanup],
	['admin/drive/files', ep___admin_drive_files],
	['admin/drive/show-file', ep___admin_drive_showFile],
	['admin/emoji/add-aliases-bulk', ep___admin_emoji_addAliasesBulk],
	['admin/emoji/add', ep___admin_emoji_add],
	['admin/emoji/copy', ep___admin_emoji_copy],
	['admin/emoji/delete-bulk', ep___admin_emoji_deleteBulk],
	['admin/emoji/delete', ep___admin_emoji_delete],
	['admin/emoji/import-zip', ep___admin_emoji_importZip],
	['admin/emoji/list-remote', ep___admin_emoji_listRemote],
	['admin/emoji/list', ep___admin_emoji_list],
	['admin/emoji/remove-aliases-bulk', ep___admin_emoji_removeAliasesBulk],
	['admin/emoji/set-aliases-bulk', ep___admin_emoji_setAliasesBulk],
	['admin/emoji/set-category-bulk', ep___admin_emoji_setCategoryBulk],
	['admin/emoji/set-license-bulk', ep___admin_emoji_setLicenseBulk],
	['admin/emoji/update', ep___admin_emoji_update],
	['admin/federation/delete-all-files', ep___admin_federation_deleteAllFiles],
	['admin/federation/refresh-remote-instance-metadata', ep___admin_federation_refreshRemoteInstanceMetadata],
	['admin/federation/remove-all-following', ep___admin_federation_removeAllFollowing],
	['admin/federation/update-instance', ep___admin_federation_updateInstance],
	['admin/get-index-stats', ep___admin_getIndexStats],
	['admin/get-table-stats', ep___admin_getTableStats],
	['admin/get-user-ips', ep___admin_getUserIps],
	['admin/invite/create', ep___admin_invite_create],
	['admin/invite/list', ep___admin_invite_list],
	['admin/promo/create', ep___admin_promo_create],
	['admin/queue/clear', ep___admin_queue_clear],
	['admin/queue/deliver-delayed', ep___admin_queue_deliverDelayed],
	['admin/queue/inbox-delayed', ep___admin_queue_inboxDelayed],
	['admin/queue/promote', ep___admin_queue_promote],
	['admin/queue/stats', ep___admin_queue_stats],
	['admin/relays/add', ep___admin_relays_add],
	['admin/relays/list', ep___admin_relays_list],
	['admin/relays/remove', ep___admin_relays_remove],
	['admin/reset-password', ep___admin_resetPassword],
	['admin/resolve-abuse-user-report', ep___admin_resolveAbuseUserReport],
	['admin/send-email', ep___admin_sendEmail],
	['admin/server-info', ep___admin_serverInfo],
	['admin/show-moderation-logs', ep___admin_showModerationLogs],
	['admin/show-user', ep___admin_showUser],
	['admin/show-users', ep___admin_showUsers],
	['admin/suspend-user', ep___admin_suspendUser],
	['admin/unsuspend-user', ep___admin_unsuspendUser],
	['admin/update-meta', ep___admin_updateMeta],
	['admin/delete-account', ep___admin_deleteAccount],
	['admin/update-user-note', ep___admin_updateUserNote],
	['admin/roles/create', ep___admin_roles_create],
	['admin/roles/delete', ep___admin_roles_delete],
	['admin/roles/list', ep___admin_roles_list],
	['admin/roles/show', ep___admin_roles_show],
	['admin/roles/update', ep___admin_roles_update],
	['admin/roles/assign', ep___admin_roles_assign],
	['admin/roles/unassign', ep___admin_roles_unassign],
	['admin/roles/update-default-policies', ep___admin_roles_updateDefaultPolicies],
	['admin/roles/users', ep___admin_roles_users],
	['admin/system-webhook/create', ep___admin_systemWebhook_create],
	['admin/system-webhook/delete', ep___admin_systemWebhook_delete],
	['admin/system-webhook/list', ep___admin_systemWebhook_list],
	['admin/system-webhook/show', ep___admin_systemWebhook_show],
	['admin/system-webhook/update', ep___admin_systemWebhook_update],
	['announcements', ep___announcements],
	['announcements/show', ep___announcements_show],
	['antennas/create', ep___antennas_create],
	['antennas/delete', ep___antennas_delete],
	['antennas/list', ep___antennas_list],
	['antennas/notes', ep___antennas_notes],
	['antennas/show', ep___antennas_show],
	['antennas/update', ep___antennas_update],
	['ap/get', ep___ap_get],
	['ap/show', ep___ap_show],
	['app/create', ep___app_create],
	['app/show', ep___app_show],
	['auth/accept', ep___auth_accept],
	['auth/session/generate', ep___auth_session_generate],
	['auth/session/show', ep___auth_session_show],
	['auth/session/userkey', ep___auth_session_userkey],
	['blocking/create', ep___blocking_create],
	['blocking/delete', ep___blocking_delete],
	['blocking/list', ep___blocking_list],
	['channels/create', ep___channels_create],
	['channels/featured', ep___channels_featured],
	['channels/follow', ep___channels_follow],
	['channels/followed', ep___channels_followed],
	['channels/owned', ep___channels_owned],
	['channels/show', ep___channels_show],
	['channels/timeline', ep___channels_timeline],
	['channels/unfollow', ep___channels_unfollow],
	['channels/update', ep___channels_update],
	['channels/favorite', ep___channels_favorite],
	['channels/unfavorite', ep___channels_unfavorite],
	['channels/my-favorites', ep___channels_myFavorites],
	['channels/search', ep___channels_search],
	['charts/active-users', ep___charts_activeUsers],
	['charts/ap-request', ep___charts_apRequest],
	['charts/drive', ep___charts_drive],
	['charts/federation', ep___charts_federation],
	['charts/instance', ep___charts_instance],
	['charts/notes', ep___charts_notes],
	['charts/user/drive', ep___charts_user_drive],
	['charts/user/following', ep___charts_user_following],
	['charts/user/notes', ep___charts_user_notes],
	['charts/user/pv', ep___charts_user_pv],
	['charts/user/reactions', ep___charts_user_reactions],
	['charts/users', ep___charts_users],
	['clips/add-note', ep___clips_addNote],
	['clips/remove-note', ep___clips_removeNote],
	['clips/create', ep___clips_create],
	['clips/delete', ep___clips_delete],
	['clips/list', ep___clips_list],
	['clips/notes', ep___clips_notes],
	['clips/show', ep___clips_show],
	['clips/update', ep___clips_update],
	['clips/favorite', ep___clips_favorite],
	['clips/unfavorite', ep___clips_unfavorite],
	['clips/my-favorites', ep___clips_myFavorites],
	['drive', ep___drive],
	['drive/files', ep___drive_files],
	['drive/files/attached-notes', ep___drive_files_attachedNotes],
	['drive/files/check-existence', ep___drive_files_checkExistence],
	['drive/files/create', ep___drive_files_create],
	['drive/files/delete', ep___drive_files_delete],
	['drive/files/find-by-hash', ep___drive_files_findByHash],
	['drive/files/find', ep___drive_files_find],
	['drive/files/show', ep___drive_files_show],
	['drive/files/update', ep___drive_files_update],
	['drive/files/upload-from-url', ep___drive_files_uploadFromUrl],
	['drive/folders', ep___drive_folders],
	['drive/folders/create', ep___drive_folders_create],
	['drive/folders/delete', ep___drive_folders_delete],
	['drive/folders/find', ep___drive_folders_find],
	['drive/folders/show', ep___drive_folders_show],
	['drive/folders/update', ep___drive_folders_update],
	['drive/stream', ep___drive_stream],
	['email-address/available', ep___emailAddress_available],
	['endpoint', ep___endpoint],
	['endpoints', ep___endpoints],
	['export-custom-emojis', ep___exportCustomEmojis],
	['federation/followers', ep___federation_followers],
	['federation/following', ep___federation_following],
	['federation/instances', ep___federation_instances],
	['federation/show-instance', ep___federation_showInstance],
	['federation/update-remote-user', ep___federation_updateRemoteUser],
	['federation/users', ep___federation_users],
	['federation/stats', ep___federation_stats],
	['following/create', ep___following_create],
	['following/delete', ep___following_delete],
	['following/update', ep___following_update],
	['following/update-all', ep___following_update_all],
	['following/invalidate', ep___following_invalidate],
	['following/requests/accept', ep___following_requests_accept],
	['following/requests/cancel', ep___following_requests_cancel],
	['following/requests/list', ep___following_requests_list],
	['following/requests/reject', ep___following_requests_reject],
	['gallery/featured', ep___gallery_featured],
	['gallery/popular', ep___gallery_popular],
	['gallery/posts', ep___gallery_posts],
	['gallery/posts/create', ep___gallery_posts_create],
	['gallery/posts/delete', ep___gallery_posts_delete],
	['gallery/posts/like', ep___gallery_posts_like],
	['gallery/posts/show', ep___gallery_posts_show],
	['gallery/posts/unlike', ep___gallery_posts_unlike],
	['gallery/posts/update', ep___gallery_posts_update],
	['get-online-users-count', ep___getOnlineUsersCount],
	['get-avatar-decorations', ep___getAvatarDecorations],
	['hashtags/list', ep___hashtags_list],
	['hashtags/search', ep___hashtags_search],
	['hashtags/show', ep___hashtags_show],
	['hashtags/trend', ep___hashtags_trend],
	['hashtags/users', ep___hashtags_users],
	['i', ep___i],
	['i/2fa/done', ep___i_2fa_done],
	['i/2fa/key-done', ep___i_2fa_keyDone],
	['i/2fa/password-less', ep___i_2fa_passwordLess],
	['i/2fa/register-key', ep___i_2fa_registerKey],
	['i/2fa/register', ep___i_2fa_register],
	['i/2fa/update-key', ep___i_2fa_updateKey],
	['i/2fa/remove-key', ep___i_2fa_removeKey],
	['i/2fa/unregister', ep___i_2fa_unregister],
	['i/apps', ep___i_apps],
	['i/authorized-apps', ep___i_authorizedApps],
	['i/claim-achievement', ep___i_claimAchievement],
	['i/change-password', ep___i_changePassword],
	['i/delete-account', ep___i_deleteAccount],
	['i/export-blocking', ep___i_exportBlocking],
	['i/export-following', ep___i_exportFollowing],
	['i/export-mute', ep___i_exportMute],
	['i/export-notes', ep___i_exportNotes],
	['i/export-clips', ep___i_exportClips],
	['i/export-favorites', ep___i_exportFavorites],
	['i/export-user-lists', ep___i_exportUserLists],
	['i/export-antennas', ep___i_exportAntennas],
	['i/favorites', ep___i_favorites],
	['i/gallery/likes', ep___i_gallery_likes],
	['i/gallery/posts', ep___i_gallery_posts],
	['i/import-blocking', ep___i_importBlocking],
	['i/import-following', ep___i_importFollowing],
	['i/import-muting', ep___i_importMuting],
	['i/import-user-lists', ep___i_importUserLists],
	['i/import-antennas', ep___i_importAntennas],
	['i/notifications', ep___i_notifications],
	['i/notifications-grouped', ep___i_notificationsGrouped],
	['i/page-likes', ep___i_pageLikes],
	['i/pages', ep___i_pages],
	['i/pin', ep___i_pin],
	['i/read-all-unread-notes', ep___i_readAllUnreadNotes],
	['i/read-announcement', ep___i_readAnnouncement],
	['i/regenerate-token', ep___i_regenerateToken],
	['i/registry/get-all', ep___i_registry_getAll],
	['i/registry/get-detail', ep___i_registry_getDetail],
	['i/registry/get', ep___i_registry_get],
	['i/registry/keys-with-type', ep___i_registry_keysWithType],
	['i/registry/keys', ep___i_registry_keys],
	['i/registry/remove', ep___i_registry_remove],
	['i/registry/scopes-with-domain', ep___i_registry_scopesWithDomain],
	['i/registry/set', ep___i_registry_set],
	['i/revoke-token', ep___i_revokeToken],
	['i/signin-history', ep___i_signinHistory],
	['i/unpin', ep___i_unpin],
	['i/update-email', ep___i_updateEmail],
	['i/update', ep___i_update],
	['i/move', ep___i_move],
	['i/webhooks/create', ep___i_webhooks_create],
	['i/webhooks/list', ep___i_webhooks_list],
	['i/webhooks/show', ep___i_webhooks_show],
	['i/webhooks/update', ep___i_webhooks_update],
	['i/webhooks/delete', ep___i_webhooks_delete],
	['invite/create', ep___invite_create],
	['invite/delete', ep___invite_delete],
	['invite/list', ep___invite_list],
	['invite/limit', ep___invite_limit],
	['meta', ep___meta],
	['emojis', ep___emojis],
	['emoji', ep___emoji],
	['miauth/gen-token', ep___miauth_genToken],
	['mute/create', ep___mute_create],
	['mute/delete', ep___mute_delete],
	['mute/list', ep___mute_list],
	['renote-mute/create', ep___renoteMute_create],
	['renote-mute/delete', ep___renoteMute_delete],
	['renote-mute/list', ep___renoteMute_list],
	['my/apps', ep___my_apps],
	['notes', ep___notes],
	['notes/children', ep___notes_children],
	['notes/clips', ep___notes_clips],
	['notes/conversation', ep___notes_conversation],
	['notes/create', ep___notes_create],
	['notes/delete', ep___notes_delete],
	['notes/favorites/create', ep___notes_favorites_create],
	['notes/favorites/delete', ep___notes_favorites_delete],
	['notes/featured', ep___notes_featured],
	['notes/global-timeline', ep___notes_globalTimeline],
	['notes/hybrid-timeline', ep___notes_hybridTimeline],
	['notes/local-timeline', ep___notes_localTimeline],
	['notes/mentions', ep___notes_mentions],
	['notes/polls/recommendation', ep___notes_polls_recommendation],
	['notes/polls/vote', ep___notes_polls_vote],
	['notes/reactions', ep___notes_reactions],
	['notes/reactions/create', ep___notes_reactions_create],
	['notes/reactions/delete', ep___notes_reactions_delete],
	['notes/renotes', ep___notes_renotes],
	['notes/replies', ep___notes_replies],
	['notes/search-by-tag', ep___notes_searchByTag],
	['notes/search', ep___notes_search],
	['notes/show', ep___notes_show],
	['notes/state', ep___notes_state],
	['notes/thread-muting/create', ep___notes_threadMuting_create],
	['notes/thread-muting/delete', ep___notes_threadMuting_delete],
	['notes/timeline', ep___notes_timeline],
	['notes/translate', ep___notes_translate],
	['notes/unrenote', ep___notes_unrenote],
	['notes/user-list-timeline', ep___notes_userListTimeline],
	['notifications/create', ep___notifications_create],
	['notifications/flush', ep___notifications_flush],
	['notifications/mark-all-as-read', ep___notifications_markAllAsRead],
	['notifications/test-notification', ep___notifications_testNotification],
	['page-push', ep___pagePush],
	['pages/create', ep___pages_create],
	['pages/delete', ep___pages_delete],
	['pages/featured', ep___pages_featured],
	['pages/like', ep___pages_like],
	['pages/show', ep___pages_show],
	['pages/unlike', ep___pages_unlike],
	['pages/update', ep___pages_update],
	['flash/create', ep___flash_create],
	['flash/delete', ep___flash_delete],
	['flash/featured', ep___flash_featured],
	['flash/like', ep___flash_like],
	['flash/show', ep___flash_show],
	['flash/unlike', ep___flash_unlike],
	['flash/update', ep___flash_update],
	['flash/my', ep___flash_my],
	['flash/my-likes', ep___flash_myLikes],
	['ping', ep___ping],
	['pinned-users', ep___pinnedUsers],
	['promo/read', ep___promo_read],
	['roles/list', ep___roles_list],
	['roles/show', ep___roles_show],
	['roles/users', ep___roles_users],
	['roles/notes', ep___roles_notes],
	['request-reset-password', ep___requestResetPassword],
	['reset-db', ep___resetDb],
	['reset-password', ep___resetPassword],
	['server-info', ep___serverInfo],
	['stats', ep___stats],
	['sw/show-registration', ep___sw_show_registration],
	['sw/update-registration', ep___sw_update_registration],
	['sw/register', ep___sw_register],
	['sw/unregister', ep___sw_unregister],
	['test', ep___test],
	['username/available', ep___username_available],
	['users', ep___users],
	['users/clips', ep___users_clips],
	['users/followers', ep___users_followers],
	['users/following', ep___users_following],
	['users/gallery/posts', ep___users_gallery_posts],
	['users/get-frequently-replied-users', ep___users_getFrequentlyRepliedUsers],
	['users/featured-notes', ep___users_featuredNotes],
	['users/lists/create', ep___users_lists_create],
	['users/lists/delete', ep___users_lists_delete],
	['users/lists/list', ep___users_lists_list],
	['users/lists/pull', ep___users_lists_pull],
	['users/lists/push', ep___users_lists_push],
	['users/lists/show', ep___users_lists_show],
	['users/lists/favorite', ep___users_lists_favorite],
	['users/lists/unfavorite', ep___users_lists_unfavorite],
	['users/lists/update', ep___users_lists_update],
	['users/lists/create-from-public', ep___users_lists_createFromPublic],
	['users/lists/update-membership', ep___users_lists_updateMembership],
	['users/lists/get-memberships', ep___users_lists_getMemberships],
	['users/notes', ep___users_notes],
	['users/pages', ep___users_pages],
	['users/flashs', ep___users_flashs],
	['users/reactions', ep___users_reactions],
	['users/recommendation', ep___users_recommendation],
	['users/relation', ep___users_relation],
	['users/report-abuse', ep___users_reportAbuse],
	['users/search-by-username-and-host', ep___users_searchByUsernameAndHost],
	['users/search', ep___users_search],
	['users/show', ep___users_show],
	['users/achievements', ep___users_achievements],
	['users/update-memo', ep___users_updateMemo],
	['fetch-rss', ep___fetchRss],
	['fetch-external-resources', ep___fetchExternalResources],
	['retention', ep___retention],
	['bubble-game/register', ep___bubbleGame_register],
	['bubble-game/ranking', ep___bubbleGame_ranking],
	['reversi/cancel-match', ep___reversi_cancelMatch],
	['reversi/games', ep___reversi_games],
	['reversi/match', ep___reversi_match],
	['reversi/invitations', ep___reversi_invitations],
	['reversi/show-game', ep___reversi_showGame],
	['reversi/surrender', ep___reversi_surrender],
	['reversi/verify', ep___reversi_verify],
	['mahjong/create-room', ep___mahjong_createRoom],
	['mahjong/join-room', ep___mahjong_joinRoom],
	['mahjong/show-room', ep___mahjong_showRoom],
];

interface IEndpointMetaBase {
	readonly stability?: 'deprecated' | 'experimental' | 'stable';

	readonly tags?: ReadonlyArray<string>;

	readonly errors?: {
		readonly [key: string]: {
			readonly message: string;
			readonly code: string;
			readonly id: string;
		};
	};

	readonly res?: Schema;

	/**
	 * このエンドポイントにリクエストするのにユーザー情報が必須か否か
	 * 省略した場合は false として解釈されます。
	 */
	readonly requireCredential?: boolean;

	/**
	 * isModeratorなロールを必要とするか
	 */
	readonly requireModerator?: boolean;

	/**
	 * isAdministratorなロールを必要とするか
	 */
	readonly requireAdmin?: boolean;

	readonly requireRolePolicy?: KeyOf<'RolePolicies'>;

	/**
	 * 引っ越し済みのユーザーによるリクエストを禁止するか
	 * 省略した場合は false として解釈されます。
	 */
	readonly prohibitMoved?: boolean;

	/**
	 * エンドポイントのリミテーションに関するやつ
	 * 省略した場合はリミテーションは無いものとして解釈されます。
	 */
	readonly limit?: {

		/**
		 * 複数のエンドポイントでリミットを共有したい場合に指定するキー
		 */
		readonly key?: string;

		/**
		 * リミットを適用する期間(ms)
		 * このプロパティを設定する場合、max プロパティも設定する必要があります。
		 */
		readonly duration?: number;

		/**
		 * durationで指定した期間内にいくつまでリクエストできるのか
		 * このプロパティを設定する場合、duration プロパティも設定する必要があります。
		 */
		readonly max?: number;

		/**
		 * 最低でもどれくらいの間隔を開けてリクエストしなければならないか(ms)
		 */
		readonly minInterval?: number;
	};

	/**
	 * ファイルの添付を必要とするか否か
	 * 省略した場合は false として解釈されます。
	 */
	readonly requireFile?: boolean;

	/**
	 * サードパーティアプリからはリクエストすることができないか否か
	 * 省略した場合は false として解釈されます。
	 */
	readonly secure?: boolean;

	/**
	 * エンドポイントの種類
	 * パーミッションの実現に利用されます。
	 */
	readonly kind?: string;

	readonly description?: string;

	/**
	 * GETでのリクエストを許容するか否か
	 */
	readonly allowGet?: boolean;

	/**
	 * 正常応答をキャッシュ (Cache-Control: public) する秒数
	 */
	readonly cacheSec?: number;
}

export type IEndpointMeta = (Omit<IEndpointMetaBase, 'requireCrential' | 'requireModerator' | 'requireAdmin'> & {
	requireCredential?: false,
	requireAdmin?: false,
	requireModerator?: false,
}) | (Omit<IEndpointMetaBase, 'secure'> & {
	secure: true,
}) | (Omit<IEndpointMetaBase, 'requireCredential' | 'kind'> & {
	requireCredential: true,
	kind: (typeof permissions)[number],
}) | (Omit<IEndpointMetaBase, 'requireModerator' | 'kind'> & {
	requireModerator: true,
	kind: (typeof permissions)[number],
}) | (Omit<IEndpointMetaBase, 'requireAdmin' | 'kind'> & {
	requireAdmin: true,
	kind: (typeof permissions)[number],
})

export interface IEndpoint {
	name: string;
	meta: IEndpointMeta;
	params: Schema;
}

const endpoints: IEndpoint[] = (eps as [string, any]).map(([name, ep]) => {
	return {
		name: name,
		get meta() {
			return ep.meta ?? {};
		},
		get params() {
			return ep.paramDef;
		},
	};
});

// eslint-disable-next-line import/no-default-export
export default endpoints;
