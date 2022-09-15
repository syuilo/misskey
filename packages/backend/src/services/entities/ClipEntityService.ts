import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { Clips } from '@/models/index.js';
import { awaitAll } from '@/prelude/await-all.js';
import type { Packed } from '@/misc/schema.js';
import type { } from '@/models/entities/blocking.js';
import type { User } from '@/models/entities/user.js';
import type { Clip } from '@/models/entities/clip.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class ClipEntityService {
	constructor(
		@Inject('clipsRepository')
		private clipsRepository: typeof Clips,

		private userEntityService: UserEntityService,
	) {
	}

	public async pack(
		src: Clip['id'] | Clip,
	): Promise<Packed<'Clip'>> {
		const clip = typeof src === 'object' ? src : await this.clipsRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: clip.id,
			createdAt: clip.createdAt.toISOString(),
			userId: clip.userId,
			user: this.userEntityService.pack(clip.user || clip.userId),
			name: clip.name,
			description: clip.description,
			isPublic: clip.isPublic,
		});
	}

	public packMany(
		clips: Clip[],
	) {
		return Promise.all(clips.map(x => this.pack(x)));
	}
}

