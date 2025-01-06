/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as argon2 from 'argon2';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { UserProfilesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { WebAuthnService } from '@/core/WebAuthnService.js';
import { ApiError } from '@/server/api/error.js';
import { UserAuthService } from '@/core/UserAuthService.js';

export const meta = {
	requireCredential: true,

	secure: true,

	errors: {
		userNotFound: {
			message: 'User not found.',
			code: 'USER_NOT_FOUND',
			id: '652f899f-66d4-490e-993e-6606c8ec04c3',
		},

		incorrectPassword: {
			message: 'Incorrect password.',
			code: 'INCORRECT_PASSWORD',
			id: '38769596-efe2-4faf-9bec-abbb3f2cd9ba',
		},

		twoFactorNotEnabled: {
			message: '2fa not enabled.',
			code: 'TWO_FACTOR_NOT_ENABLED',
			id: 'bf32b864-449b-47b8-974e-f9a5468546f1',
		},
	},

	res: {
		type: 'object',
		nullable: false,
		optional: false,
		properties: {
			rp: {
				type: 'object',
				properties: {
					id: {
						type: 'string',
						optional: true,
					},
				},
			},
			user: {
				type: 'object',
				properties: {
					id: {
						type: 'string',
					},
					name: {
						type: 'string',
					},
					displayName: {
						type: 'string',
					},
				},
			},
			challenge: {
				type: 'string',
			},
			pubKeyCredParams: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						type: {
							type: 'string',
						},
						alg: {
							type: 'number',
						},
					},
				},
			},
			timeout: {
				type: 'number',
				nullable: true,
			},
			excludeCredentials: {
				type: 'array',
				nullable: true,
				items: {
					type: 'object',
					properties: {
						id: {
							type: 'string',
						},
						type: {
							type: 'string',
						},
						transports: {
							type: 'array',
							items: {
								type: 'string',
								enum: [
									'ble',
									'cable',
									'hybrid',
									'internal',
									'nfc',
									'smart-card',
									'usb',
								],
							},
						},
					},
				},
			},
			authenticatorSelection: {
				type: 'object',
				nullable: true,
				properties: {
					authenticatorAttachment: {
						type: 'string',
						enum: [
							'cross-platform',
							'platform',
						],
					},
					requireResidentKey: {
						type: 'boolean',
					},
					userVerification: {
						type: 'string',
						enum: [
							'discouraged',
							'preferred',
							'required',
						],
					},
				},
			},
			attestation: {
				type: 'string',
				nullable: true,
				enum: [
					'direct',
					'enterprise',
					'indirect',
					'none',
					null,
				],
			},
			extensions: {
				type: 'object',
				nullable: true,
				properties: {
					appid: {
						type: 'string',
						nullable: true,
					},
					credProps: {
						type: 'boolean',
						nullable: true,
					},
					hmacCreateSecret: {
						type: 'boolean',
						nullable: true,
					},
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		password: { type: 'string' },
		token: { type: 'string', nullable: true },
	},
	required: ['password'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private webAuthnService: WebAuthnService,
		private userAuthService: UserAuthService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const token = ps.token;
			const profile = await this.userProfilesRepository.findOne({
				where: {
					userId: me.id,
				},
				relations: ['user'],
			});

			if (profile == null) {
				throw new ApiError(meta.errors.userNotFound);
			}

			if (profile.twoFactorEnabled) {
				if (token == null) {
					throw new Error('authentication failed');
				}

				try {
					await this.userAuthService.twoFactorAuthenticate(profile, token);
				} catch (e) {
					throw new Error('authentication failed');
				}
			}

			const passwordMatched = await argon2.verify(profile.password ?? '', ps.password);
			if (!passwordMatched) {
				throw new ApiError(meta.errors.incorrectPassword);
			}

			if (!profile.twoFactorEnabled) {
				throw new ApiError(meta.errors.twoFactorNotEnabled);
			}

			return await this.webAuthnService.initiateRegistration(
				me.id,
				profile.user?.username ?? me.id,
				profile.user?.name ?? undefined,
			);
		});
	}
}
