import $ from 'cafy';
import { ID } from '@/misc/cafy-id.js';
import define from '../../define.js';
import { makePaginationQuery } from '../../common/make-pagination-query.js';
import { GalleryPosts } from '@/models/index.js';

export const meta = {
	tags: ['gallery'],

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		sinceId: {
			validator: $.optional.type(ID),
		},

		untilId: {
			validator: $.optional.type(ID),
		},
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'GalleryPost',
		}
	},
};

export default define(meta, async (ps, me) => {
	const query = makePaginationQuery(GalleryPosts.createQueryBuilder('post'), ps.sinceId, ps.untilId)
		.innerJoinAndSelect('post.user', 'user');

	const posts = await query.take(ps.limit!).getMany();

	return await GalleryPosts.packMany(posts, me);
});
