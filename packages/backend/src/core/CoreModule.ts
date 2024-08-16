/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Module } from '@nestjs/common';
import { FanoutTimelineEndpointService } from '@/core/FanoutTimelineEndpointService.js';
import { AbuseReportService } from '@/core/AbuseReportService.js';
import { SystemWebhookEntityService } from '@/core/entities/SystemWebhookEntityService.js';
import {
	AbuseReportNotificationRecipientEntityService,
} from '@/core/entities/AbuseReportNotificationRecipientEntityService.js';
import { AbuseReportNotificationService } from '@/core/AbuseReportNotificationService.js';
import { SystemWebhookService } from '@/core/SystemWebhookService.js';
import { UserSearchService } from '@/core/UserSearchService.js';
import { AccountMoveService } from './AccountMoveService.js';
import { AccountUpdateService } from './AccountUpdateService.js';
import { AiService } from './AiService.js';
import { AnnouncementService } from './AnnouncementService.js';
import { AntennaService } from './AntennaService.js';
import { AppLockService } from './AppLockService.js';
import { AchievementService } from './AchievementService.js';
import { AvatarDecorationService } from './AvatarDecorationService.js';
import { CaptchaService } from './CaptchaService.js';
import { CreateSystemUserService } from './CreateSystemUserService.js';
import { CustomEmojiService } from './CustomEmojiService.js';
import { DeleteAccountService } from './DeleteAccountService.js';
import { DownloadService } from './DownloadService.js';
import { DriveService } from './DriveService.js';
import { EmailService } from './EmailService.js';
import { FederatedInstanceService } from './FederatedInstanceService.js';
import { FetchInstanceMetadataService } from './FetchInstanceMetadataService.js';
import { GlobalEventService } from './GlobalEventService.js';
import { HashtagService } from './HashtagService.js';
import { HttpRequestService } from './HttpRequestService.js';
import { IdService } from './IdService.js';
import { ImageProcessingService } from './ImageProcessingService.js';
import { InstanceActorService } from './InstanceActorService.js';
import { InternalStorageService } from './InternalStorageService.js';
import { MetaService } from './MetaService.js';
import { MfmService } from './MfmService.js';
import { ModerationLogService } from './ModerationLogService.js';
import { NoteCreateService } from './NoteCreateService.js';
import { NoteDeleteService } from './NoteDeleteService.js';
import { NotePiningService } from './NotePiningService.js';
import { NoteReadService } from './NoteReadService.js';
import { NotificationService } from './NotificationService.js';
import { PollService } from './PollService.js';
import { PushNotificationService } from './PushNotificationService.js';
import { QueryService } from './QueryService.js';
import { ReactionService } from './ReactionService.js';
import { RelayService } from './RelayService.js';
import { RoleService } from './RoleService.js';
import { S3Service } from './S3Service.js';
import { SignupService } from './SignupService.js';
import { WebAuthnService } from './WebAuthnService.js';
import { UserBlockingService } from './UserBlockingService.js';
import { CacheService } from './CacheService.js';
import { UserService } from './UserService.js';
import { UserFollowingService } from './UserFollowingService.js';
import { UserKeypairService } from './UserKeypairService.js';
import { UserListService } from './UserListService.js';
import { UserMutingService } from './UserMutingService.js';
import { UserRenoteMutingService } from './UserRenoteMutingService.js';
import { UserSuspendService } from './UserSuspendService.js';
import { UserAuthService } from './UserAuthService.js';
import { VideoProcessingService } from './VideoProcessingService.js';
import { UserWebhookService } from './UserWebhookService.js';
import { ProxyAccountService } from './ProxyAccountService.js';
import { UtilityService } from './UtilityService.js';
import { FileInfoService } from './FileInfoService.js';
import { SearchService } from './SearchService.js';
import { ClipService } from './ClipService.js';
import { FeaturedService } from './FeaturedService.js';
import { FanoutTimelineService } from './FanoutTimelineService.js';
import { ChannelFollowingService } from './ChannelFollowingService.js';
import { RegistryApiService } from './RegistryApiService.js';
import { ReversiService } from './ReversiService.js';
import { MahjongService } from './MahjongService.js';

import { ChartLoggerService } from './chart/ChartLoggerService.js';
import FederationChart from './chart/charts/federation.js';
import NotesChart from './chart/charts/notes.js';
import UsersChart from './chart/charts/users.js';
import ActiveUsersChart from './chart/charts/active-users.js';
import InstanceChart from './chart/charts/instance.js';
import PerUserNotesChart from './chart/charts/per-user-notes.js';
import PerUserPvChart from './chart/charts/per-user-pv.js';
import DriveChart from './chart/charts/drive.js';
import PerUserReactionsChart from './chart/charts/per-user-reactions.js';
import PerUserFollowingChart from './chart/charts/per-user-following.js';
import PerUserDriveChart from './chart/charts/per-user-drive.js';
import ApRequestChart from './chart/charts/ap-request.js';
import { ChartManagementService } from './chart/ChartManagementService.js';

