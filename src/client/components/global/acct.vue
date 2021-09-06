<template>
<span class="mk-acct">
	<span class="name">@{{ user.username }}</span>
	<span class="host" v-if="user.host || detail || $store.state.showFullAcct">@{{ host }}</span>
</span>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { toUnicode } from 'punycode/';
import { host } from '@client/config';

export default defineComponent({
	props: {
		user: {
			type: Object,
			required: true
		},
		detail: {
			type: Boolean,
			default: false
		},
	},
	data() {
		return {
			host: this.user.host ? toUnicode(host) : toUnicode(this.user.host),
		};
	}
});
</script>

<style lang="scss" scoped>
.mk-acct {
	> .host {
		opacity: 0.5;
	}
}
</style>
