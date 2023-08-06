<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<div style="overflow: clip;">
		<MkSpacer :contentMax="600" :marginMin="20">
			<div class="_gaps_m znqjceqz">
				<div v-panel class="about">
					<div ref="containerEl" class="container" :class="{ playing: easterEggEngine != null }">
						<img src="/client-assets/about-icon.png" alt="" class="icon" draggable="false" @load="iconLoaded" @click="gravity"/>
						<div class="misskey">Misskey</div>
						<div class="version">v{{ version }}</div>
						<span v-for="emoji in easterEggEmojis" :key="emoji.id" class="emoji" :data-physics-x="emoji.left" :data-physics-y="emoji.top" :class="{ _physics_circle_: !emoji.emoji.startsWith(':') }">
							<MkCustomEmoji v-if="emoji.emoji[0] === ':'" class="emoji" :name="emoji.emoji" :normal="true" :noStyle="true"/>
							<MkEmoji v-else class="emoji" :emoji="emoji.emoji" :normal="true" :noStyle="true"/>
						</span>
					</div>
					<button v-if="thereIsTreasure" class="_button treasure" @click="getTreasure"><img src="/fluent-emoji/1f3c6.png" class="treasureImg"></button>
				</div>
				<div style="text-align: center;">
					{{ i18n.ts._aboutMisskey.about }}<br><a href="https://misskey-hub.net/docs/misskey.html" target="_blank" class="_link">{{ i18n.ts.learnMore }}</a>
				</div>
				<div v-if="$i != null" style="text-align: center;">
					<MkButton primary rounded inline @click="iLoveMisskey">I <Mfm text="$[jelly ❤]"/> #Misskey</MkButton>
				</div>
				<FormSection>
					<div class="_formLinks">
						<FormLink to="https://github.com/misskey-dev/misskey" external>
							<template #icon><i class="ti ti-code"></i></template>
							{{ i18n.ts._aboutMisskey.source }}
							<template #suffix>GitHub</template>
						</FormLink>
						<FormLink to="https://crowdin.com/project/misskey" external>
							<template #icon><i class="ti ti-language-hiragana"></i></template>
							{{ i18n.ts._aboutMisskey.translation }}
							<template #suffix>Crowdin</template>
						</FormLink>
						<FormLink to="https://www.patreon.com/syuilo" external>
							<template #icon><i class="ti ti-pig-money"></i></template>
							{{ i18n.ts._aboutMisskey.donate }}
							<template #suffix>Patreon</template>
						</FormLink>
					</div>
				</FormSection>
				<FormSection>
					<template #label>{{ i18n.ts._aboutMisskey.contributors }}</template>
					<div :class="$style.contributors">
						<a href="https://github.com/syuilo" target="_blank" :class="$style.contributor">
							<img src="https://avatars.githubusercontent.com/u/4439005?v=4" :class="$style.contributorAvatar">
							<span :class="$style.contributorUsername">@syuilo</span>
						</a>
						<a href="https://github.com/tamaina" target="_blank" :class="$style.contributor">
							<img src="https://avatars.githubusercontent.com/u/7973572?v=4" :class="$style.contributorAvatar">
							<span :class="$style.contributorUsername">@tamaina</span>
						</a>
						<a href="https://github.com/acid-chicken" target="_blank" :class="$style.contributor">
							<img src="https://avatars.githubusercontent.com/u/20679825?v=4" :class="$style.contributorAvatar">
							<span :class="$style.contributorUsername">@acid-chicken</span>
						</a>
						<a href="https://github.com/rinsuki" target="_blank" :class="$style.contributor">
							<img src="https://avatars.githubusercontent.com/u/6533808?v=4" :class="$style.contributorAvatar">
							<span :class="$style.contributorUsername">@rinsuki</span>
						</a>
						<a href="https://github.com/mei23" target="_blank" :class="$style.contributor">
							<img src="https://avatars.githubusercontent.com/u/30769358?v=4" :class="$style.contributorAvatar">
							<span :class="$style.contributorUsername">@mei23</span>
						</a>
						<a href="https://github.com/robflop" target="_blank" :class="$style.contributor">
							<img src="https://avatars.githubusercontent.com/u/8159402?v=4" :class="$style.contributorAvatar">
							<span :class="$style.contributorUsername">@robflop</span>
						</a>
					</div>
					<template #caption><MkLink url="https://github.com/misskey-dev/misskey/graphs/contributors">{{ i18n.ts._aboutMisskey.allContributors }}</MkLink></template>
				</FormSection>
				<FormSection>
					<template #label><Mfm text="$[jelly ❤]"/> {{ i18n.ts._aboutMisskey.patrons }}</template>
					<div :class="$style.patronsWithIcon">
						<div v-for="patron in patronsWithIcon" :class="$style.patronWithIcon">
							<img :src="patron.icon" :class="$style.patronIcon">
							<span :class="$style.patronName">{{ patron.name }}</span>
						</div>
					</div>
					<div style="margin-top: 16px; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); grid-gap: 12px;">
						<div v-for="patron in patrons" :key="patron">{{ patron }}</div>
					</div>
					<p>{{ i18n.ts._aboutMisskey.morePatrons }}</p>
				</FormSection>
				<FormSection>
					<template #label>Special thanks</template>
					<div class="_gaps" style="text-align: center;">
						<div>
							<a style="display: inline-block;" class="masknetwork" title="Mask Network" href="https://mask.io/" target="_blank"><img width="180" src="https://misskey-hub.net/sponsors/masknetwork.png" alt="Mask Network"></a>
						</div>
						<div>
							<a style="display: inline-block;" class="skeb" title="Skeb" href="https://skeb.jp/" target="_blank"><img width="180" src="https://misskey-hub.net/sponsors/skeb.svg" alt="Skeb"></a>
						</div>
						<div>
							<a style="display: inline-block;" class="dcadvirth" title="DC Advirth" href="https://www.dotchain.ltd/advirth" target="_blank"><img width="100" src="https://misskey-hub.net/sponsors/dcadvirth.png" alt="DC Advirth"></a>
						</div>
					</div>
				</FormSection>
			</div>
		</MkSpacer>
	</div>
