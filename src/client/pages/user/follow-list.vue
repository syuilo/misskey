<template>
<div>
	<MkPagination :pagination="pagination" #default="{items}" class="mk-following-or-followers" ref="list">
		<div class="users _isolated">
			<MkUserInfo class="user" v-for="user in items.map(x => type === 'following' ? x.followee : x.follower)" :user="user" :key="user.id"/>
		</div>
	</MkPagination>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkUserInfo from '@client/components/user-info.vue';
import MkPagination from '@client/components/ui/pagination.vue';

export default defineComponent({
	components: {
		MkPagination,
		MkUserInfo,
	},

	props: {
		user: {
			type: Object,
			required: true
		},
		type: {
			type: String,
			required: true
		},
	},

	data() {
		return {
			pagination: {
				endpoint: () => this.type === 'following' ? 'users/following' : 'users/followers',
				limit: 20,
				params: {
					userId: this.user.id,
				}
			},
		};
	},

	watch: {
		type() {
			this.$refs.list.reload();
		},

		user() {
			this.$refs.list.reload();
		}
	}
});
</script>

<style lang="scss" scoped>
.mk-following-or-followers {
	> .users {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		grid-gap: var(--margin);
	}
}
</style>
