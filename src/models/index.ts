import { getRepository, getCustomRepository } from 'typeorm';
import { Announcement } from './entities/announcement.js';
import { AnnouncementRead } from './entities/announcement-read.js';
import { Instance } from './entities/instance.js';
import { Poll } from './entities/poll.js';
import { PollVote } from './entities/poll-vote.js';
import { Meta } from './entities/meta.js';
import { SwSubscription } from './entities/sw-subscription.js';
import { NoteWatching } from './entities/note-watching.js';
import { NoteUnread } from './entities/note-unread.js';
import { RegistrationTicket } from './entities/registration-tickets.js';
import { UserRepository } from './repositories/user.js';
import { NoteRepository } from './repositories/note.js';
import { DriveFileRepository } from './repositories/drive-file.js';
import { DriveFolderRepository } from './repositories/drive-folder.js';
import { Log } from './entities/log.js';
import { AccessToken } from './entities/access-token.js';
import { UserNotePining } from './entities/user-note-pining.js';
import { SigninRepository } from './repositories/signin.js';
import { MessagingMessageRepository } from './repositories/messaging-message.js';
import { ReversiGameRepository } from './repositories/games/reversi/game.js';
import { UserListRepository } from './repositories/user-list.js';
import { UserListJoining } from './entities/user-list-joining.js';
import { UserGroupRepository } from './repositories/user-group.js';
import { UserGroupJoining } from './entities/user-group-joining.js';
import { UserGroupInvitationRepository } from './repositories/user-group-invitation.js';
import { FollowRequestRepository } from './repositories/follow-request.js';
import { MutingRepository } from './repositories/muting.js';
import { BlockingRepository } from './repositories/blocking.js';
import { NoteReactionRepository } from './repositories/note-reaction.js';
import { NotificationRepository } from './repositories/notification.js';
import { NoteFavoriteRepository } from './repositories/note-favorite.js';
import { ReversiMatchingRepository } from './repositories/games/reversi/matching.js';
import { UserPublickey } from './entities/user-publickey.js';
import { UserKeypair } from './entities/user-keypair.js';
import { AppRepository } from './repositories/app.js';
import { FollowingRepository } from './repositories/following.js';
import { AbuseUserReportRepository } from './repositories/abuse-user-report.js';
import { AuthSessionRepository } from './repositories/auth-session.js';
import { UserProfile } from './entities/user-profile.js';
import { AttestationChallenge } from './entities/attestation-challenge.js';
import { UserSecurityKey } from './entities/user-security-key.js';
import { HashtagRepository } from './repositories/hashtag.js';
import { PageRepository } from './repositories/page.js';
import { PageLikeRepository } from './repositories/page-like.js';
import { GalleryPostRepository } from './repositories/gallery-post.js';
import { GalleryLikeRepository } from './repositories/gallery-like.js';
import { ModerationLogRepository } from './repositories/moderation-logs.js';
import { UsedUsername } from './entities/used-username.js';
import { ClipRepository } from './repositories/clip.js';
import { ClipNote } from './entities/clip-note.js';
import { AntennaRepository } from './repositories/antenna.js';
import { AntennaNote } from './entities/antenna-note.js';
import { PromoNote } from './entities/promo-note.js';
import { PromoRead } from './entities/promo-read.js';
import { EmojiRepository } from './repositories/emoji.js';
import { RelayRepository } from './repositories/relay.js';
import { ChannelRepository } from './repositories/channel.js';
import { MutedNote } from './entities/muted-note.js';
import { ChannelFollowing } from './entities/channel-following.js';
import { ChannelNotePining } from './entities/channel-note-pining.js';
import { RegistryItem } from './entities/registry-item.js';
import { Ad } from './entities/ad.js';
import { PasswordResetRequest } from './entities/password-reset-request.js';

export const Announcements = getRepository(Announcement);
export const AnnouncementReads = getRepository(AnnouncementRead);
export const Apps = getCustomRepository(AppRepository);
export const Notes = getCustomRepository(NoteRepository);
export const NoteFavorites = getCustomRepository(NoteFavoriteRepository);
export const NoteWatchings = getRepository(NoteWatching);
export const NoteReactions = getCustomRepository(NoteReactionRepository);
export const NoteUnreads = getRepository(NoteUnread);
export const Polls = getRepository(Poll);
export const PollVotes = getRepository(PollVote);
export const Users = getCustomRepository(UserRepository);
export const UserProfiles = getRepository(UserProfile);
export const UserKeypairs = getRepository(UserKeypair);
export const AttestationChallenges = getRepository(AttestationChallenge);
export const UserSecurityKeys = getRepository(UserSecurityKey);
export const UserPublickeys = getRepository(UserPublickey);
export const UserLists = getCustomRepository(UserListRepository);
export const UserListJoinings = getRepository(UserListJoining);
export const UserGroups = getCustomRepository(UserGroupRepository);
export const UserGroupJoinings = getRepository(UserGroupJoining);
export const UserGroupInvitations = getCustomRepository(UserGroupInvitationRepository);
export const UserNotePinings = getRepository(UserNotePining);
export const UsedUsernames = getRepository(UsedUsername);
export const Followings = getCustomRepository(FollowingRepository);
export const FollowRequests = getCustomRepository(FollowRequestRepository);
export const Instances = getRepository(Instance);
export const Emojis = getCustomRepository(EmojiRepository);
export const DriveFiles = getCustomRepository(DriveFileRepository);
export const DriveFolders = getCustomRepository(DriveFolderRepository);
export const Notifications = getCustomRepository(NotificationRepository);
export const Metas = getRepository(Meta);
export const Mutings = getCustomRepository(MutingRepository);
export const Blockings = getCustomRepository(BlockingRepository);
export const SwSubscriptions = getRepository(SwSubscription);
export const Hashtags = getCustomRepository(HashtagRepository);
export const AbuseUserReports = getCustomRepository(AbuseUserReportRepository);
export const RegistrationTickets = getRepository(RegistrationTicket);
export const AuthSessions = getCustomRepository(AuthSessionRepository);
export const AccessTokens = getRepository(AccessToken);
export const Signins = getCustomRepository(SigninRepository);
export const MessagingMessages = getCustomRepository(MessagingMessageRepository);
export const ReversiGames = getCustomRepository(ReversiGameRepository);
export const ReversiMatchings = getCustomRepository(ReversiMatchingRepository);
export const Logs = getRepository(Log);
export const Pages = getCustomRepository(PageRepository);
export const PageLikes = getCustomRepository(PageLikeRepository);
export const GalleryPosts = getCustomRepository(GalleryPostRepository);
export const GalleryLikes = getCustomRepository(GalleryLikeRepository);
export const ModerationLogs = getCustomRepository(ModerationLogRepository);
export const Clips = getCustomRepository(ClipRepository);
export const ClipNotes = getRepository(ClipNote);
export const Antennas = getCustomRepository(AntennaRepository);
export const AntennaNotes = getRepository(AntennaNote);
export const PromoNotes = getRepository(PromoNote);
export const PromoReads = getRepository(PromoRead);
export const Relays = getCustomRepository(RelayRepository);
export const MutedNotes = getRepository(MutedNote);
export const Channels = getCustomRepository(ChannelRepository);
export const ChannelFollowings = getRepository(ChannelFollowing);
export const ChannelNotePinings = getRepository(ChannelNotePining);
export const RegistryItems = getRepository(RegistryItem);
export const Ads = getRepository(Ad);
export const PasswordResetRequests = getRepository(PasswordResetRequest);