</MkStickyContainer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { nextTick, onBeforeUnmount } from 'vue';
import { version } from '@/config';
import FormLink from '@/components/form/link.vue';
import FormSection from '@/components/form/section.vue';
import MkButton from '@/components/MkButton.vue';
import MkLink from '@/components/MkLink.vue';
import { physics } from '@/scripts/physics';
import { i18n } from '@/i18n';
import { defaultStore } from '@/store';
import * as os from '@/os';
import { definePageMetadata } from '@/scripts/page-metadata';
import { claimAchievement, claimedAchievements } from '@/scripts/achievements';
import { $i } from '@/account';

const patronsWithIcon = [{
	name: 'カイヤン',
	icon: 'https://misskey-hub.net/patrons/a2820716883e408cb87773e377ce7c8d.jpg',
}, {
	name: 'だれかさん',
	icon: 'https://misskey-hub.net/patrons/f7409b5e5a88477a9b9d740c408de125.jpg',
}, {
	name: 'narazaka',
	icon: 'https://misskey-hub.net/patrons/e3affff31ffb4877b1196c7360abc3e5.jpg',
}, {
	name: 'ひとぅ',
	icon: 'https://misskey-hub.net/patrons/8cc0d0a0a6d84c88bca1aedabf6ed5ab.jpg',
}, {
	name: 'ぱーこ',
	icon: 'https://misskey-hub.net/patrons/79c6602ffade489e8df2fcf2c2bc5d9d.jpg',
}, {
	name: 'わっほー☆',
	icon: 'https://misskey-hub.net/patrons/d31d5d13924443a082f3da7966318a0a.jpg',
}, {
	name: 'mollinaca',
	icon: 'https://misskey-hub.net/patrons/ceb36b8f66e549bdadb3b90d5da62314.jpg',
}, {
	name: '坂本龍',
	icon: 'https://misskey-hub.net/patrons/a631cf8b490145cf8dbbe4e7508cfbc2.jpg',
}, {
	name: 'takke',
	icon: 'https://misskey-hub.net/patrons/6c3327e626c046f2914fbcd9f7557935.jpg',
}, {
	name: 'ぺんぎん',
	icon: 'https://misskey-hub.net/patrons/6a652e0534ff4cb1836e7ce4968d76a7.jpg',
}, {
	name: 'かみらえっと',
	icon: 'https://misskey-hub.net/patrons/be1326bda7d940a482f3758ffd9ffaf6.jpg',
}, {
	name: 'へてて',
	icon: 'https://misskey-hub.net/patrons/0431eacd7c6843d09de8ea9984307e86.jpg',
}, {
	name: 'spinlock',
	icon: 'https://misskey-hub.net/patrons/6a1cebc819d540a78bf20e9e3115baa8.jpg',
}, {
	name: 'じゅくま',
	icon: 'https://misskey-hub.net/patrons/3e56bdac69dd42f7a06e0f12cf2fc895.jpg',
}, {
	name: '清遊あみ',
	icon: 'https://misskey-hub.net/patrons/de25195b88e940a388388bea2e7637d8.jpg',
}, {
	name: 'Nagi8410',
	icon: 'https://misskey-hub.net/patrons/31b102ab4fc540ed806b0461575d38be.jpg',
}, {
	name: '山岡士郎',
	icon: 'https://misskey-hub.net/patrons/84b9056341684266bb1eda3e680d094d.jpg',
}, {
	name: 'よもやまたろう',
	icon: 'https://misskey-hub.net/patrons/4273c9cce50d445f8f7d0f16113d6d7f.jpg',
}, {
	name: '花咲ももか',
	icon: 'https://misskey-hub.net/patrons/8c9b2b9128cb4fee99f04bb4f86f2efa.jpg',
}, {
	name: 'カガミ',
	icon: 'https://misskey-hub.net/patrons/226ea3a4617749548580ec2d9a263e24.jpg',
}, {
	name: 'フランギ・シュウ',
	icon: 'https://misskey-hub.net/patrons/3016d37e35f3430b90420176c912d304.jpg',
}];

