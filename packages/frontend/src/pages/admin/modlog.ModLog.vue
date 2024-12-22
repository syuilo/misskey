<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkFolder>
	<template #label>
		<b
			:class="{
				[$style.logGreen]: [
					'createRole',
					'addCustomEmoji',
					'createGlobalAnnouncement',
					'createUserAnnouncement',
					'createAd',
					'createInvitation',
					'createAvatarDecoration',
					'createSystemWebhook',
					'createAbuseReportNotificationRecipient',
				].includes(log.type),
				[$style.logYellow]: [
					'markSensitiveDriveFile',
					'resetPassword',
					'suspendRemoteInstance',
				].includes(log.type),
				[$style.logRed]: [
					'suspend',
					'deleteRole',
					'deleteGlobalAnnouncement',
					'deleteUserAnnouncement',
					'deleteCustomEmoji',
					'deleteNote',
					'deleteDriveFile',
					'deleteAd',
					'deleteAvatarDecoration',
					'deleteSystemWebhook',
					'deleteAbuseReportNotificationRecipient',
					'deleteAccount',
					'deletePage',
					'deleteFlash',
					'deleteGalleryPost',
				].includes(log.type)
			}"
		>{{ i18n.ts._moderationLogTypes[log.type] }}</b>
		<span v-if="log.type === 'updateUserNote'">: @{{ log.info.userUsername }}{{ log.info.userHost ? '@' + log.info.userHost : '' }}</span>
		<span v-else-if="log.type === 'suspend'">: @{{ log.info.userUsername }}{{ log.info.userHost ? '@' + log.info.userHost : '' }}</span>
		<span v-else-if="log.type === 'unsuspend'">: @{{ log.info.userUsername }}{{ log.info.userHost ? '@' + log.info.userHost : '' }}</span>
		<span v-else-if="log.type === 'resetPassword'">: @{{ log.info.userUsername }}{{ log.info.userHost ? '@' + log.info.userHost : '' }}</span>
		<span v-else-if="log.type === 'assignRole'">: @{{ log.info.userUsername }}{{ log.info.userHost ? '@' + log.info.userHost : '' }} <i class="ti ti-arrow-right"></i> {{ log.info.roleName }}</span>
		<span v-else-if="log.type === 'unassignRole'">: @{{ log.info.userUsername }}{{ log.info.userHost ? '@' + log.info.userHost : '' }} <i class="ti ti-equal-not"></i> {{ log.info.roleName }}</span>
		<span v-else-if="log.type === 'createRole'">: {{ log.info.role.name }}</span>
		<span v-else-if="log.type === 'updateRole'">: {{ log.info.before.name }}</span>
		<span v-else-if="log.type === 'deleteRole'">: {{ log.info.role.name }}</span>
		<span v-else-if="log.type === 'addCustomEmoji'">: {{ log.info.emoji.name }}</span>
		<span v-else-if="log.type === 'updateCustomEmoji'">: {{ log.info.before.name }}</span>
		<span v-else-if="log.type === 'deleteCustomEmoji'">: {{ log.info.emoji.name }}</span>
		<span v-else-if="log.type === 'markSensitiveDriveFile'">: @{{ log.info.fileUserUsername }}{{ log.info.fileUserHost ? '@' + log.info.fileUserHost : '' }}</span>
		<span v-else-if="log.type === 'unmarkSensitiveDriveFile'">: @{{ log.info.fileUserUsername }}{{ log.info.fileUserHost ? '@' + log.info.fileUserHost : '' }}</span>
		<span v-else-if="log.type === 'suspendRemoteInstance'">: {{ log.info.host }}</span>
		<span v-else-if="log.type === 'unsuspendRemoteInstance'">: {{ log.info.host }}</span>
		<span v-else-if="log.type === 'createGlobalAnnouncement'">: {{ log.info.announcement.title }}</span>
		<span v-else-if="log.type === 'updateGlobalAnnouncement'">: {{ log.info.before.title }}</span>
		<span v-else-if="log.type === 'deleteGlobalAnnouncement'">: {{ log.info.announcement.title }}</span>
		<span v-else-if="log.type === 'resetReadsForGlobalAnnouncement'">: {{ log.info.announcement.title }}</span>
		<span v-else-if="log.type === 'createUserAnnouncement'">: @{{ log.info.userUsername }}{{ log.info.userHost ? '@' + log.info.userHost : '' }}</span>
		<span v-else-if="log.type === 'updateUserAnnouncement'">: @{{ log.info.userUsername }}{{ log.info.userHost ? '@' + log.info.userHost : '' }}</span>
		<span v-else-if="log.type === 'deleteUserAnnouncement'">: @{{ log.info.userUsername }}{{ log.info.userHost ? '@' + log.info.userHost : '' }}</span>
		<span v-else-if="log.type === 'resetReadsForUserAnnouncement'">: @{{ log.info.userUsername }}{{ log.info.userHost ? '@' + log.info.userHost : '' }}</span>
		<span v-else-if="log.type === 'deleteNote'">: @{{ log.info.noteUserUsername }}{{ log.info.noteUserHost ? '@' + log.info.noteUserHost : '' }}</span>
		<span v-else-if="log.type === 'deleteDriveFile'">: @{{ log.info.fileUserUsername }}{{ log.info.fileUserHost ? '@' + log.info.fileUserHost : '' }}</span>
		<span v-else-if="log.type === 'createAvatarDecoration'">: {{ log.info.avatarDecoration.name }}</span>
		<span v-else-if="log.type === 'updateAvatarDecoration'">: {{ log.info.before.name }}</span>
		<span v-else-if="log.type === 'deleteAvatarDecoration'">: {{ log.info.avatarDecoration.name }}</span>
		<span v-else-if="log.type === 'createSystemWebhook'">: {{ log.info.webhook.name }}</span>
		<span v-else-if="log.type === 'updateSystemWebhook'">: {{ log.info.before.name }}</span>
		<span v-else-if="log.type === 'deleteSystemWebhook'">: {{ log.info.webhook.name }}</span>
		<span v-else-if="log.type === 'createAbuseReportNotificationRecipient'">: {{ log.info.recipient.name }}</span>
		<span v-else-if="log.type === 'updateAbuseReportNotificationRecipient'">: {{ log.info.before.name }}</span>
		<span v-else-if="log.type === 'deleteAbuseReportNotificationRecipient'">: {{ log.info.recipient.name }}</span>
		<span v-else-if="log.type === 'deleteAccount'">: @{{ log.info.userUsername }}{{ log.info.userHost ? '@' + log.info.userHost : '' }}</span>
		<span v-else-if="log.type === 'deletePage'">: @{{ log.info.pageUserUsername }}</span>
		<span v-else-if="log.type === 'deleteFlash'">: @{{ log.info.flashUserUsername }}</span>
		<span v-else-if="log.type === 'deleteGalleryPost'">: @{{ log.info.postUserUsername }}</span>
	</template>
	<template #icon>
		<MkAvatar :user="log.user" :class="$style.avatar"/>
	</template>
	<template #suffix>
		<MkTime :time="log.createdAt"/>
	</template>

	<div>
		<div style="display: flex; gap: var(--MI-margin); flex-wrap: wrap;">
			<div style="flex: 1;">{{ i18n.ts.moderator }}: <MkA :to="`/admin/user/${log.userId}`" class="_link">@{{ log.user?.username }}</MkA></div>
			<div style="flex: 1;">{{ i18n.ts.dateAndTime }}: <MkTime :time="log.createdAt" mode="detail"/></div>
		</div>

		<template v-if="log.type === 'updateServerSettings'">
			<div :class="$style.diff">
				<CodeDiff :context="5" :hideHeader="true" :oldString="JSON5.stringify(log.info.before, null, '\t')" :newString="JSON5.stringify(log.info.after, null, '\t')" language="javascript" maxHeight="300px"/>
			</div>
		</template>
		<template v-else-if="log.type === 'updateUserNote'">
			<div>{{ i18n.ts.user }}: {{ log.info.userId }}</div>
			<div :class="$style.diff">
				<CodeDiff :context="5" :hideHeader="true" :oldString="log.info.before ?? ''" :newString="log.info.after ?? ''" maxHeight="300px"/>
			</div>
		</template>
		<template v-else-if="log.type === 'suspend'">
			<div>{{ i18n.ts.user }}: <MkA :to="`/admin/user/${log.info.userId}`" class="_link">@{{ log.info.userUsername }}{{ log.info.userHost ? '@' + log.info.userHost : '' }}</MkA></div>
		</template>
		<template v-else-if="log.type === 'unsuspend'">
			<div>{{ i18n.ts.user }}: <MkA :to="`/admin/user/${log.info.userId}`" class="_link">@{{ log.info.userUsername }}{{ log.info.userHost ? '@' + log.info.userHost : '' }}</MkA></div>
		</template>
		<template v-else-if="log.type === 'updateRole'">
			<div :class="$style.diff">
				<CodeDiff :context="5" :hideHeader="true" :oldString="JSON5.stringify(log.info.before, null, '\t')" :newString="JSON5.stringify(log.info.after, null, '\t')" language="javascript" maxHeight="300px"/>
			</div>
		</template>
		<template v-else-if="log.type === 'assignRole'">
			<div>{{ i18n.ts.user }}: {{ log.info.userId }}</div>
			<div>{{ i18n.ts.role }}: {{ log.info.roleName }} [{{ log.info.roleId }}]</div>
		</template>
		<template v-else-if="log.type === 'unassignRole'">
			<div>{{ i18n.ts.user }}: {{ log.info.userId }}</div>
			<div>{{ i18n.ts.role }}: {{ log.info.roleName }} [{{ log.info.roleId }}]</div>
		</template>
		<template v-else-if="log.type === 'updateCustomEmoji'">
			<div>{{ i18n.ts.emoji }}: {{ log.info.emojiId }}</div>
			<div :class="$style.diff">
				<CodeDiff :context="5" :hideHeader="true" :oldString="JSON5.stringify(log.info.before, null, '\t')" :newString="JSON5.stringify(log.info.after, null, '\t')" language="javascript" maxHeight="300px"/>
			</div>
		</template>
		<template v-else-if="log.type === 'updateAd'">
			<div :class="$style.diff">
				<CodeDiff :context="5" :hideHeader="true" :oldString="JSON5.stringify(log.info.before, null, '\t')" :newString="JSON5.stringify(log.info.after, null, '\t')" language="javascript" maxHeight="300px"/>
			</div>
		</template>
		<template v-else-if="log.type === 'updateGlobalAnnouncement'">
			<div :class="$style.diff">
				<CodeDiff :context="5" :hideHeader="true" :oldString="JSON5.stringify(log.info.before, null, '\t')" :newString="JSON5.stringify(log.info.after, null, '\t')" language="javascript" maxHeight="300px"/>
			</div>
		</template>
		<template v-else-if="log.type === 'updateUserAnnouncement'">
			<div :class="$style.diff">
				<CodeDiff :context="5" :hideHeader="true" :oldString="JSON5.stringify(log.info.before, null, '\t')" :newString="JSON5.stringify(log.info.after, null, '\t')" language="javascript" maxHeight="300px"/>
			</div>
		</template>
		<template v-else-if="log.type === 'updateAvatarDecoration'">
			<div :class="$style.diff">
				<CodeDiff :context="5" :hideHeader="true" :oldString="JSON5.stringify(log.info.before, null, '\t')" :newString="JSON5.stringify(log.info.after, null, '\t')" language="javascript" maxHeight="300px"/>
			</div>
		</template>
		<template v-else-if="log.type === 'updateRemoteInstanceNote'">
			<div :class="$style.diff">
				<CodeDiff :context="5" :hideHeader="true" :oldString="log.info.before ?? ''" :newString="log.info.after ?? ''" maxHeight="300px"/>
			</div>
		</template>
		<template v-else-if="log.type === 'updateSystemWebhook'">
			<div :class="$style.diff">
				<CodeDiff :context="5" :hideHeader="true" :oldString="JSON5.stringify(log.info.before, null, '\t')" :newString="JSON5.stringify(log.info.after, null, '\t')" language="javascript" maxHeight="300px"/>
			</div>
		</template>
		<template v-else-if="log.type === 'updateAbuseReportNotificationRecipient'">
			<div :class="$style.diff">
				<CodeDiff :context="5" :hideHeader="true" :oldString="JSON5.stringify(log.info.before, null, '\t')" :newString="JSON5.stringify(log.info.after, null, '\t')" language="javascript" maxHeight="300px"/>
			</div>
		</template>
		<template v-else-if="log.type === 'updateAbuseReportNote'">
			<div :class="$style.diff">
				<CodeDiff :context="5" :hideHeader="true" :oldString="log.info.before ?? ''" :newString="log.info.after ?? ''" maxHeight="300px"/>
			</div>
		</template>

		<details>
			<summary>raw</summary>
			<pre>{{ JSON5.stringify(log, null, '\t') }}</pre>
		</details>
	</div>
</MkFolder>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { CodeDiff } from 'v-code-diff';
import JSON5 from 'json5';
import { i18n } from '@/i18n.js';
import MkFolder from '@/components/MkFolder.vue';

const props = defineProps<{
	log: Misskey.entities.ModerationLog;
}>();
</script>

<style lang="scss" module>
.avatar {
	width: 18px;
	height: 18px;
}

.diff {
	background: #fff;
	color: #000;
	border-radius: 6px;
	overflow: clip;
}

.logYellow {
	color: var(--MI_THEME-warn);
}

.logRed {
	color: var(--MI_THEME-error);
}

.logGreen {
	color: var(--MI_THEME-success);
}
</style>
