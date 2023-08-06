<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkSpacer :contentMax="narrow ? 800 : 1100">
	<div ref="rootEl" class="ftskorzw" :class="{ wide: !narrow }" style="container-type: inline-size;">
		<div class="main _gaps">
			<!-- TODO -->
			<!-- <div class="punished" v-if="user.isSuspended"><i class="ti ti-alert-triangle" style="margin-right: 8px;"></i> {{ i18n.ts.userSuspended }}</div> -->
			<!-- <div class="punished" v-if="user.isSilenced"><i class="ti ti-alert-triangle" style="margin-right: 8px;"></i> {{ i18n.ts.userSilenced }}</div> -->

			<div class="profile _gaps">
				<MkAccountMoved v-if="user.movedTo" :movedTo="user.movedTo"/>
				<MkRemoteCaution v-if="user.host != null" :href="user.url ?? user.uri!" class="warn"/>

				<div :key="user.id" class="main _panel">
					<div class="banner-container" :style="style">
						<div ref="bannerEl" class="banner" :style="style"></div>
						<div class="fade"></div>
						<div class="title">
							<MkUserName class="name" :user="user" :nowrap="true"/>
							<div class="bottom">
								<span class="username"><MkAcct :user="user" :detail="true"/></span>
								<span v-if="user.isAdmin" :title="i18n.ts.isAdmin" style="color: var(--badge);"><i class="ti ti-shield"></i></span>
								<span v-if="user.isLocked" :title="i18n.ts.isLocked"><i class="ti ti-lock"></i></span>
								<span v-if="user.isBot" :title="i18n.ts.isBot"><i class="ti ti-robot"></i></span>
								<button v-if="!isEditingMemo && !memoDraft" class="_button add-note-button" @click="showMemoTextarea">
									<i class="ti ti-edit"/> {{ i18n.ts.addMemo }}
								</button>
							</div>
						</div>
						<span v-if="$i && $i.id != user.id && user.isFollowed" class="followed">{{ i18n.ts.followsYou }}</span>
						<div v-if="$i" class="actions">
							<button class="menu _button" @click="menu"><i class="ti ti-dots"></i></button>
							<MkFollowButton v-if="$i.id != user.id" :user="user" :inline="true" :transparent="false" :full="true" class="koudoku"/>
						</div>
					</div>
					<MkAvatar class="avatar" :user="user" indicator/>
					<div class="title">
						<MkUserName :user="user" :nowrap="false" class="name"/>
						<div class="bottom">
							<span class="username"><MkAcct :user="user" :detail="true"/></span>
							<span v-if="user.isAdmin" :title="i18n.ts.isAdmin" style="color: var(--badge);"><i class="ti ti-shield"></i></span>
							<span v-if="user.isLocked" :title="i18n.ts.isLocked"><i class="ti ti-lock"></i></span>
							<span v-if="user.isBot" :title="i18n.ts.isBot"><i class="ti ti-robot"></i></span>
						</div>
					</div>
					<div v-if="user.roles.length > 0" class="roles">
						<span v-for="role in user.roles" :key="role.id" v-tooltip="role.description" class="role" :style="{ '--color': role.color }">
							<MkA v-adaptive-bg :to="`/roles/${role.id}`">
								<img v-if="role.iconUrl" style="height: 1.3em; vertical-align: -22%;" :src="role.iconUrl"/>
								{{ role.name }}
							</MkA>
						</span>
					</div>
					<div v-if="iAmModerator" class="moderationNote">
						<MkTextarea v-if="editModerationNote || (moderationNote != null && moderationNote !== '')" v-model="moderationNote" manualSave>
							<template #label>Moderation note</template>
						</MkTextarea>
						<div v-else>
							<MkButton small @click="editModerationNote = true">Add moderation note</MkButton>
						</div>
					</div>
					<div v-if="isEditingMemo || memoDraft" class="memo" :class="{'no-memo': !memoDraft}">
						<div class="heading" v-text="i18n.ts.memo"/>
						<textarea
							ref="memoTextareaEl"
							v-model="memoDraft"
							rows="1"
							@focus="isEditingMemo = true"
							@blur="updateMemo"
							@input="adjustMemoTextarea"
						/>
					</div>
					<div class="description">
						<MkOmit>
							<Mfm v-if="user.description" :text="user.description" :isNote="false" :author="user" :i="$i"/>
							<p v-else class="empty">{{ i18n.ts.noAccountDescription }}</p>
						</MkOmit>
					</div>
					<div class="fields system">
						<dl v-if="user.location" class="field">
							<dt class="name"><i class="ti ti-map-pin ti-fw"></i> {{ i18n.ts.location }}</dt>
							<dd class="value">{{ user.location }}</dd>
						</dl>
						<dl v-if="user.birthday" class="field">
							<dt class="name"><i class="ti ti-cake ti-fw"></i> {{ i18n.ts.birthday }}</dt>
							<dd class="value">{{ user.birthday.replace('-', '/').replace('-', '/') }} ({{ i18n.t('yearsOld', { age }) }})</dd>
						</dl>
						<dl class="field">
							<dt class="name"><i class="ti ti-calendar ti-fw"></i> {{ i18n.ts.registeredDate }}</dt>
							<dd class="value">{{ dateString(user.createdAt) }} (<MkTime :time="user.createdAt"/>)</dd>
						</dl>
					</div>
					<div v-if="user.fields.length > 0" class="fields">
						<dl v-for="(field, i) in user.fields" :key="i" class="field">
							<dt class="name">
								<Mfm :text="field.name" :plain="true" :colored="false"/>
							</dt>
							<dd class="value">
								<Mfm :text="field.value" :author="user" :i="$i" :colored="false"/>
							</dd>
						</dl>
					</div>
					<div class="status">
						<MkA :to="userPage(user)">
							<b>{{ number(user.notesCount) }}</b>
							<span>{{ i18n.ts.notes }}</span>
						</MkA>
						<MkA v-if="isFfVisibleForMe(user)" :to="userPage(user, 'following')">
							<b>{{ number(user.followingCount) }}</b>
							<span>{{ i18n.ts.following }}</span>
						</MkA>
						<MkA v-if="isFfVisibleForMe(user)" :to="userPage(user, 'followers')">
							<b>{{ number(user.followersCount) }}</b>
							<span>{{ i18n.ts.followers }}</span>
						</MkA>
					</div>
				</div>
			</div>

			<div class="contents _gaps">
				<div v-if="user.pinnedNotes.length > 0" class="_gaps">
					<MkNote v-for="note in user.pinnedNotes" :key="note.id" class="note _panel" :note="note" :pinned="true"/>
				</div>
				<MkInfo v-else-if="$i && $i.id === user.id">{{ i18n.ts.userPagePinTip }}</MkInfo>
				<template v-if="narrow">
					<XPhotos :key="user.id" :user="user"/>
					<XActivity :key="user.id" :user="user"/>
				</template>
				<MkNotes v-if="!disableNotes" :class="$style.tl" :noGap="true" :pagination="pagination"/>
			</div>
		</div>
		<div v-if="!narrow" class="sub _gaps" style="container-type: inline-size;">
			<XPhotos :key="user.id" :user="user"/>
			<XActivity :key="user.id" :user="user"/>
		</div>
	</div>
