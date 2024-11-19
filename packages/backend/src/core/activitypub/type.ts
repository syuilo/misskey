/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type Obj = { [x: string]: any };
export type ApObject = IObject | string | (IObject | string)[];

export interface IObject {
	'@context'?: string | string[] | Obj | Obj[];
	type: string | string[];
	id?: string;
	name?: string | null;
	summary?: string;
	_misskey_summary?: string;
	_misskey_followedMessage?: string | null;
	_misskey_requireSigninToViewContents?: boolean;
	_misskey_makeNotesFollowersOnlyBefore?: number | null;
	_misskey_makeNotesHiddenBefore?: number | null;
	published?: string;
	cc?: ApObject;
	to?: ApObject;
	attributedTo?: ApObject;
	attachment?: any[];
	inReplyTo?: any;
	replies?: ICollection;
	content?: string | null;
	startTime?: Date;
	endTime?: Date;
	icon?: any;
	image?: any;
	mediaType?: string;
	url?: ApObject | string;
	href?: string;
	tag?: IObject | IObject[];
	sensitive?: boolean;
}

/**
 * Get array of ActivityStreams Objects id
 */
export function getApIds(value: ApObject | undefined): string[] {
	if (value == null) return [];
	const array = Array.isArray(value) ? value : [value];
	return array.map(x => getApId(x));
}

/**
 * Get first ActivityStreams Object id
 */
export function getOneApId(value: ApObject): string {
	const firstOne = Array.isArray(value) ? value[0] : value;
	return getApId(firstOne);
}

/**
 * Get ActivityStreams Object id
 */
export function getApId(value: string | IObject): string {
	if (typeof value === 'string') return value;
	if (typeof value.id === 'string') return value.id;
	throw new Error('cannot determine id');
}

/**
 * Get ActivityStreams Object type
 *
 * タイプ判定ができなかった場合に、あえてエラーではなくnullを返すようにしている。
 * 詳細: https://github.com/misskey-dev/misskey/issues/14239
 */
export function getApType(value: IObject): string | null {
	if (typeof value.type === 'string') return value.type;
	if (Array.isArray(value.type) && typeof value.type[0] === 'string') return value.type[0];
	return null;
}

export function getOneApHrefNullable(value: ApObject | undefined): string | undefined {
	const firstOne = Array.isArray(value) ? value[0] : value;
	return getApHrefNullable(firstOne);
}

export function getApHrefNullable(value: string | IObject | undefined): string | undefined {
	if (typeof value === 'string') return value;
	if (typeof value?.href === 'string') return value.href;
	return undefined;
}

export interface IActivity extends IObject {
	//type: 'Activity';
	actor: IObject | string;
	object: IObject | string;
	target?: IObject | string;
	/** LD-Signature */
	signature?: {
		type: string;
		created: Date;
		creator: string;
		domain?: string;
		nonce?: string;
		signatureValue: string;
	};
}

export interface ICollection extends IObject {
	type: 'Collection';
	totalItems: number;
	first?: IObject | string;
	items?: ApObject;
}

export interface IOrderedCollection extends IObject {
	type: 'OrderedCollection';
	totalItems: number;
	first?: IObject | string;
	orderedItems?: ApObject;
}

export const validPost = ['Note', 'Question', 'Article', 'Audio', 'Document', 'Image', 'Page', 'Video', 'Event'];

export const isPost = (object: IObject): object is IPost => {
	const type = getApType(object);
	return type != null && validPost.includes(type);
};

export interface IPost extends IObject {
	type: 'Note' | 'Question' | 'Article' | 'Audio' | 'Document' | 'Image' | 'Page' | 'Video' | 'Event';
	source?: {
		content: string;
		mediaType: string;
	};
	_misskey_quote?: string;
	_misskey_content?: string;
	quoteUrl?: string;
}

export interface IQuestion extends IObject {
	type: 'Note' | 'Question';
	actor: string;
	source?: {
		content: string;
		mediaType: string;
	};
	_misskey_quote?: string;
	quoteUrl?: string;
	oneOf?: IQuestionChoice[];
	anyOf?: IQuestionChoice[];
	endTime?: Date;
	closed?: Date;
}

export const isQuestion = (object: IObject): object is IQuestion =>
	getApType(object) === 'Note' || getApType(object) === 'Question';

interface IQuestionChoice {
	name?: string;
	replies?: ICollection;
	_misskey_votes?: number;
}
export interface ITombstone extends IObject {
	type: 'Tombstone';
	formerType?: string;
	deleted?: Date;
}

export const isTombstone = (object: IObject): object is ITombstone =>
	getApType(object) === 'Tombstone';

export const validActor = ['Person', 'Service', 'Group', 'Organization', 'Application'];

export const isActor = (object: IObject): object is IActor => {
	const type = getApType(object);
	return type != null && validActor.includes(type);
};

