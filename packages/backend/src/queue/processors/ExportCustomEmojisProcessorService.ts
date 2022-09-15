import * as fs from 'node:fs';
import { Inject, Injectable } from '@nestjs/common';
import { IsNull, MoreThan } from 'typeorm';
import { format as dateFormat } from 'date-fns';
import { ulid } from 'ulid';
import mime from 'mime-types';
import archiver from 'archiver';
import { DI } from '@/di-symbols.js';
import type { Emojis, Users } from '@/models/index.js';
import type { Config } from '@/config.js';
import type Logger from '@/logger.js';
import type { DriveService } from '@/services/DriveService.js';
import { createTemp, createTempDir } from '@/misc/create-temp.js';
import { downloadUrl } from '@/misc/download-url.js';
import type Bull from 'bull';
import type { QueueLoggerService } from '../QueueLoggerService.js';

@Injectable()
export class ExportCustomEmojisProcessorService {
	#logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject('usersRepository')
		private usersRepository: typeof Users,

		@Inject('emojisRepository')
		private emojisRepository: typeof Emojis,

		private driveService: DriveService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.queueLoggerService.logger.createSubLogger('export-custom-emojis');
	}

	public async process(job: Bull.Job, done: () => void): Promise<void> {
		this.#logger.info('Exporting custom emojis ...');

		const user = await this.usersRepository.findOneBy({ id: job.data.user.id });
		if (user == null) {
			done();
			return;
		}

		const [path, cleanup] = await createTempDir();

		this.#logger.info(`Temp dir is ${path}`);

		const metaPath = path + '/meta.json';

		fs.writeFileSync(metaPath, '', 'utf-8');

		const metaStream = fs.createWriteStream(metaPath, { flags: 'a' });

		const writeMeta = (text: string): Promise<void> => {
			return new Promise<void>((res, rej) => {
				metaStream.write(text, err => {
					if (err) {
						this.#logger.error(err);
						rej(err);
					} else {
						res();
					}
				});
			});
		};

		await writeMeta(`{"metaVersion":2,"host":"${this.config.host}","exportedAt":"${new Date().toString()}","emojis":[`);

		const customEmojis = await this.emojisRepository.find({
			where: {
				host: IsNull(),
			},
			order: {
				id: 'ASC',
			},
		});

		for (const emoji of customEmojis) {
			const ext = mime.extension(emoji.type);
			const fileName = emoji.name + (ext ? '.' + ext : '');
			const emojiPath = path + '/' + fileName;
			fs.writeFileSync(emojiPath, '', 'binary');
			let downloaded = false;

			try {
				await downloadUrl(emoji.originalUrl, emojiPath);
				downloaded = true;
			} catch (e) { // TODO: 何度か再試行
				this.#logger.error(e instanceof Error ? e : new Error(e as string));
			}

			if (!downloaded) {
				fs.unlinkSync(emojiPath);
			}

			const content = JSON.stringify({
				fileName: fileName,
				downloaded: downloaded,
				emoji: emoji,
			});
			const isFirst = customEmojis.indexOf(emoji) === 0;

			await writeMeta(isFirst ? content : ',\n' + content);
		}

		await writeMeta(']}');

		metaStream.end();

		// Create archive
		const [archivePath, archiveCleanup] = await createTemp();
		const archiveStream = fs.createWriteStream(archivePath);
		const archive = archiver('zip', {
			zlib: { level: 0 },
		});
		archiveStream.on('close', async () => {
			this.#logger.succ(`Exported to: ${archivePath}`);

			const fileName = 'custom-emojis-' + dateFormat(new Date(), 'yyyy-MM-dd-HH-mm-ss') + '.zip';
			const driveFile = await this.driveService.addFile({ user, path: archivePath, name: fileName, force: true });

			this.#logger.succ(`Exported to: ${driveFile.id}`);
			cleanup();
			archiveCleanup();
			done();
		});
		archive.pipe(archiveStream);
		archive.directory(path, false);
		archive.finalize();
	}
}
