<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkA :to="`/@${page.user.username}/pages/${page.name}`" class="vhpxefrj" tabindex="-1">
	<div v-if="page.eyeCatchingImage" class="thumbnail" :style="`background-image: url('${page.eyeCatchingImage.thumbnailUrl}')`"></div>
	<article>
		<header>
			<h1 :title="page.title">{{ page.title }}</h1>
		</header>
		<p v-if="page.summary" :title="page.summary">{{ page.summary.length > 85 ? page.summary.slice(0, 85) + '…' : page.summary }}</p>
		<footer>
			<img class="icon" :src="page.user.avatarUrl"/>
			<p>{{ userName(page.user) }}</p>
		</footer>
	</article>
</MkA>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { } from 'vue';
import * as misskey from 'misskey-js';
import { userName } from '@/filters/user';

const props = defineProps<{
	page: misskey.entities.Page;
}>();
</script>

<style lang="scss" scoped>
.vhpxefrj {
	display: block;

	&:hover {
		text-decoration: none;
		color: var(--accent);
	}

	> .thumbnail {
		width: 100%;
		height: 200px;
		background-position: center;
		background-size: cover;
		display: flex;
		justify-content: center;
		align-items: center;

		> button {
			font-size: 3.5em;
			opacity: 0.7;

			&:hover {
				font-size: 4em;
				opacity: 0.9;
			}
		}

		& + article {
			left: 100px;
			width: calc(100% - 100px);
		}
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
		> .thumbnail {
			position: relative;
			width: 100%;
			height: 100px;

			& + article {
				left: 0;
				width: 100%;
			}
		}
	}

	@media (max-width: 550px) {
		font-size: 12px;

		> .thumbnail {
			height: 80px;
		}

		> article {
			padding: 12px;
		}
	}

	@media (max-width: 500px) {
		font-size: 10px;

		> .thumbnail {
			height: 70px;
		}

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
