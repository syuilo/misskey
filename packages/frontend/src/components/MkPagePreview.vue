<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkA :to="`/@${page.user.username}/pages/${page.name}`" class="vhpxefrj">
	<div v-if="page.eyeCatchingImage" class="thumbnail">
		<MediaImage
			:image="page.eyeCatchingImage"
			:disableImageLink="true"
			:controls="false"
			:cover="true"
			:class="$style.eyeCatchingImageRoot"
		/>
	</div>
	<article>
		<header>
			<h1 :title="page.title">{{ page.title }}</h1>
		</header>
		<p v-if="page.summary" :title="page.summary">{{ page.summary.length > 85 ? page.summary.slice(0, 85) + '…' : page.summary }}</p>
		<footer>
			<img v-if="page.user.avatarUrl" class="icon" :src="page.user.avatarUrl"/>
			<MkUserName class="name" :user="page.user"/>
		</footer>
	</article>
</MkA>
</template>

<script lang="ts" setup>
import { } from 'vue';
import * as Misskey from 'misskey-js';
import MediaImage from '@/components/MkMediaImage.vue';

const props = defineProps<{
	page: Misskey.entities.Page;
}>();
</script>

<style module>
.eyeCatchingImageRoot {
	width: 100%;
	height: 200px;
	border-radius: var(--MI-radius) var(--MI-radius) 0 0;
	overflow: hidden;
}
</style>

<style lang="scss" scoped>
.vhpxefrj {
	display: block;
	position: relative;

	&:hover {
		text-decoration: none;
		color: var(--MI_THEME-accent);
	}

	&:focus-within {
		outline: none;

		&::after {
			content: "";
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			border-radius: var(--MI-radius);
			pointer-events: none;
			box-shadow: inset 0 0 0 2px var(--MI_THEME-focus);
		}
	}

	> .thumbnail {
		& + article {
			border-radius: 0 0 var(--MI-radius) var(--MI-radius);
		}
	}

	> article {
		background-color: var(--MI_THEME-panel);
		padding: 16px;
		border-radius: var(--MI-radius);

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

			> .name {
				display: inline-block;
				margin: 0;
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
			}
		}
	}

	@media (max-width: 550px) {
		font-size: 12px;

		> .thumbnail {
			height: 80px;
			overflow: clip;
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
