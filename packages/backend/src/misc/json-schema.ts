/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	packedMeDetailedOnlySchema,
	packedMeDetailedSchema,
	packedUserDetailedNotMeOnlySchema,
	packedUserDetailedNotMeSchema,
	packedUserDetailedSchema,
	packedUserLiteSchema,
	packedUserSchema,
} from '@/models/json-schema/user.js';
import { packedNoteSchema } from '@/models/json-schema/note.js';
import { packedUserListSchema } from '@/models/json-schema/user-list.js';
import { packedAppSchema } from '@/models/json-schema/app.js';
import { packedNotificationSchema } from '@/models/json-schema/notification.js';
import { packedDriveFileSchema } from '@/models/json-schema/drive-file.js';
import { packedDriveFolderSchema } from '@/models/json-schema/drive-folder.js';
import { packedFollowingSchema } from '@/models/json-schema/following.js';
import { packedMutingSchema } from '@/models/json-schema/muting.js';
import { packedRenoteMutingSchema } from '@/models/json-schema/renote-muting.js';
import { packedBlockingSchema } from '@/models/json-schema/blocking.js';
import { packedNoteReactionSchema } from '@/models/json-schema/note-reaction.js';
import { packedHashtagSchema } from '@/models/json-schema/hashtag.js';
import { packedInviteCodeSchema } from '@/models/json-schema/invite-code.js';
import { packedPageBlockSchema, packedPageSchema } from '@/models/json-schema/page.js';
import { packedNoteFavoriteSchema } from '@/models/json-schema/note-favorite.js';
import { packedChannelSchema } from '@/models/json-schema/channel.js';
import { packedAntennaSchema } from '@/models/json-schema/antenna.js';
import { packedClipSchema } from '@/models/json-schema/clip.js';
import { packedFederationInstanceSchema } from '@/models/json-schema/federation-instance.js';
import { packedQueueCountSchema } from '@/models/json-schema/queue.js';
import { packedGalleryPostSchema } from '@/models/json-schema/gallery-post.js';
import {
	packedEmojiDetailedAdminSchema,
	packedEmojiDetailedSchema,
	packedEmojiSimpleSchema,
} from '@/models/json-schema/emoji.js';
import { packedFlashSchema } from '@/models/json-schema/flash.js';
import { packedAnnouncementSchema } from '@/models/json-schema/announcement.js';
import { packedSigninSchema } from '@/models/json-schema/signin.js';
import {
	packedRoleCondFormulaFollowersOrFollowingOrNotesSchema,
	packedRoleCondFormulaLogicsSchema,
	packedRoleCondFormulaValueAssignedRoleSchema,
	packedRoleCondFormulaValueCreatedSchema,
	packedRoleCondFormulaValueIsLocalOrRemoteSchema,
	packedRoleCondFormulaValueNot,
	packedRoleCondFormulaValueSchema,
	packedRoleCondFormulaValueUserSettingBooleanSchema,
	packedRoleLiteSchema,
	packedRolePoliciesSchema,
	packedRoleSchema,
} from '@/models/json-schema/role.js';
import { packedAdSchema } from '@/models/json-schema/ad.js';
import { packedReversiGameDetailedSchema, packedReversiGameLiteSchema } from '@/models/json-schema/reversi-game.js';
import {
	packedMetaDetailedOnlySchema,
	packedMetaDetailedSchema,
	packedMetaLiteSchema,
} from '@/models/json-schema/meta.js';
import { packedSystemWebhookSchema } from '@/models/json-schema/system-webhook.js';
import { packedAbuseReportNotificationRecipientSchema } from '@/models/json-schema/abuse-report-notification-recipient.js';

