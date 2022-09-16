import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { AntennaNotes, Antennas, UserGroupJoinings } from '@/models/index.js';
import { awaitAll } from '@/prelude/await-all.js';
import type { Packed } from '@/misc/schema.js';
import type { Antenna } from '@/models/entities/Antenna.js';

@Injectable()
export class AntennaEntityService {
	constructor(
		@Inject(DI.antennasRepository)
		private antennasRepository: typeof Antennas,

		@Inject(DI.antennaNotesRepository)
		private antennaNotesRepository: typeof AntennaNotes,

		@Inject(DI.userGroupJoiningsRepository)
		private userGroupJoiningsRepository: typeof UserGroupJoinings,
	) {
	}

	public async pack(
		src: Antenna['id'] | Antenna,
	): Promise<Packed<'Antenna'>> {
		const antenna = typeof src === 'object' ? src : await this.antennasRepository.findOneByOrFail({ id: src });

		const hasUnreadNote = (await this.antennaNotesRepository.findOneBy({ antennaId: antenna.id, read: false })) != null;
		const userGroupJoining = antenna.userGroupJoiningId ? await this.userGroupJoiningsRepository.findOneBy({ id: antenna.userGroupJoiningId }) : null;

		return {
			id: antenna.id,
			createdAt: antenna.createdAt.toISOString(),
			name: antenna.name,
			keywords: antenna.keywords,
			excludeKeywords: antenna.excludeKeywords,
			src: antenna.src,
			userListId: antenna.userListId,
			userGroupId: userGroupJoining ? userGroupJoining.userGroupId : null,
			users: antenna.users,
			caseSensitive: antenna.caseSensitive,
			notify: antenna.notify,
			withReplies: antenna.withReplies,
			withFile: antenna.withFile,
			hasUnreadNote,
		};
	}
}
