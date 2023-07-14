import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { DriveFilesRepository } from '@/models/index.js';
import type { RemoteUser } from '@/models/entities/User.js';
import type { DriveFile } from '@/models/entities/DriveFile.js';
import { MetaService } from '@/core/MetaService.js';
import { truncate } from '@/misc/truncate.js';
import { DB_MAX_IMAGE_COMMENT_LENGTH } from '@/const.js';
import { DriveService } from '@/core/DriveService.js';
import type Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';
import { checkHttps } from '@/misc/check-https.js';
import { ApResolverService } from '../ApResolverService.js';
import { ApLoggerService } from '../ApLoggerService.js';
import type { IObject } from '../type.js';

@Injectable()
export class ApImageService {
	private logger: Logger;

	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private metaService: MetaService,
		private apResolverService: ApResolverService,
		private driveService: DriveService,
		private apLoggerService: ApLoggerService,
	) {
		this.logger = this.apLoggerService.logger;
	}

	/**
	 * Imageを作成します。
	 */
	@bindThis
	public async createImage(actor: RemoteUser, value: string | IObject): Promise<DriveFile> {
		// 投稿者が凍結されていたらスキップ
		if (actor.isSuspended) {
			throw new Error('actor has been suspended');
		}

		const image = await this.apResolverService.createResolver().resolve(value);

		if (image.url == null) {
			throw new Error('invalid image: url not provided');
		}

		if (typeof image.url !== 'string') {
			throw new Error('invalid image: unexpected type of url: ' + JSON.stringify(image.url, null, 2));
		}

		if (!checkHttps(image.url)) {
			throw new Error('invalid image: unexpected schema of url: ' + image.url);
		}

		this.logger.info(`Creating the Image: ${image.url}`);

		const instance = await this.metaService.fetch();

		// Cache if remote file cache is on AND either
		// 1. remote sensitive file is also on
		// 2. or the image is not sensitive
		const shouldBeCached = instance.cacheRemoteFiles && (instance.cacheRemoteSensitiveFiles || !image.sensitive);

		const file = await this.driveService.uploadFromUrl({
			url: image.url,
			user: actor,
			uri: image.url,
			sensitive: image.sensitive,
			isLink: !shouldBeCached,
			comment: truncate(image.name ?? undefined, DB_MAX_IMAGE_COMMENT_LENGTH),
		});
		if (!file.isLink || file.url === image.url) return file;

		// URLが異なっている場合、同じ画像が以前に異なるURLで登録されていたということなので、URLを更新する
		await this.driveFilesRepository.update({ id: file.id }, { url: image.url, uri: image.url });
		return await this.driveFilesRepository.findOneByOrFail({ id: file.id });
	}

	/**
	 * Imageを解決します。
	 *
	 * Misskeyに対象のImageが登録されていればそれを返し、そうでなければ
	 * リモートサーバーからフェッチしてMisskeyに登録しそれを返します。
	 */
	@bindThis
	public async resolveImage(actor: RemoteUser, value: string | IObject): Promise<DriveFile> {
		// TODO

		// リモートサーバーからフェッチしてきて登録
		return await this.createImage(actor, value);
	}
}
