/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { IsNull, DataSource } from 'typeorm';
import { genRsaKeyPair } from '@/misc/gen-key-pair.js';
import { MiUser } from '@/models/User.js';
import { MiUserProfile } from '@/models/UserProfile.js';
import { IdService } from '@/core/IdService.js';
import { MiUserKeypair } from '@/models/UserKeypair.js';
import { MiUsedUsername } from '@/models/UsedUsername.js';
import { DI } from '@/di-symbols.js';
import generateNativeUserToken from '@/misc/generate-native-user-token.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class CreateSystemUserService {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		private idService: IdService,
	) {
	}

	@bindThis
	public async createSystemUser(username: string): Promise<MiUser> {
		const password = randomUUID();

		// Generate hash of password
		const hash = await argon2.hash(password);

		// Generate secret
		const secret = generateNativeUserToken();

		const keyPair = await genRsaKeyPair();

		let account!: MiUser;

		// Start transaction
		await this.db.transaction(async transactionalEntityManager => {
			const exist = await transactionalEntityManager.findOneBy(MiUser, {
				usernameLower: username.toLowerCase(),
				host: IsNull(),
			});

			if (exist) throw new Error('the user is already exists');

			account = await transactionalEntityManager.insert(MiUser, {
				id: this.idService.gen(),
				username: username,
				usernameLower: username.toLowerCase(),
				host: null,
				token: secret,
				isRoot: false,
				isLocked: true,
				isExplorable: false,
				isBot: true,
			}).then(x => transactionalEntityManager.findOneByOrFail(MiUser, x.identifiers[0]));

			await transactionalEntityManager.insert(MiUserKeypair, {
				publicKey: keyPair.publicKey,
				privateKey: keyPair.privateKey,
				userId: account.id,
			});

			await transactionalEntityManager.insert(MiUserProfile, {
				userId: account.id,
				autoAcceptFollowed: false,
				password: hash,
			});

			await transactionalEntityManager.insert(MiUsedUsername, {
				createdAt: new Date(),
				username: username.toLowerCase(),
			});
		});

		return account;
	}
}