const patrons = [
	'まっちゃとーにゅ',
	'mametsuko',
	'noellabo',
	'AureoleArk',
	'Gargron',
	'Nokotaro Takeda',
	'Suji Yan',
	'oi_yekssim',
	'regtan',
	'Hekovic',
	'nenohi',
	'Gitmo Life Services',
	'naga_rus',
	'Efertone',
	'Melilot',
	'motcha',
	'nanami kan',
	'sevvie Rose',
	'Hayato Ishikawa',
	'Puniko',
	'skehmatics',
	'Quinton Macejkovic',
	'YUKIMOCHI',
	'dansup',
	'mewl hayabusa',
	'Emilis',
	'Fristi',
	'makokunsan',
	'chidori ninokura',
	'Peter G.',
	'見当かなみ',
	'natalie',
	'Maronu',
	'Steffen K9',
	'takimura',
	'sikyosyounin',
	'Nesakko',
	'YuzuRyo61',
	'blackskye',
	'sheeta.s',
	'osapon',
	'public_yusuke',
	'CG',
	'吴浥',
	't_w',
	'Jerry',
	'nafuchoco',
	'Takumi Sugita',
	'GLaTAN',
	'mkatze',
	'kabo2468y',
	'mydarkstar',
	'Roujo',
	'DignifiedSilence',
	'uroco @99',
	'totokoro',
	'うし',
	'kiritan',
	'weepjp',
	'Liaizon Wakest',
	'Duponin',
	'Blue',
	'Naoki Hirayama',
	'wara',
	'Wataru Manji (manji0)',
	'みなしま',
	'kanoy',
	'xianon',
	'Denshi',
	'Osushimaru',
	'にょんへら',
	'おのだい',
	'Leni',
	'oss',
	'Weeble',
	'蝉暮せせせ',
	'ThatOneCalculator',
	'pixeldesu',
	'あめ玉',
	'氷月氷華里',
	'Ebise Lutica',
	'巣黒るい@リスケモ男の娘VTuber!',
	'ふぇいぽむ',
	'依古田イコ',
	'戸塚こだま',
	'すー。',
	'秋雨/Slime-hatena.jp',
	'けそ',
	'ずも',
	'binvinyl',
	'渡志郎',
	'ぷーざ',
	'越貝鯛丸',
	'Nick / pprmint.',
	'kino3277',
];

