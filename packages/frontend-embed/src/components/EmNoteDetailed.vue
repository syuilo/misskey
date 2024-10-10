<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	v-show="!isDeleted"
	ref="rootEl"
	:class="$style.root"
>
	<EmNoteSub v-if="appearNote.reply" :note="appearNote.reply" :class="$style.replyTo"/>
	<div v-if="isRenote" :class="$style.renote">
		<EmAvatar :class="$style.renoteAvatar" :user="note.user" link/>
		<i class="ti ti-repeat" style="margin-right: 4px;"></i>
		<span :class="$style.renoteText">
			<I18n :src="i18n.ts.renotedBy" tag="span">
				<template #user>
					<EmA :class="$style.renoteName" :to="userPage(note.user)">
						<EmUserName :user="note.user"/>
					</EmA>
				</template>
			</I18n>
		</span>
		<div :class="$style.renoteInfo">
			<div class="$style.renoteTime">
				<EmTime :time="note.createdAt"/>
			</div>
			<span v-if="note.visibility !== 'public'" style="margin-left: 0.5em;" :title="i18n.ts._visibility[note.visibility]">
				<i v-if="note.visibility === 'home'" class="ti ti-home"></i>
				<i v-else-if="note.visibility === 'followers'" class="ti ti-lock"></i>
				<i v-else-if="note.visibility === 'specified'" ref="specified" class="ti ti-mail"></i>
			</span>
			<span v-if="note.localOnly" style="margin-left: 0.5em;" :title="i18n.ts._visibility['disableFederation']"><i class="ti ti-rocket-off"></i></span>
		</div>
	</div>
	<article :class="$style.note">
		<header :class="$style.noteHeader">
			<EmAvatar :class="$style.noteHeaderAvatar" :user="appearNote.user" indicator link/>
			<div :class="$style.noteHeaderBody">
				<div :class="$style.noteHeaderBodyUpper">
					<div style="min-width: 0;">
						<div class="_nowrap">
							<EmA :class="$style.noteHeaderName" :to="userPage(appearNote.user)">
								<EmUserName :nowrap="true" :user="appearNote.user"/>
							</EmA>
							<span v-if="appearNote.user.isBot" :class="$style.isBot">bot</span>
						</div>
						<div :class="$style.noteHeaderUsername"><EmAcct :user="appearNote.user"/></div>
					</div>
					<div :class="$style.noteHeaderInfo">
						<a :href="url" :class="$style.noteHeaderInstanceIconLink" target="_blank" rel="noopener noreferrer">
							<img :src="serverMetadata.iconUrl || '/favicon.ico'" alt="" :class="$style.noteHeaderInstanceIcon"/>
						</a>
					</div>
				</div>
				<EmInstanceTicker v-if="appearNote.user.instance != null" :instance="appearNote.user.instance"/>
			</div>
		</header>
		<div :class="[$style.noteContent, { [$style.contentCollapsed]: collapsed }]">
			<p v-if="appearNote.cw != null" :class="$style.cw">
				<EmMfm v-if="appearNote.cw != ''" style="margin-right: 8px;" :text="appearNote.cw" :author="appearNote.user" :nyaize="'respect'"/>
				<button style="display: block; width: 100%; margin: 4px 0;" class="_buttonGray _buttonRounded" @click="showContent = !showContent">{{ showContent ? i18n.ts._cw.hide : i18n.ts._cw.show }}</button>
			</p>
			<div v-show="appearNote.cw == null || showContent">
				<span v-if="appearNote.isHidden" style="opacity: 0.5">({{ i18n.ts.private }})</span>
				<EmA v-if="appearNote.replyId" :class="$style.noteReplyTarget" :to="`/notes/${appearNote.replyId}`"><i class="ti ti-arrow-back-up"></i></EmA>
				<EmMfm
					v-if="appearNote.text"
					:parsedNodes="parsed"
					:text="appearNote.text"
					:author="appearNote.user"
					:nyaize="'respect'"
					:emojiUrls="appearNote.emojis"
				/>
				<a v-if="appearNote.renote != null" :class="$style.rn">RN:</a>
				<div v-if="appearNote.files && appearNote.files.length > 0">
					<EmMediaList :mediaList="appearNote.files" :originalEntityUrl="`${url}/notes/${appearNote.id}`"/>
				</div>
				<EmPoll v-if="appearNote.poll" ref="pollViewer" :noteId="appearNote.id" :poll="appearNote.poll" :readOnly="true" :class="$style.poll"/>
				<div v-if="appearNote.renote" :class="$style.quote"><EmNoteSimple :note="appearNote.renote" :class="$style.quoteNote"/></div>
				<button v-if="isLong && collapsed" :class="$style.collapsed" class="_button" @click="collapsed = false">
					<span :class="$style.collapsedLabel">{{ i18n.ts.showMore }}</span>
				</button>
				<button v-else-if="isLong && !collapsed" :class="$style.showLess" class="_button" @click="collapsed = true">
					<span :class="$style.showLessLabel">{{ i18n.ts.showLess }}</span>
				</button>
			</div>
			<EmA v-if="appearNote.channel && !inChannel" :class="$style.channel" :to="`/channels/${appearNote.channel.id}`"><i class="ti ti-device-tv"></i> {{ appearNote.channel.name }}</EmA>
		</div>
		<footer>
			<div :class="$style.noteFooterInfo">
				<span v-if="appearNote.visibility !== 'public'" style="display: inline-block; margin-right: 0.5em;" :title="i18n.ts._visibility[appearNote.visibility]">
					<i v-if="appearNote.visibility === 'home'" class="ti ti-home"></i>
					<i v-else-if="appearNote.visibility === 'followers'" class="ti ti-lock"></i>
					<i v-else-if="appearNote.visibility === 'specified'" ref="specified" class="ti ti-mail"></i>
				</span>
				<span v-if="appearNote.localOnly" style="display: inline-block; margin-right: 0.5em;" :title="i18n.ts._visibility['disableFederation']"><i class="ti ti-rocket-off"></i></span>
				<EmA :to="notePage(appearNote)">
					<EmTime :time="appearNote.createdAt" mode="detail" colored/>
				</EmA>
			</div>
			<EmReactionsViewer v-if="appearNote.reactionAcceptance !== 'likeOnly'" ref="reactionsViewer" :maxNumber="16" :note="appearNote">
				<template #more>
					<EmA :to="`/notes/${appearNote.id}`" :class="[$style.reactionOmitted]">{{ i18n.ts.more }}</EmA>
				</template>
			</EmReactionsViewer>
			<a :href="`/notes/${appearNote.id}`" target="_blank" rel="noopener" :class="[$style.noteFooterButton, $style.footerButtonLink]" class="_button">
				<i class="ti ti-arrow-back-up"></i>
			</a>
			<a :href="`/notes/${appearNote.id}`" target="_blank" rel="noopener" :class="[$style.noteFooterButton, $style.footerButtonLink]" class="_button">
				<i class="ti ti-repeat"></i>
				<p v-if="appearNote.renoteCount > 0" :class="$style.noteFooterButtonCount">{{ (appearNote.renoteCount) }}</p>
			</a>
			<a :href="`/notes/${appearNote.id}`" target="_blank" rel="noopener" :class="[$style.noteFooterButton, $style.footerButtonLink]" class="_button">
				<i v-if="appearNote.reactionAcceptance === 'likeOnly'" class="ti ti-heart"></i>
				<i v-else class="ti ti-plus"></i>
				<p v-if="(appearNote.reactionAcceptance === 'likeOnly') && appearNote.reactionCount > 0" :class="$style.noteFooterButtonCount">{{ (appearNote.reactionCount) }}</p>
			</a>
			<a :href="`/notes/${appearNote.id}`" target="_blank" rel="noopener" :class="[$style.noteFooterButton, $style.footerButtonLink]" class="_button">
				<i class="ti ti-dots"></i>
			</a>
		</footer>
	</article>
