<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div :class="$style.head">
		<MkAvatar v-if="['pollEnded', 'note'].includes(notification.type) && 'note' in notification" :class="$style.icon" :user="notification.note.user" link preview/>
		<MkAvatar v-else-if="['roleAssigned', 'achievementEarned', 'exportCompleted', 'login', 'loginFailed'].includes(notification.type)" :class="$style.icon" :user="$i" link preview/>
		<div v-else-if="notification.type === 'reaction:grouped' && notification.note.reactionAcceptance === 'likeOnly'" :class="[$style.icon, $style.icon_reactionGroupHeart]"><i class="ti ti-heart" style="line-height: 1;"></i></div>
		<div v-else-if="notification.type === 'reaction:grouped'" :class="[$style.icon, $style.icon_reactionGroup]"><i class="ti ti-plus" style="line-height: 1;"></i></div>
		<div v-else-if="notification.type === 'renote:grouped'" :class="[$style.icon, $style.icon_renoteGroup]"><i class="ti ti-repeat" style="line-height: 1;"></i></div>
		<img v-else-if="notification.type === 'test'" :class="$style.icon" :src="infoImageUrl"/>
		<MkAvatar v-else-if="'user' in notification" :class="$style.icon" :user="notification.user" link preview/>
		<img v-else-if="'icon' in notification && notification.icon != null" :class="[$style.icon, $style.icon_app]" :src="notification.icon" alt=""/>
		<div
			:class="[$style.subIcon, {
				[$style.t_follow]: notification.type === 'follow',
				[$style.t_followRequestAccepted]: notification.type === 'followRequestAccepted',
				[$style.t_receiveFollowRequest]: notification.type === 'receiveFollowRequest',
				[$style.t_renote]: notification.type === 'renote',
				[$style.t_reply]: notification.type === 'reply',
				[$style.t_mention]: notification.type === 'mention',
				[$style.t_quote]: notification.type === 'quote',
				[$style.t_pollEnded]: notification.type === 'pollEnded',
				[$style.t_achievementEarned]: notification.type === 'achievementEarned',
				[$style.t_exportCompleted]: notification.type === 'exportCompleted',
				[$style.t_login]: notification.type === 'login',
				[$style.t_loginFailed]: notification.type === 'loginFailed',
				[$style.t_roleAssigned]: notification.type === 'roleAssigned' && notification.role.iconUrl == null,
			}]"
		>
			<i v-if="notification.type === 'follow'" class="ti ti-plus"></i>
			<i v-else-if="notification.type === 'receiveFollowRequest'" class="ti ti-clock"></i>
			<i v-else-if="notification.type === 'followRequestAccepted'" class="ti ti-check"></i>
			<i v-else-if="notification.type === 'renote'" class="ti ti-repeat"></i>
			<i v-else-if="notification.type === 'reply'" class="ti ti-arrow-back-up"></i>
			<i v-else-if="notification.type === 'mention'" class="ti ti-at"></i>
			<i v-else-if="notification.type === 'quote'" class="ti ti-quote"></i>
			<i v-else-if="notification.type === 'pollEnded'" class="ti ti-chart-arrows"></i>
			<i v-else-if="notification.type === 'achievementEarned'" class="ti ti-medal"></i>
			<i v-else-if="notification.type === 'exportCompleted'" class="ti ti-archive"></i>
			<i v-else-if="notification.type === 'login'" class="ti ti-login-2"></i>
			<i v-else-if="notification.type === 'loginFailed'" class="ti ti-lock-exclamation"></i>
			<template v-else-if="notification.type === 'roleAssigned'">
				<img v-if="notification.role.iconUrl" style="height: 1.3em; vertical-align: -22%;" :src="notification.role.iconUrl" alt=""/>
				<i v-else class="ti ti-badges"></i>
			</template>
			<MkReactionIcon
				v-else-if="notification.type === 'reaction'"
				:withTooltip="true"
				:reaction="notification.reaction.replace(/^:(\w+):$/, ':$1@.:')"
				:noStyle="true"
				style="width: 100%; height: 100% !important; object-fit: contain;"
			/>
		</div>
	</div>
	<div :class="$style.tail">
		<header :class="$style.header">
			<span v-if="notification.type === 'pollEnded'">{{ i18n.ts._notification.pollEnded }}</span>
			<span v-else-if="notification.type === 'note'">{{ i18n.ts._notification.newNote }}: <MkUserName :user="notification.note.user"/></span>
			<span v-else-if="notification.type === 'roleAssigned'">{{ i18n.ts._notification.roleAssigned }}</span>
			<span v-else-if="notification.type === 'achievementEarned'">{{ i18n.ts._notification.achievementEarned }}</span>
			<span v-else-if="notification.type === 'login'">{{ i18n.ts._notification.login }}</span>
			<span v-else-if="notification.type === 'loginFailed'">{{ i18n.ts._notification.loginFailed }}</span>
			<span v-else-if="notification.type === 'test'">{{ i18n.ts._notification.testNotification }}</span>
			<span v-else-if="notification.type === 'exportCompleted'">{{ i18n.tsx._notification.exportOfXCompleted({ x: exportEntityName[notification.exportedEntity] }) }}</span>
			<MkA v-else-if="notification.type === 'follow' || notification.type === 'mention' || notification.type === 'reply' || notification.type === 'renote' || notification.type === 'quote' || notification.type === 'reaction' || notification.type === 'receiveFollowRequest' || notification.type === 'followRequestAccepted'" v-user-preview="notification.user.id" :class="$style.headerName" :to="userPage(notification.user)"><MkUserName :user="notification.user"/></MkA>
			<span v-else-if="notification.type === 'reaction:grouped' && notification.note.reactionAcceptance === 'likeOnly'">{{ i18n.tsx._notification.likedBySomeUsers({ n: getActualReactedUsersCount(notification) }) }}</span>
			<span v-else-if="notification.type === 'reaction:grouped'">{{ i18n.tsx._notification.reactedBySomeUsers({ n: getActualReactedUsersCount(notification) }) }}</span>
			<span v-else-if="notification.type === 'renote:grouped'">{{ i18n.tsx._notification.renotedBySomeUsers({ n: notification.users.length }) }}</span>
			<span v-else-if="notification.type === 'app'">{{ notification.header }}</span>
			<MkTime v-if="withTime" :time="notification.createdAt" :class="$style.headerTime"/>
		</header>
		<div>
			<MkA v-if="notification.type === 'reaction' || notification.type === 'reaction:grouped'" :class="$style.text" :to="notePage(notification.note)" :title="getNoteSummary(notification.note)">
				<i class="ti ti-quote" :class="$style.quote"></i>
				<Mfm :text="getNoteSummary(notification.note)" :plain="true" :nowrap="true" :author="notification.note.user"/>
				<i class="ti ti-quote" :class="$style.quote"></i>
			</MkA>
			<MkA v-else-if="notification.type === 'renote' || notification.type === 'renote:grouped'" :class="$style.text" :to="notePage(notification.note)" :title="getNoteSummary(notification.note.renote)">
				<i class="ti ti-quote" :class="$style.quote"></i>
				<Mfm :text="getNoteSummary(notification.note.renote)" :plain="true" :nowrap="true" :author="notification.note.renote?.user"/>
				<i class="ti ti-quote" :class="$style.quote"></i>
			</MkA>
			<MkA v-else-if="notification.type === 'reply'" :class="$style.text" :to="notePage(notification.note)" :title="getNoteSummary(notification.note)">
				<Mfm :text="getNoteSummary(notification.note)" :plain="true" :nowrap="true" :author="notification.note.user"/>
			</MkA>
			<MkA v-else-if="notification.type === 'mention'" :class="$style.text" :to="notePage(notification.note)" :title="getNoteSummary(notification.note)">
				<Mfm :text="getNoteSummary(notification.note)" :plain="true" :nowrap="true" :author="notification.note.user"/>
			</MkA>
			<MkA v-else-if="notification.type === 'quote'" :class="$style.text" :to="notePage(notification.note)" :title="getNoteSummary(notification.note)">
				<Mfm :text="getNoteSummary(notification.note)" :plain="true" :nowrap="true" :author="notification.note.user"/>
			</MkA>
			<MkA v-else-if="notification.type === 'note'" :class="$style.text" :to="notePage(notification.note)" :title="getNoteSummary(notification.note)">
				<Mfm :text="getNoteSummary(notification.note)" :plain="true" :nowrap="true" :author="notification.note.user"/>
			</MkA>
			<MkA v-else-if="notification.type === 'pollEnded'" :class="$style.text" :to="notePage(notification.note)" :title="getNoteSummary(notification.note)">
				<i class="ti ti-quote" :class="$style.quote"></i>
				<Mfm :text="getNoteSummary(notification.note)" :plain="true" :nowrap="true" :author="notification.note.user"/>
				<i class="ti ti-quote" :class="$style.quote"></i>
			</MkA>
			<div v-else-if="notification.type === 'roleAssigned'" :class="$style.text">
				{{ notification.role.name }}
			</div>
			<MkA v-else-if="notification.type === 'achievementEarned'" :class="$style.text" to="/my/achievements">
				{{ i18n.ts._achievements._types['_' + notification.achievement].title }}
			</MkA>
			<MkA v-else-if="notification.type === 'exportCompleted'" :class="$style.text" :to="`/my/drive/file/${notification.fileId}`">
				{{ i18n.ts.showFile }}
			</MkA>
			<MkA v-else-if="notification.type === 'loginFailed'" :class="$style.text" to="/settings/security">
				<Mfm :text="i18n.tsx._notification.loginFailedDescription({ ip: notification.ip })"/>
			</MkA>
			<MkA v-else-if="notification.type === 'login'" :class="$style.text" to="/settings/security">
				<Mfm :text="i18n.tsx._notification.loginDescription({ ip: notification.ip, text: i18n.ts.regenerateLoginToken })"/>
			</MkA>
			<template v-else-if="notification.type === 'follow'">
				<span :class="$style.text" style="opacity: 0.6;">{{ i18n.ts.youGotNewFollower }}</span>
			</template>
			<template v-else-if="notification.type === 'followRequestAccepted'">
				<div :class="$style.text" style="opacity: 0.6;">{{ i18n.ts.followRequestAccepted }}</div>
				<div v-if="notification.message" :class="$style.text" style="opacity: 0.6; font-style: oblique;">
					<i class="ti ti-quote" :class="$style.quote"></i>
					<span>{{ notification.message }}</span>
					<i class="ti ti-quote" :class="$style.quote"></i>
				</div>
			</template>
			<template v-else-if="notification.type === 'receiveFollowRequest'">
				<span :class="$style.text" style="opacity: 0.6;">{{ i18n.ts.receiveFollowRequest }}</span>
				<div v-if="full && !followRequestDone" :class="$style.followRequestCommands">
					<MkButton :class="$style.followRequestCommandButton" rounded primary @click="acceptFollowRequest()"><i class="ti ti-check"/> {{ i18n.ts.accept }}</MkButton>
					<MkButton :class="$style.followRequestCommandButton" rounded danger @click="rejectFollowRequest()"><i class="ti ti-x"/> {{ i18n.ts.reject }}</MkButton>
				</div>
			</template>
			<span v-else-if="notification.type === 'test'" :class="$style.text">{{ i18n.ts._notification.notificationWillBeDisplayedLikeThis }}</span>
			<span v-else-if="notification.type === 'app'" :class="$style.text">
				<Mfm :text="notification.body" :nowrap="false"/>
			</span>

			<div v-if="notification.type === 'reaction:grouped'">
				<div v-for="reaction of notification.reactions" :key="reaction.user.id + reaction.reaction" :class="$style.reactionsItem">
					<MkAvatar :class="$style.reactionsItemAvatar" :user="reaction.user" link preview/>
					<div :class="$style.reactionsItemReaction">
						<MkReactionIcon
							:withTooltip="true"
							:reaction="reaction.reaction.replace(/^:(\w+):$/, ':$1@.:')"
							:noStyle="true"
							style="width: 100%; height: 100% !important; object-fit: contain;"
						/>
					</div>
				</div>
			</div>
			<div v-else-if="notification.type === 'renote:grouped'">
				<div v-for="user of notification.users" :key="user.id" :class="$style.reactionsItem">
					<MkAvatar :class="$style.reactionsItemAvatar" :user="user" link preview/>
				</div>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkReactionIcon from '@/components/MkReactionIcon.vue';
