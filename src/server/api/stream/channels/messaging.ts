import autobind from 'autobind-decorator';
import { readUserMessagingMessage, readGroupMessagingMessage, deliverReadActivity } from '../../common/read-messaging-message';
import Channel from '../channel';
import { UserGroupJoinings, Users, MessagingMessages } from '@/models/index';
import { User, ILocalUser, IRemoteUser } from '@/models/entities/user';
import { UserGroup } from '@/models/entities/user-group';
import { StreamMessages } from '../types';

export default class extends Channel {
	public readonly chName = 'messaging';
	public static shouldShare = false;
	public static requireCredential = true;

	private otherpartyId: string | null;
	private otherparty: User | null;
	private groupId: string | null;
	private subCh: `messagingStream:${User['id']}-${User['id']}` | `messagingStream:${UserGroup['id']}`;
	private typers: Record<User['id'], Date> = {};
	private emitTypersIntervalId: ReturnType<typeof setInterval>;

	@autobind
	public async init(params: any) {
		this.otherpartyId = params.otherparty;
		this.otherparty = this.otherpartyId ? await Users.findOneOrFail({ id: this.otherpartyId }) : null;
		this.groupId = params.group;

		// Check joining
		if (this.groupId) {
			const joining = await UserGroupJoinings.findOne({
				userId: this.user!.id,
				userGroupId: this.groupId
			});

			if (joining == null) {
				return;
			}
		}

		this.emitTypersIntervalId = setInterval(this.emitTypers, 5000);

		this.subCh = this.otherpartyId
			? `messagingStream:${this.user!.id}-${this.otherpartyId}`
			: `messagingStream:${this.groupId}`;

		// Subscribe messaging stream
		this.subscriber.on(this.subCh, this.onEvent);
	}

	@autobind
	private onEvent(data: StreamMessages['messaging']['spec'] | StreamMessages['groupMessaging']['spec']) {
		if (data.type === 'typing') {
			const id = data.body;
			const begin = this.typers[id] == null;
			this.typers[id] = new Date();
			if (begin) {
				this.emitTypers();
			}
		} else {
			this.send(data);
		}
	}

	@autobind
	public onMessage(type: string, body: any) {
		switch (type) {
			case 'read':
				if (this.otherpartyId) {
					readUserMessagingMessage(this.user!.id, this.otherpartyId, [body.id]);

					// リモートユーザーからのメッセージだったら既読配信
					if (Users.isLocalUser(this.user!) && Users.isRemoteUser(this.otherparty!)) {
						MessagingMessages.findOne(body.id).then(message => {
							if (message) deliverReadActivity(this.user as ILocalUser, this.otherparty as IRemoteUser, message);
						});
					}
				} else if (this.groupId) {
					readGroupMessagingMessage(this.user!.id, this.groupId, [body.id]);
				}
				break;
		}
	}

	@autobind
	private async emitTypers() {
		const now = new Date();

		// Remove not typing users
		for (const [userId, date] of Object.entries(this.typers)) {
			if (now.getTime() - date.getTime() > 5000) delete this.typers[userId];
		}

		const users = await Users.packMany(Object.keys(this.typers), null, { detail: false });

		this.send({
			type: 'typers',
			body: users,
		});
	}

	@autobind
	public dispose() {
		this.subscriber.off(this.subCh, this.onEvent);

		clearInterval(this.emitTypersIntervalId);
	}
}
