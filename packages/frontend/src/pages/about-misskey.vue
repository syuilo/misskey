<!--
SPDX-FileCopyrightText: syuilo and misskey-project
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
							<MkCustomEmoji v-if="emoji.emoji[0] === ':'" class="emoji" :name="emoji.emoji" :normal="true" :noStyle="true" :fallbackToImage="true"/>
							<MkEmoji v-else class="emoji" :emoji="emoji.emoji" :normal="true" :noStyle="true"/>
						</span>
					</div>
					<button v-if="thereIsTreasure" class="_button treasure" @click="getTreasure"><img src="/fluent-emoji/1f3c6.png" class="treasureImg"></button>
				</div>
				<div style="text-align: center;">
					{{ i18n.ts._aboutMisskey.about }}<br><a href="https://misskey-hub.net/docs/about-misskey/" target="_blank" class="_link">{{ i18n.ts.learnMore }}</a>
				</div>
				<div v-if="$i != null" style="text-align: center;">
					<MkButton primary rounded inline @click="iLoveMisskey">I <Mfm text="$[jelly ❤]"/> #Misskey</MkButton>
				</div>
				<FormSection>
					<div class="_gaps_s">
						<FormLink to="https://github.com/misskey-dev/misskey" external>
							<template #icon><i class="ti ti-code"></i></template>
							{{ i18n.ts._aboutMisskey.source }} ({{ i18n.ts._aboutMisskey.original }})
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
				<FormSection v-if="instance.repositoryUrl !== 'https://github.com/misskey-dev/misskey'">
					<div class="_gaps_s">
						<MkInfo>
							{{ i18n.tsx._aboutMisskey.thisIsModifiedVersion({ name: instance.name }) }}
						</MkInfo>
						<FormLink v-if="instance.repositoryUrl" :to="instance.repositoryUrl" external>
							<template #icon><i class="ti ti-code"></i></template>
							{{ i18n.ts._aboutMisskey.source }}
						</FormLink>
						<FormLink v-if="instance.providesTarball" :to="`/tarball/misskey-${version}.tar.gz`" external>
							<template #icon><i class="ti ti-download"></i></template>
							{{ i18n.ts._aboutMisskey.source }}
							<template #suffix>Tarball</template>
						</FormLink>
						<MkInfo v-if="!instance.repositoryUrl && !instance.providesTarball" warn>
							{{ i18n.ts.sourceCodeIsNotYetProvided }}
						</MkInfo>
					</div>
				</FormSection>
				<FormSection>
					<template #label>{{ i18n.ts._aboutMisskey.projectMembers }}</template>
					<div :class="$style.contributors">
						<a href="https://github.com/syuilo" target="_blank" :class="$style.contributor">
							<img src="https://avatars.githubusercontent.com/u/4439005?v=4" :class="$style.contributorAvatar">
							<span :class="$style.contributorUsername">@syuilo</span>
						</a>
						<a href="https://github.com/acid-chicken" target="_blank" :class="$style.contributor">
							<img src="https://avatars.githubusercontent.com/u/20679825?v=4" :class="$style.contributorAvatar">
							<span :class="$style.contributorUsername">@acid-chicken</span>
						</a>
						<a href="https://github.com/kakkokari-gtyih" target="_blank" :class="$style.contributor">
							<img src="https://avatars.githubusercontent.com/u/67428053?v=4" :class="$style.contributorAvatar">
							<span :class="$style.contributorUsername">@kakkokari-gtyih</span>
						</a>
						<a href="https://github.com/tai-cha" target="_blank" :class="$style.contributor">
							<img src="https://avatars.githubusercontent.com/u/40626578?v=4" :class="$style.contributorAvatar">
							<span :class="$style.contributorUsername">@tai-cha</span>
						</a>
						<a href="https://github.com/samunohito" target="_blank" :class="$style.contributor">
							<img src="https://avatars.githubusercontent.com/u/46447427?v=4" :class="$style.contributorAvatar">
							<span :class="$style.contributorUsername">@samunohito</span>
						</a>
						<a href="https://github.com/anatawa12" target="_blank" :class="$style.contributor">
							<img src="https://avatars.githubusercontent.com/u/22656849?v=4" :class="$style.contributorAvatar">
							<span :class="$style.contributorUsername">@anatawa12</span>
						</a>
					</div>
				</FormSection>
				<FormSection>
					<template #label>Special thanks</template>
					<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(130px, 1fr));grid-gap:24px;align-items:center;">
						<div>
							<a style="display: inline-block;" class="masknetwork" title="Mask Network" href="https://mask.io/" target="_blank"><img style="width: 100%;" src="https://assets.misskey-hub.net/sponsors/masknetwork.png" alt="Mask Network"></a>
						</div>
						<div>
							<a style="display: inline-block;" class="xserver" title="XServer" href="https://www.xserver.ne.jp/" target="_blank"><img style="width: 100%;" src="https://assets.misskey-hub.net/sponsors/xserver.png" alt="XServer"></a>
						</div>
						<div>
							<a style="display: inline-block;" class="skeb" title="Skeb" href="https://skeb.jp/" target="_blank"><img style="width: 100%;" src="https://assets.misskey-hub.net/sponsors/skeb.svg" alt="Skeb"></a>
						</div>
						<div>
							<a style="display: inline-block;" class="pepabo" title="GMO Pepabo" href="https://pepabo.com/" target="_blank"><img style="width: 100%;" src="https://assets.misskey-hub.net/sponsors/gmo_pepabo.svg" alt="GMO Pepabo"></a>
						</div>
					</div>
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
			</div>
		</MkSpacer>
	</div>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { nextTick, onBeforeUnmount, ref, shallowRef, computed } from 'vue';
