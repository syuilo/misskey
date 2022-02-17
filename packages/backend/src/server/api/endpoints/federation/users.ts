import define from '../../define';
import { Users } from '@/models/index';
import { makePaginationQuery } from '../../common/make-pagination-query';

export const meta = {
	tags: ['federation'],

	requireCredential: false,

	params: {
		type: 'object',
		properties: {
			host: { type: 'string', },
			sinceId: { type: 'string', format: 'misskey:id', },
			untilId: { type: 'string', format: 'misskey:id', },
			limit: { type: 'integer', maximum: 100, default: 10, },
		},
		required: ['host'],
	},

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'UserDetailedNotMe',
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, me) => {
	const query = makePaginationQuery(Users.createQueryBuilder('user'), ps.sinceId, ps.untilId)
		.andWhere(`user.host = :host`, { host: ps.host });

	const users = await query
		.take(ps.limit!)
		.getMany();

	return await Users.packMany(users, me, { detail: true });
});