export const refs = {
	UserLite: packedUserLiteSchema,
	UserDetailedNotMeOnly: packedUserDetailedNotMeOnlySchema,
	MeDetailedOnly: packedMeDetailedOnlySchema,
	UserDetailedNotMe: packedUserDetailedNotMeSchema,
	MeDetailed: packedMeDetailedSchema,
	UserDetailed: packedUserDetailedSchema,
	User: packedUserSchema,

	UserList: packedUserListSchema,
	Ad: packedAdSchema,
	Announcement: packedAnnouncementSchema,
	App: packedAppSchema,
	Note: packedNoteSchema,
	NoteReaction: packedNoteReactionSchema,
	NoteFavorite: packedNoteFavoriteSchema,
	Notification: packedNotificationSchema,
	DriveFile: packedDriveFileSchema,
	DriveFolder: packedDriveFolderSchema,
	Following: packedFollowingSchema,
	Muting: packedMutingSchema,
	RenoteMuting: packedRenoteMutingSchema,
	Blocking: packedBlockingSchema,
	Hashtag: packedHashtagSchema,
	InviteCode: packedInviteCodeSchema,
	Page: packedPageSchema,
	PageBlock: packedPageBlockSchema,
	Channel: packedChannelSchema,
	QueueCount: packedQueueCountSchema,
	Antenna: packedAntennaSchema,
	Clip: packedClipSchema,
	FederationInstance: packedFederationInstanceSchema,
	GalleryPost: packedGalleryPostSchema,
	EmojiSimple: packedEmojiSimpleSchema,
	EmojiDetailed: packedEmojiDetailedSchema,
	EmojiDetailedAdmin: packedEmojiDetailedAdminSchema,
	Flash: packedFlashSchema,
	Signin: packedSigninSchema,
	RoleCondFormulaLogics: packedRoleCondFormulaLogicsSchema,
	RoleCondFormulaValueNot: packedRoleCondFormulaValueNot,
	RoleCondFormulaValueIsLocalOrRemote: packedRoleCondFormulaValueIsLocalOrRemoteSchema,
	RoleCondFormulaValueUserSettingBooleanSchema: packedRoleCondFormulaValueUserSettingBooleanSchema,
	RoleCondFormulaValueAssignedRole: packedRoleCondFormulaValueAssignedRoleSchema,
	RoleCondFormulaValueCreated: packedRoleCondFormulaValueCreatedSchema,
	RoleCondFormulaFollowersOrFollowingOrNotes: packedRoleCondFormulaFollowersOrFollowingOrNotesSchema,
	RoleCondFormulaValue: packedRoleCondFormulaValueSchema,
	RoleLite: packedRoleLiteSchema,
	Role: packedRoleSchema,
	RolePolicies: packedRolePoliciesSchema,
	ReversiGameLite: packedReversiGameLiteSchema,
	ReversiGameDetailed: packedReversiGameDetailedSchema,
	MetaLite: packedMetaLiteSchema,
	MetaDetailedOnly: packedMetaDetailedOnlySchema,
	MetaDetailed: packedMetaDetailedSchema,
	SystemWebhook: packedSystemWebhookSchema,
	AbuseReportNotificationRecipient: packedAbuseReportNotificationRecipientSchema,
};

export type Packed<x extends keyof typeof refs> = SchemaType<typeof refs[x]>;

export type KeyOf<x extends keyof typeof refs> = PropertiesToUnion<typeof refs[x]>;
type PropertiesToUnion<p extends Schema> = p['properties'] extends NonNullable<Obj> ? keyof p['properties'] : never;

type TypeStringef = 'null' | 'boolean' | 'integer' | 'number' | 'string' | 'array' | 'object' | 'any';
type StringDefToType<T extends TypeStringef> =
	T extends 'null' ? null :
	T extends 'boolean' ? boolean :
	T extends 'integer' ? number :
	T extends 'number' ? number :
	T extends 'string' ? string | Date :
	T extends 'array' ? ReadonlyArray<any> :
	T extends 'object' ? Record<string, any> :
	any;

// https://swagger.io/specification/?sbsearch=optional#schema-object
type OfSchema = {
	readonly anyOf?: ReadonlyArray<Schema>;
	readonly oneOf?: ReadonlyArray<Schema>;
	readonly allOf?: ReadonlyArray<Schema>;
}

export interface Schema extends OfSchema {
	readonly type?: TypeStringef;
	readonly nullable?: boolean;
	readonly optional?: boolean;
	readonly prefixItems?: ReadonlyArray<Schema>;
	readonly items?: Schema;
	readonly unevaluatedItems?: Schema | boolean;
	readonly properties?: Obj;
	readonly required?: ReadonlyArray<Extract<keyof NonNullable<this['properties']>, string>>;
	readonly description?: string;
	readonly example?: any;
	readonly format?: string;
	readonly ref?: keyof typeof refs;
	readonly selfRef?: boolean;
	readonly enum?: ReadonlyArray<string | null>;
	readonly default?: (this['type'] extends TypeStringef ? StringDefToType<this['type']> : any) | null;
	readonly maxLength?: number;
	readonly minLength?: number;
	readonly maximum?: number;
	readonly minimum?: number;
	readonly pattern?: string;
}

type RequiredPropertyNames<s extends Obj> = {
	[K in keyof s]:
		// K is not optional
		s[K]['optional'] extends false ? K :
		// K has default value
		s[K]['default'] extends null | string | number | boolean | Record<string, unknown> ? K :
		never
}[keyof s];

export type Obj = Record<string, Schema>;

