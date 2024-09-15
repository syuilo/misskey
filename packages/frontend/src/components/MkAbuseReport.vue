<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, '_panel', '_margin']">
	<!-- 通報されたユーザー -->
	<div :class="[$style.item, '_gaps_s']">
		<MkA v-user-preview="props.report.targetUser.id" :to="`/admin/user/${props.report.targetUser.id}`" :behavior="'window'">
			<MkUserCardMini :user="props.report.targetUser" :withChart="false" :class="$style.userCard"/>
		</MkA>
		<div :class="$style.userStatus">
			<button
				v-if="props.report.targetUser.isSuspended"
				v-tooltip:dialog="i18n.ts.userSuspended"
				:class="['_button', $style.badge, $style.isSuspended]"
				v-text="'Suspended'"
			></button>
			<button
				v-if="props.report.targetUser.isSilenced"
				v-tooltip:dialog="i18n.ts.userSilenced"
				:class="['_button', $style.badge, $style.isSilenced]"
				v-text="'Silenced'"
			></button>
			<button
				v-if="props.report.targetUser.moderationNote != null && props.report.targetUser.moderationNote.trim() !== ''"
				v-tooltip:dialog="props.report.targetUser.moderationNote.trim()"
				:class="['_button', $style.badge]"
				v-text="i18n.ts.moderationNote"
			></button>
		</div>
	</div>

	<!-- 通報の本文 -->
	<div :class="$style.item">
		<Mfm v-if="props.report.comment.trim() !== ''" :text="props.report.comment.trim()" :linkNavigationBehavior="'window'"/>
		<span v-else :class="$style.noComment">({{ i18n.ts.noDescription }})</span>
	</div>

	<!-- 通報の情報 -->
	<div :class="$style.item">
		<div :class="$style.information">
			<div :class="$style.infoItem">
				<div :class="$style.infoLabel">{{ i18n.ts.reporter }}</div>
				<div :class="$style.infoContent">
					<MkA :to="`/admin/user/${props.report.reporter.id}`" class="_link" :behavior="'window'">
						<MkAcct :user="props.report.reporter"/>
					</MkA>
				</div>
			</div>
			<div :class="$style.infoItem">
				<div :class="$style.infoLabel">{{ i18n.ts.createdAt }}</div>
				<div :class="$style.infoContent">{{ dateString(props.report.createdAt) }} (<MkTime :time="props.report.createdAt"/>)</div>
			</div>
		</div>
	</div>

	<!-- 通報の状態 -->
	<div :class="$style.item">
		<div v-if="resolvedRef">
			<i class="ti ti-check" style="color: var(--success); margin-right: 0.5em;"></i>
			<I18n v-if="props.report.assignee != null" :src="i18n.ts.resolvedByX" tag="span">
				<template #user>
					<MkA :to="`/admin/user/${props.report.assignee.id}`" class="_link" :behavior="'window'">
						<MkAcct :user="props.report.assignee"/>
					</MkA>
				</template>
			</I18n>
			<span v-else>{{ i18n.ts.resolved }}</span>
		</div>
		<div v-if="forwardedRef">
			<i class="ti ti-check" style="color: var(--success); margin-right: 0.5em;"></i>
			<span>{{ i18n.ts.forwardedReport }}</span>
		</div>
	</div>

	<!-- 通報の操作 -->
	<div :class="$style.item">
		<div v-if="!resolvedRef" :class="$style.operations">
			<MkSwitch v-if="props.report.targetUser.host != null" v-model="editForwardRef">
				<template #label>{{ i18n.ts.forwardReport }}</template>
				<template #caption>{{ i18n.ts.forwardReportIsAnonymous }}</template>
			</MkSwitch>
			<div :class="$style.resolveButton">
				<MkButton primary @click="resolveReport">{{ i18n.ts.abuseMarkAsResolved }}</MkButton>
			</div>
		</div>
		<div v-else-if="!forwardedRef && props.report.targetUser.host != null" :class="$style.operations">
			<div :class="$style.resolveButton">
				<MkButton @click="forwardReport">{{ i18n.ts.forwardReport }}</MkButton>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import type * as Misskey from 'misskey-js';
import { apiWithDialog } from '@/os.js';
import { i18n } from '@/i18n.js';
import { dateString } from '@/filters/date.js';
import MkButton from '@/components/MkButton.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkUserCardMini from '@/components/MkUserCardMini.vue';

export type AbuseUserReport = Misskey.entities.AdminAbuseUserReportsResponse[number];

const props = defineProps<{
	report: AbuseUserReport;
}>();

const emit = defineEmits<{
	(ev: 'resolved', reportId: string): void;
}>();

const editForwardRef = ref(false);

// eslint-disable-next-line vue/no-setup-props-destructure
const resolvedRef = ref(props.report.resolved);
// eslint-disable-next-line vue/no-setup-props-destructure
const forwardedRef = ref(props.report.forwarded);

const resolveReport = () => {
	// 解決済みは弾く
	if (resolvedRef.value) return;

	const reportId = props.report.id;
	const forward = editForwardRef.value && props.report.targetUser.host != null;

	apiWithDialog('admin/resolve-abuse-user-report', { reportId, forward }).then(() => {
		emit('resolved', reportId);
		resolvedRef.value = true;
		forwardedRef.value = forward;
	});
};

const forwardReport = () => {
	// 未解決は弾く
	if (!resolvedRef.value) return;
	// ローカルユーザーは弾く
	if (props.report.targetUser.host == null) return;

	const reportId = props.report.id;
	const forward = true;

	apiWithDialog('admin/resolve-abuse-user-report', { reportId, forward }).then(() => {
		resolvedRef.value = true;
		forwardedRef.value = forward;
	});
};
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
}

.item {
	padding: 16px;
	border-top: solid 0.5px var(--divider);

	&:first-child {
		border-top: none;
	}

	&:empty {
		display: none;
	}
}

.userCard {
	background-image: linear-gradient(
		45deg,
		rgba(255, 196, 0, 0.15) 16.67%,
		transparent 16.67%,
		transparent 50%,
		rgba(255, 196, 0, 0.15) 50%,
		rgba(255, 196, 0, 0.15) 66.67%,
		transparent 66.67%,
		transparent 100%
	);
	background-size: 16px 16px;
	background-color: transparent !important;
}

.userStatus {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;

	&:empty {
		display: none;
	}

	> .badge {
		display: inline-block;
		border: 1px solid var(--c, var(--fg));
		border-radius: 6px;
		padding: 2px 6px;
		font-size: 85%;
		color: var(--c, var(--fg));
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;

		&.isSuspended {
			--c: var(--error);
		}

		&.isSilenced {
			--c: var(--warn);
		}
	}
}

.noComment {
	color: var(--fgTransparentWeak);
}

.information {
	display: grid;
	grid-template-columns: max-content 1fr;
	gap: 0;
}

.infoItem {
	display: grid;
	grid-template: auto / subgrid;
	grid-row: auto;
	grid-column: span 2;
	gap: 8px;
}

@container (max-width: 300px) {
	.information {
		grid-template-columns: 1fr;
		gap: 8px;
	}

	.infoItem {
		grid-template: subgrid / auto;
		grid-row: span 2;
		grid-column: auto;
		gap: 0;
	}
}

.infoLabel {
	color: var(--fgTransparentWeak);
}

.infoContent {
	white-space: nowrap;
	text-overflow: ellipsis;
	overflow: hidden;
}

.operations {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	align-items: center;
}

.resolveButton {
	margin-left: auto;
}
</style>