import MkButton from '@/components/MkButton.vue';
import { getNoteSummary } from '@/scripts/get-note-summary.js';
import { notePage } from '@/filters/note.js';
import { userPage } from '@/filters/user.js';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { signinRequired } from '@/account.js';
import { infoImageUrl } from '@/instance.js';

const $i = signinRequired();

const props = withDefaults(defineProps<{
	notification: Misskey.entities.Notification;
	withTime?: boolean;
	full?: boolean;
}>(), {
	withTime: false,
	full: false,
});

type ExportCompletedNotification = Misskey.entities.Notification & { type: 'exportCompleted' };

const exportEntityName = {
	antenna: i18n.ts.antennas,
	blocking: i18n.ts.blockedUsers,
	clip: i18n.ts.clips,
	customEmoji: i18n.ts.customEmojis,
	favorite: i18n.ts.favorites,
	following: i18n.ts.following,
	muting: i18n.ts.mutedUsers,
	note: i18n.ts.notes,
	userList: i18n.ts.lists,
} as const satisfies Record<ExportCompletedNotification['exportedEntity'], string>;

const followRequestDone = ref(false);

const acceptFollowRequest = () => {
	if (!('user' in props.notification)) return;
	followRequestDone.value = true;
	misskeyApi('following/requests/accept', { userId: props.notification.user.id });
};

