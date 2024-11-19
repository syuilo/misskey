/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { Packed } from '@/misc/json-schema.js';
import type { MiInstance } from '@/models/Instance.js';
import { bindThis } from '@/decorators.js';
import { UtilityService } from '@/core/UtilityService.js';
import { RoleService } from '@/core/RoleService.js';
import { MiUser } from '@/models/User.js';
import { DI } from '@/di-symbols.js';
import { MiMeta } from '@/models/_.js';

@Injectable()
export class InstanceEntityService {
	constructor(
		@Inject(DI.meta)
		private meta: MiMeta,

		private roleService: RoleService,

		private utilityService: UtilityService,
	) {
	}

	@bindThis
	public async pack(
		instance: MiInstance,
		me?: { id: MiUser['id']; } | null | undefined,
	): Promise<Packed<'FederationInstance'>> {
		const iAmModerator = me ? await this.roleService.isModerator(me as MiUser) : false;

		return {
			id: instance.id,
			firstRetrievedAt: instance.firstRetrievedAt.toISOString(),
			host: instance.host,
			usersCount: instance.usersCount,
			notesCount: instance.notesCount,
			followingCount: instance.followingCount,
			followersCount: instance.followersCount,
			isNotResponding: instance.isNotResponding,
			isSuspended: instance.suspensionState !== 'none',
			suspensionState: instance.suspensionState,
			isBlocked: this.utilityService.isBlockedHost(this.meta.blockedHosts, instance.host),
			softwareName: instance.softwareName,
			softwareVersion: instance.softwareVersion,
			openRegistrations: instance.openRegistrations,
			name: instance.name,
			description: instance.description,
			maintainerName: instance.maintainerName,
			maintainerEmail: instance.maintainerEmail,
			isSilenced: this.utilityService.isSilencedHost(this.meta.silencedHosts, instance.host),
			isMediaSilenced: this.utilityService.isMediaSilencedHost(this.meta.mediaSilencedHosts, instance.host),
			iconUrl: instance.iconUrl,
			faviconUrl: instance.faviconUrl,
			themeColor: instance.themeColor,
			infoUpdatedAt: instance.infoUpdatedAt ? instance.infoUpdatedAt.toISOString() : null,
			latestRequestReceivedAt: instance.latestRequestReceivedAt ? instance.latestRequestReceivedAt.toISOString() : null,
			moderationNote: iAmModerator ? instance.moderationNote : null,
			httpMessageSignaturesImplementationLevel: instance.httpMessageSignaturesImplementationLevel,
		};
	}

	@bindThis
	public packMany(
		instances: MiInstance[],
		me?: { id: MiUser['id']; } | null | undefined,
	) {
		return Promise.all(instances.map(x => this.pack(x, me)));
	}
}