</div>
</template>

<script lang="ts" setup>
import { computed, inject, ref } from 'vue';
import * as mfm from 'mfm-js';
import * as Misskey from 'misskey-js';
import I18n from '@/components/I18n.vue';
import EmMediaList from '@/components/EmMediaList.vue';
import EmNoteSub from '@/components/EmNoteSub.vue';
import EmNoteSimple from '@/components/EmNoteSimple.vue';
import EmInstanceTicker from '@/components/EmInstanceTicker.vue';
import EmReactionsViewer from '@/components/EmReactionsViewer.vue';
import EmPoll from '@/components/EmPoll.vue';
import EmA from '@/components/EmA.vue';
import EmAvatar from '@/components/EmAvatar.vue';
import EmTime from '@/components/EmTime.vue';
import EmUserName from '@/components/EmUserName.vue';
import EmAcct from '@/components/EmAcct.vue';
import { userPage } from '@/utils.js';
import { notePage } from '@/utils.js';
import { i18n } from '@/i18n.js';
import { DI } from '@/di.js';
import { shouldCollapse } from '@@/js/collapsed.js';
import { url } from '@@/js/config.js';
import EmMfm from '@/components/EmMfm.js';

const props = defineProps<{
	note: Misskey.entities.Note;
}>();

const serverMetadata = inject(DI.serverMetadata)!;

