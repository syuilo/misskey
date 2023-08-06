<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<div v-if="achievements" :class="$style.root">
		<div v-for="achievement in achievements" :key="achievement" :class="$style.achievement" class="_panel">
			<div :class="$style.icon">
				<div
					:class="[$style.iconFrame, {
						[$style.iconFrame_bronze]: ACHIEVEMENT_BADGES[achievement.name].frame === 'bronze',
						[$style.iconFrame_silver]: ACHIEVEMENT_BADGES[achievement.name].frame === 'silver',
						[$style.iconFrame_gold]: ACHIEVEMENT_BADGES[achievement.name].frame === 'gold',
						[$style.iconFrame_platinum]: ACHIEVEMENT_BADGES[achievement.name].frame === 'platinum',
					}]"
				>
					<div :class="[$style.iconInner]" :style="{ background: ACHIEVEMENT_BADGES[achievement.name].bg }">
						<img :class="$style.iconImg" :src="ACHIEVEMENT_BADGES[achievement.name].img">
					</div>
				</div>
			</div>
			<div :class="$style.body">
				<div :class="$style.header">
					<span :class="$style.title">{{ i18n.ts._achievements._types['_' + achievement.name].title }}</span>
					<span :class="$style.time">
						<time v-tooltip="new Date(achievement.unlockedAt).toLocaleString()">{{ new Date(achievement.unlockedAt).getFullYear() }}/{{ new Date(achievement.unlockedAt).getMonth() + 1 }}/{{ new Date(achievement.unlockedAt).getDate() }}</time>
					</span>
				</div>
				<div :class="$style.description">{{ withDescription ? i18n.ts._achievements._types['_' + achievement.name].description : '???' }}</div>
				<div v-if="i18n.ts._achievements._types['_' + achievement.name].flavor && withDescription" :class="$style.flavor">{{ i18n.ts._achievements._types['_' + achievement.name].flavor }}</div>
			</div>
		</div>
		<template v-if="withLocked">
			<div v-for="achievement in lockedAchievements" :key="achievement" :class="[$style.achievement, $style.locked]" class="_panel" @click="achievement === 'clickedClickHere' ? clickHere() : () => {}">
				<div :class="$style.icon">
				</div>
				<div :class="$style.body">
					<div :class="$style.header">
						<span :class="$style.title">???</span>
					</div>
					<div :class="$style.description">???</div>
				</div>
			</div>
		</template>
	</div>
	<div v-else>
		<MkLoading/>
	</div>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import * as misskey from 'misskey-js';
import { onMounted } from 'vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { ACHIEVEMENT_TYPES, ACHIEVEMENT_BADGES, claimAchievement } from '@/scripts/achievements';

const props = withDefaults(defineProps<{
	user: misskey.entities.User;
	withLocked: boolean;
	withDescription: boolean;
}>(), {
	withLocked: true,
	withDescription: true,
});

let achievements = $ref();
const lockedAchievements = $computed(() => ACHIEVEMENT_TYPES.filter(x => !(achievements ?? []).some(a => a.name === x)));

function fetch() {
	os.api('users/achievements', { userId: props.user.id }).then(res => {
		achievements = [];
		for (const t of ACHIEVEMENT_TYPES) {
			const a = res.find(x => x.name === t);
			if (a) achievements.push(a);
		}
		//achievements = res.sort((a, b) => b.unlockedAt - a.unlockedAt);
	});
}

function clickHere() {
	claimAchievement('clickedClickHere');
	fetch();
}

onMounted(() => {
	fetch();
});
</script>

<style lang="scss" module>
.root {
	display: grid;
	grid-template-columns: repeat(auto-fill, min(380px, 100%));
	grid-gap: 12px;
	place-content: center;
}

.achievement {
	display: flex;
	padding: 16px;

	&.locked {
		opacity: 0.5;
	}
}

.icon {
	flex-shrink: 0;
	margin-right: 12px;
}

@keyframes shine {
	0% { translate: -30px; }
	100% { translate: -130px; }
}

.iconFrame {
	position: relative;
	width: 58px;
	height: 58px;
	padding: 6px;
	border-radius: 100%;
	box-sizing: border-box;
	pointer-events: none;
	user-select: none;
	filter: drop-shadow(0px 2px 2px #00000044);
	box-shadow: 0 1px 0px #ffffff88 inset;
	overflow: clip;
}
.iconFrame_bronze {
	background: linear-gradient(0deg, #703827, #d37566);

	> .iconInner {
		background: linear-gradient(0deg, #d37566, #703827);
	}
}
.iconFrame_silver {
	background: linear-gradient(0deg, #7c7c7c, #e1e1e1);

	> .iconInner {
		background: linear-gradient(0deg, #e1e1e1, #7c7c7c);
	}
}
.iconFrame_gold {
	background: linear-gradient(0deg, rgba(255,182,85,1) 0%, rgba(233,133,0,1) 49%, rgba(255,243,93,1) 51%, rgba(255,187,25,1) 100%);

	> .iconInner {
		background: linear-gradient(0deg, #ffee20, #eb7018);
	}

	&:before {
		content: "";
		display: block;
		position: absolute;
    top: 30px;
    width: 200px;
    height: 8px;
    rotate: -45deg;
    translate: -30px;
		background: #ffffff88;
		animation: shine 2s infinite;
	}
}
.iconFrame_platinum {
	background: linear-gradient(0deg, rgba(154,154,154,1) 0%, rgba(226,226,226,1) 49%, rgba(255,255,255,1) 51%, rgba(195,195,195,1) 100%);

	> .iconInner {
		background: linear-gradient(0deg, #e1e1e1, #7c7c7c);
	}

	&:before {
		content: "";
		display: block;
		position: absolute;
    top: 30px;
    width: 200px;
    height: 8px;
    rotate: -45deg;
    translate: -30px;
		background: #ffffffee;
		animation: shine 2s infinite;
	}
}

.iconInner {
	position: relative;
	width: 100%;
	height: 100%;
	border-radius: 100%;
	box-shadow: 0 1px 0px #ffffff88 inset;
}

.iconImg {
	width: calc(100% - 12px);
	height: calc(100% - 12px);
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	margin: auto;
	filter: drop-shadow(0px 1px 2px #000000aa);
}

.body {
	flex: 1;
	min-width: 0;
}

.header {
	margin-bottom: 8px;
	display: flex;
}

.title {
	font-weight: bold;
}

.time {
	margin-left: auto;
	font-size: 85%;
	opacity: 0.7;
}

.description {
	font-size: 85%;
}

.flavor {
	opacity: 0.7;
	transform: skewX(-15deg);
	font-size: 85%;
	margin-top: 8px;
}
</style>
