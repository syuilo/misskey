/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { noteVisibilities, noteReactionAcceptances } from '@/types.js';
import { DI } from '@/di-symbols.js';
import type { MiNoteDraft, NoteDraftsRepository, MiNote, MiDriveFile, MiChannel } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { RoleService } from '@/core/RoleService.js';
import { IdService } from '@/core/IdService.js';
import type { MiLocalUser, MiUser } from '@/models/User.js';
import { IPoll } from '@/models/Poll.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';

export type NoteDraftOptions = {
	reply?: MiNote | null;
	renote?: MiNote | null;
	text?: string | null;
	cw?: string | null;
	localOnly?: boolean | null;
	reactionAcceptance?: typeof noteReactionAcceptances[number];
	visibility?: typeof noteVisibilities[number];
	files? : MiDriveFile[];
	visibleUsers?: MiUser[];
	hashtag?: string;
	channel?: MiChannel | null;
	poll?: (IPoll & { expiredAfter?: number | null }) | null;
};

@Injectable()
export class NoteDraftService {
	constructor(
		@Inject(DI.noteDraftsRepository)
		private noteDraftsRepository: NoteDraftsRepository,

		private roleService: RoleService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async get(me: MiLocalUser, draftId: MiNoteDraft['id']): Promise<MiNoteDraft | null> {
		const draft = await this.noteDraftsRepository.findOneBy({
			id: draftId,
			userId: me.id,
		});

		return draft;
	}

	@bindThis
	public async create(me: MiLocalUser, data: NoteDraftOptions): Promise<MiNoteDraft> {
		if (data.visibility == null) data.visibility = 'public';
		if (data.localOnly == null) data.localOnly = false;
		if (data.reactionAcceptance === undefined) data.reactionAcceptance = null;
		if (data.channel != null) {
			data.visibility = 'public';
			data.visibleUsers = [];
			data.localOnly = true;
		}

		const currentCount = await this.noteDraftsRepository.countBy({
			userId: me.id,
		});
		if (currentCount >= (await this.roleService.getUserPolicies(me.id)).noteDraftLimit) {
			throw new IdentifiableError('c9a2c1d8-d153-40be-9cac-9fc2eb56b581', 'Too many drafts');
		}

		const draft = await this.noteDraftsRepository.insertOne({
			id: this.idService.gen(),
			visibility: data.visibility,
			cw: data.cw,
			fileIds: data.files ? data.files.map(file => file.id) : [],
			replyId: data.reply ? data.reply.id : null,
			renoteId: data.renote ? data.renote.id : null,
			channelId: data.channel ? data.channel.id : null,
			text: data.text ?? null,
			hashtag: data.hashtag,
			hasPoll: data.poll != null,
			pollChoices: data.poll ? data.poll.choices : [],
			pollMultiple: data.poll ? data.poll.multiple : false,
			pollExpiresAt: data.poll ? data.poll.expiresAt : null,
			pollExpiredAfter: data.poll ? data.poll.expiredAfter : null,
			localOnly: data.localOnly,
			visibleUserIds: data.visibleUsers ? data.visibleUsers.map(user => user.id) : [],
			userId: me.id,
		});

		return draft;
	}

	@bindThis
	public async update(me: MiLocalUser, draftId: MiNoteDraft['id'], data: NoteDraftOptions): Promise<void> {
		if (data.visibility == null) data.visibility = 'public';
		if (data.localOnly == null) data.localOnly = false;
		if (data.reactionAcceptance === undefined) data.reactionAcceptance = null;
		if (data.channel != null) {
			data.visibility = 'public';
			data.visibleUsers = [];
			data.localOnly = true;
		}

		const draft = await this.noteDraftsRepository.findOneBy({
			id: draftId,
			userId: me.id,
		});

		if (draft == null) {
			throw new IdentifiableError('03a9514d-ff73-4c48-a55a-0282c8311ec6', 'No such note draft');
		}

		await this.noteDraftsRepository.update(draft.id, {
			visibility: data.visibility,
			cw: data.cw,
			fileIds: data.files ? data.files.map(file => file.id) : [],
			replyId: data.reply ? data.reply.id : null,
			renoteId: data.renote ? data.renote.id : null,
			channelId: data.channel ? data.channel.id : null,
			text: data.text ?? null,
			hashtag: data.hashtag,
			hasPoll: data.poll != null,
			pollChoices: data.poll ? data.poll.choices : [],
			pollMultiple: data.poll ? data.poll.multiple : false,
			pollExpiresAt: data.poll ? data.poll.expiresAt : null,
			pollExpiredAfter: data.poll ? data.poll.expiredAfter : null,
			visibleUserIds: data.visibleUsers ? data.visibleUsers.map(user => user.id) : [],
			localOnly: data.localOnly,
		});
	}

	@bindThis
	public async delete(me: MiLocalUser, draftId: MiNoteDraft['id']): Promise<void> {
		const draft = await this.noteDraftsRepository.findOneBy({
			id: draftId,
			userId: me.id,
		});

		if (draft == null) {
			throw new IdentifiableError('03a9514d-ff73-4c48-a55a-0282c8311ec6', 'No such note draft');
		}

		await this.noteDraftsRepository.delete(draft.id);
	}
}
