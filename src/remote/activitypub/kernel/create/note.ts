import Resolver from '../../resolver';
import { IRemoteUser } from '@/models/entities/user';
import { createNote, fetchNote } from '../../models/note';
import { getApId, IObject, ICreate } from '../../type';
import { getApLock } from '@/misc/app-lock';
import { extractDbHost } from '@/misc/convert-host';
import { StatusError } from '@/misc/fetch';

/**
 * 投稿作成アクティビティを捌きます
 */
export default async function(resolver: Resolver, actor: IRemoteUser, note: IObject, silent = false, activity?: ICreate): Promise<string> {
	const uri = getApId(note);

	if (typeof note === 'object') {
		if (actor.uri !== note.attributedTo) {
			return `skip: actor.uri !== note.attributedTo`;
		}

		if (typeof note.id === 'string') {
			if (extractDbHost(actor.uri) !== extractDbHost(note.id)) {
				return `skip: host in actor.uri !== note.id`;
			}
		}
	}

	const unlock = await getApLock(uri);

	try {
		const exist = await fetchNote(note);
		if (exist) return 'skip: note exists';

		await createNote(note, resolver, silent);
		return 'ok';
	} catch (e) {
		if (e instanceof StatusError && e.isClientError) {
			return `skip ${e.statusCode}`;
		} else {
			throw e;
		}
	} finally {
		unlock();
	}
}
