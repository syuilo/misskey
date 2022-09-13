import { Inject, Injectable } from '@nestjs/common';
import { IsNull, MoreThan } from 'typeorm';
import { DI_SYMBOLS } from '@/di-symbols.js';
import type { DriveFiles , UserListJoinings , UserLists } from '@/models/index.js';
import { Users } from '@/models/index.js';
import type { Config } from '@/config/types.js';
import type Logger from '@/logger.js';
import { isSelfHost, toPuny } from '@/misc/convert-host.js';
import * as Acct from '@/misc/acct.js';
import type { ResolveUserService } from '@/services/remote/ResolveUserService.js';
import type { DownloadService } from '@/services/DownloadService.js';
import type { UserListService } from '@/services/UserListService.js';
import type { IdService } from '@/services/IdService.js';
import type Bull from 'bull';
import type { DbUserImportJobData } from '../types.js';
import type { QueueLoggerService } from '../QueueLoggerService.js';

@Injectable()
export class ImportUserListsProcessorService {
	#logger: Logger;

	constructor(
		@Inject(DI_SYMBOLS.config)
		private config: Config,

		@Inject('usersRepository')
		private usersRepository: typeof Users,

		@Inject('driveFilesRepository')
		private driveFilesRepository: typeof DriveFiles,

		@Inject('userListsRepository')
		private userListsRepository: typeof UserLists,

		@Inject('userListJoiningsRepository')
		private userListJoiningsRepository: typeof UserListJoinings,

		private idService: IdService,
		private userListService: UserListService,
		private resolveUserService: ResolveUserService,
		private downloadService: DownloadService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.queueLoggerService.logger.createSubLogger('import-user-lists');
	}

	public async process(job: Bull.Job<DbUserImportJobData>, done: () => void): Promise<void> {
		this.#logger.info(`Importing user lists of ${job.data.user.id} ...`);

		const user = await this.usersRepository.findOneBy({ id: job.data.user.id });
		if (user == null) {
			done();
			return;
		}

		const file = await this.driveFilesRepository.findOneBy({
			id: job.data.fileId,
		});
		if (file == null) {
			done();
			return;
		}

		const csv = await this.downloadService.downloadTextFile(file.url);

		let linenum = 0;

		for (const line of csv.trim().split('\n')) {
			linenum++;

			try {
				const listName = line.split(',')[0].trim();
				const { username, host } = Acct.parse(line.split(',')[1].trim());

				let list = await this.userListsRepository.findOneBy({
					userId: user.id,
					name: listName,
				});

				if (list == null) {
					list = await this.userListsRepository.insert({
						id: this.idService.genId(),
						createdAt: new Date(),
						userId: user.id,
						name: listName,
					}).then(x => this.userListsRepository.findOneByOrFail(x.identifiers[0]));
				}

				let target = isSelfHost(host!) ? await Users.findOneBy({
					host: IsNull(),
					usernameLower: username.toLowerCase(),
				}) : await Users.findOneBy({
					host: toPuny(host!),
					usernameLower: username.toLowerCase(),
				});

				if (target == null) {
					target = await this.resolveUserService.resolveUser(username, host);
				}

				if (await this.userListJoiningsRepository.findOneBy({ userListId: list!.id, userId: target.id }) != null) continue;

				this.userListService.push(target, list!);
			} catch (e) {
				this.#logger.warn(`Error in line:${linenum} ${e}`);
			}
		}

		this.#logger.succ('Imported');
		done();
	}
}