import { version } from '@@/js/config.js';
import FormLink from '@/components/form/link.vue';
import FormSection from '@/components/form/section.vue';
import MkButton from '@/components/MkButton.vue';
import MkInfo from '@/components/MkInfo.vue';
import { physics } from '@/scripts/physics.js';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import { defaultStore } from '@/store.js';
import * as os from '@/os.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { claimAchievement, claimedAchievements } from '@/scripts/achievements.js';
import { $i } from '@/account.js';

const patronsWithIcon = [{
	name: 'カイヤン',
	icon: 'https://assets.misskey-hub.net/patrons/a2820716883e408cb87773e377ce7c8d.jpg',
}, {
	name: 'だれかさん',
	icon: 'https://assets.misskey-hub.net/patrons/f7409b5e5a88477a9b9d740c408de125.jpg',
}, {
	name: 'narazaka',
	icon: 'https://assets.misskey-hub.net/patrons/e3affff31ffb4877b1196c7360abc3e5.jpg',
}, {
	name: 'ひとぅ',
	icon: 'https://assets.misskey-hub.net/patrons/8cc0d0a0a6d84c88bca1aedabf6ed5ab.jpg',
}, {
	name: 'ぱーこ',
	icon: 'https://assets.misskey-hub.net/patrons/79c6602ffade489e8df2fcf2c2bc5d9d.jpg',
}, {
	name: 'わっほー☆',
	icon: 'https://assets.misskey-hub.net/patrons/d31d5d13924443a082f3da7966318a0a.jpg',
}, {
	name: 'mollinaca',
	icon: 'https://assets.misskey-hub.net/patrons/ceb36b8f66e549bdadb3b90d5da62314.jpg',
}, {
	name: '坂本龍',
	icon: 'https://assets.misskey-hub.net/patrons/a631cf8b490145cf8dbbe4e7508cfbc2.jpg',
}, {
	name: 'takke',
	icon: 'https://assets.misskey-hub.net/patrons/6c3327e626c046f2914fbcd9f7557935.jpg',
}, {
	name: 'ぺんぎん',
	icon: 'https://assets.misskey-hub.net/patrons/6a652e0534ff4cb1836e7ce4968d76a7.jpg',
}, {
	name: 'かみらえっと',
	icon: 'https://assets.misskey-hub.net/patrons/be1326bda7d940a482f3758ffd9ffaf6.jpg',
}, {
	name: 'へてて',
	icon: 'https://assets.misskey-hub.net/patrons/0431eacd7c6843d09de8ea9984307e86.jpg',
}, {
	name: 'spinlock',
	icon: 'https://assets.misskey-hub.net/patrons/6a1cebc819d540a78bf20e9e3115baa8.jpg',
}, {
	name: 'じゅくま',
	icon: 'https://assets.misskey-hub.net/patrons/3e56bdac69dd42f7a06e0f12cf2fc895.jpg',
}, {
	name: '清遊あみ',
	icon: 'https://assets.misskey-hub.net/patrons/de25195b88e940a388388bea2e7637d8.jpg',
}, {
	name: 'Nagi8410',
	icon: 'https://assets.misskey-hub.net/patrons/31b102ab4fc540ed806b0461575d38be.jpg',
}, {
	name: '山岡士郎',
	icon: 'https://assets.misskey-hub.net/patrons/84b9056341684266bb1eda3e680d094d.jpg',
}, {
	name: 'よもやまたろう',
	icon: 'https://assets.misskey-hub.net/patrons/4273c9cce50d445f8f7d0f16113d6d7f.jpg',
}, {
	name: '花咲ももか',
	icon: 'https://assets.misskey-hub.net/patrons/8c9b2b9128cb4fee99f04bb4f86f2efa.jpg',
}, {
	name: 'カガミ',
	icon: 'https://assets.misskey-hub.net/patrons/226ea3a4617749548580ec2d9a263e24.jpg',
}, {
	name: 'フランギ・シュウ',
	icon: 'https://assets.misskey-hub.net/patrons/3016d37e35f3430b90420176c912d304.jpg',
}, {
	name: '百日紅',
	icon: 'https://assets.misskey-hub.net/patrons/302dce2898dd457ba03c3f7dc037900b.jpg',
}, {
	name: 'taichan',
	icon: 'https://assets.misskey-hub.net/patrons/f981ab0159fb4e2c998e05f7263e1cd9.jpg',
}, {
	name: '猫吉よりお',
	icon: 'https://assets.misskey-hub.net/patrons/a11518b3b34b4536a4bdd7178ba76a7b.jpg',
}, {
	name: '有栖かずみ',
	icon: 'https://assets.misskey-hub.net/patrons/9240e8e0ba294a8884143e99ac7ed6a0.jpg',
}, {
	name: 'イカロ(コアラ)',
	icon: 'https://assets.misskey-hub.net/patrons/50b9bdc03735412c80807dbdf32cecb6.jpg',
}, {
	name: 'ハチノス３号',
	icon: 'https://assets.misskey-hub.net/patrons/030347a6f8ce4e82bc5184b5aad09a18.jpg',
}, {
	name: 'Takeno',
	icon: 'https://assets.misskey-hub.net/patrons/6fba81536aea48fe94a30909c502dfa1.jpg',
}, {
	name: 'くびすじ',
	icon: 'https://assets.misskey-hub.net/patrons/aa5789850b2149aeb5b89ebe2e9083db.jpg',
}, {
	name: '古道京紗＠ぷらいべったー',
	icon: 'https://assets.misskey-hub.net/patrons/18346d0519704963a4beabe6abc170af.jpg',
}, {
	name: '越貝鯛丸',
	icon: 'https://assets.misskey-hub.net/patrons/86c7374de37849b882d8ebbc833dc968.jpg',
}, {
	name: '☔あめ🍬(灬˘╰╯˘灬)',
	icon: 'https://assets.misskey-hub.net/patrons/676eea72d4884d3f89aababbb62533fb.jpg',
}, {
	name: '貯水よび',
	icon: 'https://assets.misskey-hub.net/patrons/2974506d53244bbe94a67707b27099e2.jpg',
}, {
	name: 'はるかさ',
	icon: 'https://assets.misskey-hub.net/patrons/26ce2432739a400aa3aa0de0ef67a107.jpg',
}, {
	name: '天鈴のあ',
	icon: 'https://assets.misskey-hub.net/patrons/995cdbb00bd6421184461a883adfe1d9.jpg',
}, {
	name: 'えとゔぁす',
	icon: 'https://assets.misskey-hub.net/patrons/2578f441b82a44cfaa55ba83a318b26e.jpg',
}, {
	name: 'Soli',
	icon: 'https://assets.misskey-hub.net/patrons/448070c81ebd41eda4ea2328291b2efe.jpg',
}, {
	name: 'ささくれりょう',
	icon: 'https://assets.misskey-hub.net/patrons/cf55022cee6c41da8e70a43587aaad9a.jpg',
}, {
	name: 'Macop',
	icon: 'https://assets.misskey-hub.net/patrons/ee052bf550014d36a643ce3dce595640.jpg',
}, {
	name: 'なっかあ',
	icon: 'https://assets.misskey-hub.net/patrons/c2f5f3e394e74a64912284a2f4ca710e.jpg',
}, {
	name: '如月ユカ',
	icon: 'https://assets.misskey-hub.net/patrons/f24a042076a041b6811a2f124eb620ca.jpg',
}, {
	name: 'Yatoigawa',
	icon: 'https://assets.misskey-hub.net/patrons/505e3568885a4a488431a8f22b4553d0.jpg',
}, {
	name: '秋瀬カヲル',
	icon: 'https://assets.misskey-hub.net/patrons/0f22aeb866484f4fa51db6721e3f9847.jpg',
}, {
	name: '新井　治',
	icon: 'https://assets.misskey-hub.net/patrons/d160876f20394674a17963a0e609600a.jpg',
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
	'美少女JKぐーちゃん',
	'てば',
	'たっくん',
	'SHO SEKIGUCHI',
	'塩キャベツ',
	'はとぽぷさん',
	'100の人 (エスパー・イーシア)',
	'ケモナーのケシン',
	'こまつぶり',
	'まゆつな空高',
	'asata',
	'ruru',
];

const thereIsTreasure = ref($i && !claimedAchievements.includes('foundTreasure'));

let easterEggReady = false;
const easterEggEmojis = ref<{
	id: string,
	top: number,
	left: number,
	emoji: string
}[]>([]);
const easterEggEngine = ref<{ stop: () => void } | null>(null);
const containerEl = shallowRef<HTMLElement>();

function iconLoaded() {
	const emojis = defaultStore.state.reactions;
	const containerWidth = containerEl.value.offsetWidth;
	for (let i = 0; i < 32; i++) {
		easterEggEmojis.value.push({
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
	easterEggEngine.value = physics(containerEl.value);
}

function iLoveMisskey() {
	os.post({
		initialText: 'I $[jelly ❤] #Misskey',
		instant: true,
	});
}

function getTreasure() {
	thereIsTreasure.value = false;
	claimAchievement('foundTreasure');
}

onBeforeUnmount(() => {
	if (easterEggEngine.value) {
		easterEggEngine.value.stop();
	}
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.aboutMisskey,
	icon: null,
}));
</script>

<style lang="scss" scoped>
.znqjceqz {
	> .about {
		position: relative;
		border-radius: var(--MI-radius);

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
	background: var(--MI_THEME-buttonBg);
	border-radius: 6px;

	&:hover {
		text-decoration: none;
		background: var(--MI_THEME-buttonHoverBg);
	}

	&.active {
		color: var(--MI_THEME-accent);
		background: var(--MI_THEME-buttonHoverBg);
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
	background: var(--MI_THEME-buttonBg);
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
