import { Inject, Injectable } from '@/di-decorators.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type Logger from '@/logger.js';
import FederationChart from '@/core/chart/charts/federation.js';
import NotesChart from '@/core/chart/charts/notes.js';
import UsersChart from '@/core/chart/charts/users.js';
import ActiveUsersChart from '@/core/chart/charts/active-users.js';
import InstanceChart from '@/core/chart/charts/instance.js';
import PerUserNotesChart from '@/core/chart/charts/per-user-notes.js';
import PerUserPvChart from '@/core/chart/charts/per-user-pv.js';
import DriveChart from '@/core/chart/charts/drive.js';
import PerUserReactionsChart from '@/core/chart/charts/per-user-reactions.js';
import PerUserFollowingChart from '@/core/chart/charts/per-user-following.js';
import PerUserDriveChart from '@/core/chart/charts/per-user-drive.js';
import ApRequestChart from '@/core/chart/charts/ap-request.js';
import { bindThis } from '@/decorators.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type Bull from 'bull';

@Injectable()
export class TickChartsProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.FederationChart)
		private federationChart: FederationChart,

		@Inject(DI.NotesChart)
		private notesChart: NotesChart,

		@Inject(DI.UsersChart)
		private usersChart: UsersChart,

		@Inject(DI.ActiveUsersChart)
		private activeUsersChart: ActiveUsersChart,

		@Inject(DI.InstanceChart)
		private instanceChart: InstanceChart,

		@Inject(DI.PerUserNotesChart)
		private perUserNotesChart: PerUserNotesChart,

		@Inject(DI.PerUserPvChart)
		private perUserPvChart: PerUserPvChart,

		@Inject(DI.DriveChart)
		private driveChart: DriveChart,

		@Inject(DI.PerUserReactionsChart)
		private perUserReactionsChart: PerUserReactionsChart,

		@Inject(DI.PerUserFollowingChart)
		private perUserFollowingChart: PerUserFollowingChart,

		@Inject(DI.PerUserDriveChart)
		private perUserDriveChart: PerUserDriveChart,

		@Inject(DI.ApRequestChart)
		private apRequestChart: ApRequestChart,

		@Inject(DI.QueueLoggerService)
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('tick-charts');
	}

	@bindThis
	public async process(job: Bull.Job<Record<string, unknown>>, done: () => void): Promise<void> {
		this.logger.info('Tick charts...');

		await Promise.all([
			this.federationChart.tick(false),
			this.notesChart.tick(false),
			this.usersChart.tick(false),
			this.activeUsersChart.tick(false),
			this.instanceChart.tick(false),
			this.perUserNotesChart.tick(false),
			this.perUserPvChart.tick(false),
			this.driveChart.tick(false),
			this.perUserReactionsChart.tick(false),
			this.perUserFollowingChart.tick(false),
			this.perUserDriveChart.tick(false),
			this.apRequestChart.tick(false),
		]);

		this.logger.succ('All charts successfully ticked.');
		done();
	}
}