import { AbuseUserReportEntityService } from './entities/AbuseUserReportEntityService.js';
import { AnnouncementEntityService } from './entities/AnnouncementEntityService.js';
import { AntennaEntityService } from './entities/AntennaEntityService.js';
import { AppEntityService } from './entities/AppEntityService.js';
import { AuthSessionEntityService } from './entities/AuthSessionEntityService.js';
import { BlockingEntityService } from './entities/BlockingEntityService.js';
import { ChannelEntityService } from './entities/ChannelEntityService.js';
import { ClipEntityService } from './entities/ClipEntityService.js';
import { DriveFileEntityService } from './entities/DriveFileEntityService.js';
import { DriveFolderEntityService } from './entities/DriveFolderEntityService.js';
import { EmojiEntityService } from './entities/EmojiEntityService.js';
import { FollowingEntityService } from './entities/FollowingEntityService.js';
import { FollowRequestEntityService } from './entities/FollowRequestEntityService.js';
import { GalleryLikeEntityService } from './entities/GalleryLikeEntityService.js';
import { GalleryPostEntityService } from './entities/GalleryPostEntityService.js';
import { HashtagEntityService } from './entities/HashtagEntityService.js';
import { InstanceEntityService } from './entities/InstanceEntityService.js';
import { InviteCodeEntityService } from './entities/InviteCodeEntityService.js';
import { ModerationLogEntityService } from './entities/ModerationLogEntityService.js';
import { MutingEntityService } from './entities/MutingEntityService.js';
import { RenoteMutingEntityService } from './entities/RenoteMutingEntityService.js';
import { NoteEntityService } from './entities/NoteEntityService.js';
import { NoteFavoriteEntityService } from './entities/NoteFavoriteEntityService.js';
import { NoteReactionEntityService } from './entities/NoteReactionEntityService.js';
import { NotificationEntityService } from './entities/NotificationEntityService.js';
import { PageEntityService } from './entities/PageEntityService.js';
import { PageLikeEntityService } from './entities/PageLikeEntityService.js';
import { SigninEntityService } from './entities/SigninEntityService.js';
import { UserEntityService } from './entities/UserEntityService.js';
import { UserListEntityService } from './entities/UserListEntityService.js';
import { FlashEntityService } from './entities/FlashEntityService.js';
import { FlashLikeEntityService } from './entities/FlashLikeEntityService.js';
import { RoleEntityService } from './entities/RoleEntityService.js';
import { ReversiGameEntityService } from './entities/ReversiGameEntityService.js';
import { MetaEntityService } from './entities/MetaEntityService.js';

import { ApAudienceService } from './activitypub/ApAudienceService.js';
import { ApDbResolverService } from './activitypub/ApDbResolverService.js';
import { ApDeliverManagerService } from './activitypub/ApDeliverManagerService.js';
import { ApInboxService } from './activitypub/ApInboxService.js';
import { ApLoggerService } from './activitypub/ApLoggerService.js';
import { ApMfmService } from './activitypub/ApMfmService.js';
import { ApRendererService } from './activitypub/ApRendererService.js';
import { ApRequestService } from './activitypub/ApRequestService.js';
import { ApResolverService } from './activitypub/ApResolverService.js';
import { JsonLdService } from './activitypub/JsonLdService.js';
import { RemoteLoggerService } from './RemoteLoggerService.js';
import { RemoteUserResolveService } from './RemoteUserResolveService.js';
import { WebfingerService } from './WebfingerService.js';
import { ApImageService } from './activitypub/models/ApImageService.js';
import { ApMentionService } from './activitypub/models/ApMentionService.js';
import { ApNoteService } from './activitypub/models/ApNoteService.js';
import { ApPersonService } from './activitypub/models/ApPersonService.js';
import { ApQuestionService } from './activitypub/models/ApQuestionService.js';
import { QueueModule } from './QueueModule.js';
import { QueueService } from './QueueService.js';
import { LoggerService } from './LoggerService.js';
import type { Provider } from '@nestjs/common';

