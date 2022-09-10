import bcrypt from 'bcryptjs';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserProfiles } from '@/models/index.js';

export const meta = {
	requireCredential: true,

	secure: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		currentPassword: { type: 'string' },
		newPassword: { type: 'string', minLength: 1 },
	},
	required: ['currentPassword', 'newPassword'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('usersRepository')
    private usersRepository: typeof Users,

		@Inject('notesRepository')
    private notesRepository: typeof Notes,
	) {
		super(meta, paramDef, async (ps, user) => {
			const profile = await UserProfiles.findOneByOrFail({ userId: user.id });

			// Compare password
			const same = await bcrypt.compare(ps.currentPassword, profile.password!);

			if (!same) {
				throw new Error('incorrect password');
			}

			// Generate hash of password
			const salt = await bcrypt.genSalt(8);
			const hash = await bcrypt.hash(ps.newPassword, salt);

			await UserProfiles.update(user.id, {
				password: hash,
			});
		});
	}
}