const inChannel = inject('inChannel', null);

const note = ref(props.note);

const isRenote = (
	note.value.renote != null &&
	note.value.reply == null &&
	note.value.text == null &&
	note.value.cw == null &&
	note.value.fileIds && note.value.fileIds.length === 0 &&
	note.value.poll == null
);

const appearNote = computed(() => isRenote ? note.value.renote as Misskey.entities.Note : note.value);
const showContent = ref(false);
const isDeleted = ref(false);
const parsed = appearNote.value.text ? mfm.parse(appearNote.value.text) : null;
const isLong = shouldCollapse(appearNote.value, 13.5, parsed.value);
const collapsed = ref(appearNote.value.cw == null && isLong);
</script>

<style lang="scss" module>
.root {
	position: relative;
	transition: box-shadow 0.1s ease;
	overflow: clip;
	contain: content;
}

.replyTo {
	opacity: 0.7;
	padding-bottom: 0;
}

.renote {
	display: flex;
	align-items: center;
	padding: 16px 32px 8px 32px;
	line-height: 28px;
	white-space: pre;
	color: var(--MI_THEME-renote);
}

.renoteAvatar {
	flex-shrink: 0;
	display: inline-block;
	width: 28px;
	height: 28px;
	margin: 0 8px 0 0;
	border-radius: 6px;
}

