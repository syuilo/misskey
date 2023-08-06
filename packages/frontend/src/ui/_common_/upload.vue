<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="mk-uploader _acrylic" :style="{ zIndex }">
	<ol v-if="uploads.length > 0">
		<li v-for="ctx in uploads" :key="ctx.id">
			<div class="img" :style="{ backgroundImage: `url(${ ctx.img })` }"></div>
			<div class="top">
				<p class="name"><MkLoading :em="true"/>{{ ctx.name }}</p>
				<p class="status">
					<span v-if="ctx.progressValue === undefined" class="initing">{{ i18n.ts.waiting }}<MkEllipsis/></span>
					<span v-if="ctx.progressValue !== undefined" class="kb">{{ String(Math.floor(ctx.progressValue / 1024)).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,') }}<i>KB</i> / {{ String(Math.floor(ctx.progressMax / 1024)).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,') }}<i>KB</i></span>
					<span v-if="ctx.progressValue !== undefined" class="percentage">{{ Math.floor((ctx.progressValue / ctx.progressMax) * 100) }}</span>
				</p>
			</div>
			<progress :value="ctx.progressValue || 0" :max="ctx.progressMax || 0" :class="{ initing: ctx.progressValue === undefined, waiting: ctx.progressValue !== undefined && ctx.progressValue === ctx.progressMax }"></progress>
		</li>
	</ol>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { } from 'vue';
import * as os from '@/os';
import { uploads } from '@/scripts/upload';
import { i18n } from '@/i18n';

const zIndex = os.claimZIndex('high');
</script>

<style lang="scss" scoped>
.mk-uploader {
	position: fixed;
	right: 16px;
	width: 260px;
	top: 32px;
	padding: 16px 20px;
	pointer-events: none;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
	border-radius: 8px;
}
.mk-uploader:empty {
  display: none;
}
.mk-uploader > ol {
  display: block;
  margin: 0;
  padding: 0;
  list-style: none;
}
.mk-uploader > ol > li {
  display: grid;
  margin: 8px 0 0 0;
  padding: 0;
  height: 36px;
  width: 100%;
  border-top: solid 8px transparent;
  grid-template-columns: 36px calc(100% - 44px);
  grid-template-rows: 1fr 8px;
  column-gap: 8px;
  box-sizing: content-box;
}
.mk-uploader > ol > li:first-child {
  margin: 0;
  box-shadow: none;
  border-top: none;
}
.mk-uploader > ol > li > .img {
  display: block;
  background-size: cover;
  background-position: center center;
  grid-column: 1/2;
  grid-row: 1/3;
}
.mk-uploader > ol > li > .top {
  display: flex;
  grid-column: 2/3;
  grid-row: 1/2;
}
.mk-uploader > ol > li > .top > .name {
  display: block;
  padding: 0 8px 0 0;
  margin: 0;
  font-size: 0.8em;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  flex-shrink: 1;
}
.mk-uploader > ol > li > .top > .name > i {
  margin-right: 4px;
}
.mk-uploader > ol > li > .top > .status {
  display: block;
  margin: 0 0 0 auto;
  padding: 0;
  font-size: 0.8em;
  flex-shrink: 0;
}
.mk-uploader > ol > li > .top > .status > .initing {
}
.mk-uploader > ol > li > .top > .status > .kb {
}
.mk-uploader > ol > li > .top > .status > .percentage {
  display: inline-block;
  width: 48px;
  text-align: right;
}
.mk-uploader > ol > li > .top > .status > .percentage:after {
  content: '%';
}
.mk-uploader > ol > li > progress {
  display: block;
  background: transparent;
  border: none;
  border-radius: 4px;
  overflow: hidden;
  grid-column: 2/3;
  grid-row: 2/3;
  z-index: 2;
	width: 100%;
	height: 8px;
}
.mk-uploader > ol > li > progress::-webkit-progress-value {
  background: var(--accent);
}
.mk-uploader > ol > li > progress::-webkit-progress-bar {
  //background: var(--accentAlpha01);
	background: transparent;
}
</style>
