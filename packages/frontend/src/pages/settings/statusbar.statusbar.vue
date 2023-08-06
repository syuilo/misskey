<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkSelect v-model="statusbar.type" placeholder="Please select">
		<template #label>{{ i18n.ts.type }}</template>
		<option value="rss">RSS</option>
		<option value="federation">Federation</option>
		<option value="userList">User list timeline</option>
	</MkSelect>

	<MkInput v-model="statusbar.name" manualSave>
		<template #label>{{ i18n.ts.label }}</template>
	</MkInput>

	<MkSwitch v-model="statusbar.black">
		<template #label>Black</template>
	</MkSwitch>

	<MkRadios v-model="statusbar.size">
		<template #label>{{ i18n.ts.size }}</template>
		<option value="verySmall">{{ i18n.ts.small }}+</option>
		<option value="small">{{ i18n.ts.small }}</option>
		<option value="medium">{{ i18n.ts.medium }}</option>
		<option value="large">{{ i18n.ts.large }}</option>
		<option value="veryLarge">{{ i18n.ts.large }}+</option>
	</MkRadios>

	<template v-if="statusbar.type === 'rss'">
		<MkInput v-model="statusbar.props.url" manualSave type="url">
			<template #label>URL</template>
		</MkInput>
		<MkSwitch v-model="statusbar.props.shuffle">
			<template #label>{{ i18n.ts.shuffle }}</template>
		</MkSwitch>
		<MkInput v-model="statusbar.props.refreshIntervalSec" manualSave type="number">
			<template #label>{{ i18n.ts.refreshInterval }}</template>
		</MkInput>
		<MkRange v-model="statusbar.props.marqueeDuration" :min="5" :max="150" :step="1">
			<template #label>{{ i18n.ts.speed }}</template>
			<template #caption>{{ i18n.ts.fast }} &lt;-&gt; {{ i18n.ts.slow }}</template>
		</MkRange>
		<MkSwitch v-model="statusbar.props.marqueeReverse">
			<template #label>{{ i18n.ts.reverse }}</template>
		</MkSwitch>
	</template>
	<template v-else-if="statusbar.type === 'federation'">
		<MkInput v-model="statusbar.props.refreshIntervalSec" manualSave type="number">
			<template #label>{{ i18n.ts.refreshInterval }}</template>
		</MkInput>
		<MkRange v-model="statusbar.props.marqueeDuration" :min="5" :max="150" :step="1">
			<template #label>{{ i18n.ts.speed }}</template>
			<template #caption>{{ i18n.ts.fast }} &lt;-&gt; {{ i18n.ts.slow }}</template>
		</MkRange>
		<MkSwitch v-model="statusbar.props.marqueeReverse">
			<template #label>{{ i18n.ts.reverse }}</template>
		</MkSwitch>
		<MkSwitch v-model="statusbar.props.colored">
			<template #label>{{ i18n.ts.colored }}</template>
		</MkSwitch>
	</template>
	<template v-else-if="statusbar.type === 'userList' && userLists != null">
		<MkSelect v-model="statusbar.props.userListId">
			<template #label>{{ i18n.ts.userList }}</template>
			<option v-for="list in userLists" :value="list.id">{{ list.name }}</option>
		</MkSelect>
		<MkInput v-model="statusbar.props.refreshIntervalSec" manualSave type="number">
			<template #label>{{ i18n.ts.refreshInterval }}</template>
		</MkInput>
		<MkRange v-model="statusbar.props.marqueeDuration" :min="5" :max="150" :step="1">
			<template #label>{{ i18n.ts.speed }}</template>
			<template #caption>{{ i18n.ts.fast }} &lt;-&gt; {{ i18n.ts.slow }}</template>
		</MkRange>
		<MkSwitch v-model="statusbar.props.marqueeReverse">
			<template #label>{{ i18n.ts.reverse }}</template>
		</MkSwitch>
	</template>

	<div class="_buttons">
		<MkButton danger @click="del">{{ i18n.ts.remove }}</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { reactive, watch } from 'vue';
import MkSelect from '@/components/MkSelect.vue';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRadios from '@/components/MkRadios.vue';
import MkButton from '@/components/MkButton.vue';
import MkRange from '@/components/MkRange.vue';
import { defaultStore } from '@/store';
import { i18n } from '@/i18n';
import { deepClone } from '@/scripts/clone';

const props = defineProps<{
	_id: string;
	userLists: any[] | null;
}>();

const statusbar = reactive(deepClone(defaultStore.state.statusbars.find(x => x.id === props._id)));

watch(() => statusbar.type, () => {
	if (statusbar.type === 'rss') {
		statusbar.name = 'NEWS';
		statusbar.props.url = 'http://feeds.afpbb.com/rss/afpbb/afpbbnews';
		statusbar.props.shuffle = true;
		statusbar.props.refreshIntervalSec = 120;
		statusbar.props.display = 'marquee';
		statusbar.props.marqueeDuration = 100;
		statusbar.props.marqueeReverse = false;
	} else if (statusbar.type === 'federation') {
		statusbar.name = 'FEDERATION';
		statusbar.props.refreshIntervalSec = 120;
		statusbar.props.display = 'marquee';
		statusbar.props.marqueeDuration = 100;
		statusbar.props.marqueeReverse = false;
		statusbar.props.colored = false;
	} else if (statusbar.type === 'userList') {
		statusbar.name = 'LIST TL';
		statusbar.props.refreshIntervalSec = 120;
		statusbar.props.display = 'marquee';
		statusbar.props.marqueeDuration = 100;
		statusbar.props.marqueeReverse = false;
	}
});

watch(statusbar, save);

async function save() {
	const i = defaultStore.state.statusbars.findIndex(x => x.id === props._id);
	const statusbars = deepClone(defaultStore.state.statusbars);
	statusbars[i] = deepClone(statusbar);
	defaultStore.set('statusbars', statusbars);
}

function del() {
	defaultStore.set('statusbars', defaultStore.state.statusbars.filter(x => x.id !== props._id));
}
</script>