const rejectFollowRequest = () => {
	if (!('user' in props.notification)) return;
	followRequestDone.value = true;
	misskeyApi('following/requests/reject', { userId: props.notification.user.id });
};

function getActualReactedUsersCount(notification: Misskey.entities.Notification) {
	if (notification.type !== 'reaction:grouped') return 0;
	return new Set(notification.reactions.map((reaction) => reaction.user.id)).size;
}
</script>

<style lang="scss" module>
.root {
	position: relative;
	box-sizing: border-box;
	padding: 24px 32px;
	font-size: 0.9em;
	overflow-wrap: break-word;
	display: flex;
	contain: content;
	content-visibility: auto;
	contain-intrinsic-size: 0 100px;

	--eventFollow: #36aed2;
	--eventRenote: #36d298;
	--eventReply: #007aff;
	--eventReactionHeart: var(--MI_THEME-love);
	--eventReaction: #e99a0b;
	--eventAchievement: #cb9a11;
	--eventLogin: #007aff;
	--eventOther: #88a6b7;
}

.head {
	position: sticky;
	top: 0;
	flex-shrink: 0;
	width: 42px;
	height: 42px;
	margin-right: 8px;
}

.icon {
	display: block;
	width: 100%;
	height: 100%;
}

.icon_reactionGroup,
.icon_reactionGroupHeart,
.icon_renoteGroup {
	display: grid;
	align-items: center;
	justify-items: center;
	width: 80%;
	height: 80%;
	font-size: 15px;
	border-radius: 100%;
	color: #fff;
}

