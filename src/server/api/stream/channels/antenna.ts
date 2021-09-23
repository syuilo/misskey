import autobind from 'autobind-decorator';
import Channel from '../channel';
import { Notes } from '@/models/index';
import { isMutedUserRelated } from '@/misc/is-muted-user-related';
import { isBlockerUserRelated } from '@/misc/is-blocker-user-related';
import { StreamMessages } from '../types';

export default class extends Channel {
	public readonly chName = 'antenna';
	public static shouldShare = false;
	public static requireCredential = false;
	private antennaId: string;

	@autobind
	public async init(params: any) {
		this.antennaId = params.antennaId as string;

		// Subscribe stream
		this.subscriber.on(`antennaStream:${this.antennaId}`, this.onEvent);
	}

	@autobind
	private async onEvent(data: StreamMessages['antenna']['spec']) {
		if (data.type === 'note') {
			const note = await Notes.pack(data.body.id, this.user, { detail: true });

			// 流れてきたNoteがミュートしているユーザーが関わるものだったら無視する
			if (isMutedUserRelated(note, this.muting)) return;
			// 流れてきたNoteがブロックされているユーザーが関わるものだったら無視する
			if (isBlockerUserRelated(note, this.blocking)) return;

			this.connection.cacheNote(note);

			this.send('note', note);
		}
	}

	@autobind
	public dispose() {
		// Unsubscribe events
		this.subscriber.off(`antennaStream:${this.antennaId}`, this.onEvent);
	}
}
