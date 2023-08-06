<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<button
	class="_button"
	:class="[$style.root, { [$style.wait]: wait, [$style.active]: isFollowing || hasPendingFollowRequestFromYou, [$style.full]: full, [$style.large]: large }]"
	:disabled="wait"
	@click="onClick"
>
	<template v-if="!wait">
		<template v-if="hasPendingFollowRequestFromYou && user.isLocked">
			<span v-if="full" :class="$style.text">{{ i18n.ts.followRequestPending }}</span><i class="ti ti-hourglass-empty"></i>
		</template>
		<template v-else-if="hasPendingFollowRequestFromYou && !user.isLocked">
			<!-- つまりリモートフォローの場合。 -->
			<span v-if="full" :class="$style.text">{{ i18n.ts.processing }}</span><MkLoading :em="true" :colored="false"/>
		</template>
		<template v-else-if="isFollowing">
			<span v-if="full" :class="$style.text">{{ i18n.ts.unfollow }}</span><i class="ti ti-minus"></i>
		</template>
		<template v-else-if="!isFollowing && user.isLocked">
			<span v-if="full" :class="$style.text">{{ i18n.ts.followRequest }}</span><i class="ti ti-plus"></i>
		</template>
		<template v-else-if="!isFollowing && !user.isLocked">
			<span v-if="full" :class="$style.text">{{ i18n.ts.follow }}</span><i class="ti ti-plus"></i>
		</template>
	</template>
	<template v-else>
		<span v-if="full" :class="$style.text">{{ i18n.ts.processing }}</span><MkLoading :em="true" :colored="false"/>
	</template>
</button>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { onBeforeUnmount, onMounted } from 'vue';
import * as Misskey from 'misskey-js';
import * as os from '@/os';
import { useStream } from '@/stream';
import { i18n } from '@/i18n';
import { claimAchievement } from '@/scripts/achievements';
import { $i } from '@/account';

const props = withDefaults(defineProps<{
	user: Misskey.entities.UserDetailed,
	full?: boolean,
	large?: boolean,
}>(), {
	full: false,
	large: false,
});

let isFollowing = $ref(props.user.isFollowing);
let hasPendingFollowRequestFromYou = $ref(props.user.hasPendingFollowRequestFromYou);
let wait = $ref(false);
const connection = useStream().useChannel('main');

if (props.user.isFollowing == null) {
	os.api('users/show', {
		userId: props.user.id,
	})
		.then(onFollowChange);
}

function onFollowChange(user: Misskey.entities.UserDetailed) {
	if (user.id === props.user.id) {
		isFollowing = user.isFollowing;
		hasPendingFollowRequestFromYou = user.hasPendingFollowRequestFromYou;
	}
}

async function onClick() {
	wait = true;

	try {
		if (isFollowing) {
			const { canceled } = await os.confirm({
				type: 'warning',
				text: i18n.t('unfollowConfirm', { name: props.user.name || props.user.username }),
			});

			if (canceled) return;

			await os.api('following/delete', {
				userId: props.user.id,
			});
		} else {
			if (hasPendingFollowRequestFromYou) {
				await os.api('following/requests/cancel', {
					userId: props.user.id,
				});
				hasPendingFollowRequestFromYou = false;
			} else {
				await os.api('following/create', {
					userId: props.user.id,
				});
				hasPendingFollowRequestFromYou = true;

				claimAchievement('following1');

				if ($i.followingCount >= 10) {
					claimAchievement('following10');
				}
				if ($i.followingCount >= 50) {
					claimAchievement('following50');
				}
				if ($i.followingCount >= 100) {
					claimAchievement('following100');
				}
				if ($i.followingCount >= 300) {
					claimAchievement('following300');
				}
			}
		}
	} catch (err) {
		console.error(err);
	} finally {
		wait = false;
	}
}

onMounted(() => {
	connection.on('follow', onFollowChange);
	connection.on('unfollow', onFollowChange);
});

onBeforeUnmount(() => {
	connection.dispose();
});
</script>

<style lang="scss" module>
.root {
	position: relative;
	display: inline-block;
	font-weight: bold;
	color: var(--fgOnWhite);
	border: solid 1px var(--accent);
	padding: 0;
	height: 31px;
	font-size: 16px;
	border-radius: 32px;
	background: #fff;

	&.full {
		padding: 0 8px 0 12px;
		font-size: 14px;
	}

	&.large {
		font-size: 16px;
		height: 38px;
		padding: 0 12px 0 16px;
	}

	&:not(.full) {
		width: 31px;
	}

	&:focus-visible {
		&:after {
			content: "";
			pointer-events: none;
			position: absolute;
			top: -5px;
			right: -5px;
			bottom: -5px;
			left: -5px;
			border: 2px solid var(--focus);
			border-radius: 32px;
		}
	}

	&:hover {
		//background: mix($primary, #fff, 20);
	}

	&:active {
		//background: mix($primary, #fff, 40);
	}

	&.active {
		color: var(--fgOnAccent);
		background: var(--accent);

		&:hover {
			background: var(--accentLighten);
			border-color: var(--accentLighten);
		}

		&:active {
			background: var(--accentDarken);
			border-color: var(--accentDarken);
		}
	}

	&.wait {
		cursor: wait !important;
		opacity: 0.7;
	}
}

.text {
	margin-right: 6px;
}
</style>
