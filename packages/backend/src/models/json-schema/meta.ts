/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const packedMetaLiteSchema = {
	type: 'object',
	optional: false, nullable: false,
	properties: {
		maintainerName: {
			type: 'string',
			optional: false, nullable: true,
		},
		maintainerEmail: {
			type: 'string',
			optional: false, nullable: true,
		},
		version: {
			type: 'string',
			optional: false, nullable: false,
		},
		providesTarball: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		name: {
			type: 'string',
			optional: false, nullable: true,
		},
		shortName: {
			type: 'string',
			optional: false, nullable: true,
		},
		uri: {
			type: 'string',
			optional: false, nullable: false,
			format: 'url',
			example: 'https://misskey.example.com',
		},
		description: {
			type: 'string',
			optional: false, nullable: true,
		},
		langs: {
			type: 'array',
			optional: false, nullable: false,
			items: {
				type: 'string',
				optional: false, nullable: false,
			},
		},
		tosUrl: {
			type: 'string',
			optional: false, nullable: true,
		},
		repositoryUrl: {
			type: 'string',
			optional: false, nullable: true,
			default: 'https://github.com/misskey-dev/misskey',
		},
		feedbackUrl: {
			type: 'string',
			optional: false, nullable: true,
			default: 'https://github.com/misskey-dev/misskey/issues/new',
		},
		defaultDarkTheme: {
			type: 'string',
			optional: false, nullable: true,
		},
		defaultLightTheme: {
			type: 'string',
			optional: false, nullable: true,
		},
		disableRegistration: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		emailRequiredForSignup: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		enableHcaptcha: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		hcaptchaSiteKey: {
			type: 'string',
			optional: false, nullable: true,
		},
		enableMcaptcha: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		mcaptchaSiteKey: {
			type: 'string',
			optional: false, nullable: true,
		},
		mcaptchaInstanceUrl: {
			type: 'string',
			optional: false, nullable: true,
		},
		enableRecaptcha: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		recaptchaSiteKey: {
			type: 'string',
			optional: false, nullable: true,
		},
		enableTurnstile: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		turnstileSiteKey: {
			type: 'string',
			optional: false, nullable: true,
		},
		swPublickey: {
			type: 'string',
			optional: false, nullable: true,
		},
		mascotImageUrl: {
			type: 'string',
			optional: false, nullable: false,
			default: '/assets/ai.png',
		},
		bannerUrl: {
			type: 'string',
			optional: false, nullable: true,
		},
		serverErrorImageUrl: {
			type: 'string',
			optional: false, nullable: true,
		},
		infoImageUrl: {
			type: 'string',
			optional: false, nullable: true,
		},
		notFoundImageUrl: {
			type: 'string',
			optional: false, nullable: true,
		},
		iconUrl: {
			type: 'string',
			optional: false, nullable: true,
		},
		maxNoteTextLength: {
			type: 'number',
			optional: false, nullable: false,
		},
		ads: {
			type: 'array',
			optional: false, nullable: false,
			items: {
				type: 'object',
				optional: false, nullable: false,
				properties: {
					id: {
						type: 'string',
						optional: false, nullable: false,
						format: 'id',
						example: 'xxxxxxxxxx',
					},
					url: {
						type: 'string',
						optional: false, nullable: false,
						format: 'url',
					},
					place: {
						type: 'string',
						optional: false, nullable: false,
					},
					ratio: {
						type: 'number',
						optional: false, nullable: false,
					},
					imageUrl: {
						type: 'string',
						optional: false, nullable: false,
						format: 'url',
					},
					dayOfWeek: {
						type: 'integer',
						optional: false, nullable: false,
					},
				},
			},
		},
		notesPerOneAd: {
			type: 'number',
			optional: false, nullable: false,
			default: 0,
		},
		enableEmail: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		enableServiceWorker: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		translatorAvailable: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		mediaProxy: {
			type: 'string',
			optional: false, nullable: false,
		},
		enableUrlPreview: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		preferPopularUserFactor: {
			type: 'string',
			optional: false, nullable: false,
			enum: ['follower', 'pv', 'none'],
		},
		backgroundImageUrl: {
			type: 'string',
			optional: false, nullable: true,
		},
		impressumUrl: {
			type: 'string',
			optional: false, nullable: true,
		},
		logoImageUrl: {
			type: 'string',
			optional: false, nullable: true,
		},
		privacyPolicyUrl: {
			type: 'string',
			optional: false, nullable: true,
		},
		inquiryUrl: {
			type: 'string',
			optional: false, nullable: true,
		},
		serverRules: {
			type: 'array',
			optional: false, nullable: false,
			items: {
				type: 'string',
			},
		},
		themeColor: {
			type: 'string',
			optional: false, nullable: true,
		},
		policies: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'RolePolicies',
		},
		noteSearchableScope: {
			type: 'string',
			enum: ['local', 'global'],
			optional: false, nullable: false,
			default: 'local',
		},
		maxFileSize: {
			type: 'number',
			optional: false, nullable: false,
		},
	},
} as const;

export const packedMetaDetailedOnlySchema = {
	type: 'object',
	optional: false, nullable: false,
	properties: {
		features: {
			type: 'object',
			optional: true, nullable: false,
			properties: {
				registration: {
					type: 'boolean',
					optional: false, nullable: false,
				},
				emailRequiredForSignup: {
					type: 'boolean',
					optional: false, nullable: false,
				},
				localTimeline: {
					type: 'boolean',
					optional: false, nullable: false,
				},
				globalTimeline: {
					type: 'boolean',
					optional: false, nullable: false,
				},
				hcaptcha: {
					type: 'boolean',
					optional: false, nullable: false,
				},
				turnstile: {
					type: 'boolean',
					optional: false, nullable: false,
				},
				recaptcha: {
					type: 'boolean',
					optional: false, nullable: false,
				},
				objectStorage: {
					type: 'boolean',
					optional: false, nullable: false,
				},
				serviceWorker: {
					type: 'boolean',
					optional: false, nullable: false,
				},
				miauth: {
					type: 'boolean',
					optional: true, nullable: false,
					default: true,
				},
			},
		},
		proxyAccountName: {
			type: 'string',
			optional: false, nullable: true,
		},
		requireSetup: {
			type: 'boolean',
			optional: false, nullable: false,
			example: false,
		},
		cacheRemoteFiles: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		cacheRemoteSensitiveFiles: {
			type: 'boolean',
			optional: false, nullable: false,
		},
	},
} as const;

export const packedMetaDetailedSchema = {
	type: 'object',
	allOf: [
		{
			type: 'object',
			ref: 'MetaLite',
		},
		{
			type: 'object',
			ref: 'MetaDetailedOnly',
		},
	],
} as const;