.renoteText {
	overflow: hidden;
	flex-shrink: 1;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.renoteName {
	font-weight: bold;
}

.renoteInfo {
	margin-left: auto;
	font-size: 0.9em;
}

.renoteTime {
	flex-shrink: 0;
	color: inherit;
}

.renote + .note {
	padding-top: 8px;
}

.note {
	padding: 24px 32px 16px;
	font-size: 1.2em;

	&:hover > .main > .footer > .button {
		opacity: 1;
	}
}

.noteHeader {
	display: flex;
	position: relative;
	margin-bottom: 16px;
	align-items: center;
}

.noteHeaderAvatar {
	display: block;
	flex-shrink: 0;
	width: 50px;
	height: 50px;
}

.noteHeaderBody {
	flex: 1;
	display: flex;
	min-width: 0;
	flex-direction: column;
	justify-content: center;
	padding-left: 16px;
	font-size: 0.95em;
}

.noteHeaderBodyUpper {
	display: flex;
	min-width: 0;
}

.noteHeaderName {
	font-weight: bold;
	line-height: 1.3;
}

.isBot {
	display: inline-block;
	margin: 0 0.5em;
	padding: 4px 6px;
	font-size: 80%;
	line-height: 1;
	border: solid 0.5px var(--MI_THEME-divider);
	border-radius: 4px;
}

.noteHeaderInfo {
	margin-left: auto;
	display: flex;
	gap: 0.5em;
	align-items: center;
}

.noteHeaderInstanceIconLink {
	display: inline-block;
	margin-left: 4px;
}

.noteHeaderInstanceIcon {
	width: 32px;
	height: 32px;
	border-radius: 4px;
}

.noteHeaderUsername {
	margin-bottom: 2px;
	line-height: 1.3;
	word-wrap: anywhere;
}

.noteContent {
	container-type: inline-size;
	overflow-wrap: break-word;
}

.cw {
	cursor: default;
	display: block;
	margin: 0;
	padding: 0;
	overflow-wrap: break-word;
}

.noteReplyTarget {
	color: var(--MI_THEME-accent);
	margin-right: 0.5em;
}

.rn {
	margin-left: 4px;
	font-style: oblique;
	color: var(--MI_THEME-renote);
}

.reactionOmitted {
	display: inline-block;
	margin-left: 8px;
	opacity: .8;
	font-size: 95%;
}

.poll {
	font-size: 80%;
}

.quote {
	padding: 8px 0;
}

.quoteNote {
	padding: 16px;
	border: dashed 1px var(--MI_THEME-renote);
	border-radius: 8px;
	overflow: clip;
}

.channel {
	opacity: 0.7;
	font-size: 80%;
}

.showLess {
	width: 100%;
	margin-top: 14px;
	position: sticky;
	bottom: calc(var(--stickyBottom, 0px) + 14px);
}

.showLessLabel {
	display: inline-block;
	background: var(--MI_THEME-popup);
	padding: 6px 10px;
	font-size: 0.8em;
	border-radius: 999px;
	box-shadow: 0 2px 6px rgb(0 0 0 / 20%);
}

.contentCollapsed {
	position: relative;
	max-height: 9em;
	overflow: clip;
}

.collapsed {
	display: block;
	position: absolute;
	bottom: 0;
	left: 0;
	z-index: 2;
	width: 100%;
	height: 64px;
	background: linear-gradient(0deg, var(--MI_THEME-panel), var(--MI_THEME-X15));

	&:hover > .collapsedLabel {
		background: var(--MI_THEME-panelHighlight);
	}
}

.collapsedLabel {
	display: inline-block;
	background: var(--MI_THEME-panel);
	padding: 6px 10px;
	font-size: 0.8em;
	border-radius: 999px;
	box-shadow: 0 2px 6px rgb(0 0 0 / 20%);
}

.noteFooterInfo {
	margin: 16px 0;
	opacity: 0.7;
	font-size: 0.9em;
}

.noteFooterButton {
	margin: 0;
	padding: 8px;
	opacity: 0.7;

	&:not(:last-child) {
		margin-right: 28px;
	}

	&:hover {
		color: var(--MI_THEME-fgHighlighted);
	}
}

.footerButtonLink:hover,
.footerButtonLink:focus,
.footerButtonLink:active {
	text-decoration: none;
}

.noteFooterButtonCount {
	display: inline;
	margin: 0 0 0 8px;
	opacity: 0.7;

	&.reacted {
		color: var(--MI_THEME-accent);
	}
}

@container (max-width: 500px) {
	.root {
		font-size: 0.9em;
	}
}

@container (max-width: 450px) {
	.renote {
		padding: 8px 16px 0 16px;
	}

	.note {
		padding: 16px;
	}

	.noteHeaderAvatar {
		width: 50px;
		height: 50px;
	}
}

@container (max-width: 350px) {
	.noteFooterButton {
		&:not(:last-child) {
			margin-right: 18px;
		}
	}
}

@container (max-width: 300px) {
	.root {
		font-size: 0.825em;
	}

	.noteHeaderAvatar {
		width: 50px;
		height: 50px;
	}

	.noteFooterButton {
		&:not(:last-child) {
			margin-right: 12px;
		}
	}
}
</style>
