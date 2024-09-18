/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import JSON5 from 'json5';
import type { Packed } from '@/misc/json-schema.js';
import type { MiMeta } from '@/models/Meta.js';
import type { AdsRepository } from '@/models/_.js';
import { MAX_NOTE_TEXT_LENGTH } from '@/const.js';
import { MetaService } from '@/core/MetaService.js';
import { bindThis } from '@/decorators.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { InstanceActorService } from '@/core/InstanceActorService.js';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import { DEFAULT_POLICIES } from '@/core/RoleService.js';

@Injectable()
export class MetaEntityService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.adsRepository)
		private adsRepository: AdsRepository,

		private userEntityService: UserEntityService,
		private metaService: MetaService,
		private instanceActorService: InstanceActorService,
	) { }

	@bindThis
	public async pack(meta?: MiMeta): Promise<Packed<'MetaLite'>> {
		let instance = meta;

		if (!instance) {
			instance = await this.metaService.fetch();
		}

		const ads = await this.adsRepository.createQueryBuilder('ads')
			.where('ads.expiresAt > :now', { now: new Date() })
			.andWhere('ads.startsAt <= :now', { now: new Date() })
			.andWhere(new Brackets(qb => {
				// 曜日のビットフラグを確認する
				qb.where('ads.dayOfWeek & :dayOfWeek > 0', { dayOfWeek: 1 << new Date().getDay() })
					.orWhere('ads.dayOfWeek = 0');
			}))
			.getMany();

		// クライアントの手間を減らすためあらかじめJSONに変換しておく
		let defaultLightTheme = null;
		let defaultDarkTheme = null;
		if (instance.defaultLightTheme) {
			try {
				defaultLightTheme = JSON.stringify(JSON5.parse(instance.defaultLightTheme));
			} catch (e) {
			}
		}
		if (instance.defaultDarkTheme) {
			try {
				defaultDarkTheme = JSON.stringify(JSON5.parse(instance.defaultDarkTheme));
			} catch (e) {
			}
		}

		const packed: Packed<'MetaLite'> = {
			maintainerName: instance.maintainerName,
			maintainerEmail: instance.maintainerEmail,

			version: this.config.version,
			providesTarball: this.config.publishTarballInsteadOfProvideRepositoryUrl,

			name: instance.name,
			shortName: instance.shortName,
			uri: this.config.url,
			description: instance.description,
			langs: instance.langs,
			tosUrl: instance.termsOfServiceUrl,
			repositoryUrl: instance.repositoryUrl,
			feedbackUrl: instance.feedbackUrl,
			impressumUrl: instance.impressumUrl,
			privacyPolicyUrl: instance.privacyPolicyUrl,
			inquiryUrl: instance.inquiryUrl,
			disableRegistration: instance.disableRegistration,
			emailRequiredForSignup: instance.emailRequiredForSignup,
			enableHcaptcha: instance.enableHcaptcha,
			hcaptchaSiteKey: instance.hcaptchaSiteKey,
			enableMcaptcha: instance.enableMcaptcha,
			mcaptchaSiteKey: instance.mcaptchaSitekey,
			mcaptchaInstanceUrl: instance.mcaptchaInstanceUrl,
			enableRecaptcha: instance.enableRecaptcha,
			recaptchaSiteKey: instance.recaptchaSiteKey,
			enableTurnstile: instance.enableTurnstile,
			turnstileSiteKey: instance.turnstileSiteKey,
			swPublickey: instance.swPublicKey,
			themeColor: instance.themeColor,
			mascotImageUrl: instance.mascotImageUrl ?? '/assets/ai.png',
			bannerUrl: instance.bannerUrl,
			infoImageUrl: instance.infoImageUrl,
			serverErrorImageUrl: instance.serverErrorImageUrl,
			notFoundImageUrl: instance.notFoundImageUrl,
			iconUrl: instance.iconUrl,
			backgroundImageUrl: instance.backgroundImageUrl,
			logoImageUrl: instance.logoImageUrl,
			maxNoteTextLength: MAX_NOTE_TEXT_LENGTH,
			defaultLightTheme,
			defaultDarkTheme,
			ads: ads.map(ad => ({
				id: ad.id,
				url: ad.url,
				place: ad.place,
				ratio: ad.ratio,
				imageUrl: ad.imageUrl,
				dayOfWeek: ad.dayOfWeek,
			})),
			notesPerOneAd: instance.notesPerOneAd,
			enableEmail: instance.enableEmail,
			enableServiceWorker: instance.enableServiceWorker,

			translatorAvailable: instance.deeplAuthKey != null,

			serverRules: instance.serverRules,

			policies: { ...DEFAULT_POLICIES, ...instance.policies },

			mediaProxy: this.config.mediaProxy,
			enableUrlPreview: instance.urlPreviewEnabled,
			noteSearchableScope: (this.config.meilisearch == null || this.config.meilisearch.scope !== 'local') ? 'global' : 'local',
			maxFileSize: this.config.maxFileSize,
			preferPopularUserFactor: instance.preferPopularUserFactor,
		};

		return packed;
	}

	@bindThis
	public async packDetailed(meta?: MiMeta): Promise<Packed<'MetaDetailed'>> {
		let instance = meta;

		if (!instance) {
			instance = await this.metaService.fetch();
		}

		const packed = await this.pack(instance);

		const proxyAccount = instance.proxyAccountId ? await this.userEntityService.pack(instance.proxyAccountId).catch(() => null) : null;

		const packDetailed: Packed<'MetaDetailed'> = {
			...packed,
			cacheRemoteFiles: instance.cacheRemoteFiles,
			cacheRemoteSensitiveFiles: instance.cacheRemoteSensitiveFiles,
			requireSetup: !await this.instanceActorService.realLocalUsersPresent(),
			proxyAccountName: proxyAccount ? proxyAccount.username : null,
			features: {
				localTimeline: instance.policies.ltlAvailable,
				globalTimeline: instance.policies.gtlAvailable,
				registration: !instance.disableRegistration,
				emailRequiredForSignup: instance.emailRequiredForSignup,
				hcaptcha: instance.enableHcaptcha,
				recaptcha: instance.enableRecaptcha,
				turnstile: instance.enableTurnstile,
				objectStorage: instance.useObjectStorage,
				serviceWorker: instance.enableServiceWorker,
				miauth: true,
			},
		};

		return packDetailed;
	}
}