.icon_reactionGroup {
	background: var(--eventReaction);
}

.icon_reactionGroupHeart {
	background: var(--eventReactionHeart);
}

.icon_renoteGroup {
	background: var(--eventRenote);
}

.icon_app {
	border-radius: 6px;
}

.subIcon {
	position: absolute;
	z-index: 1;
	bottom: -2px;
	right: -2px;
	width: 20px;
	height: 20px;
	box-sizing: border-box;
	border-radius: 100%;
	background: var(--MI_THEME-panel);
	box-shadow: 0 0 0 3px var(--MI_THEME-panel);
	font-size: 11px;
	text-align: center;
	color: #fff;

	&:empty {
		display: none;
	}
}

.t_follow, .t_followRequestAccepted, .t_receiveFollowRequest {
	padding: 3px;
	background: var(--eventFollow);
	pointer-events: none;
}

.t_renote {
	padding: 3px;
	background: var(--eventRenote);
	pointer-events: none;
}

.t_quote {
	padding: 3px;
	background: var(--eventRenote);
	pointer-events: none;
}

.t_reply {
	padding: 3px;
	background: var(--eventReply);
	pointer-events: none;
}

.t_mention {
	padding: 3px;
	background: var(--eventOther);
	pointer-events: none;
}

.t_pollEnded {
	padding: 3px;
	background: var(--eventOther);
	pointer-events: none;
}

.t_achievementEarned {
	padding: 3px;
	background: var(--eventAchievement);
	pointer-events: none;
}

.t_exportCompleted {
	padding: 3px;
	background: var(--eventOther);
	pointer-events: none;
}

.t_roleAssigned {
	padding: 3px;
	background: var(--eventOther);
	pointer-events: none;
}

.t_login {
	padding: 3px;
	background: var(--eventLogin);
	pointer-events: none;
}

.t_loginFailed {
	padding: 3px;
	background: var(--eventUnFollow);
	pointer-events: none;
}

.tail {
	flex: 1;
	min-width: 0;
}

.header {
	display: flex;
	align-items: baseline;
	white-space: nowrap;
}

.headerName {
	text-overflow: ellipsis;
	white-space: nowrap;
	min-width: 0;
	overflow: hidden;
}

.headerTime {
	margin-left: auto;
	font-size: 0.9em;
}

.text {
	display: flex;
	width: 100%;
	overflow: clip;
	opacity: 0.7;
}

.quote {
	vertical-align: super;
	font-size: 50%;
	opacity: 0.5;
}

.quote:first-child {
	margin-right: 4px;
	position: relative;

	&::before {
		position: absolute;
		transform: rotate(180deg);
	}
}

.quote:last-child {
	margin-left: 4px;
}

.followRequestCommands {
	display: flex;
	gap: 8px;
	max-width: 300px;
	margin-top: 8px;
}
.followRequestCommandButton {
	flex: 1;
}

.reactionsItem {
	display: inline-block;
	position: relative;
	width: 38px;
	height: 38px;
	margin-top: 8px;
	margin-right: 8px;
}

.reactionsItemAvatar {
	width: 100%;
	height: 100%;
}

.reactionsItemReaction {
	position: absolute;
	z-index: 1;
	bottom: -2px;
	right: -2px;
	width: 20px;
	height: 20px;
	box-sizing: border-box;
	border-radius: 100%;
	background: var(--MI_THEME-panel);
	box-shadow: 0 0 0 3px var(--MI_THEME-panel);
	font-size: 11px;
	text-align: center;
	color: #fff;
}

@container (max-width: 600px) {
	.root {
		padding: 16px;
		font-size: 0.9em;
	}
}

@container (max-width: 500px) {
	.root {
		padding: 12px;
		font-size: 0.85em;
	}
}
</style>
