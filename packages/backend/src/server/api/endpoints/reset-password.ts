import * as bcrypt from 'bcryptjs';
import { publishMainStream } from '@/services/stream';
import define from '../define';
import { Users, UserProfiles, PasswordResetRequests } from '@/models/index';
import { ApiError } from '../error';

export const meta = {
	requireCredential: false,

	params: {
		type: 'object',
		properties: {
			token: { type: 'string', },
			password: { type: 'string', },
		},
		required: ['token', 'password'],
	},

	errors: {

	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	const req = await PasswordResetRequests.findOneOrFail({
		token: ps.token,
	});

	// 発行してから30分以上経過していたら無効
	if (Date.now() - req.createdAt.getTime() > 1000 * 60 * 30) {
		throw new Error(); // TODO
	}

	// Generate hash of password
	const salt = await bcrypt.genSalt(8);
	const hash = await bcrypt.hash(ps.password, salt);

	await UserProfiles.update(req.userId, {
		password: hash,
	});

	PasswordResetRequests.delete(req.id);
});
