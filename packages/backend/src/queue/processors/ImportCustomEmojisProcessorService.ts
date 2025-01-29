/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import { Inject, Injectable } from '@nestjs/common';
import { ZipReader } from 'slacc';
import { DI } from '@/di-symbols.js';
import type { EmojisRepository, DriveFilesRepository } from '@/models/_.js';
import type Logger from '@/logger.js';
import { CustomEmojiService } from '@/core/CustomEmojiService.js';
import { createTempDir } from '@/misc/create-temp.js';
import { DriveService } from '@/core/DriveService.js';
import { DownloadService } from '@/core/DownloadService.js';
import { bindThis } from '@/decorators.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type * as Bull from 'bullmq';
import type { DbUserImportJobData } from '../types.js';

// TODO: 名前衝突時の動作を選べるようにする
@Injectable()
export class ImportCustomEmojisProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.emojisRepository)
		private emojisRepository: EmojisRepository,

		private customEmojiService: CustomEmojiService,
		private driveService: DriveService,
		private downloadService: DownloadService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('import-custom-emojis');
	}

	@bindThis
	public async process(job: Bull.Job<DbUserImportJobData>): Promise<void> {
		this.logger.info('Importing custom emojis ...');

		const file = await this.driveFilesRepository.findOneBy({
			id: job.data.fileId,
		});
		if (file == null) {
			return;
		}

		const [path, cleanup] = await createTempDir();

		this.logger.info(`Temp dir is ${path}`);

		const destPath = path + '/emojis.zip';

		try {
			fs.writeFileSync(destPath, '', 'binary');
			await this.downloadService.downloadUrl(file.url, destPath);
		} catch (e) { // TODO: 何度か再試行
			if (e instanceof Error || typeof e === 'string') {
				this.logger.error(e);
			}
			throw e;
		}

		const outputPath = path + '/emojis';
		try {
			this.logger.succ(`Unzipping to ${outputPath}`);
			ZipReader.withDestinationPath(outputPath).viaBuffer(await fs.promises.readFile(destPath));
			const metaRaw = fs.readFileSync(outputPath + '/meta.json', 'utf-8');
			const meta = JSON.parse(metaRaw);

			for (const record of meta.emojis) {
				if (!record.downloaded) continue;
				if (!/^[a-zA-Z0-9_]+?([a-zA-Z0-9\.]+)?$/.test(record.fileName)) {
					this.logger.error(`invalid filename: ${record.fileName}`);
					continue;
				}
				const emojiInfo = record.emoji;
				if (!/^[a-zA-Z0-9_]+$/.test(emojiInfo.name)) {
					this.logger.error(`invalid emojiname: ${emojiInfo.name}`);
					continue;
				}
				const emojiPath = outputPath + '/' + record.fileName;
				await this.emojisRepository.delete({
					name: emojiInfo.name,
				});

				try {
					const driveFile = await this.driveService.addFile({
						user: null,
						path: emojiPath,
						name: record.fileName,
						force: true,
					});
					await this.customEmojiService.add({
						originalUrl: driveFile.url,
						publicUrl: driveFile.webpublicUrl ?? driveFile.url,
						fileType: driveFile.webpublicType ?? driveFile.type,
						name: emojiInfo.name,
						category: emojiInfo.category,
						host: null,
						aliases: emojiInfo.aliases,
						license: emojiInfo.license,
						isSensitive: emojiInfo.isSensitive,
						localOnly: emojiInfo.localOnly,
						roleIdsThatCanBeUsedThisEmojiAsReaction: [],
					});
				} catch (e) {
					if (e instanceof Error || typeof e === 'string') {
						this.logger.error(`couldn't import ${emojiPath} for ${emojiInfo.name}: ${e}`);
					}
					continue;
				}
			}

			cleanup();

			this.logger.succ('Imported');
		} catch (e) {
			if (e instanceof Error || typeof e === 'string') {
				this.logger.error(e);
			}
			cleanup();
			throw e;
		}
	}
}
