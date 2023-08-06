<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<Transition :name="defaultStore.state.animation ? '_transition_zoom' : ''" mode="out-in">
		<MkLoading v-if="fetching"/>
		<div v-else :class="$style.root">
			<div class="item _panel users">
				<div class="icon"><i class="ti ti-users"></i></div>
				<div class="body">
					<div class="value">
						<MkNumber :value="stats.originalUsersCount" style="margin-right: 0.5em;"/>
						<MkNumberDiff v-tooltip="i18n.ts.dayOverDayChanges" class="diff" :value="usersComparedToThePrevDay"></MkNumberDiff>
					</div>
					<div class="label">Users</div>
				</div>
			</div>
			<div class="item _panel notes">
				<div class="icon"><i class="ti ti-pencil"></i></div>
				<div class="body">
					<div class="value">
						<MkNumber :value="stats.originalNotesCount" style="margin-right: 0.5em;"/>
						<MkNumberDiff v-tooltip="i18n.ts.dayOverDayChanges" class="diff" :value="notesComparedToThePrevDay"></MkNumberDiff>
					</div>
					<div class="label">Notes</div>
				</div>
			</div>
			<div class="item _panel instances">
				<div class="icon"><i class="ti ti-planet"></i></div>
				<div class="body">
					<div class="value">
						<MkNumber :value="stats.instances" style="margin-right: 0.5em;"/>
					</div>
					<div class="label">Instances</div>
				</div>
			</div>
			<div class="item _panel emojis">
				<div class="icon"><i class="ti ti-icons"></i></div>
				<div class="body">
					<div class="value">
						<MkNumber :value="customEmojis.length" style="margin-right: 0.5em;"/>
					</div>
					<div class="label">Custom emojis</div>
				</div>
			</div>
			<div class="item _panel online">
				<div class="icon"><i class="ti ti-access-point"></i></div>
				<div class="body">
					<div class="value">
						<MkNumber :value="onlineUsersCount" style="margin-right: 0.5em;"/>
					</div>
					<div class="label">Online</div>
				</div>
			</div>
		</div>
	</Transition>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { onMounted } from 'vue';
import * as os from '@/os';
import MkNumberDiff from '@/components/MkNumberDiff.vue';
import MkNumber from '@/components/MkNumber.vue';
import { i18n } from '@/i18n';
import { customEmojis } from '@/custom-emojis';
import { defaultStore } from '@/store';

let stats: any = $ref(null);
let usersComparedToThePrevDay = $ref<number>();
let notesComparedToThePrevDay = $ref<number>();
let onlineUsersCount = $ref(0);
let fetching = $ref(true);

onMounted(async () => {
	const [_stats, _onlineUsersCount] = await Promise.all([
		os.api('stats', {}),
		os.apiGet('get-online-users-count').then(res => res.count),
	]);
	stats = _stats;
	onlineUsersCount = _onlineUsersCount;

	os.apiGet('charts/users', { limit: 2, span: 'day' }).then(chart => {
		usersComparedToThePrevDay = stats.originalUsersCount - chart.local.total[1];
	});

	os.apiGet('charts/notes', { limit: 2, span: 'day' }).then(chart => {
		notesComparedToThePrevDay = stats.originalNotesCount - chart.local.total[1];
	});

	fetching = false;
});
</script>

<style lang="scss" module>
.root {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
	grid-gap: 12px;

	&:global {
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
				background: var(--accentedBg);
				color: var(--accent);
				border-radius: 10px;
			}

			&.users {
				> .icon {
					background: #0088d726;
					color: #3d96c1;
				}
			}

			&.notes {
				> .icon {
					background: #86b30026;
					color: #86b300;
				}
			}

			&.instances {
				> .icon {
					background: #e96b0026;
					color: #d76d00;
				}
			}

			&.emojis {
				> .icon {
					background: #d5ba0026;
						color: #dfc300;
				}
			}

			&.online {
				> .icon {
					background: #8a00d126;
					color: #c01ac3;
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
</style>
