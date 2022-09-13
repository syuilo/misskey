import { Inject, Injectable } from '@nestjs/common';

import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { IsNull } from 'typeorm';
import { genRsaKeyPair } from '@/misc/gen-key-pair.js';
import { User } from '@/models/entities/user.js';
import { UserProfile } from '@/models/entities/user-profile.js';
import type { IdService } from '@/services/IdService.js';
import { UserKeypair } from '@/models/entities/user-keypair.js';
import { UsedUsername } from '@/models/entities/used-username.js';
import { DI_SYMBOLS } from '@/di-symbols.js';
import generateNativeUserToken from '../server/api/common/generate-native-user-token.js';
import type { DataSource } from 'typeorm';

@Injectable()
export class CreateSystemUserService {
	constructor(
		@Inject(DI_SYMBOLS.db)
		private db: DataSource,

		private idService: IdService,
	) {
	}

	public async createSystemUser(username: string): Promise<User> {
		const password = uuid();
	
		// Generate hash of password
		const salt = await bcrypt.genSalt(8);
		const hash = await bcrypt.hash(password, salt);
	
		// Generate secret
		const secret = generateNativeUserToken();
	
		const keyPair = await genRsaKeyPair(4096);
	
		let account!: User;
	
		// Start transaction
		await this.db.transaction(async transactionalEntityManager => {
			const exist = await transactionalEntityManager.findOneBy(User, {
				usernameLower: username.toLowerCase(),
				host: IsNull(),
			});
	
			if (exist) throw new Error('the user is already exists');
	
			account = await transactionalEntityManager.insert(User, {
				id: this.idService.genId(),
				createdAt: new Date(),
				username: username,
				usernameLower: username.toLowerCase(),
				host: null,
				token: secret,
				isAdmin: false,
				isLocked: true,
				isExplorable: false,
				isBot: true,
			}).then(x => transactionalEntityManager.findOneByOrFail(User, x.identifiers[0]));
	
			await transactionalEntityManager.insert(UserKeypair, {
				publicKey: keyPair.publicKey,
				privateKey: keyPair.privateKey,
				userId: account.id,
			});
	
			await transactionalEntityManager.insert(UserProfile, {
				userId: account.id,
				autoAcceptFollowed: false,
				password: hash,
			});
	
			await transactionalEntityManager.insert(UsedUsername, {
				createdAt: new Date(),
				username: username.toLowerCase(),
			});
		});
	
		return account;
	}
}
