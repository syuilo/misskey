/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { bindThis } from '@/decorators.js';
import { isInstanceMuted } from '@/misc/is-instance-muted.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import { isQuotePacked, isRenotePacked } from '@/misc/is-renote.js';
import type { Packed } from '@/misc/json-schema.js';
import { isChannelRelated } from '@/misc/is-channel-related.js';
import type Connection from './Connection.js';

/**
 * Stream channel
 */
// eslint-disable-next-line import/no-default-export
export default abstract class Channel {
	protected connection: Connection;
	public id: string;
	public abstract readonly chName: string;
	public static readonly shouldShare: boolean;
	public static readonly requireCredential: boolean;
	public static readonly kind?: string | null;

	protected get user() {
		return this.connection.user;
	}

	protected get userProfile() {
		return this.connection.userProfile;
	}

	protected get following() {
		return this.connection.following;
	}

	protected get userIdsWhoMeMuting() {
		return this.connection.userIdsWhoMeMuting;
	}

	protected get userIdsWhoMeMutingRenotes() {
		return this.connection.userIdsWhoMeMutingRenotes;
	}

	protected get userIdsWhoBlockingMe() {
		return this.connection.userIdsWhoBlockingMe;
	}

	protected get userMutedInstances() {
		return this.connection.userMutedInstances;
	}

	protected get followingChannels() {
		return this.connection.followingChannels;
	}

	protected get mutingChannels() {
		return this.connection.mutingChannels;
	}

	protected get subscriber() {
		return this.connection.subscriber;
	}

	/*
	 * ミュートとブロックされてるを処理する
	 */
	protected isNoteMutedOrBlocked(note: Packed<'Note'>): boolean {
		// 流れてきたNoteがインスタンスミュートしたインスタンスが関わる
		if (isInstanceMuted(note, new Set<string>(this.userProfile?.mutedInstances ?? []))) return true;

		// 流れてきたNoteがミュートしているユーザーが関わる
		if (isUserRelated(note, this.userIdsWhoMeMuting)) return true;
		// 流れてきたNoteがブロックされているユーザーが関わる
		if (isUserRelated(note, this.userIdsWhoBlockingMe)) return true;

		// 流れてきたNoteがリノートをミュートしてるユーザが行ったもの
		if (isRenotePacked(note) && !isQuotePacked(note) && this.userIdsWhoMeMutingRenotes.has(note.user.id)) return true;

		// 流れてきたNoteがミュートしているチャンネルと関わる
		if (isChannelRelated(note, this.mutingChannels)) return true;

		return false;
	}

	constructor(id: string, connection: Connection) {
		this.id = id;
		this.connection = connection;
	}

	@bindThis
	public send(typeOrPayload: any, payload?: any) {
		const type = payload === undefined ? typeOrPayload.type : typeOrPayload;
		const body = payload === undefined ? typeOrPayload.body : payload;

		this.connection.sendMessageToWs('channel', {
			id: this.id,
			type: type,
			body: body,
		});
	}

	public abstract init(params: any): void;

	public dispose?(): void;

	public onMessage?(type: string, body: any): void;
}

export type MiChannelService<T extends boolean> = {
	shouldShare: boolean;
	requireCredential: T;
	kind: T extends true ? string : string | null | undefined;
	create: (id: string, connection: Connection) => Channel;
}