//#region 文字列ベースでのinjection用(循環参照対応のため)
const $LoggerService: Provider = { provide: 'LoggerService', useExisting: LoggerService };
const $AbuseReportService: Provider = { provide: 'AbuseReportService', useExisting: AbuseReportService };
const $AbuseReportNotificationService: Provider = { provide: 'AbuseReportNotificationService', useExisting: AbuseReportNotificationService };
const $AccountMoveService: Provider = { provide: 'AccountMoveService', useExisting: AccountMoveService };
const $AccountUpdateService: Provider = { provide: 'AccountUpdateService', useExisting: AccountUpdateService };
const $AiService: Provider = { provide: 'AiService', useExisting: AiService };
const $AnnouncementService: Provider = { provide: 'AnnouncementService', useExisting: AnnouncementService };
const $AntennaService: Provider = { provide: 'AntennaService', useExisting: AntennaService };
const $AppLockService: Provider = { provide: 'AppLockService', useExisting: AppLockService };
const $AchievementService: Provider = { provide: 'AchievementService', useExisting: AchievementService };
const $AvatarDecorationService: Provider = { provide: 'AvatarDecorationService', useExisting: AvatarDecorationService };
const $CaptchaService: Provider = { provide: 'CaptchaService', useExisting: CaptchaService };
const $CreateSystemUserService: Provider = { provide: 'CreateSystemUserService', useExisting: CreateSystemUserService };
const $CustomEmojiService: Provider = { provide: 'CustomEmojiService', useExisting: CustomEmojiService };
const $DeleteAccountService: Provider = { provide: 'DeleteAccountService', useExisting: DeleteAccountService };
const $DownloadService: Provider = { provide: 'DownloadService', useExisting: DownloadService };
const $DriveService: Provider = { provide: 'DriveService', useExisting: DriveService };
const $EmailService: Provider = { provide: 'EmailService', useExisting: EmailService };
const $FederatedInstanceService: Provider = { provide: 'FederatedInstanceService', useExisting: FederatedInstanceService };
const $FetchInstanceMetadataService: Provider = { provide: 'FetchInstanceMetadataService', useExisting: FetchInstanceMetadataService };
const $GlobalEventService: Provider = { provide: 'GlobalEventService', useExisting: GlobalEventService };
const $HashtagService: Provider = { provide: 'HashtagService', useExisting: HashtagService };
const $HttpRequestService: Provider = { provide: 'HttpRequestService', useExisting: HttpRequestService };
const $IdService: Provider = { provide: 'IdService', useExisting: IdService };
const $ImageProcessingService: Provider = { provide: 'ImageProcessingService', useExisting: ImageProcessingService };
const $InstanceActorService: Provider = { provide: 'InstanceActorService', useExisting: InstanceActorService };
const $InternalStorageService: Provider = { provide: 'InternalStorageService', useExisting: InternalStorageService };
const $MetaService: Provider = { provide: 'MetaService', useExisting: MetaService };
const $MfmService: Provider = { provide: 'MfmService', useExisting: MfmService };
const $ModerationLogService: Provider = { provide: 'ModerationLogService', useExisting: ModerationLogService };
const $NoteCreateService: Provider = { provide: 'NoteCreateService', useExisting: NoteCreateService };
const $NoteDeleteService: Provider = { provide: 'NoteDeleteService', useExisting: NoteDeleteService };
const $NotePiningService: Provider = { provide: 'NotePiningService', useExisting: NotePiningService };
const $NoteReadService: Provider = { provide: 'NoteReadService', useExisting: NoteReadService };
const $NotificationService: Provider = { provide: 'NotificationService', useExisting: NotificationService };
const $PollService: Provider = { provide: 'PollService', useExisting: PollService };
const $ProxyAccountService: Provider = { provide: 'ProxyAccountService', useExisting: ProxyAccountService };
const $PushNotificationService: Provider = { provide: 'PushNotificationService', useExisting: PushNotificationService };
const $QueryService: Provider = { provide: 'QueryService', useExisting: QueryService };
const $ReactionService: Provider = { provide: 'ReactionService', useExisting: ReactionService };
const $RelayService: Provider = { provide: 'RelayService', useExisting: RelayService };
const $RoleService: Provider = { provide: 'RoleService', useExisting: RoleService };
const $S3Service: Provider = { provide: 'S3Service', useExisting: S3Service };
const $SignupService: Provider = { provide: 'SignupService', useExisting: SignupService };
const $WebAuthnService: Provider = { provide: 'WebAuthnService', useExisting: WebAuthnService };
const $UserBlockingService: Provider = { provide: 'UserBlockingService', useExisting: UserBlockingService };
const $CacheService: Provider = { provide: 'CacheService', useExisting: CacheService };
const $UserService: Provider = { provide: 'UserService', useExisting: UserService };
const $UserFollowingService: Provider = { provide: 'UserFollowingService', useExisting: UserFollowingService };
const $UserKeypairService: Provider = { provide: 'UserKeypairService', useExisting: UserKeypairService };
const $UserListService: Provider = { provide: 'UserListService', useExisting: UserListService };
const $UserMutingService: Provider = { provide: 'UserMutingService', useExisting: UserMutingService };
const $UserRenoteMutingService: Provider = { provide: 'UserRenoteMutingService', useExisting: UserRenoteMutingService };
const $UserSearchService: Provider = { provide: 'UserSearchService', useExisting: UserSearchService };
const $UserSuspendService: Provider = { provide: 'UserSuspendService', useExisting: UserSuspendService };
const $UserAuthService: Provider = { provide: 'UserAuthService', useExisting: UserAuthService };
const $VideoProcessingService: Provider = { provide: 'VideoProcessingService', useExisting: VideoProcessingService };
const $UserWebhookService: Provider = { provide: 'UserWebhookService', useExisting: UserWebhookService };
const $SystemWebhookService: Provider = { provide: 'SystemWebhookService', useExisting: SystemWebhookService };
const $UtilityService: Provider = { provide: 'UtilityService', useExisting: UtilityService };
const $FileInfoService: Provider = { provide: 'FileInfoService', useExisting: FileInfoService };
const $SearchService: Provider = { provide: 'SearchService', useExisting: SearchService };
const $ClipService: Provider = { provide: 'ClipService', useExisting: ClipService };
const $FeaturedService: Provider = { provide: 'FeaturedService', useExisting: FeaturedService };
const $FanoutTimelineService: Provider = { provide: 'FanoutTimelineService', useExisting: FanoutTimelineService };
const $FanoutTimelineEndpointService: Provider = { provide: 'FanoutTimelineEndpointService', useExisting: FanoutTimelineEndpointService };
const $ChannelFollowingService: Provider = { provide: 'ChannelFollowingService', useExisting: ChannelFollowingService };
const $RegistryApiService: Provider = { provide: 'RegistryApiService', useExisting: RegistryApiService };
const $ReversiService: Provider = { provide: 'ReversiService', useExisting: ReversiService };
const $MahjongService: Provider = { provide: 'MahjongService', useExisting: MahjongService };