// https://github.com/misskey-dev/misskey/issues/8535
// To avoid excessive stack depth error,
// deceive TypeScript with UnionToIntersection (or more precisely, `infer` expression within it).
export type ObjType<s extends Obj, RequiredProps extends ReadonlyArray<keyof s>> =
	UnionToIntersection<
		{ -readonly [R in RequiredPropertyNames<s>]-?: SchemaType<s[R]> } &
		{ -readonly [R in RequiredProps[number]]-?: SchemaType<s[R]> } &
		{ -readonly [P in keyof s]?: SchemaType<s[P]> }
	>;

type NullOrUndefined<p extends Schema, T> =
	| (p['nullable'] extends true ? null : never)
	| (p['optional'] extends true ? undefined : never)
	| T;

// https://stackoverflow.com/questions/54938141/typescript-convert-union-to-intersection
// Get intersection from union
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;
type PartialIntersection<T> = Partial<UnionToIntersection<T>>;

// https://github.com/misskey-dev/misskey/pull/8144#discussion_r785287552
// To get union, we use `Foo extends any ? Hoge<Foo> : never`
type UnionSchemaType<a extends readonly any[], X extends Schema = a[number]> = X extends any ? SchemaType<X> : never;
//type UnionObjectSchemaType<a extends readonly any[], X extends Schema = a[number]> = X extends any ? ObjectSchemaType<X> : never;
type UnionObjType<s extends Obj, a extends readonly any[], X extends ReadonlyArray<keyof s> = a[number]> = X extends any ? ObjType<s, X> : never;
type ArrayUnion<T> = T extends any ? Array<T> : never;
type ArrayToTuple<X extends ReadonlyArray<Schema>> = { [K in keyof X]: SchemaType<X[K]> };

type ObjectSchemaTypeDef<p extends Schema> =
	p['ref'] extends keyof typeof refs ? Packed<p['ref']> :
	p['properties'] extends NonNullable<Obj> ?
		p['anyOf'] extends ReadonlyArray<Schema> ? p['anyOf'][number]['required'] extends ReadonlyArray<keyof p['properties']> ?
			UnionObjType<p['properties'], NonNullable<p['anyOf'][number]['required']>> & ObjType<p['properties'], NonNullable<p['required']>>
			: never
			: ObjType<p['properties'], NonNullable<p['required']>>
	:
	p['anyOf'] extends ReadonlyArray<Schema> ? never : // see CONTRIBUTING.md
	p['allOf'] extends ReadonlyArray<Schema> ? UnionToIntersection<UnionSchemaType<p['allOf']>> :
	any

type ObjectSchemaType<p extends Schema> = NullOrUndefined<p, ObjectSchemaTypeDef<p>>;

export type SchemaTypeDef<p extends Schema> =
	p['type'] extends 'null' ? null :
	p['type'] extends 'integer' ? number :
	p['type'] extends 'number' ? number :
	p['type'] extends 'string' ? (
		p['enum'] extends readonly (string | null)[] ?
		p['enum'][number] :
		p['format'] extends 'date-time' ? string : // Dateにする？？
		string
	) :
	p['type'] extends 'boolean' ? boolean :
	p['type'] extends 'object' ? ObjectSchemaTypeDef<p> :
	p['type'] extends 'array' ? (
		p['items'] extends OfSchema ? (
			p['items']['anyOf'] extends ReadonlyArray<Schema> ? UnionSchemaType<NonNullable<p['items']['anyOf']>>[] :
			p['items']['oneOf'] extends ReadonlyArray<Schema> ? ArrayUnion<UnionSchemaType<NonNullable<p['items']['oneOf']>>> :
			p['items']['allOf'] extends ReadonlyArray<Schema> ? UnionToIntersection<UnionSchemaType<NonNullable<p['items']['allOf']>>>[] :
			never
		) :
		p['prefixItems'] extends ReadonlyArray<Schema> ? (
			p['items'] extends NonNullable<Schema> ? [...ArrayToTuple<p['prefixItems']>, ...SchemaType<p['items']>[]] :
			p['items'] extends false ? ArrayToTuple<p['prefixItems']> :
			p['unevaluatedItems'] extends false ? ArrayToTuple<p['prefixItems']> :
			[...ArrayToTuple<p['prefixItems']>, ...unknown[]]
		) :
		p['items'] extends NonNullable<Schema> ? SchemaType<p['items']>[] :
		any[]
	) :
	p['anyOf'] extends ReadonlyArray<Schema> ? UnionSchemaType<p['anyOf']> & PartialIntersection<UnionSchemaType<p['anyOf']>> :
	p['oneOf'] extends ReadonlyArray<Schema> ? UnionSchemaType<p['oneOf']> :
	any;

export type SchemaType<p extends Schema> = NullOrUndefined<p, SchemaTypeDef<p>>;