</MkSpacer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { defineAsyncComponent, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import calcAge from 's-age';
import * as misskey from 'misskey-js';
import MkNote from '@/components/MkNote.vue';
import MkFollowButton from '@/components/MkFollowButton.vue';
import MkAccountMoved from '@/components/MkAccountMoved.vue';
import MkRemoteCaution from '@/components/MkRemoteCaution.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkOmit from '@/components/MkOmit.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkButton from '@/components/MkButton.vue';
import { getScrollPosition } from '@/scripts/scroll';
import { getUserMenu } from '@/scripts/get-user-menu';
import number from '@/filters/number';
import { userPage } from '@/filters/user';
import * as os from '@/os';
import { useRouter } from '@/router';
import { i18n } from '@/i18n';
import { $i, iAmModerator } from '@/account';
import { dateString } from '@/filters/date';
import { confetti } from '@/scripts/confetti';
import MkNotes from '@/components/MkNotes.vue';
import { api } from '@/os';
import { isFfVisibleForMe } from '@/scripts/isFfVisibleForMe';

const XPhotos = defineAsyncComponent(() => import('./index.photos.vue'));
const XActivity = defineAsyncComponent(() => import('./index.activity.vue'));

const props = withDefaults(defineProps<{
	user: misskey.entities.UserDetailed;
	/** Test only; MkNotes currently causes problems in vitest */
	disableNotes: boolean;
}>(), {
	disableNotes: false,
});

const router = useRouter();

let parallaxAnimationId = $ref<null | number>(null);
let narrow = $ref<null | boolean>(null);
let rootEl = $ref<null | HTMLElement>(null);
let bannerEl = $ref<null | HTMLElement>(null);
let memoTextareaEl = $ref<null | HTMLElement>(null);
let memoDraft = $ref(props.user.memo);
let isEditingMemo = $ref(false);
let moderationNote = $ref(props.user.moderationNote);
let editModerationNote = $ref(false);

watch($$(moderationNote), async () => {
	await os.api('admin/update-user-note', { userId: props.user.id, text: moderationNote });
});

const pagination = {
	endpoint: 'users/notes' as const,
	limit: 10,
	params: computed(() => ({
		userId: props.user.id,
	})),
};

const style = $computed(() => {
	if (props.user.bannerUrl == null) return {};
	return {
		backgroundImage: `url(${ props.user.bannerUrl })`,
	};
});

const age = $computed(() => {
	return calcAge(props.user.birthday);
});

function menu(ev) {
	const { menu, cleanup } = getUserMenu(props.user, router);
	os.popupMenu(menu, ev.currentTarget ?? ev.target).finally(cleanup);
}

function parallaxLoop() {
	parallaxAnimationId = window.requestAnimationFrame(parallaxLoop);
	parallax();
}

function parallax() {
	const banner = bannerEl as any;
	if (banner == null) return;

	const top = getScrollPosition(rootEl);

	if (top < 0) return;

	const z = 1.75; // 奥行き(小さいほど奥)
	const pos = -(top / z);
	banner.style.backgroundPosition = `center calc(50% - ${pos}px)`;
}

function showMemoTextarea() {
	isEditingMemo = true;
	nextTick(() => {
		memoTextareaEl?.focus();
	});
}

function adjustMemoTextarea() {
	if (!memoTextareaEl) return;
	memoTextareaEl.style.height = '0px';
	memoTextareaEl.style.height = `${memoTextareaEl.scrollHeight}px`;
}

async function updateMemo() {
	await api('users/update-memo', {
		memo: memoDraft,
		userId: props.user.id,
	});
	isEditingMemo = false;
}

watch([props.user], () => {
	memoDraft = props.user.memo;
});

onMounted(() => {
	window.requestAnimationFrame(parallaxLoop);
	narrow = rootEl!.clientWidth < 1000;

	if (props.user.birthday) {
		const m = new Date().getMonth() + 1;
		const d = new Date().getDate();
		const bm = parseInt(props.user.birthday.split('-')[1]);
		const bd = parseInt(props.user.birthday.split('-')[2]);
		if (m === bm && d === bd) {
			confetti({
				duration: 1000 * 4,
			});
		}
	}
	nextTick(() => {
		adjustMemoTextarea();
	});
});

onUnmounted(() => {
	if (parallaxAnimationId) {
		window.cancelAnimationFrame(parallaxAnimationId);
	}
});
</script>

<style lang="scss" scoped>
.ftskorzw {

	> .main {

		> .punished {
			font-size: 0.8em;
			padding: 16px;
		}

		> .profile {

			> .main {
				position: relative;
				overflow: clip;

				> .banner-container {
					position: relative;
					height: 250px;
					overflow: clip;
					background-size: cover;
					background-position: center;

					> .banner {
						height: 100%;
						background-color: #4c5e6d;
						background-size: cover;
						background-position: center;
						box-shadow: 0 0 128px rgba(0, 0, 0, 0.5) inset;
						will-change: background-position;
					}

					> .fade {
						position: absolute;
						bottom: 0;
						left: 0;
						width: 100%;
						height: 78px;
						background: linear-gradient(transparent, rgba(#000, 0.7));
					}

					> .followed {
						position: absolute;
						top: 12px;
						left: 12px;
						padding: 4px 8px;
						color: #fff;
						background: rgba(0, 0, 0, 0.7);
						font-size: 0.7em;
						border-radius: 6px;
					}

					> .actions {
						position: absolute;
						top: 12px;
						right: 12px;
						-webkit-backdrop-filter: var(--blur, blur(8px));
						backdrop-filter: var(--blur, blur(8px));
						background: rgba(0, 0, 0, 0.2);
						padding: 8px;
						border-radius: 24px;

						> .menu {
							vertical-align: bottom;
							height: 31px;
							width: 31px;
							color: #fff;
							text-shadow: 0 0 8px #000;
							font-size: 16px;
						}

						> .koudoku {
							margin-left: 4px;
							vertical-align: bottom;
						}
					}

					> .title {
						position: absolute;
						bottom: 0;
						left: 0;
						width: 100%;
						padding: 0 0 8px 154px;
						box-sizing: border-box;
						color: #fff;

						> .name {
							display: block;
							margin: 0;
							line-height: 32px;
							font-weight: bold;
							font-size: 1.8em;
							text-shadow: 0 0 8px #000;
						}

						> .bottom {
							> * {
								display: inline-block;
								margin-right: 16px;
								line-height: 20px;
								opacity: 0.8;

								&.username {
									font-weight: bold;
								}
							}

							> .add-note-button {
								background: rgba(0, 0, 0, 0.2);
								color: #fff;
								-webkit-backdrop-filter: var(--blur, blur(8px));
								backdrop-filter: var(--blur, blur(8px));
								border-radius: 24px;
								padding: 4px 8px;
								font-size: 80%;
							}
						}
					}
				}

				> .title {
					display: none;
					text-align: center;
					padding: 50px 8px 16px 8px;
					font-weight: bold;
					border-bottom: solid 0.5px var(--divider);

					> .bottom {
						> * {
							display: inline-block;
							margin-right: 8px;
							opacity: 0.8;
						}
					}
				}

				> .avatar {
					display: block;
					position: absolute;
					top: 170px;
					left: 16px;
					z-index: 2;
					width: 120px;
					height: 120px;
					box-shadow: 1px 1px 3px rgba(#000, 0.2);
				}

				> .roles {
					padding: 24px 24px 0 154px;
					font-size: 0.95em;
					display: flex;
					flex-wrap: wrap;
					gap: 8px;

					> .role {
						border: solid 1px var(--color, var(--divider));
						border-radius: 999px;
						margin-right: 4px;
						padding: 3px 8px;
					}
				}

				> .moderationNote {
					margin: 12px 24px 0 154px;
				}

				> .memo {
					margin: 12px 24px 0 154px;
					background: transparent;
					color: var(--fg);
					border: 1px solid var(--divider);
					border-radius: 8px;
					padding: 8px;
					line-height: 0;

					> .heading {
						text-align: left;
						color: var(--fgTransparent);
						line-height: 1.5;
						font-size: 85%;
					}

					textarea {
						margin: 0;
						padding: 0;
						resize: none;
						border: none;
						outline: none;
						width: 100%;
						height: auto;
						min-height: 0;
						line-height: 1.5;
						color: var(--fg);
						overflow: hidden;
						background: transparent;
						font-family: inherit;
					}
				}

				> .description {
					padding: 24px 24px 24px 154px;
					font-size: 0.95em;

					> .empty {
						margin: 0;
						opacity: 0.5;
					}
				}

				> .fields {
					padding: 24px;
					font-size: 0.9em;
					border-top: solid 0.5px var(--divider);

					> .field {
						display: flex;
						padding: 0;
						margin: 0;
						align-items: center;

						&:not(:last-child) {
							margin-bottom: 8px;
						}

						> .name {
							width: 30%;
							overflow: hidden;
							white-space: nowrap;
							text-overflow: ellipsis;
							font-weight: bold;
							text-align: center;
						}

						> .value {
							width: 70%;
							overflow: hidden;
							white-space: nowrap;
							text-overflow: ellipsis;
							margin: 0;
						}
					}

					&.system > .field > .name {
					}
				}

				> .status {
					display: flex;
					padding: 24px;
					border-top: solid 0.5px var(--divider);

					> a {
						flex: 1;
						text-align: center;

						&.active {
							color: var(--accent);
						}

						&:hover {
							text-decoration: none;
						}

						> b {
							display: block;
							line-height: 16px;
						}

						> span {
							font-size: 70%;
						}
					}
				}
			}
		}

		> .contents {
			> .content {
				margin-bottom: var(--margin);
			}
		}
	}

	&.wide {
		display: flex;
		width: 100%;

		> .main {
			width: 100%;
			min-width: 0;
		}

		> .sub {
			max-width: 350px;
			min-width: 350px;
			margin-left: var(--margin);
		}
	}
}

@container (max-width: 500px) {
	.ftskorzw {
		> .main {
			> .profile > .main {
				> .banner-container {
					height: 140px;

					> .fade {
						display: none;
					}

					> .title {
						display: none;
					}
				}

				> .title {
					display: block;
				}

				> .avatar {
					top: 90px;
					left: 0;
					right: 0;
					width: 92px;
					height: 92px;
					margin: auto;
				}

				> .roles {
					padding: 16px 16px 0 16px;
					justify-content: center;
				}

				> .moderationNote {
					margin: 16px 16px 0 16px;
				}

				> .memo {
					margin: 16px 16px 0 16px;
				}

				> .description {
					padding: 16px;
					text-align: center;
				}

				> .fields {
					padding: 16px;
				}

				> .status {
					padding: 16px;
				}
			}

			> .contents {
				> .nav {
					font-size: 80%;
				}
			}
		}
	}
}
</style>

<style lang="scss" module>
.tl {
	background: var(--bg);
    border-radius: var(--radius);
    overflow: clip;
}
</style>
