<template>
<div class="yweeujhr _root" v-size="{ max: [400] }">
	<MkButton @click="start" primary class="start"><i class="fas fa-plus"></i> {{ $ts.startMessaging }}</MkButton>

	<div class="history" v-if="messages.length > 0">
		<MkA v-for="(message, i) in messages"
			class="message _block"
			:class="{ isMe: isMe(message), isRead: message.groupId ? message.reads.includes($i.id) : message.isRead }"
			:to="message.groupId ? `/my/messaging/group/${message.groupId}` : `/my/messaging/${getAcctUi(isMe(message) ? message.recipient : message.user)}`"
			:data-index="i"
			:key="message.id"
			v-anim="i"
		>
			<div>
				<MkAvatar class="avatar" :user="message.groupId ? message.user : isMe(message) ? message.recipient : message.user" :show-indicator="true"/>
				<header v-if="message.groupId">
					<span class="name">{{ message.group.name }}</span>
					<MkTime :time="message.createdAt" class="time"/>
				</header>
				<header v-else>
					<span class="name"><MkUserName :user="isMe(message) ? message.recipient : message.user"/></span>
					<span class="username">@{{ getAcctUi(isMe(message) ? message.recipient : message.user) }}</span>
					<MkTime :time="message.createdAt" class="time"/>
				</header>
				<div class="body">
					<p class="text"><span class="me" v-if="isMe(message)">{{ $ts.you }}:</span>{{ message.text }}</p>
				</div>
			</div>
		</MkA>
	</div>
	<div class="_fullinfo" v-if="!fetching && messages.length == 0">
		<img src="https://xn--931a.moe/assets/info.jpg" class="_ghost"/>
		<div>{{ $ts.noHistory }}</div>
	</div>
	<MkLoading v-if="fetching"/>
</div>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent, markRaw } from 'vue';
import { getAcctUi } from '@/misc/acct';
import MkButton from '@client/components/ui/button.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		MkButton
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.messaging,
				icon: 'fas fa-comments'
			},
			fetching: true,
			moreFetching: false,
			messages: [],
			connection: null,
		};
	},

	mounted() {
		this.connection = markRaw(os.stream.useChannel('messagingIndex'));

		this.connection.on('message', this.onMessage);
		this.connection.on('read', this.onRead);

		os.api('messaging/history', { group: false }).then(userMessages => {
			os.api('messaging/history', { group: true }).then(groupMessages => {
				const messages = userMessages.concat(groupMessages);
				messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
				this.messages = messages;
				this.fetching = false;
			});
		});
	},

	beforeUnmount() {
		this.connection.dispose();
	},

	methods: {
		getAcctUi,

		isMe(message) {
			return message.userId == this.$i.id;
		},

		onMessage(message) {
			if (message.recipientId) {
				this.messages = this.messages.filter(m => !(
					(m.recipientId == message.recipientId && m.userId == message.userId) ||
					(m.recipientId == message.userId && m.userId == message.recipientId)));

				this.messages.unshift(message);
			} else if (message.groupId) {
				this.messages = this.messages.filter(m => m.groupId !== message.groupId);
				this.messages.unshift(message);
			}
		},

		onRead(ids) {
			for (const id of ids) {
				const found = this.messages.find(m => m.id == id);
				if (found) {
					if (found.recipientId) {
						found.isRead = true;
					} else if (found.groupId) {
						found.reads.push(this.$i.id);
					}
				}
			}
		},

		start(ev) {
			os.popupMenu([{
				text: this.$ts.messagingWithUser,
				icon: 'fas fa-user',
				action: () => { this.startUser() }
			}, {
				text: this.$ts.messagingWithGroup,
				icon: 'fas fa-users',
				action: () => { this.startGroup() }
			}], ev.currentTarget || ev.target);
		},

		async startUser() {
			os.selectUser().then(user => {
				this.$router.push(`/my/messaging/${getAcctUi(user)}`);
			});
		},

		async startGroup() {
			const groups1 = await os.api('users/groups/owned');
			const groups2 = await os.api('users/groups/joined');
			if (groups1.length === 0 && groups2.length === 0) {
				os.dialog({
					type: 'warning',
					title: this.$ts.youHaveNoGroups,
					text: this.$ts.joinOrCreateGroup,
				});
				return;
			}
			const { canceled, result: group } = await os.dialog({
				type: null,
				title: this.$ts.group,
				select: {
					items: groups1.concat(groups2).map(group => ({
						value: group, text: group.name
					}))
				},
				showCancelButton: true
			});
			if (canceled) return;
			this.$router.push(`/my/messaging/group/${group.id}`);
		}
	}
});
</script>

<style lang="scss" scoped>
.yweeujhr {

	> .start {
		margin: var(--margin) auto var(--margin) auto;
	}

	> .history {
		> .message {
			display: block;
			text-decoration: none;
			margin-bottom: var(--margin);

			* {
				pointer-events: none;
				user-select: none;
			}

			&:hover {
				.avatar {
					filter: saturate(200%);
				}
			}

			&:active {
			}

			&.isRead,
			&.isMe {
				opacity: 0.8;
			}

			&:not(.isMe):not(.isRead) {
				> div {
					background-image: url("/static-assets/client/unread.svg");
					background-repeat: no-repeat;
					background-position: 0 center;
				}
			}

			&:after {
				content: "";
				display: block;
				clear: both;
			}

			> div {
				padding: 20px 30px;

				&:after {
					content: "";
					display: block;
					clear: both;
				}

				> header {
					display: flex;
					align-items: center;
					margin-bottom: 2px;
					white-space: nowrap;
					overflow: hidden;

					> .name {
						margin: 0;
						padding: 0;
						overflow: hidden;
						text-overflow: ellipsis;
						font-size: 1em;
						font-weight: bold;
						transition: all 0.1s ease;
					}

					> .username {
						margin: 0 8px;
					}

					> .time {
						margin: 0 0 0 auto;
					}
				}

				> .avatar {
					float: left;
					width: 54px;
					height: 54px;
					margin: 0 16px 0 0;
					border-radius: 8px;
					transition: all 0.1s ease;
				}

				> .body {

					> .text {
						display: block;
						margin: 0 0 0 0;
						padding: 0;
						overflow: hidden;
						overflow-wrap: break-word;
						font-size: 1.1em;
						color: var(--faceText);

						.me {
							opacity: 0.7;
						}
					}

					> .image {
						display: block;
						max-width: 100%;
						max-height: 512px;
					}
				}
			}
		}
	}

	&.max-width_400px {
		> .history {
			> .message {
				&:not(.isMe):not(.isRead) {
					> div {
						background-image: none;
						border-left: solid 4px #3aa2dc;
					}
				}

				> div {
					padding: 16px;
					font-size: 0.9em;

					> .avatar {
						margin: 0 12px 0 0;
					}
				}
			}
		}
	}
}
</style>
