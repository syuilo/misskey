<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="meta" class="rsqzvsbo">
	<MkFeaturedPhotos class="bg"/>
	<XTimeline class="tl"/>
	<div class="shape1"></div>
	<div class="shape2"></div>
	<img src="/client-assets/misskey.svg" class="misskey"/>
	<div class="emojis">
		<MkEmoji :normal="true" :noStyle="true" emoji="👍"/>
		<MkEmoji :normal="true" :noStyle="true" emoji="❤"/>
		<MkEmoji :normal="true" :noStyle="true" emoji="😆"/>
		<MkEmoji :normal="true" :noStyle="true" emoji="🎉"/>
		<MkEmoji :normal="true" :noStyle="true" emoji="🍮"/>
	</div>
	<div class="contents">
		<MkVisitorDashboard/>
	</div>
	<div v-if="instances && instances.length > 0" class="federation">
		<MarqueeText :duration="40">
			<MkA v-for="instance in instances" :key="instance.id" :class="$style.federationInstance" :to="`/instance-info/${instance.host}`" behavior="window">
				<!--<MkInstanceCardMini :instance="instance"/>-->
				<img v-if="instance.iconUrl" class="icon" :src="instance.iconUrl" alt=""/>
				<span class="name _monospace">{{ instance.host }}</span>
			</MkA>
		</MarqueeText>
	</div>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { } from 'vue';
import { Instance } from 'misskey-js/built/entities';
import XTimeline from './welcome.timeline.vue';
import MarqueeText from '@/components/MkMarquee.vue';
import MkFeaturedPhotos from '@/components/MkFeaturedPhotos.vue';
import MkInfo from '@/components/MkInfo.vue';
import { instanceName } from '@/config';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { instance } from '@/instance';
import number from '@/filters/number';
import MkNumber from '@/components/MkNumber.vue';
import MkVisitorDashboard from '@/components/MkVisitorDashboard.vue';

let meta = $ref<Instance>();
let instances = $ref<any[]>();

os.api('meta', { detail: true }).then(_meta => {
	meta = _meta;
});

os.apiGet('federation/instances', {
	sort: '+pubSub',
	limit: 20,
}).then(_instances => {
	instances = _instances;
});
</script>

<style lang="scss" scoped>
.rsqzvsbo {
	> .bg {
		position: fixed;
		top: 0;
		right: 0;
		width: 80vw; // 100%からshapeの幅を引いている
		height: 100vh;
	}

	> .tl {
		position: fixed;
		top: 0;
		bottom: 0;
		right: 64px;
		margin: auto;
		padding: 128px 0;
		width: 500px;
		height: calc(100% - 256px);
		overflow: hidden;
		-webkit-mask-image: linear-gradient(0deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 128px, rgba(0,0,0,1) calc(100% - 128px), rgba(0,0,0,0) 100%);
		mask-image: linear-gradient(0deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 128px, rgba(0,0,0,1) calc(100% - 128px), rgba(0,0,0,0) 100%);

		@media (max-width: 1200px) {
			display: none;
		}
	}

	> .shape1 {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: var(--accent);
		clip-path: polygon(0% 0%, 45% 0%, 20% 100%, 0% 100%);
	}
	> .shape2 {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: var(--accent);
		clip-path: polygon(0% 0%, 25% 0%, 35% 100%, 0% 100%);
		opacity: 0.5;
	}

	> .misskey {
		position: fixed;
		top: 42px;
		left: 42px;
		width: 140px;

		@media (max-width: 450px) {
			width: 130px;
		}
	}

	> .emojis {
		position: fixed;
		bottom: 32px;
		left: 35px;

		> * {
			margin-right: 8px;
		}

		@media (max-width: 1200px) {
			display: none;
		}
	}

	> .contents {
		position: relative;
		width: min(430px, calc(100% - 32px));
		margin-left: 128px;
		padding: 100px 0 100px 0;

		@media (max-width: 1200px) {
			margin: auto;
		}
	}

	> .federation {
		position: fixed;
		bottom: 16px;
		left: 0;
		right: 0;
		margin: auto;
		background: var(--acrylicPanel);
		-webkit-backdrop-filter: var(--blur, blur(15px));
		backdrop-filter: var(--blur, blur(15px));
		border-radius: 999px;
		overflow: clip;
		width: 800px;
		padding: 8px 0;

		@media (max-width: 900px) {
			display: none;
		}
	}
}
</style>

<style lang="scss" module>
.federationInstance {
	display: inline-flex;
	align-items: center;
	vertical-align: bottom;
	padding: 6px 12px 6px 6px;
	margin: 0 10px 0 0;
	background: var(--panel);
	border-radius: 999px;

	> :global(.icon) {
		display: inline-block;
		width: 20px;
		height: 20px;
		margin-right: 5px;
		border-radius: 999px;
	}
}
</style>
