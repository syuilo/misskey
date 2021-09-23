<template>
<transition name="fade" mode="out-in">
	<MkLoading v-if="fetching"/>

	<MkError v-else-if="error" @retry="init()"/>

	<p class="mfcuwfyp" v-else-if="empty">{{ $ts.noNotifications }}</p>

	<div v-else>
		<XList class="elsfgstc" :items="items" v-slot="{ item: notification }" :no-gap="true">
			<XNote v-if="['reply', 'quote', 'mention'].includes(notification.type)" :note="notification.note" @update:note="noteUpdated(notification.note, $event)" :key="notification.id"/>
			<XNotification v-else :notification="notification" :with-time="true" :full="true" class="_panel notification" :key="notification.id"/>
		</XList>

		<MkButton primary style="margin: var(--margin) auto;" v-appear="$store.state.enableInfiniteScroll ? fetchMore : null" @click="fetchMore" v-show="more" :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }">
			<template v-if="!moreFetching">{{ $ts.loadMore }}</template>
			<template v-if="moreFetching"><MkLoading inline/></template>
		</MkButton>
	</div>
</transition>
</template>

<script lang="ts">
import { defineComponent, PropType, markRaw } from 'vue';
import paging from '@client/scripts/paging';
import { markNotificationRead } from '@client/scripts/mark-notification-read';
import XNotification from './notification.vue';
import XList from './date-separated-list.vue';
import XNote from './note.vue';
import { notificationTypes } from '../../types';
import * as os from '@client/os';
import MkButton from '@client/components/ui/button.vue';

export default defineComponent({
	components: {
		XNotification,
		XList,
		XNote,
		MkButton,
	},

	mixins: [
		paging({}),
	],

	props: {
		includeTypes: {
			type: Array as PropType<typeof notificationTypes[number][]>,
			required: false,
			default: null,
		},
	},

	data() {
		return {
			connection: null,
			pagination: {
				endpoint: 'i/notifications',
				limit: 10,
				params: () => ({
					includeTypes: this.allIncludeTypes || undefined,
				})
			},
		};
	},

	computed: {
		allIncludeTypes() {
			return this.includeTypes ?? notificationTypes.filter(x => !this.$i.mutingNotificationTypes.includes(x));
		}
	},

	watch: {
		includeTypes: {
			handler() {
				this.reload();
			},
			deep: true
		},
		// TODO: vue/vuexのバグか仕様かは不明なものの、プロフィール更新するなどして $i が更新されると、
		// mutingNotificationTypes に変化が無くてもこのハンドラーが呼び出され無駄なリロードが発生するのを直す
		'$i.mutingNotificationTypes': {
			handler() {
				if (this.includeTypes === null) {
					this.reload();
				}
			},
			deep: true
		}
	},

	mounted() {
		this.connection = markRaw(os.stream.useChannel('main'));
		this.connection.on('notification', this.onNotification);

		this.connection.on('readAllNotifications', () => {
			for (const item of this.queue) {
				item.isRead = true;
			}
			for (const item of this.items) {
				item.isRead = true;
			}
		});
		this.connection.on('readNotifications', notificationIds => {
			for (let i = 0; i < this.queue.length; i++) {
				if (notificationIds.includes(this.queue[i].id)) {
					this.queue[i].isRead = true;
				}
			}
			for (let i = 0; i < this.items.length; i++) {
				if (notificationIds.includes(this.items[i].id)) {
					this.items[i].isRead = true;
				}
			}
		});
	},

	beforeUnmount() {
		this.connection.dispose();
	},

	methods: {
		onNotification(notification) {
			const isMuted = !this.allIncludeTypes.includes(notification.type);
			if (isMuted || document.visibilityState === 'visible') {
				os.stream.send('readNotification', {
					id: notification.id
				});
			}

			if (!isMuted) {
				this.prepend({
					...notification,
					isRead: document.visibilityState === 'visible'
				});
			}
		},

		noteUpdated(oldValue, newValue) {
			const i = this.items.findIndex(n => n.note === oldValue);
			this.items[i] = {
				...this.items[i],
				note: newValue
			};
		},
	}
});
</script>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.125s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.mfcuwfyp {
	margin: 0;
	padding: 16px;
	text-align: center;
	color: var(--fg);
}

.elsfgstc {
	background: var(--panel);
}
</style>
