import define from '../../define';
import { makePaginationQuery } from '../../common/make-pagination-query';
import { GalleryPosts } from '@/models/index';

export const meta = {
	tags: ['gallery'],

	params: {
		type: 'object',
		properties: {
			limit: { type: 'integer', maximum: 100, default: 10, },
			sinceId: { type: 'string', format: 'misskey:id', },
			untilId: { type: 'string', format: 'misskey:id', },
		},
		required: [],
	},

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'GalleryPost',
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, me) => {
	const query = makePaginationQuery(GalleryPosts.createQueryBuilder('post'), ps.sinceId, ps.untilId)
		.innerJoinAndSelect('post.user', 'user');

	const posts = await query.take(ps.limit!).getMany();

	return await GalleryPosts.packMany(posts, me);
});