const $ChartLoggerService: Provider = { provide: 'ChartLoggerService', useExisting: ChartLoggerService };
const $FederationChart: Provider = { provide: 'FederationChart', useExisting: FederationChart };
const $NotesChart: Provider = { provide: 'NotesChart', useExisting: NotesChart };
const $UsersChart: Provider = { provide: 'UsersChart', useExisting: UsersChart };
const $ActiveUsersChart: Provider = { provide: 'ActiveUsersChart', useExisting: ActiveUsersChart };
const $InstanceChart: Provider = { provide: 'InstanceChart', useExisting: InstanceChart };
const $PerUserNotesChart: Provider = { provide: 'PerUserNotesChart', useExisting: PerUserNotesChart };
const $PerUserPvChart: Provider = { provide: 'PerUserPvChart', useExisting: PerUserPvChart };
const $DriveChart: Provider = { provide: 'DriveChart', useExisting: DriveChart };
const $PerUserReactionsChart: Provider = { provide: 'PerUserReactionsChart', useExisting: PerUserReactionsChart };
const $PerUserFollowingChart: Provider = { provide: 'PerUserFollowingChart', useExisting: PerUserFollowingChart };
const $PerUserDriveChart: Provider = { provide: 'PerUserDriveChart', useExisting: PerUserDriveChart };
const $ApRequestChart: Provider = { provide: 'ApRequestChart', useExisting: ApRequestChart };
const $ChartManagementService: Provider = { provide: 'ChartManagementService', useExisting: ChartManagementService };

