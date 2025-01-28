<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" class="mkw-userList">
	<template #icon><i class="ti ti-users"></i></template>
	<template #header>{{ list ? list.name : i18n.ts._widgets.userList }}</template>
	<template #func="{ buttonStyleClass }"><button class="_button" :class="buttonStyleClass" @click="configure()"><i class="ti ti-settings"></i></button></template>

	<div :class="$style.root">
		<div v-if="widgetProps.listId == null" class="init">
			<MkButton primary @click="chooseList">{{ i18n.ts._widgets._userList.chooseList }}</MkButton>
		</div>
		<MkLoading v-else-if="fetching"/>
		<div v-else class="users">
			<span v-for="user in users" :key="user.id" class="user">
				<MkAvatar :user="user" class="avatar" indicator link preview/>
			</span>
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { GetFormResultType } from '@/scripts/form.js';
import MkContainer from '@/components/MkContainer.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { useInterval } from '@@/js/use-interval.js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';

const name = 'userList';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
	listId: {
		type: 'string' as const,
		default: null,
		hidden: true,
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure, save } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const list = ref<Misskey.entities.UserList>();
const users = ref<Misskey.entities.UserDetailed[]>([]);
const fetching = ref(true);

async function chooseList() {
	const lists = await misskeyApi('users/lists/list');
	const { canceled, result: list } = await os.select({
		title: i18n.ts.selectList,
		items: lists.map(x => ({
			value: x, text: x.name,
		})),
		default: widgetProps.listId,
	});
	if (canceled) return;

	widgetProps.listId = list.id;
	save();
	fetch();
}

const fetch = () => {
	if (widgetProps.listId == null) {
		fetching.value = false;
		return;
	}

	misskeyApi('users/lists/show', {
		listId: widgetProps.listId,
	}).then(_list => {
		list.value = _list;
		misskeyApi('users/show', {
			userIds: list.value.userIds,
		}).then(_users => {
			users.value = _users;
			fetching.value = false;
		});
	});
};

useInterval(fetch, 1000 * 60, {
	immediate: true,
	afterMounted: true,
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.root {
	&:global {
		> .init {
			padding: 16px;
		}

		> .users {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(30px, 40px));
			grid-gap: 12px;
			place-content: center;
			padding: 16px;

			> .user {
				width: 100%;
				height: 100%;
				aspect-ratio: 1;

				> .avatar {
					width: 100%;
					height: 100%;
				}
			}
		}
	}
}
</style>
