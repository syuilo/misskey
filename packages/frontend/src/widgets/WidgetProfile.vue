<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_panel">
	<div :class="$style.container" :style="{ backgroundImage: $i.bannerUrl ? `url(${ $i.bannerUrl })` : null }">
		<div :class="$style.avatarContainer">
			<MkAvatar :class="$style.avatar" :user="$i"/>
		</div>
		<div :class="$style.bodyContainer">
			<div :class="$style.body">
				<MkA :class="$style.name" :to="userPage($i)">
					<MkUserName :user="$i"/>
				</MkA>
				<div :class="$style.username"><MkAcct :user="$i" detail/></div>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { GetFormResultType } from '@/scripts/form.js';
import { $i } from '@/account.js';
import { userPage } from '@/filters/user.js';

const name = 'profile';

const widgetPropsDef = {
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.container {
	position: relative;
	background-size: cover;
	background-position: center;
	display: flex;
}

.avatarContainer {
	display: inline-block;
	text-align: center;
	padding: 16px;
}

.avatar {
	display: inline-block;
	width: 60px;
	height: 60px;
	box-sizing: border-box;
	border: solid 3px #fff;
}

.bodyContainer {
	display: flex;
	align-items: center;
	min-width: 0;
	padding: 0 16px 0 0;
}

.body {
	text-overflow: ellipsis;
	overflow: clip;
	margin-left: -10px;
	padding: 10px;
}

.name {
	color: #fff;
	filter: drop-shadow(0 0 4px #000) drop-shadow(0 0 0.1px rgba(0, 0, 0, 0.5));
	font-weight: bold;
}

.username {
	color: #fff;
	filter: drop-shadow(0 0 4px #000) drop-shadow(0 0 0.1px rgba(0, 0, 0, 0.5));
	font-weight: normal;
}
</style>