const $AbuseUserReportEntityService: Provider = { provide: 'AbuseUserReportEntityService', useExisting: AbuseUserReportEntityService };
const $AnnouncementEntityService: Provider = { provide: 'AnnouncementEntityService', useExisting: AnnouncementEntityService };
const $AbuseReportNotificationRecipientEntityService: Provider = { provide: 'AbuseReportNotificationRecipientEntityService', useExisting: AbuseReportNotificationRecipientEntityService };
const $AntennaEntityService: Provider = { provide: 'AntennaEntityService', useExisting: AntennaEntityService };
const $AppEntityService: Provider = { provide: 'AppEntityService', useExisting: AppEntityService };
const $AuthSessionEntityService: Provider = { provide: 'AuthSessionEntityService', useExisting: AuthSessionEntityService };
const $BlockingEntityService: Provider = { provide: 'BlockingEntityService', useExisting: BlockingEntityService };
const $ChannelEntityService: Provider = { provide: 'ChannelEntityService', useExisting: ChannelEntityService };
const $ClipEntityService: Provider = { provide: 'ClipEntityService', useExisting: ClipEntityService };
const $DriveFileEntityService: Provider = { provide: 'DriveFileEntityService', useExisting: DriveFileEntityService };
const $DriveFolderEntityService: Provider = { provide: 'DriveFolderEntityService', useExisting: DriveFolderEntityService };
const $EmojiEntityService: Provider = { provide: 'EmojiEntityService', useExisting: EmojiEntityService };
const $FollowingEntityService: Provider = { provide: 'FollowingEntityService', useExisting: FollowingEntityService };
const $FollowRequestEntityService: Provider = { provide: 'FollowRequestEntityService', useExisting: FollowRequestEntityService };
const $GalleryLikeEntityService: Provider = { provide: 'GalleryLikeEntityService', useExisting: GalleryLikeEntityService };
const $GalleryPostEntityService: Provider = { provide: 'GalleryPostEntityService', useExisting: GalleryPostEntityService };
const $HashtagEntityService: Provider = { provide: 'HashtagEntityService', useExisting: HashtagEntityService };
const $InstanceEntityService: Provider = { provide: 'InstanceEntityService', useExisting: InstanceEntityService };
const $InviteCodeEntityService: Provider = { provide: 'InviteCodeEntityService', useExisting: InviteCodeEntityService };
const $ModerationLogEntityService: Provider = { provide: 'ModerationLogEntityService', useExisting: ModerationLogEntityService };
const $MutingEntityService: Provider = { provide: 'MutingEntityService', useExisting: MutingEntityService };
const $RenoteMutingEntityService: Provider = { provide: 'RenoteMutingEntityService', useExisting: RenoteMutingEntityService };
const $NoteEntityService: Provider = { provide: 'NoteEntityService', useExisting: NoteEntityService };
const $NoteFavoriteEntityService: Provider = { provide: 'NoteFavoriteEntityService', useExisting: NoteFavoriteEntityService };
const $NoteReactionEntityService: Provider = { provide: 'NoteReactionEntityService', useExisting: NoteReactionEntityService };
const $NotificationEntityService: Provider = { provide: 'NotificationEntityService', useExisting: NotificationEntityService };
const $PageEntityService: Provider = { provide: 'PageEntityService', useExisting: PageEntityService };
const $PageLikeEntityService: Provider = { provide: 'PageLikeEntityService', useExisting: PageLikeEntityService };
const $SigninEntityService: Provider = { provide: 'SigninEntityService', useExisting: SigninEntityService };
const $UserEntityService: Provider = { provide: 'UserEntityService', useExisting: UserEntityService };
const $UserListEntityService: Provider = { provide: 'UserListEntityService', useExisting: UserListEntityService };
const $FlashEntityService: Provider = { provide: 'FlashEntityService', useExisting: FlashEntityService };
const $FlashLikeEntityService: Provider = { provide: 'FlashLikeEntityService', useExisting: FlashLikeEntityService };
const $RoleEntityService: Provider = { provide: 'RoleEntityService', useExisting: RoleEntityService };
const $ReversiGameEntityService: Provider = { provide: 'ReversiGameEntityService', useExisting: ReversiGameEntityService };
const $MetaEntityService: Provider = { provide: 'MetaEntityService', useExisting: MetaEntityService };
const $SystemWebhookEntityService: Provider = { provide: 'SystemWebhookEntityService', useExisting: SystemWebhookEntityService };

const $ApAudienceService: Provider = { provide: 'ApAudienceService', useExisting: ApAudienceService };
const $ApDbResolverService: Provider = { provide: 'ApDbResolverService', useExisting: ApDbResolverService };
const $ApDeliverManagerService: Provider = { provide: 'ApDeliverManagerService', useExisting: ApDeliverManagerService };
const $ApInboxService: Provider = { provide: 'ApInboxService', useExisting: ApInboxService };
const $ApLoggerService: Provider = { provide: 'ApLoggerService', useExisting: ApLoggerService };
const $ApMfmService: Provider = { provide: 'ApMfmService', useExisting: ApMfmService };
const $ApRendererService: Provider = { provide: 'ApRendererService', useExisting: ApRendererService };
const $ApRequestService: Provider = { provide: 'ApRequestService', useExisting: ApRequestService };
const $ApResolverService: Provider = { provide: 'ApResolverService', useExisting: ApResolverService };
const $JsonLdService: Provider = { provide: 'JsonLdService', useExisting: JsonLdService };
const $RemoteLoggerService: Provider = { provide: 'RemoteLoggerService', useExisting: RemoteLoggerService };
const $RemoteUserResolveService: Provider = { provide: 'RemoteUserResolveService', useExisting: RemoteUserResolveService };
const $WebfingerService: Provider = { provide: 'WebfingerService', useExisting: WebfingerService };
const $ApImageService: Provider = { provide: 'ApImageService', useExisting: ApImageService };
const $ApMentionService: Provider = { provide: 'ApMentionService', useExisting: ApMentionService };
const $ApNoteService: Provider = { provide: 'ApNoteService', useExisting: ApNoteService };
const $ApPersonService: Provider = { provide: 'ApPersonService', useExisting: ApPersonService };
const $ApQuestionService: Provider = { provide: 'ApQuestionService', useExisting: ApQuestionService };
//#endregion

