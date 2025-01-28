<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkLoading v-if="fetching"/>
	<div v-show="!fetching" :class="$style.root">
		<div v-if="topSubInstancesForPie && topPubInstancesForPie" class="pies">
			<div class="pie deliver _panel">
				<div class="title">Sub</div>
				<XPie :data="topSubInstancesForPie" class="chart"/>
				<div class="subTitle">Top 10</div>
			</div>
			<div class="pie inbox _panel">
				<div class="title">Pub</div>
				<XPie :data="topPubInstancesForPie" class="chart"/>
				<div class="subTitle">Top 10</div>
			</div>
		</div>
		<div v-if="!fetching" class="items">
			<div class="item _panel sub">
				<div class="icon"><i class="ti ti-world-download"></i></div>
				<div class="body">
					<div class="value">
						{{ number(federationSubActive) }}
						<MkNumberDiff v-tooltip="i18n.ts.dayOverDayChanges" class="diff" :value="federationSubActiveDiff"></MkNumberDiff>
					</div>
					<div class="label">Sub</div>
				</div>
			</div>
			<div class="item _panel pub">
				<div class="icon"><i class="ti ti-world-upload"></i></div>
				<div class="body">
					<div class="value">
						{{ number(federationPubActive) }}
						<MkNumberDiff v-tooltip="i18n.ts.dayOverDayChanges" class="diff" :value="federationPubActiveDiff"></MkNumberDiff>
					</div>
					<div class="label">Pub</div>
				</div>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import XPie from './overview.pie.vue';
import type { InstanceForPie } from './overview.pie.vue';
import * as os from '@/os.js';
import { misskeyApiGet } from '@/scripts/misskey-api.js';
import number from '@/filters/number.js';
import MkNumberDiff from '@/components/MkNumberDiff.vue';
import { i18n } from '@/i18n.js';
import { useChartTooltip } from '@/scripts/use-chart-tooltip.js';

const topSubInstancesForPie = ref<InstanceForPie[] | null>(null);
const topPubInstancesForPie = ref<InstanceForPie[] | null>(null);
const federationPubActive = ref<number | null>(null);
const federationPubActiveDiff = ref<number | null>(null);
const federationSubActive = ref<number | null>(null);
const federationSubActiveDiff = ref<number | null>(null);
const fetching = ref(true);

const { handler: externalTooltipHandler } = useChartTooltip();

onMounted(async () => {
	const chart = await misskeyApiGet('charts/federation', { limit: 2, span: 'day' });
	federationPubActive.value = chart.pubActive[0];
	federationPubActiveDiff.value = chart.pubActive[0] - chart.pubActive[1];
	federationSubActive.value = chart.subActive[0];
	federationSubActiveDiff.value = chart.subActive[0] - chart.subActive[1];

	misskeyApiGet('federation/stats', { limit: 10 }).then(res => {
		topSubInstancesForPie.value = [
			...res.topSubInstances.map(x => ({
				name: x.host,
				color: x.themeColor,
				value: x.followersCount,
				onClick: () => {
					os.pageWindow(`/instance-info/${x.host}`);
				},
			})),
			{ name: '(other)', color: '#80808080', value: res.otherFollowersCount },
		];
		topPubInstancesForPie.value = [
			...res.topPubInstances.map(x => ({
				name: x.host,
				color: x.themeColor,
				value: x.followingCount,
				onClick: () => {
					os.pageWindow(`/instance-info/${x.host}`);
				},
			})),
			{ name: '(other)', color: '#80808080', value: res.otherFollowingCount },
		];
	});

	fetching.value = false;
});
</script>

<style lang="scss" module>
.root {

	&:global {
		> .pies {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
			grid-gap: 12px;
			margin-bottom: 12px;

			> .pie {
				position: relative;
				padding: 12px;

				> .title {
					position: absolute;
					top: 20px;
					left: 20px;
					font-size: 90%;
				}

				> .chart {
					max-height: 150px;
				}

				> .subTitle {
					position: absolute;
					bottom: 20px;
					right: 20px;
					font-size: 85%;
				}
			}
		}

		> .items {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
			grid-gap: 12px;

			> .item {
				display: flex;
				box-sizing: border-box;
				padding: 12px;

				> .icon {
					display: grid;
					place-items: center;
					height: 100%;
					aspect-ratio: 1;
					margin-right: 12px;
					background: var(--MI_THEME-accentedBg);
					color: var(--MI_THEME-accent);
					border-radius: 10px;
				}

				&.sub {
					> .icon {
						background: #d5ba0026;
						color: #dfc300;
					}
				}

				&.pub {
					> .icon {
						background: #00cf2326;
						color: #00cd5b;
					}
				}

				> .body {
					padding: 2px 0;

					> .value {
						font-size: 1.2em;
						font-weight: bold;

						> .diff {
							font-size: 0.65em;
							font-weight: normal;
						}
					}

					> .label {
						font-size: 0.8em;
						opacity: 0.5;
					}
				}
			}
		}
	}
}
</style>

