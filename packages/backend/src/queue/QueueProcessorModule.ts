/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Module } from '@nestjs/common';
import { LocalUserDeliverProcessorService } from '@/queue/processors/LocalUserDeliverProcessorService.js';
import { CoreModule } from '@/core/CoreModule.js';
import { GlobalModule } from '@/GlobalModule.js';
import { CheckModeratorsActivityProcessorService } from '@/queue/processors/CheckModeratorsActivityProcessorService.js';
import { QueueLoggerService } from './QueueLoggerService.js';
import { QueueProcessorService } from './QueueProcessorService.js';
import { DeliverProcessorService } from './processors/DeliverProcessorService.js';
import { EndedPollNotificationProcessorService } from './processors/EndedPollNotificationProcessorService.js';
import { InboxProcessorService } from './processors/InboxProcessorService.js';
import { UserWebhookDeliverProcessorService } from './processors/UserWebhookDeliverProcessorService.js';
import { SystemWebhookDeliverProcessorService } from './processors/SystemWebhookDeliverProcessorService.js';
import { CheckExpiredMutingsProcessorService } from './processors/CheckExpiredMutingsProcessorService.js';
import { BakeBufferedReactionsProcessorService } from './processors/BakeBufferedReactionsProcessorService.js';
import { CleanChartsProcessorService } from './processors/CleanChartsProcessorService.js';
import { CleanProcessorService } from './processors/CleanProcessorService.js';
import { CleanRemoteFilesProcessorService } from './processors/CleanRemoteFilesProcessorService.js';
import { DeleteAccountProcessorService } from './processors/DeleteAccountProcessorService.js';
import { DeleteDriveFilesProcessorService } from './processors/DeleteDriveFilesProcessorService.js';
import { DeleteFileProcessorService } from './processors/DeleteFileProcessorService.js';
import { ExportBlockingProcessorService } from './processors/ExportBlockingProcessorService.js';
import { ExportCustomEmojisProcessorService } from './processors/ExportCustomEmojisProcessorService.js';
import { ExportFollowingProcessorService } from './processors/ExportFollowingProcessorService.js';
import { ExportMutingProcessorService } from './processors/ExportMutingProcessorService.js';
import { ExportNotesProcessorService } from './processors/ExportNotesProcessorService.js';
import { ExportClipsProcessorService } from './processors/ExportClipsProcessorService.js';
import { ExportUserListsProcessorService } from './processors/ExportUserListsProcessorService.js';
import { ExportAntennasProcessorService } from './processors/ExportAntennasProcessorService.js';
import { ImportBlockingProcessorService } from './processors/ImportBlockingProcessorService.js';
import { ImportCustomEmojisProcessorService } from './processors/ImportCustomEmojisProcessorService.js';
import { ImportFollowingProcessorService } from './processors/ImportFollowingProcessorService.js';
import { ImportMutingProcessorService } from './processors/ImportMutingProcessorService.js';
import { ImportUserListsProcessorService } from './processors/ImportUserListsProcessorService.js';
import { ImportAntennasProcessorService } from './processors/ImportAntennasProcessorService.js';
import { ResyncChartsProcessorService } from './processors/ResyncChartsProcessorService.js';
import { TickChartsProcessorService } from './processors/TickChartsProcessorService.js';
import { AggregateRetentionProcessorService } from './processors/AggregateRetentionProcessorService.js';
import { ExportFavoritesProcessorService } from './processors/ExportFavoritesProcessorService.js';
import { RelationshipProcessorService } from './processors/RelationshipProcessorService.js';

@Module({
	imports: [
		GlobalModule,
		CoreModule,
	],
	providers: [
		QueueLoggerService,
		TickChartsProcessorService,
		ResyncChartsProcessorService,
		CleanChartsProcessorService,
		CheckExpiredMutingsProcessorService,
		BakeBufferedReactionsProcessorService,
		CleanProcessorService,
		DeleteDriveFilesProcessorService,
		ExportCustomEmojisProcessorService,
		ExportNotesProcessorService,
		ExportClipsProcessorService,
		ExportFavoritesProcessorService,
		ExportFollowingProcessorService,
		ExportMutingProcessorService,
		ExportBlockingProcessorService,
		ExportUserListsProcessorService,
		ExportAntennasProcessorService,
		ImportFollowingProcessorService,
		ImportMutingProcessorService,
		ImportBlockingProcessorService,
		ImportUserListsProcessorService,
		ImportCustomEmojisProcessorService,
		ImportAntennasProcessorService,
		DeleteAccountProcessorService,
		DeleteFileProcessorService,
		CleanRemoteFilesProcessorService,
		RelationshipProcessorService,
		UserWebhookDeliverProcessorService,
		SystemWebhookDeliverProcessorService,
		EndedPollNotificationProcessorService,
		DeliverProcessorService,
		InboxProcessorService,
		AggregateRetentionProcessorService,
		CheckExpiredMutingsProcessorService,
		CheckModeratorsActivityProcessorService,
		LocalUserDeliverProcessorService,
		QueueProcessorService,
	],
	exports: [
		QueueProcessorService,
	],
})
export class QueueProcessorModule {}
