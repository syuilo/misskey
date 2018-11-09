import * as mongo from 'mongodb';
import * as debug from 'debug';

import config from '../../../config';
import Resolver from '../resolver';
import Note, { INote } from '../../../models/note';
import post from '../../../services/note/create';
import { INote as INoteActivityStreamsObject, IObject } from '../type';
import { resolvePerson, updatePerson } from './person';
import { resolveImage } from './image';
import { IRemoteUser, IUser } from '../../../models/user';
import htmlToMFM from '../../../mfm/html-to-mfm';
import Emoji from '../../../models/emoji';
import { ITag } from './tag';
import { toUnicode } from 'punycode';
import { unique, concat, difference } from '../../../prelude/array';

const log = debug('misskey:activitypub');

/**
 * Noteをフェッチします。
 *
 * Misskeyに対象のNoteが登録されていればそれを返します。
 */
export async function fetchNote(value: string | IObject, resolver?: Resolver): Promise<INote> {
	const uri = typeof value == 'string' ? value : value.id;

	// URIがこのサーバーを指しているならデータベースからフェッチ
	if (uri.startsWith(config.url + '/')) {
		const id = new mongo.ObjectID(uri.split('/').pop());
		return await Note.findOne({ _id: id });
	}

	//#region このサーバーに既に登録されていたらそれを返す
	const exist = await Note.findOne({ uri });

	if (exist) {
		return exist;
	}
	//#endregion

	return null;
}

/**
 * Noteを作成します。
 */
export async function createNote(value: any, resolver?: Resolver, silent = false): Promise<INote> {
	if (resolver == null) resolver = new Resolver();

	const object = await resolver.resolve(value) as any;

	if (object == null || object.type !== 'Note') {
		log(`invalid note: ${object}`);
		return null;
	}

	const note: INoteActivityStreamsObject = object;

	log(`Creating the Note: ${note.id}`);

	// 投稿者をフェッチ
	const actor = await resolvePerson(note.attributedTo, null, resolver) as IRemoteUser;

	// 投稿者が凍結されていたらスキップ
	if (actor.isSuspended) {
		return null;
	}

	//#region Visibility
	let visibility = 'public';
	let visibleUsers: IUser[] = [];
	if (!note.to.includes('https://www.w3.org/ns/activitystreams#Public')) {
		if (note.cc.includes('https://www.w3.org/ns/activitystreams#Public')) {
			visibility = 'home';
		} else if (note.to.includes(`${actor.uri}/followers`)) {	// TODO: person.followerと照合するべき？
			visibility = 'followers';
		} else {
			visibility = 'specified';
			visibleUsers = await Promise.all(note.to.map(uri => resolvePerson(uri, null, resolver)));
		}
	}
	//#endergion

	const apMentions = await extractMentionedUsers(actor, note.to, note.cc, resolver);

	// 添付ファイル
	// TODO: attachmentは必ずしもImageではない
	// TODO: attachmentは必ずしも配列ではない
	// Noteがsensitiveなら添付もsensitiveにする
	const files = note.attachment
		.map(attach => attach.sensitive = note.sensitive)
		? await Promise.all(note.attachment.map(x => resolveImage(actor, x)))
		: [];

	// リプライ
	const reply = note.inReplyTo ? await resolveNote(note.inReplyTo, resolver) : null;

	// テキストのパース
	const text = note._misskey_content ? note._misskey_content : htmlToMFM(note.content);

	await extractEmojis(note.tag, actor.host).catch(e => {
		console.log(`extractEmojis: ${e}`);
	});

	// ユーザーの情報が古かったらついでに更新しておく
	if (actor.updatedAt == null || Date.now() - actor.updatedAt.getTime() > 1000 * 60 * 60 * 24) {
		updatePerson(note.attributedTo);
	}

	return await post(actor, {
		createdAt: new Date(note.published),
		files: files,
		reply,
		renote: undefined,
		cw: note.summary,
		text: text,
		viaMobile: false,
		geo: undefined,
		visibility,
		visibleUsers,
		apMentions,
		uri: note.id
	}, silent);
}

/**
 * Noteを解決します。
 *
 * Misskeyに対象のNoteが登録されていればそれを返し、そうでなければ
 * リモートサーバーからフェッチしてMisskeyに登録しそれを返します。
 */
export async function resolveNote(value: string | IObject, resolver?: Resolver): Promise<INote> {
	const uri = typeof value == 'string' ? value : value.id;

	//#region このサーバーに既に登録されていたらそれを返す
	const exist = await fetchNote(uri);

	if (exist) {
		return exist;
	}
	//#endregion

	// リモートサーバーからフェッチしてきて登録
	// ここでuriの代わりに添付されてきたNote Objectが指定されていると、サーバーフェッチを経ずにノートが生成されるが
	// 添付されてきたNote Objectは偽装されている可能性があるため、常にuriを指定してサーバーフェッチを行う。
	return await createNote(uri, resolver);
}

async function extractEmojis(tags: ITag[], host_: string) {
	const host = toUnicode(host_.toLowerCase());

	if (!tags) return [];

	const eomjiTags = tags.filter(tag => tag.type === 'Emoji' && tag.icon && tag.icon.url);

	return await Promise.all(
		eomjiTags.map(async tag => {
			const name = tag.name.replace(/^:/, '').replace(/:$/, '');

			const exists = await Emoji.findOne({
				host,
				name
			});

			if (exists) {
				return exists;
			}

			log(`register emoji host=${host}, name=${name}`);

			return await Emoji.insert({
				host,
				name,
				url: tag.icon.url,
				aliases: [],
			});
		})
	);
}

async function extractMentionedUsers(actor: IRemoteUser, to: string[], cc: string[], resolver: Resolver) {
	const ignoreUris = ['https://www.w3.org/ns/activitystreams#Public', `${actor.uri}/followers`];
	const uris = difference(unique(concat([to || [], cc || []])), ignoreUris);

	const users = await Promise.all(
		uris.map(async uri => await resolvePerson(uri, null, resolver).catch(() => null))
	);

	return users.filter(x => x != null);
}
