<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkA :to="`/play/${flash.id}`" class="vhpxefrk _panel" tabindex="-1">
	<article>
		<header>
			<h1 :title="flash.title">{{ flash.title }}</h1>
		</header>
		<p v-if="flash.summary" :title="flash.summary">{{ flash.summary.length > 85 ? flash.summary.slice(0, 85) + '…' : flash.summary }}</p>
		<footer>
			<img class="icon" :src="flash.user.avatarUrl"/>
			<p>{{ userName(flash.user) }}</p>
		</footer>
	</article>
</MkA>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { } from 'vue';
import { userName } from '@/filters/user';

const props = defineProps<{
	//flash: misskey.entities.Flash;
	flash: any;
}>();
</script>

<style lang="scss" scoped>
.vhpxefrk {
	display: block;

	&:hover {
		text-decoration: none;
		color: var(--accent);
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

			> p {
				display: inline-block;
				margin: 0;
				color: var(--urlPreviewInfo);
				font-size: 0.8em;
				line-height: 16px;
				vertical-align: top;
			}
		}
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
