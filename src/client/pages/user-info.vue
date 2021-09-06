<template>
<FormBase>
	<FormSuspense :p="init">
		<div class="_formItem aeakzknw">
			<MkAvatar class="avatar" :user="user" :show-indicator="true"/>
		</div>

		<FormLink :to="userPage(user)">Profile</FormLink>

		<FormGroup>
			<FormKeyValueView>
				<template #key>Acct</template>
				<template #value><span class="_monospace">{{ getAcctUi(user) }}</span></template>
			</FormKeyValueView>

			<FormKeyValueView>
				<template #key>ID</template>
				<template #value><span class="_monospace">{{ user.id }}</span></template>
			</FormKeyValueView>
		</FormGroup>

		<FormGroup v-if="iAmModerator">
			<FormSwitch v-if="user.host == null && $i.isAdmin && (moderator || !user.isAdmin)" @update:value="toggleModerator" v-model:value="moderator">{{ $ts.moderator }}</FormSwitch>
			<FormSwitch @update:value="toggleSilence" v-model:value="silenced">{{ $ts.silence }}</FormSwitch>
			<FormSwitch @update:value="toggleSuspend" v-model:value="suspended">{{ $ts.suspend }}</FormSwitch>
		</FormGroup>

		<FormGroup>
			<FormButton v-if="user.host != null" @click="updateRemoteUser"><i class="fas fa-sync"></i> {{ $ts.updateRemoteUser }}</FormButton>
			<FormButton v-if="user.host == null && iAmModerator" @click="resetPassword"><i class="fas fa-key"></i> {{ $ts.resetPassword }}</FormButton>
		</FormGroup>

		<FormGroup>
			<FormLink :to="`/user-ap-info/${user.id}`">ActivityPub</FormLink>

			<FormLink v-if="user.host" :to="`/instance-info/${user.host}`">{{ $ts.instanceInfo }}<template #suffix>{{ user.host }}</template></FormLink>
			<FormKeyValueView v-else>
				<template #key>{{ $ts.instanceInfo }}</template>
				<template #value>(Local user)</template>
			</FormKeyValueView>
		</FormGroup>

		<FormGroup>
			<FormKeyValueView>
				<template #key>{{ $ts.updatedAt }}</template>
				<template #value><MkTime v-if="user.lastFetchedAt" mode="detail" :time="user.lastFetchedAt"/><span v-else>N/A</span></template>
			</FormKeyValueView>
		</FormGroup>

		<FormObjectView tall :value="user">
			<span>Raw</span>
		</FormObjectView>
	</FormSuspense>
</FormBase>
</template>

<script lang="ts">
import { computed, defineAsyncComponent, defineComponent } from 'vue';
import FormObjectView from '@client/components/form/object-view.vue';
import FormTextarea from '@client/components/form/textarea.vue';
import FormSwitch from '@client/components/form/switch.vue';
import FormLink from '@client/components/form/link.vue';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
import FormButton from '@client/components/form/button.vue';
import FormKeyValueView from '@client/components/form/key-value-view.vue';
import FormSuspense from '@client/components/form/suspense.vue';
import * as os from '@client/os';
import number from '@client/filters/number';
import bytes from '@client/filters/bytes';
import * as symbols from '@client/symbols';
import { url } from '@client/config';
import { getAcctUi } from '@/misc/acct';
import { userPage } from '@client/filters/user';

export default defineComponent({
	components: {
		FormBase,
		FormTextarea,
		FormSwitch,
		FormObjectView,
		FormButton,
		FormLink,
		FormGroup,
		FormKeyValueView,
		FormSuspense,
	},

	props: {
		userId: {
			type: String,
			required: true
		}
	},

	data() {
		return {
			[symbols.PAGE_INFO]: computed(() => ({
				title: this.user ? getAcctUi(this.user) : this.$ts.userInfo,
				icon: 'fas fa-info-circle',
				actions: this.user ? [this.user.url ? {
					text: this.user.url,
					icon: 'fas fa-external-link-alt',
					handler: () => {
						window.open(this.user.url, '_blank');
					}
				} : undefined].filter(x => x !== undefined) : [],
			})),
			init: null,
			user: null,
			info: null,
			moderator: false,
			silenced: false,
			suspended: false,
		}
	},

	computed: {
		iAmModerator(): boolean {
			return this.$i && (this.$i.isAdmin || this.$i.isModerator);
		}
	},

	watch: {
		userId: {
			handler() {
				this.init = this.createFetcher();
			},
			immediate: true
		}
	},

	methods: {
		number,
		bytes,
		userPage,
		getAcctUi,

		createFetcher() {
			if (this.iAmModerator) {
				return () => Promise.all([os.api('users/show', {
					userId: this.userId
				}), os.api('admin/show-user', {
					userId: this.userId
				})]).then(([user, info]) => {
					this.user = user;
					this.info = info;
					this.moderator = this.info.isModerator;
					this.silenced = this.info.isSilenced;
					this.suspended = this.info.isSuspended;
				});
			} else {
				return () => os.api('users/show', {
					userId: this.userId
				}).then((user) => {
					this.user = user;
				});
			}
		},

		refreshUser() {
			this.init = this.createFetcher();
		},

		async updateRemoteUser() {
			await os.apiWithDialog('federation/update-remote-user', { userId: this.user.id });
			this.refreshUser();
		},

		async resetPassword() {
			const { password } = await os.api('admin/reset-password', {
				userId: this.user.id,
			});

			os.dialog({
				type: 'success',
				text: this.$t('newPasswordIs', { password })
			});
		},

		async toggleSilence(v) {
			const confirm = await os.dialog({
				type: 'warning',
				showCancelButton: true,
				text: v ? this.$ts.silenceConfirm : this.$ts.unsilenceConfirm,
			});
			if (confirm.canceled) {
				this.silenced = !v;
			} else {
				await os.api(v ? 'admin/silence-user' : 'admin/unsilence-user', { userId: this.user.id });
				await this.refreshUser();
			}
		},

		async toggleSuspend(v) {
			const confirm = await os.dialog({
				type: 'warning',
				showCancelButton: true,
				text: v ? this.$ts.suspendConfirm : this.$ts.unsuspendConfirm,
			});
			if (confirm.canceled) {
				this.suspended = !v;
			} else {
				await os.api(v ? 'admin/suspend-user' : 'admin/unsuspend-user', { userId: this.user.id });
				await this.refreshUser();
			}
		},

		async toggleModerator(v) {
			await os.api(v ? 'admin/moderators/add' : 'admin/moderators/remove', { userId: this.user.id });
			await this.refreshUser();
		},

		async deleteAllFiles() {
			const confirm = await os.dialog({
				type: 'warning',
				showCancelButton: true,
				text: this.$ts.deleteAllFilesConfirm,
			});
			if (confirm.canceled) return;
			const process = async () => {
				await os.api('admin/delete-all-files-of-a-user', { userId: this.user.id });
				os.success();
			};
			await process().catch(e => {
				os.dialog({
					type: 'error',
					text: e.toString()
				});
			});
			await this.refreshUser();
		},
	}
});
</script>

<style lang="scss" scoped>
.aeakzknw {
	> .avatar {
		display: block;
		margin: 0 auto;
		width: 64px;
		height: 64px;
	}
}
</style>