let thereIsTreasure = $ref($i && !claimedAchievements.includes('foundTreasure'));

let easterEggReady = false;
let easterEggEmojis = $ref([]);
let easterEggEngine = $ref(null);
const containerEl = $shallowRef<HTMLElement>();

function iconLoaded() {
	const emojis = defaultStore.state.reactions;
	const containerWidth = containerEl.offsetWidth;
	for (let i = 0; i < 32; i++) {
		easterEggEmojis.push({
			id: i.toString(),
			top: -(128 + (Math.random() * 256)),
			left: (Math.random() * containerWidth),
			emoji: emojis[Math.floor(Math.random() * emojis.length)],
		});
	}

	nextTick(() => {
		easterEggReady = true;
	});
}

function gravity() {
	if (!easterEggReady) return;
	easterEggReady = false;
	easterEggEngine = physics(containerEl);
}

function iLoveMisskey() {
	os.post({
		initialText: 'I $[jelly ❤] #Misskey',
		instant: true,
	});
}

function getTreasure() {
	thereIsTreasure = false;
	claimAchievement('foundTreasure');
}

onBeforeUnmount(() => {
	if (easterEggEngine) {
		easterEggEngine.stop();
	}
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.aboutMisskey,
	icon: null,
});
</script>

<style lang="scss" scoped>
.znqjceqz {
	> .about {
		position: relative;
		border-radius: var(--radius);

		> .treasure {
			position: absolute;
			top: 60px;
			left: 0;
			right: 0;
			margin: 0 auto;
			width: min-content;

			> .treasureImg {
				width: 25px;
				vertical-align: bottom;
			}
		}

		> .container {
			position: relative;
			text-align: center;
			padding: 16px;

			&.playing {
				&, * {
					user-select: none;
				}

				* {
					will-change: transform;
				}

				> .emoji {
					visibility: visible;
				}
			}

			> .icon {
				display: block;
				width: 80px;
				margin: 0 auto;
				border-radius: 16px;
				position: relative;
				z-index: 1;
			}

			> .misskey {
				margin: 0.75em auto 0 auto;
				width: max-content;
				position: relative;
				z-index: 1;
			}

			> .version {
				margin: 0 auto;
				width: max-content;
				opacity: 0.5;
				position: relative;
				z-index: 1;
			}

			> .emoji {
				position: absolute;
				z-index: 1;
				top: 0;
				left: 0;
				visibility: hidden;

				> .emoji {
					pointer-events: none;
					font-size: 24px;
					width: 24px;
				}
			}
		}
	}
}
</style>

<style lang="scss" module>
.contributors {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	grid-gap: 12px;
}

.contributor {
	display: flex;
	align-items: center;
	padding: 12px;
	background: var(--buttonBg);
	border-radius: 6px;

	&:hover {
		text-decoration: none;
		background: var(--buttonHoverBg);
	}

	&.active {
		color: var(--accent);
		background: var(--buttonHoverBg);
	}
}

.contributorAvatar {
	width: 30px;
	border-radius: 100%;
}

.contributorUsername {
	margin-left: 12px;
}

.patronsWithIcon {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	grid-gap: 12px;
}

.patronWithIcon {
	display: flex;
	align-items: center;
	padding: 12px;
	background: var(--buttonBg);
	border-radius: 6px;
}

.patronIcon {
	width: 24px;
	border-radius: 100%;
}

.patronName {
	margin-left: 12px;
}
</style>
