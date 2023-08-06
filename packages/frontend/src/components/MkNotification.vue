<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="elRef" :class="$style.root">
	<div :class="$style.head">
		<MkAvatar v-if="notification.type === 'pollEnded'" :class="$style.icon" :user="notification.note.user" link preview/>
		<MkAvatar v-else-if="notification.type === 'achievementEarned'" :class="$style.icon" :user="$i" link preview/>
		<MkAvatar v-else-if="notification.user" :class="$style.icon" :user="notification.user" link preview/>
		<img v-else-if="notification.icon" :class="$style.icon" :src="notification.icon" alt=""/>
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
			<!-- notification.reaction が null になることはまずないが、ここでoptional chaining使うと一部ブラウザで刺さるので念の為 -->
			<MkReactionIcon
				v-else-if="notification.type === 'reaction'"
				ref="reactionRef"
				:reaction="notification.reaction ? notification.reaction.replace(/^:(\w+):$/, ':$1@.:') : notification.reaction"
				:customEmojis="notification.note.emojis"
				:noStyle="true"
				style="width: 100%; height: 100%;"
			/>
		</div>
	</div>
	<div :class="$style.tail">
		<header :class="$style.header">
			<span v-if="notification.type === 'pollEnded'">{{ i18n.ts._notification.pollEnded }}</span>
			<span v-else-if="notification.type === 'achievementEarned'">{{ i18n.ts._notification.achievementEarned }}</span>
			<MkA v-else-if="notification.user" v-user-preview="notification.user.id" :class="$style.headerName" :to="userPage(notification.user)"><MkUserName :user="notification.user"/></MkA>
			<span v-else>{{ notification.header }}</span>
			<MkTime v-if="withTime" :time="notification.createdAt" :class="$style.headerTime"/>
		</header>
		<div>
			<MkA v-if="notification.type === 'reaction'" :class="$style.text" :to="notePage(notification.note)" :title="getNoteSummary(notification.note)">
				<i class="ti ti-quote" :class="$style.quote"></i>
				<Mfm :text="getNoteSummary(notification.note)" :plain="true" :nowrap="true" :author="notification.note.user"/>
				<i class="ti ti-quote" :class="$style.quote"></i>
			</MkA>
			<MkA v-else-if="notification.type === 'renote'" :class="$style.text" :to="notePage(notification.note)" :title="getNoteSummary(notification.note.renote)">
				<i class="ti ti-quote" :class="$style.quote"></i>
				<Mfm :text="getNoteSummary(notification.note.renote)" :plain="true" :nowrap="true" :author="notification.note.renote.user"/>
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
			<MkA v-else-if="notification.type === 'pollEnded'" :class="$style.text" :to="notePage(notification.note)" :title="getNoteSummary(notification.note)">
				<i class="ti ti-quote" :class="$style.quote"></i>
				<Mfm :text="getNoteSummary(notification.note)" :plain="true" :nowrap="true" :author="notification.note.user"/>
				<i class="ti ti-quote" :class="$style.quote"></i>
			</MkA>
			<MkA v-else-if="notification.type === 'achievementEarned'" :class="$style.text" to="/my/achievements">
				{{ i18n.ts._achievements._types['_' + notification.achievement].title }}
			</MkA>
			<template v-else-if="notification.type === 'follow'">
				<span :class="$style.text" style="opacity: 0.6;">{{ i18n.ts.youGotNewFollower }}</span>
				<div v-if="full"><MkFollowButton :user="notification.user" :full="true"/></div>
			</template>
			<span v-else-if="notification.type === 'followRequestAccepted'" :class="$style.text" style="opacity: 0.6;">{{ i18n.ts.followRequestAccepted }}</span>
			<template v-else-if="notification.type === 'receiveFollowRequest'">
				<span :class="$style.text" style="opacity: 0.6;">{{ i18n.ts.receiveFollowRequest }}</span>
				<div v-if="full && !followRequestDone" :class="$style.followRequestCommands">
					<MkButton :class="$style.followRequestCommandButton" rounded primary @click="acceptFollowRequest()"><i class="ti ti-check"/> {{ i18n.ts.accept }}</MkButton>
					<MkButton :class="$style.followRequestCommandButton" rounded danger @click="rejectFollowRequest()"><i class="ti ti-x"/> {{ i18n.ts.reject }}</MkButton>
				</div>
			</template>
			<span v-else-if="notification.type === 'app'" :class="$style.text">
				<Mfm :text="notification.body" :nowrap="false"/>
			</span>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { ref, shallowRef } from 'vue';
import * as misskey from 'misskey-js';
import MkReactionIcon from '@/components/MkReactionIcon.vue';
import MkFollowButton from '@/components/MkFollowButton.vue';
import XReactionTooltip from '@/components/MkReactionTooltip.vue';
import MkButton from '@/components/MkButton.vue';
import { getNoteSummary } from '@/scripts/get-note-summary';
import { notePage } from '@/filters/note';
import { userPage } from '@/filters/user';
import { i18n } from '@/i18n';
import * as os from '@/os';
import { useTooltip } from '@/scripts/use-tooltip';
import { $i } from '@/account';

const props = withDefaults(defineProps<{
	notification: misskey.entities.Notification;
	withTime?: boolean;
	full?: boolean;
}>(), {
	withTime: false,
	full: false,
});

const elRef = shallowRef<HTMLElement>(null);
const reactionRef = ref(null);

const followRequestDone = ref(false);

const acceptFollowRequest = () => {
	followRequestDone.value = true;
	os.api('following/requests/accept', { userId: props.notification.user.id });
};

const rejectFollowRequest = () => {
	followRequestDone.value = true;
	os.api('following/requests/reject', { userId: props.notification.user.id });
};

useTooltip(reactionRef, (showing) => {
	os.popup(XReactionTooltip, {
		showing,
		reaction: props.notification.reaction ? props.notification.reaction.replace(/^:(\w+):$/, ':$1@.:') : props.notification.reaction,
		emojis: props.notification.note.emojis,
		targetElement: reactionRef.value.$el,
	}, {}, 'closed');
});
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
	background: var(--panel);
	box-shadow: 0 0 0 3px var(--panel);
	font-size: 11px;
	text-align: center;
	color: #fff;

	&:empty {
		display: none;
	}
}

.t_follow, .t_followRequestAccepted, .t_receiveFollowRequest {
	padding: 3px;
	background: #36aed2;
	pointer-events: none;
}

.t_renote {
	padding: 3px;
	background: #36d298;
	pointer-events: none;
}

.t_quote {
	padding: 3px;
	background: #36d298;
	pointer-events: none;
}

.t_reply {
	padding: 3px;
	background: #007aff;
	pointer-events: none;
}

.t_mention {
	padding: 3px;
	background: #88a6b7;
	pointer-events: none;
}

.t_pollEnded {
	padding: 3px;
	background: #88a6b7;
	pointer-events: none;
}

.t_achievementEarned {
	padding: 3px;
	background: #cb9a11;
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
}

.quote {
	vertical-align: super;
	font-size: 50%;
	opacity: 0.5;
}

.quote:first-child {
	margin-right: 4px;
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
