// SafariがBroadcastChannel未実装なのでライブラリを使う
import { BroadcastChannel } from 'broadcast-channel';

export const reloadChannel = new BroadcastChannel<string>('reload');

// BroadcastChannelを用いて、クライアントが一斉にreloadするようにします。
export function unisonReload(path?: string) {
	if (path !== undefined) {
		reloadChannel.postMessage(path);
		location.href = path;
	} else {
		reloadChannel.postMessage('reload');
		location.reload();
	}
}
