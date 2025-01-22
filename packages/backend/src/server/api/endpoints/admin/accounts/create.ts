/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { UsersRepository } from '@/models/_.js';
import { SignupService } from '@/core/SignupService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { InstanceActorService } from '@/core/InstanceActorService.js';
import { localUsernameSchema, passwordSchema } from '@/models/User.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { ApiError } from '@/server/api/error.js';
import { Packed } from '@/misc/json-schema.js';
import { RoleService } from '@/core/RoleService.js';

export const meta = {
	tags: ['admin'],

	errors: {
		accessDenied: {
			httpStatusCode: 403,
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '1fb7cb09-d46a-4fff-b8df-057708cce513',
		},

		wrongInitialPassword: {
			httpStatusCode: 401,
			message: 'Initial password is incorrect.',
			code: 'INCORRECT_INITIAL_PASSWORD',
			id: '97147c55-1ae1-4f6f-91d6-e1c3e0e76d62',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'MeDetailed',
		properties: {
			token: {
				type: 'string',
				optional: false, nullable: false,
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		username: localUsernameSchema,
		password: passwordSchema,
		setupPassword: { type: 'string', nullable: true },
	},
	required: ['username', 'password'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private roleService: RoleService,
		private userEntityService: UserEntityService,
		private signupService: SignupService,
		private instanceActorService: InstanceActorService,
	) {
		super(meta, paramDef, async (ps, _me, token) => {
			const me = _me ? await this.usersRepository.findOneByOrFail({ id: _me.id }) : null;
			const realUsers = await this.instanceActorService.realLocalUsersPresent();

			if (!realUsers && me == null && token == null) {
				// 初回セットアップの場合
				if (this.config.setupPassword != null) {
					// 初期パスワードが設定されている場合
					if (ps.setupPassword !== this.config.setupPassword) {
						// 初期パスワードが違う場合
						throw new ApiError(meta.errors.wrongInitialPassword);
					}
				} else if (ps.setupPassword != null && ps.setupPassword.trim() !== '') {
					// 初期パスワードが設定されていないのに初期パスワードが入力された場合
					throw new ApiError(meta.errors.wrongInitialPassword);
				}
			} else if (!(me?.isRoot) && !await this.roleService.isAdministrator(me)) {
				// 管理者でない場合
				throw new ApiError(meta.errors.accessDenied);
			} else if (token && !token?.permission.includes('write:admin:create-account')) {
				// access token を使うときは write:admin:create-account 権限が必要
				throw new ApiError(meta.errors.accessDenied);
			}

			const { account, secret } = await this.signupService.signup({
				username: ps.username,
				password: ps.password,
				ignorePreservedUsernames: true,
			});

			const res = await this.userEntityService.pack(account, account, {
				schema: 'MeDetailed',
				includeSecrets: true,
			}) as Packed<'MeDetailed'> & { token: string };

			res.token = secret;

			return res;
		});
	}
}