export interface IActor extends IObject {
	type: 'Person' | 'Service' | 'Organization' | 'Group' | 'Application';
	name?: string;
	preferredUsername?: string;
	manuallyApprovesFollowers?: boolean;
	movedTo?: string;
	alsoKnownAs?: string[];
	discoverable?: boolean;
	inbox: string;
	sharedInbox?: string;	// 後方互換性のため
	publicKey?: IKey | IKey[];
	additionalPublicKeys?: IKey[];
	followers?: string | ICollection | IOrderedCollection;
	following?: string | ICollection | IOrderedCollection;
	featured?: string | IOrderedCollection;
	outbox: string | IOrderedCollection;
	endpoints?: {
		sharedInbox?: string;
	};
	'vcard:bday'?: string;
	'vcard:Address'?: string;
}

export const isCollection = (object: IObject): object is ICollection =>
	getApType(object) === 'Collection';

export const isOrderedCollection = (object: IObject): object is IOrderedCollection =>
	getApType(object) === 'OrderedCollection';

export const isCollectionOrOrderedCollection = (object: IObject): object is ICollection | IOrderedCollection =>
	isCollection(object) || isOrderedCollection(object);

export interface IApPropertyValue extends IObject {
	type: 'PropertyValue';
	identifier: IApPropertyValue;
	name: string;
	value: string;
}

export const isPropertyValue = (object: IObject): object is IApPropertyValue =>
	getApType(object) === 'PropertyValue' &&
	typeof object.name === 'string' &&
	'value' in object &&
	typeof object.value === 'string';

export interface IApMention extends IObject {
	type: 'Mention';
	href: string;
	name: string;
}

export const isMention = (object: IObject): object is IApMention =>
	getApType(object) === 'Mention' &&
	typeof object.href === 'string';

export interface IApHashtag extends IObject {
	type: 'Hashtag';
	name: string;
}

export const isHashtag = (object: IObject): object is IApHashtag =>
	getApType(object) === 'Hashtag' &&
	typeof object.name === 'string';

export interface IApEmoji extends IObject {
	type: 'Emoji';
	name: string;
	updated: string;
}

export const isEmoji = (object: IObject): object is IApEmoji =>
	getApType(object) === 'Emoji' && !Array.isArray(object.icon) && object.icon.url != null;

export interface IKey extends IObject {
	type: 'Key';
	id: string;
	owner: string;
	publicKeyPem: string;
}

export const validDocumentTypes = ['Audio', 'Document', 'Image', 'Page', 'Video'];

export interface IApDocument extends IObject {
	type: 'Audio' | 'Document' | 'Image' | 'Page' | 'Video';
}

export const isDocument = (object: IObject): object is IApDocument => {
	const type = getApType(object);
	return type != null && validDocumentTypes.includes(type);
};

export interface IApImage extends IApDocument {
	type: 'Image';
}

export interface ICreate extends IActivity {
	type: 'Create';
}

export interface IDelete extends IActivity {
	type: 'Delete';
}

export interface IUpdate extends IActivity {
	type: 'Update';
}

export interface IRead extends IActivity {
	type: 'Read';
}

export interface IUndo extends IActivity {
	type: 'Undo';
}

export interface IFollow extends IActivity {
	type: 'Follow';
}

export interface IAccept extends IActivity {
	type: 'Accept';
}

export interface IReject extends IActivity {
	type: 'Reject';
}

export interface IAdd extends IActivity {
	type: 'Add';
}

export interface IRemove extends IActivity {
	type: 'Remove';
}

export interface ILike extends IActivity {
	type: 'Like' | 'EmojiReaction' | 'EmojiReact';
	_misskey_reaction?: string;
}

export interface IAnnounce extends IActivity {
	type: 'Announce';
}

export interface IBlock extends IActivity {
	type: 'Block';
}

export interface IFlag extends IActivity {
	type: 'Flag';
}

export interface IMove extends IActivity {
	type: 'Move';
	target: IObject | string;
}

export const isCreate = (object: IObject): object is ICreate => getApType(object) === 'Create';
export const isDelete = (object: IObject): object is IDelete => getApType(object) === 'Delete';
export const isUpdate = (object: IObject): object is IUpdate => getApType(object) === 'Update';
export const isRead = (object: IObject): object is IRead => getApType(object) === 'Read';
export const isUndo = (object: IObject): object is IUndo => getApType(object) === 'Undo';
export const isFollow = (object: IObject): object is IFollow => getApType(object) === 'Follow';
export const isAccept = (object: IObject): object is IAccept => getApType(object) === 'Accept';
export const isReject = (object: IObject): object is IReject => getApType(object) === 'Reject';
export const isAdd = (object: IObject): object is IAdd => getApType(object) === 'Add';
export const isRemove = (object: IObject): object is IRemove => getApType(object) === 'Remove';
export const isLike = (object: IObject): object is ILike => {
	const type = getApType(object);
	return type != null && ['Like', 'EmojiReaction', 'EmojiReact'].includes(type);
};
export const isAnnounce = (object: IObject): object is IAnnounce => getApType(object) === 'Announce';
export const isBlock = (object: IObject): object is IBlock => getApType(object) === 'Block';
export const isFlag = (object: IObject): object is IFlag => getApType(object) === 'Flag';
export const isMove = (object: IObject): object is IMove => getApType(object) === 'Move';
export const isNote = (object: IObject): object is IPost => getApType(object) === 'Note';