@Module({
	imports: [
		QueueModule,
	],
	providers: [
		LoggerService,
		AbuseReportService,
		AbuseReportNotificationService,
		AccountMoveService,
		AccountUpdateService,
		AiService,
		AnnouncementService,
		AntennaService,
		AppLockService,
		AchievementService,
		AvatarDecorationService,
		CaptchaService,
		CreateSystemUserService,
		CustomEmojiService,
		DeleteAccountService,
		DownloadService,
		DriveService,
		EmailService,
		FederatedInstanceService,
		FetchInstanceMetadataService,
		GlobalEventService,
		HashtagService,
		HttpRequestService,
		IdService,
		ImageProcessingService,
		InstanceActorService,
		InternalStorageService,
		MetaService,
		MfmService,
		ModerationLogService,
		NoteCreateService,
		NoteDeleteService,
		NotePiningService,
		NoteReadService,
		NotificationService,
		PollService,
		ProxyAccountService,
		PushNotificationService,
		QueryService,
		ReactionService,
		RelayService,
		RoleService,
		S3Service,
		SignupService,
		WebAuthnService,
		UserBlockingService,
		CacheService,
		UserService,
		UserFollowingService,
		UserKeypairService,
		UserListService,
		UserMutingService,
		UserRenoteMutingService,
		UserSearchService,
		UserSuspendService,
		UserAuthService,
		VideoProcessingService,
		UserWebhookService,
		SystemWebhookService,
		UtilityService,
		FileInfoService,
		SearchService,
		ClipService,
		FeaturedService,
		FanoutTimelineService,
		FanoutTimelineEndpointService,
		ChannelFollowingService,
		RegistryApiService,
		ReversiService,
		MahjongService,

		ChartLoggerService,
		FederationChart,
		NotesChart,
		UsersChart,
		ActiveUsersChart,
		InstanceChart,
		PerUserNotesChart,
		PerUserPvChart,
		DriveChart,
		PerUserReactionsChart,
		PerUserFollowingChart,
		PerUserDriveChart,
		ApRequestChart,
		ChartManagementService,

		AbuseUserReportEntityService,
		AnnouncementEntityService,
		AbuseReportNotificationRecipientEntityService,
		AntennaEntityService,
		AppEntityService,
		AuthSessionEntityService,
		BlockingEntityService,
		ChannelEntityService,
		ClipEntityService,
		DriveFileEntityService,
		DriveFolderEntityService,
		EmojiEntityService,
		FollowingEntityService,
		FollowRequestEntityService,
		GalleryLikeEntityService,
		GalleryPostEntityService,
		HashtagEntityService,
		InstanceEntityService,
		InviteCodeEntityService,
		ModerationLogEntityService,
		MutingEntityService,
		RenoteMutingEntityService,
		NoteEntityService,
		NoteFavoriteEntityService,
		NoteReactionEntityService,
		NotificationEntityService,
		PageEntityService,
		PageLikeEntityService,
		SigninEntityService,
		UserEntityService,
		UserListEntityService,
		FlashEntityService,
		FlashLikeEntityService,
		RoleEntityService,
		ReversiGameEntityService,
		MetaEntityService,
		SystemWebhookEntityService,

		ApAudienceService,
		ApDbResolverService,
		ApDeliverManagerService,
		ApInboxService,
		ApLoggerService,
		ApMfmService,
		ApRendererService,
		ApRequestService,
		ApResolverService,
		JsonLdService,
		RemoteLoggerService,
		RemoteUserResolveService,
		WebfingerService,
		ApImageService,
		ApMentionService,
		ApNoteService,
		ApPersonService,
		ApQuestionService,
		QueueService,

		//#region 文字列ベースでのinjection用(循環参照対応のため)
		$LoggerService,
		$AbuseReportService,
		$AbuseReportNotificationService,
		$AccountMoveService,
		$AccountUpdateService,
		$AiService,
		$AnnouncementService,
		$AntennaService,
		$AppLockService,
		$AchievementService,
		$AvatarDecorationService,
		$CaptchaService,
		$CreateSystemUserService,
		$CustomEmojiService,
		$DeleteAccountService,
		$DownloadService,
		$DriveService,
		$EmailService,
		$FederatedInstanceService,
		$FetchInstanceMetadataService,
		$GlobalEventService,
		$HashtagService,
		$HttpRequestService,
		$IdService,
		$ImageProcessingService,
		$InstanceActorService,
		$InternalStorageService,
		$MetaService,
		$MfmService,
		$ModerationLogService,
		$NoteCreateService,
		$NoteDeleteService,
		$NotePiningService,
		$NoteReadService,
		$NotificationService,
		$PollService,
		$ProxyAccountService,
		$PushNotificationService,
		$QueryService,
		$ReactionService,
		$RelayService,
		$RoleService,
		$S3Service,
		$SignupService,
		$WebAuthnService,
		$UserBlockingService,
		$CacheService,
		$UserService,
		$UserFollowingService,
		$UserKeypairService,
		$UserListService,
		$UserMutingService,
		$UserRenoteMutingService,
		$UserSearchService,
		$UserSuspendService,
		$UserAuthService,
		$VideoProcessingService,
		$UserWebhookService,
		$SystemWebhookService,
		$UtilityService,
		$FileInfoService,
		$SearchService,
		$ClipService,
		$FeaturedService,
		$FanoutTimelineService,
		$FanoutTimelineEndpointService,
		$ChannelFollowingService,
		$RegistryApiService,
		$ReversiService,
		$MahjongService,

		$ChartLoggerService,
		$FederationChart,
		$NotesChart,
		$UsersChart,
		$ActiveUsersChart,
		$InstanceChart,
		$PerUserNotesChart,
		$PerUserPvChart,
		$DriveChart,
		$PerUserReactionsChart,
		$PerUserFollowingChart,
		$PerUserDriveChart,
		$ApRequestChart,
		$ChartManagementService,

		$AbuseUserReportEntityService,
		$AnnouncementEntityService,
		$AbuseReportNotificationRecipientEntityService,
		$AntennaEntityService,
		$AppEntityService,
		$AuthSessionEntityService,
		$BlockingEntityService,
		$ChannelEntityService,
		$ClipEntityService,
		$DriveFileEntityService,
		$DriveFolderEntityService,
		$EmojiEntityService,
		$FollowingEntityService,
		$FollowRequestEntityService,
		$GalleryLikeEntityService,
		$GalleryPostEntityService,
		$HashtagEntityService,
		$InstanceEntityService,
		$InviteCodeEntityService,
		$ModerationLogEntityService,
		$MutingEntityService,
		$RenoteMutingEntityService,
		$NoteEntityService,
		$NoteFavoriteEntityService,
		$NoteReactionEntityService,
		$NotificationEntityService,
		$PageEntityService,
		$PageLikeEntityService,
		$SigninEntityService,
		$UserEntityService,
		$UserListEntityService,
		$FlashEntityService,
		$FlashLikeEntityService,
		$RoleEntityService,
		$ReversiGameEntityService,
		$MetaEntityService,
		$SystemWebhookEntityService,

		$ApAudienceService,
		$ApDbResolverService,
		$ApDeliverManagerService,
		$ApInboxService,
		$ApLoggerService,
		$ApMfmService,
		$ApRendererService,
		$ApRequestService,
		$ApResolverService,
		$JsonLdService,
		$RemoteLoggerService,
		$RemoteUserResolveService,
		$WebfingerService,
		$ApImageService,
		$ApMentionService,
		$ApNoteService,
		$ApPersonService,
		$ApQuestionService,
		//#endregion
	],
	exports: [
		QueueModule,
		LoggerService,
		AbuseReportService,
		AbuseReportNotificationService,
		AccountMoveService,
		AccountUpdateService,
		AiService,
		AnnouncementService,
		AntennaService,
		AppLockService,
		AchievementService,
		AvatarDecorationService,
		CaptchaService,
		CreateSystemUserService,
		CustomEmojiService,
		DeleteAccountService,
		DownloadService,
		DriveService,
		EmailService,
		FederatedInstanceService,
		FetchInstanceMetadataService,
		GlobalEventService,
		HashtagService,
		HttpRequestService,
		IdService,
		ImageProcessingService,
		InstanceActorService,
		InternalStorageService,
		MetaService,
		MfmService,
		ModerationLogService,
		NoteCreateService,
		NoteDeleteService,
		NotePiningService,
		NoteReadService,
		NotificationService,
		PollService,
		ProxyAccountService,
		PushNotificationService,
		QueryService,
		ReactionService,
		RelayService,
		RoleService,
		S3Service,
		SignupService,
		WebAuthnService,
		UserBlockingService,
		CacheService,
		UserService,
		UserFollowingService,
		UserKeypairService,
		UserListService,
		UserMutingService,
		UserRenoteMutingService,
		UserSearchService,
		UserSuspendService,
		UserAuthService,
		VideoProcessingService,
		UserWebhookService,
		SystemWebhookService,
		UtilityService,
		FileInfoService,
		SearchService,
		ClipService,
		FeaturedService,
		FanoutTimelineService,
		FanoutTimelineEndpointService,
		ChannelFollowingService,
		RegistryApiService,
		ReversiService,
		MahjongService,

		FederationChart,
		NotesChart,
		UsersChart,
		ActiveUsersChart,
		InstanceChart,
		PerUserNotesChart,
		PerUserPvChart,
		DriveChart,
		PerUserReactionsChart,
		PerUserFollowingChart,
		PerUserDriveChart,
		ApRequestChart,
		ChartManagementService,

		AbuseUserReportEntityService,
		AnnouncementEntityService,
		AbuseReportNotificationRecipientEntityService,
		AntennaEntityService,
		AppEntityService,
		AuthSessionEntityService,
		BlockingEntityService,
		ChannelEntityService,
		ClipEntityService,
		DriveFileEntityService,
		DriveFolderEntityService,
		EmojiEntityService,
		FollowingEntityService,
		FollowRequestEntityService,
		GalleryLikeEntityService,
		GalleryPostEntityService,
		HashtagEntityService,
		InstanceEntityService,
		InviteCodeEntityService,
		ModerationLogEntityService,
		MutingEntityService,
		RenoteMutingEntityService,
		NoteEntityService,
		NoteFavoriteEntityService,
		NoteReactionEntityService,
		NotificationEntityService,
		PageEntityService,
		PageLikeEntityService,
		SigninEntityService,
		UserEntityService,
		UserListEntityService,
		FlashEntityService,
		FlashLikeEntityService,
		RoleEntityService,
		ReversiGameEntityService,
		MetaEntityService,
		SystemWebhookEntityService,

		ApAudienceService,
		ApDbResolverService,
		ApDeliverManagerService,
		ApInboxService,
		ApLoggerService,
		ApMfmService,
		ApRendererService,
		ApRequestService,
		ApResolverService,
		JsonLdService,
		RemoteLoggerService,
		RemoteUserResolveService,
		WebfingerService,
		ApImageService,
		ApMentionService,
		ApNoteService,
		ApPersonService,
		ApQuestionService,
		QueueService,

		//#region 文字列ベースでのinjection用(循環参照対応のため)
		$LoggerService,
		$AbuseReportService,
		$AbuseReportNotificationService,
		$AccountMoveService,
		$AccountUpdateService,
		$AiService,
		$AnnouncementService,
		$AntennaService,
		$AppLockService,
		$AchievementService,
		$AvatarDecorationService,
		$CaptchaService,
		$CreateSystemUserService,
		$CustomEmojiService,
		$DeleteAccountService,
		$DownloadService,
		$DriveService,
		$EmailService,
		$FederatedInstanceService,
		$FetchInstanceMetadataService,
		$GlobalEventService,
		$HashtagService,
		$HttpRequestService,
		$IdService,
		$ImageProcessingService,
		$InstanceActorService,
		$InternalStorageService,
		$MetaService,
		$MfmService,
		$ModerationLogService,
		$NoteCreateService,
		$NoteDeleteService,
		$NotePiningService,
		$NoteReadService,
		$NotificationService,
		$PollService,
		$ProxyAccountService,
		$PushNotificationService,
		$QueryService,
		$ReactionService,
		$RelayService,
		$RoleService,
		$S3Service,
		$SignupService,
		$WebAuthnService,
		$UserBlockingService,
		$CacheService,
		$UserService,
		$UserFollowingService,
		$UserKeypairService,
		$UserListService,
		$UserMutingService,
		$UserRenoteMutingService,
		$UserSearchService,
		$UserSuspendService,
		$UserAuthService,
		$VideoProcessingService,
		$UserWebhookService,
		$SystemWebhookService,
		$UtilityService,
		$FileInfoService,
		$SearchService,
		$ClipService,
		$FeaturedService,
		$FanoutTimelineService,
		$FanoutTimelineEndpointService,
		$ChannelFollowingService,
		$RegistryApiService,
		$ReversiService,
		$MahjongService,

		$FederationChart,
		$NotesChart,
		$UsersChart,
		$ActiveUsersChart,
		$InstanceChart,
		$PerUserNotesChart,
		$PerUserPvChart,
		$DriveChart,
		$PerUserReactionsChart,
		$PerUserFollowingChart,
		$PerUserDriveChart,
		$ApRequestChart,
		$ChartManagementService,

		$AbuseUserReportEntityService,
		$AnnouncementEntityService,
		$AbuseReportNotificationRecipientEntityService,
		$AntennaEntityService,
		$AppEntityService,
		$AuthSessionEntityService,
		$BlockingEntityService,
		$ChannelEntityService,
		$ClipEntityService,
		$DriveFileEntityService,
		$DriveFolderEntityService,
		$EmojiEntityService,
		$FollowingEntityService,
		$FollowRequestEntityService,
		$GalleryLikeEntityService,
		$GalleryPostEntityService,
		$HashtagEntityService,
		$InstanceEntityService,
		$InviteCodeEntityService,
		$ModerationLogEntityService,
		$MutingEntityService,
		$RenoteMutingEntityService,
		$NoteEntityService,
		$NoteFavoriteEntityService,
		$NoteReactionEntityService,
		$NotificationEntityService,
		$PageEntityService,
		$PageLikeEntityService,
		$SigninEntityService,
		$UserEntityService,
		$UserListEntityService,
		$FlashEntityService,
		$FlashLikeEntityService,
		$RoleEntityService,
		$ReversiGameEntityService,
		$MetaEntityService,
		$SystemWebhookEntityService,

		$ApAudienceService,
		$ApDbResolverService,
		$ApDeliverManagerService,
		$ApInboxService,
		$ApLoggerService,
		$ApMfmService,
		$ApRendererService,
		$ApRequestService,
		$ApResolverService,
		$JsonLdService,
		$RemoteLoggerService,
		$RemoteUserResolveService,
		$WebfingerService,
		$ApImageService,
		$ApMentionService,
		$ApNoteService,
		$ApPersonService,
		$ApQuestionService,
		//#endregion
	],
})
export class CoreModule { }
