<template>
<div class="lknzcolw">
	<div class="actions">
		<MkButton inline primary @click="addUser()"><i class="fas fa-plus"></i> {{ $ts.addUser }}</MkButton>
		<MkButton inline primary @click="lookupUser()"><i class="fas fa-search"></i> {{ $ts.lookup }}</MkButton>
	</div>

	<div class="users">
		<div class="inputs" style="display: flex;">
			<MkSelect v-model="sort" style="margin: 0; flex: 1;">
				<template #label>{{ $ts.sort }}</template>
				<option value="-createdAt">{{ $ts.registeredDate }} ({{ $ts.ascendingOrder }})</option>
				<option value="+createdAt">{{ $ts.registeredDate }} ({{ $ts.descendingOrder }})</option>
				<option value="-updatedAt">{{ $ts.lastUsed }} ({{ $ts.ascendingOrder }})</option>
				<option value="+updatedAt">{{ $ts.lastUsed }} ({{ $ts.descendingOrder }})</option>
			</MkSelect>
			<MkSelect v-model="state" style="margin: 0; flex: 1;">
				<template #label>{{ $ts.state }}</template>
				<option value="all">{{ $ts.all }}</option>
				<option value="available">{{ $ts.normal }}</option>
				<option value="admin">{{ $ts.administrator }}</option>
				<option value="moderator">{{ $ts.moderator }}</option>
				<option value="silenced">{{ $ts.silence }}</option>
				<option value="suspended">{{ $ts.suspend }}</option>
			</MkSelect>
			<MkSelect v-model="origin" style="margin: 0; flex: 1;">
				<template #label>{{ $ts.instance }}</template>
				<option value="combined">{{ $ts.all }}</option>
				<option value="local">{{ $ts.local }}</option>
				<option value="remote">{{ $ts.remote }}</option>
			</MkSelect>
		</div>
		<div class="inputs" style="display: flex; padding-top: 1.2em;">
			<MkInput v-model="searchUsername" style="margin: 0; flex: 1;" type="text" spellcheck="false" @update:modelValue="$refs.users.reload()">
				<template #label>{{ $ts.username }}</template>
			</MkInput>
			<MkInput v-model="searchHost" style="margin: 0; flex: 1;" type="text" spellcheck="false" @update:modelValue="$refs.users.reload()" :disabled="pagination.params().origin === 'local'">
				<template #label>{{ $ts.host }}</template>
			</MkInput>
		</div>

		<MkPagination :pagination="pagination" #default="{items}" class="users" ref="users">
			<button class="user _panel _button _gap" v-for="user in items" :key="user.id" @click="show(user)">
				<MkAvatar class="avatar" :user="user" :disable-link="true" :show-indicator="true"/>
				<div class="body">
					<header>
						<MkUserName class="name" :user="user"/>
						<span class="acct">@{{ getAcctUi(user) }}</span>
						<span class="staff" v-if="user.isAdmin"><i class="fas fa-bookmark"></i></span>
						<span class="staff" v-if="user.isModerator"><i class="far fa-bookmark"></i></span>
						<span class="punished" v-if="user.isSilenced"><i class="fas fa-microphone-slash"></i></span>
						<span class="punished" v-if="user.isSuspended"><i class="fas fa-snowflake"></i></span>
					</header>
					<div>
						<span>{{ $ts.lastUsed }}: <MkTime v-if="user.updatedAt" :time="user.updatedAt" mode="detail"/></span>
					</div>
					<div>
						<span>{{ $ts.registeredDate }}: <MkTime :time="user.createdAt" mode="detail"/></span>
					</div>
				</div>
			</button>
		</MkPagination>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkButton from '@client/components/ui/button.vue';
import MkInput from '@client/components/ui/input.vue';
import MkSelect from '@client/components/ui/select.vue';
import MkPagination from '@client/components/ui/pagination.vue';
import { getAcctUi } from '@/misc/acct';
import * as os from '@client/os';
import * as symbols from '@client/symbols';
import { lookupUser } from '@client/scripts/lookup-user';

export default defineComponent({
	components: {
		MkButton,
		MkInput,
		MkSelect,
		MkPagination,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.users,
				icon: 'fas fa-users',
				action: {
					icon: 'fas fa-search',
					handler: this.searchUser
				}
			},
			sort: '+createdAt',
			state: 'all',
			origin: 'local',
			searchUsername: '',
			searchHost: '',
			pagination: {
				endpoint: 'admin/show-users',
				limit: 10,
				params: () => ({
					sort: this.sort,
					state: this.state,
					origin: this.origin,
					username: this.searchUsername,
					hostname: this.searchHost,
				}),
				offsetMode: true
			},
		}
	},

	watch: {
		sort() {
			this.$refs.users.reload();
		},
		state() {
			this.$refs.users.reload();
		},
		origin() {
			this.$refs.users.reload();
		},
	},

	async mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		lookupUser,

		searchUser() {
			os.selectUser().then(user => {
				this.show(user);
			});
		},

		async addUser() {
			const { canceled: canceled1, result: username } = await os.dialog({
				title: this.$ts.username,
				input: true
			});
			if (canceled1) return;

			const { canceled: canceled2, result: password } = await os.dialog({
				title: this.$ts.password,
				input: { type: 'password' }
			});
			if (canceled2) return;

			os.apiWithDialog('admin/accounts/create', {
				username: username,
				password: password,
			}).then(res => {
				this.$refs.users.reload();
			});
		},

		show(user) {
			os.pageWindow(`/user-info/${user.id}`);
		},

		getAcctUi
	}
});
</script>

<style lang="scss" scoped>
.lknzcolw {
	> .actions {
		margin: var(--margin);
	}

	> .users {
		margin: var(--margin);
	
		> .users {
			margin-top: var(--margin);

			> .user {
				display: flex;
				width: 100%;
				box-sizing: border-box;
				text-align: left;
				align-items: center;
				padding: 16px;

				&:hover {
					color: var(--accent);
				}

				> .avatar {
					width: 60px;
					height: 60px;
				}

				> .body {
					margin-left: 0.3em;
					padding: 0 8px;
					flex: 1;

					@media (max-width: 500px) {
						font-size: 14px;
					}

					> header {
						> .name {
							font-weight: bold;
						}

						> .acct {
							margin-left: 8px;
							opacity: 0.7;
						}

						> .staff {
							margin-left: 0.5em;
							color: var(--badge);
						}

						> .punished {
							margin-left: 0.5em;
							color: #4dabf7;
						}
					}
				}
			}
		}
	}
}
</style>
