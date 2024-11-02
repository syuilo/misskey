<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkFolder>
	<template #icon>
		<i v-if="report.resolved && report.resolvedAs === 'accept'" class="ti ti-check" style="color: var(--MI_THEME-success)"></i>
		<i v-else-if="report.resolved && report.resolvedAs === 'reject'" class="ti ti-x" style="color: var(--MI_THEME-error)"></i>
		<i v-else-if="report.resolved" class="ti ti-slash"></i>
		<i v-else class="ti ti-exclamation-circle" style="color: var(--MI_THEME-warn)"></i>
	</template>
	<template #label><MkAcct :user="report.targetUser"/> (by <MkAcct :user="report.reporter"/>)</template>
	<template #caption>{{ report.comment }}</template>
	<template #suffix><MkTime :time="report.createdAt"/></template>
	<template #footer>
		<div class="_buttons">
			<template v-if="!report.resolved">
				<MkButton @click="resolve('accept')"><i class="ti ti-check" style="color: var(--MI_THEME-success)"></i> {{ i18n.ts._abuseUserReport.resolve }} ({{ i18n.ts._abuseUserReport.accept }})</MkButton>
				<MkButton @click="resolve('reject')"><i class="ti ti-x" style="color: var(--MI_THEME-error)"></i> {{ i18n.ts._abuseUserReport.resolve }} ({{ i18n.ts._abuseUserReport.reject }})</MkButton>
				<MkButton @click="resolve(null)"><i class="ti ti-slash"></i> {{ i18n.ts._abuseUserReport.resolve }} ({{ i18n.ts.other }})</MkButton>
			</template>
			<template v-if="report.targetUser.host != null">
				<MkButton :disabled="report.forwarded" primary @click="forward"><i class="ti ti-corner-up-right"></i> {{ i18n.ts._abuseUserReport.forward }}</MkButton>
				<div v-tooltip:dialog="i18n.ts._abuseUserReport.forwardDescription" class="_button _help"><i class="ti ti-help-circle"></i></div>
			</template>
			<button class="_button" style="margin-left: auto; width: 34px;" @click="showMenu"><i class="ti ti-dots"></i></button>
		</div>
	</template>

	<div class="_gaps_s">
		<MkFolder :withSpacer="false">
			<template #icon><MkAvatar :user="report.targetUser" style="width: 18px; height: 18px;"/></template>
			<template #label>{{ i18n.ts.target }}: <MkAcct :user="report.targetUser"/></template>
			<template #suffix>#{{ report.targetUserId.toUpperCase() }}</template>

			<div style="container-type: inline-size;">
				<RouterView :router="targetRouter"/>
			</div>
		</MkFolder>

		<MkFolder :defaultOpen="true">
			<template #icon><i class="ti ti-message-2"></i></template>
			<template #label>{{ i18n.ts.details }}</template>
			<div class="_gaps_s">
				<Mfm :text="report.comment" :linkNavigationBehavior="'window'"/>
			</div>
		</MkFolder>

		<MkFolder :withSpacer="false">
			<template #icon><MkAvatar :user="report.reporter" style="width: 18px; height: 18px;"/></template>
			<template #label>{{ i18n.ts.reporter }}: <MkAcct :user="report.reporter"/></template>
			<template #suffix>#{{ report.reporterId.toUpperCase() }}</template>

			<div style="container-type: inline-size;">
				<RouterView :router="reporterRouter"/>
			</div>
		</MkFolder>

		<MkFolder :defaultOpen="false">
			<template #icon><i class="ti ti-message-2"></i></template>
			<template #label>{{ i18n.ts.moderationNote }}</template>
			<template #suffix>{{ moderationNote.length > 0 ? '...' : i18n.ts.none }}</template>
			<div class="_gaps_s">
				<MkTextarea v-model="moderationNote" manualSave>
					<template #caption>{{ i18n.ts.moderationNoteDescription }}</template>
				</MkTextarea>
			</div>
		</MkFolder>

		<div v-if="report.assignee">
			{{ i18n.ts.moderator }}:
			<MkAcct :user="report.assignee"/>
		</div>
	</div>
</MkFolder>
</template>

<script lang="ts" setup>
import { provide, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@/components/MkButton.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { dateString } from '@/filters/date.js';
import MkFolder from '@/components/MkFolder.vue';
import RouterView from '@/components/global/RouterView.vue';
import { useRouterFactory } from '@/router/supplier';
import MkTextarea from '@/components/MkTextarea.vue';
import { copyToClipboard } from '@/scripts/copy-to-clipboard.js';

const props = defineProps<{
	report: Misskey.entities.AdminAbuseUserReportsResponse[number];
}>();

const emit = defineEmits<{
	(ev: 'resolved', reportId: string): void;
}>();

const routerFactory = useRouterFactory();
const targetRouter = routerFactory(`/admin/user/${props.report.targetUserId}`);
targetRouter.init();
const reporterRouter = routerFactory(`/admin/user/${props.report.reporterId}`);
reporterRouter.init();

const moderationNote = ref(props.report.moderationNote ?? '');

watch(moderationNote, async () => {
	os.apiWithDialog('admin/update-abuse-user-report', {
		reportId: props.report.id,
		moderationNote: moderationNote.value,
	}).then(() => {
	});
});

function resolve(resolvedAs) {
	os.apiWithDialog('admin/resolve-abuse-user-report', {
		reportId: props.report.id,
		resolvedAs,
	}).then(() => {
		emit('resolved', props.report.id);
	});
}

function forward() {
	os.apiWithDialog('admin/forward-abuse-user-report', {
		reportId: props.report.id,
	}).then(() => {

	});
}

function showMenu(ev: MouseEvent) {
	os.popupMenu([{
		icon: 'ti ti-id',
		text: 'Copy ID',
		action: () => {
			copyToClipboard(props.report.id);
		},
	}, {
		icon: 'ti ti-json',
		text: 'Copy JSON',
		action: () => {
			copyToClipboard(JSON.stringify(props.report, null, '\t'));
		},
	}], ev.currentTarget ?? ev.target);
}
</script>

<style lang="scss" module>
</style>
