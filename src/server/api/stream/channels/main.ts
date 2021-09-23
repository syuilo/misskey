import autobind from 'autobind-decorator';
import Channel from '../channel';
import { Notes } from '@/models/index';

export default class extends Channel {
	public readonly chName = 'main';
	public static shouldShare = true;
	public static requireCredential = true;

	@autobind
	public async init(params: any) {
		// Subscribe main stream channel
		this.subscriber.on(`mainStream:${this.user!.id}`, async data => {
			switch (data.type) {
				case 'notification': {
					if (data.body.userId && this.muting.has(data.body.userId)) return;

					if (data.body.note && data.body.note.isHidden) {
						const note = await Notes.pack(data.body.note.id, this.user, {
							detail: true
						});
						this.connection.cacheNote(note);
						data.body.note = note;
					}
					break;
				}
				case 'mention': {
					if (this.muting.has(data.body.userId)) return;
					if (data.body.isHidden) {
						const note = await Notes.pack(data.body.id, this.user, {
							detail: true
						});
						this.connection.cacheNote(note);
						data.body = note;
					}
					break;
				}
			}

			this.send(data.type, data.body);
		});
	}
}
