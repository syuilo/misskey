import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import { DriveFiles } from '@/models/index.js';
import type { Pages , PageLikes } from '@/models/index.js';
import { awaitAll } from '@/prelude/await-all.js';
import type { Packed } from '@/misc/schema.js';
import type { } from '@/models/entities/blocking.js';
import type { User } from '@/models/entities/user.js';
import type { Page } from '@/models/entities/page.js';
import type { DriveFile } from '@/models/entities/drive-file.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class PageEntityService {
	constructor(
		@Inject('pagesRepository')
		private pagesRepository: typeof Pages,

		@Inject('pageLikesRepository')
		private pageLikesRepository: typeof PageLikes,

		@Inject('driveFilesRepository')
		private driveFilesRepository: typeof DriveFiles,

		private userEntityService: UserEntityService,
	) {
	}

	public async pack(
		src: Page['id'] | Page,
		me?: { id: User['id'] } | null | undefined,
	): Promise<Packed<'Page'>> {
		const meId = me ? me.id : null;
		const page = typeof src === 'object' ? src : await this.pagesRepository.findOneByOrFail({ id: src });

		const attachedFiles: Promise<DriveFile | null>[] = [];
		const collectFile = (xs: any[]) => {
			for (const x of xs) {
				if (x.type === 'image') {
					attachedFiles.push(this.driveFilesRepository.findOneBy({
						id: x.fileId,
						userId: page.userId,
					}));
				}
				if (x.children) {
					collectFile(x.children);
				}
			}
		};
		collectFile(page.content);

		// 後方互換性のため
		let migrated = false;
		const migrate = (xs: any[]) => {
			for (const x of xs) {
				if (x.type === 'input') {
					if (x.inputType === 'text') {
						x.type = 'textInput';
					}
					if (x.inputType === 'number') {
						x.type = 'numberInput';
						if (x.default) x.default = parseInt(x.default, 10);
					}
					migrated = true;
				}
				if (x.children) {
					migrate(x.children);
				}
			}
		};
		migrate(page.content);
		if (migrated) {
			this.pagesRepository.update(page.id, {
				content: page.content,
			});
		}

		return await awaitAll({
			id: page.id,
			createdAt: page.createdAt.toISOString(),
			updatedAt: page.updatedAt.toISOString(),
			userId: page.userId,
			user: this.userEntityService.pack(page.user || page.userId, me), // { detail: true } すると無限ループするので注意
			content: page.content,
			variables: page.variables,
			title: page.title,
			name: page.name,
			summary: page.summary,
			hideTitleWhenPinned: page.hideTitleWhenPinned,
			alignCenter: page.alignCenter,
			font: page.font,
			script: page.script,
			eyeCatchingImageId: page.eyeCatchingImageId,
			eyeCatchingImage: page.eyeCatchingImageId ? await DriveFiles.pack(page.eyeCatchingImageId) : null,
			attachedFiles: DriveFiles.packMany((await Promise.all(attachedFiles)).filter((x): x is DriveFile => x != null)),
			likedCount: page.likedCount,
			isLiked: meId ? await this.pageLikesRepository.findOneBy({ pageId: page.id, userId: meId }).then(x => x != null) : undefined,
		});
	}

	public packMany(
		pages: Page[],
		me?: { id: User['id'] } | null | undefined,
	) {
		return Promise.all(pages.map(x => this.pack(x, me)));
	}
}

