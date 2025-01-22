<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkA :to="`/play/${flash.id}`" class="vhpxefrk _panel" :class="[{ gray: flash.visibility === 'private' }]">
	<article>
		<header>
			<h1 :title="flash.title">{{ flash.title }}</h1>
		</header>
		<p v-if="flash.summary" :title="flash.summary">
			<Mfm class="summaryMfm" :text="flash.summary" :plain="true" :nowrap="true"/>
		</p>
		<footer>
			<img class="icon" :src="flash.user.avatarUrl"/>
			<MkUserName class="name" :user="flash.user"/>
		</footer>
	</article>
</MkA>
</template>

<script lang="ts" setup>
import { } from 'vue';
import * as Misskey from 'misskey-js';

const props = defineProps<{
	flash: Misskey.entities.Flash;
}>();
</script>

<style lang="scss" scoped>
.vhpxefrk {
	display: block;

	&:hover {
		text-decoration: none;
		color: var(--MI_THEME-accent);
	}

	&:focus-visible {
		outline-offset: -2px;
	}

	> article {
		padding: 16px;

		> header {
			margin-bottom: 8px;

			> h1 {
				margin: 0;
				font-size: 1em;
				color: var(--urlPreviewTitle);
			}
		}

		> p {
			margin: 0;
			color: var(--urlPreviewText);
			font-size: 0.8em;
			overflow: clip;

			> .summaryMfm {
				display: block;
				width: 100%;
			}
		}

		> footer {
			margin-top: 8px;
			height: 16px;

			> img {
				display: inline-block;
				width: 16px;
				height: 16px;
				margin-right: 4px;
				vertical-align: top;
			}

			> .name {
				display: inline-block;
				margin: 0;
				font-size: 0.8em;
				line-height: 16px;
				vertical-align: top;
			}
		}
	}

	&:global(.gray) {
		--c: var(--MI_THEME-bg);
		background-image: linear-gradient(45deg, var(--c) 16.67%, transparent 16.67%, transparent 50%, var(--c) 50%, var(--c) 66.67%, transparent 66.67%, transparent 100%);
		background-size: 16px 16px;
	}

	@media (max-width: 700px) {
	}

	@media (max-width: 550px) {
		font-size: 12px;

		> article {
			padding: 12px;
		}
	}

	@media (max-width: 500px) {
		font-size: 10px;

		> article {
			padding: 8px;

			> header {
				margin-bottom: 4px;
			}

			> footer {
				margin-top: 4px;

				> img {
					width: 12px;
					height: 12px;
				}
			}
		}
	}
}

</style>
