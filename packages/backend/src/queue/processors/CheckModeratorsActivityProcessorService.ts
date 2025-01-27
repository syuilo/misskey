/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import type Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';
import { MetaService } from '@/core/MetaService.js';
import { RoleService } from '@/core/RoleService.js';
import { EmailService } from '@/core/EmailService.js';
import { MiUser, type UserProfilesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { SystemWebhookService } from '@/core/SystemWebhookService.js';
import { AnnouncementService } from '@/core/AnnouncementService.js';
import { QueueLoggerService } from '../QueueLoggerService.js';

// モデレーターが不在と判断する日付の閾値
const MODERATOR_INACTIVITY_LIMIT_DAYS = 7;
// 警告通知やログ出力を行う残日数の閾値
const MODERATOR_INACTIVITY_WARNING_REMAINING_DAYS = 2;
// 期限から6時間ごとに通知を行う
const MODERATOR_INACTIVITY_WARNING_NOTIFY_INTERVAL_HOURS = 6;
const ONE_HOUR_MILLI_SEC = 1000 * 60 * 60;
const ONE_DAY_MILLI_SEC = ONE_HOUR_MILLI_SEC * 24;

export type ModeratorInactivityEvaluationResult = {
	isModeratorsInactive: boolean;
	inactiveModerators: MiUser[];
	remainingTime: ModeratorInactivityRemainingTime;
};

export type ModeratorInactivityRemainingTime = {
	time: number;
	asHours: number;
	asDays: number;
};

function generateModeratorInactivityMail(remainingTime: ModeratorInactivityRemainingTime) {
	const subject = 'Moderator Inactivity Warning / モデレーター不在の通知';

	const timeVariant = remainingTime.asDays === 0 ? `${remainingTime.asHours} hours` : `${remainingTime.asDays} days`;
	const timeVariantJa = remainingTime.asDays === 0 ? `${remainingTime.asHours} 時間` : `${remainingTime.asDays} 日間`;
	const message = [
		'To Moderators,',
		'',
		`A moderator has been inactive for a period of time. If there are ${timeVariant} of inactivity left, it will switch to invitation only.`,
		'If you do not wish to move to invitation only, you must log into Misskey and update your last active date and time.',
		'',
		'---------------',
		'',
		'To モデレーター各位',
		'',
		`モデレーターが一定期間活動していないようです。あと${timeVariantJa}活動していない状態が続くと招待制に切り替わります。`,
		'招待制に切り替わることを望まない場合は、Misskeyにログインして最終アクティブ日時を更新してください。',
		'',
	];

	const html = message.join('<br>');
	const text = message.join('\n');

	return {
		subject,
		html,
		text,
	};
}

function generateInvitationOnlyChangedMail() {
	const subject = 'Change to Invitation-Only / 招待制に変更されました';

	const message = [
		'To Moderators,',
		'',
		`Changed to invitation only because no moderator activity was detected for ${MODERATOR_INACTIVITY_LIMIT_DAYS} days.`,
		'To cancel the invitation only, you need to access the control panel.',
		'',
		'---------------',
		'',
		'To モデレーター各位',
		'',
		`モデレーターの活動が${MODERATOR_INACTIVITY_LIMIT_DAYS}日間検出されなかったため、招待制に変更されました。`,
		'招待制を解除するには、コントロールパネルにアクセスする必要があります。',
		'',
	];

	const html = message.join('<br>');
	const text = message.join('\n');

	return {
		subject,
		html,
		text,
	};
}

@Injectable()
export class CheckModeratorsActivityProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,
		private metaService: MetaService,
		private roleService: RoleService,
		private emailService: EmailService,
		private announcementService: AnnouncementService,
		private systemWebhookService: SystemWebhookService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('check-moderators-activity');
	}

	@bindThis
	public async process(): Promise<void> {
		this.logger.info('start.');

		const meta = await this.metaService.fetch(false);
		if (!meta.disableRegistration) {
			await this.processImpl();
		} else {
			this.logger.info('is already invitation only.');
		}

		this.logger.succ('finish.');
	}

	@bindThis
	private async processImpl() {
		const evaluateResult = await this.evaluateModeratorsInactiveDays();
		if (evaluateResult.isModeratorsInactive) {
			this.logger.warn(`The moderator has been inactive for ${MODERATOR_INACTIVITY_LIMIT_DAYS} days. We will move to invitation only.`);

			await this.changeToInvitationOnly();
			await this.notifyChangeToInvitationOnly();
		} else {
			const remainingTime = evaluateResult.remainingTime;
			if (remainingTime.asDays <= MODERATOR_INACTIVITY_WARNING_REMAINING_DAYS) {
				const timeVariant = remainingTime.asDays === 0 ? `${remainingTime.asHours} hours` : `${remainingTime.asDays} days`;
				this.logger.warn(`A moderator has been inactive for a period of time. If you are inactive for an additional ${timeVariant}, it will switch to invitation only.`);

				if (remainingTime.asHours % MODERATOR_INACTIVITY_WARNING_NOTIFY_INTERVAL_HOURS === 0) {
					// ジョブの実行頻度と同等だと通知が多すぎるため期限から6時間ごとに通知する
					// つまり、のこり2日を切ったら6時間ごとに通知が送られる
					await this.notifyInactiveModeratorsWarning(remainingTime);
				}
			}
		}
	}

	/**
	 * モデレーターが不在であるかどうかを確認する。trueの場合はモデレーターが不在である。
	 * isModerator, isAdministrator, isRootのいずれかがtrueのユーザを対象に、
	 * {@link MiUser.lastActiveDate}の値が実行日時の{@link MODERATOR_INACTIVITY_LIMIT_DAYS}日前よりも古いユーザがいるかどうかを確認する。
	 * {@link MiUser.lastActiveDate}がnullの場合は、そのユーザは確認の対象外とする。
	 *
	 * -----
	 *
	 * ### サンプルパターン
	 * - 実行日時: 2022-01-30 12:00:00
	 * - 判定基準: 2022-01-23 12:00:00（実行日時の{@link MODERATOR_INACTIVITY_LIMIT_DAYS}日前）
	 *
	 * #### パターン①
	 * - モデレータA: lastActiveDate = 2022-01-20 00:00:00 ※アウト
	 * - モデレータB: lastActiveDate = 2022-01-23 12:00:00 ※セーフ（判定基準と同値なのでギリギリ残り0日）
	 * - モデレータC: lastActiveDate = 2022-01-23 11:59:59 ※アウト（残り-1日）
	 * - モデレータD: lastActiveDate = null
	 *
	 * この場合、モデレータBのアクティビティのみ判定基準日よりも古くないため、モデレーターが在席と判断される。
	 *
	 * #### パターン②
	 * - モデレータA: lastActiveDate = 2022-01-20 00:00:00 ※アウト
	 * - モデレータB: lastActiveDate = 2022-01-22 12:00:00 ※アウト（残り-1日）
	 * - モデレータC: lastActiveDate = 2022-01-23 11:59:59 ※アウト（残り-1日）
	 * - モデレータD: lastActiveDate = null
	 *
	 * この場合、モデレータA, B, Cのアクティビティは判定基準日よりも古いため、モデレーターが不在と判断される。
	 */
	@bindThis
	public async evaluateModeratorsInactiveDays(): Promise<ModeratorInactivityEvaluationResult> {
		const today = new Date();
		const inactivePeriod = new Date(today);
		inactivePeriod.setDate(today.getDate() - MODERATOR_INACTIVITY_LIMIT_DAYS);

		const moderators = await this.fetchModerators()
			.then(it => it.filter(it => it.lastActiveDate != null));
		const inactiveModerators = moderators
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			.filter(it => it.lastActiveDate!.getTime() < inactivePeriod.getTime());

		// 残りの猶予を示したいので、最終アクティブ日時が一番若いモデレータの日数を基準に猶予を計算する
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const newestLastActiveDate = new Date(Math.max(...moderators.map(it => it.lastActiveDate!.getTime())));
		const remainingTime = newestLastActiveDate.getTime() - inactivePeriod.getTime();
		const remainingTimeAsDays = Math.floor(remainingTime / ONE_DAY_MILLI_SEC);
		const remainingTimeAsHours = Math.floor((remainingTime / ONE_HOUR_MILLI_SEC));

		return {
			isModeratorsInactive: inactiveModerators.length === moderators.length,
			inactiveModerators,
			remainingTime: {
				time: remainingTime,
				asHours: remainingTimeAsHours,
				asDays: remainingTimeAsDays,
			},
		};
	}

	@bindThis
	private async changeToInvitationOnly() {
		await this.metaService.update({ disableRegistration: true });
	}

	@bindThis
	public async notifyInactiveModeratorsWarning(remainingTime: ModeratorInactivityRemainingTime) {
		// -- モデレータへのメール送信

		const moderators = await this.fetchModerators();
		const moderatorProfiles = await this.userProfilesRepository
			.findBy({ userId: In(moderators.map(it => it.id)) })
			.then(it => new Map(it.map(it => [it.userId, it])));

		const mail = generateModeratorInactivityMail(remainingTime);
		for (const moderator of moderators) {
			const profile = moderatorProfiles.get(moderator.id);
			if (profile && profile.email && profile.emailVerified) {
				this.emailService.sendEmail(profile.email, mail.subject, mail.html, mail.text);
			}
		}

		// -- SystemWebhook

		return this.systemWebhookService.enqueueSystemWebhook(
			'inactiveModeratorsWarning',
			{ remainingTime: remainingTime },
		);
	}

	@bindThis
	public async notifyChangeToInvitationOnly() {
		// -- モデレータへのメールとお知らせ（個人向け）送信

		const moderators = await this.fetchModerators();
		const moderatorProfiles = await this.userProfilesRepository
			.findBy({ userId: In(moderators.map(it => it.id)) })
			.then(it => new Map(it.map(it => [it.userId, it])));

		const mail = generateInvitationOnlyChangedMail();
		for (const moderator of moderators) {
			this.announcementService.create({
				title: mail.subject,
				text: mail.text,
				forExistingUsers: true,
				needConfirmationToRead: true,
				userId: moderator.id,
			});

			const profile = moderatorProfiles.get(moderator.id);
			if (profile && profile.email && profile.emailVerified) {
				this.emailService.sendEmail(profile.email, mail.subject, mail.html, mail.text);
			}
		}

		// -- SystemWebhook

		return this.systemWebhookService.enqueueSystemWebhook(
			'inactiveModeratorsInvitationOnlyChanged',
			{},
		);
	}

	@bindThis
	private async fetchModerators() {
		// TODO: モデレーター以外にも特別な権限を持つユーザーがいる場合は考慮する
		return this.roleService.getModerators({
			includeAdmins: true,
			includeRoot: true,
			excludeExpire: true,
		});
	}
}
