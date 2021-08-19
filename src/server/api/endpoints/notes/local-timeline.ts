import $ from 'cafy';
import { ID } from '@/misc/cafy-id.js';
import define from '../../define.js';
import { fetchMeta } from '@/misc/fetch-meta.js';
import { ApiError } from '../../error.js';
import { Notes } from '@/models/index.js';
import { generateMutedUserQuery } from '../../common/generate-muted-user-query.js';
import { makePaginationQuery } from '../../common/make-pagination-query.js';
import { generateVisibilityQuery } from '../../common/generate-visibility-query.js';
import { activeUsersChart } from '@/services/chart/index.js';
import { Brackets } from 'typeorm';
import { generateRepliesQuery } from '../../common/generate-replies-query.js';
import { generateMutedNoteQuery } from '../../common/generate-muted-note-query.js';
import { generateChannelQuery } from '../../common/generate-channel-query.js';
import { generateBlockedUserQuery } from '../../common/generate-block-query.js';

export const meta = {
	tags: ['notes'],

	params: {
		withFiles: {
			validator: $.optional.bool,
		},

		fileType: {
			validator: $.optional.arr($.str),
		},

		excludeNsfw: {
			validator: $.optional.bool,
			default: false,
		},

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

		sinceDate: {
			validator: $.optional.num,
		},

		untilDate: {
			validator: $.optional.num,
		},
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'Note',
		}
	},

	errors: {
		ltlDisabled: {
			message: 'Local timeline has been disabled.',
			code: 'LTL_DISABLED',
			id: '45a6eb02-7695-4393-b023-dd3be9aaaefd'
		},
	}
};

export default define(meta, async (ps, user) => {
	const m = await fetchMeta();
	if (m.disableLocalTimeline) {
		if (user == null || (!user.isAdmin && !user.isModerator)) {
			throw new ApiError(meta.errors.ltlDisabled);
		}
	}

	//#region Construct query
	const query = makePaginationQuery(Notes.createQueryBuilder('note'),
			ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
		.andWhere('(note.visibility = \'public\') AND (note.userHost IS NULL)')
		.innerJoinAndSelect('note.user', 'user')
		.leftJoinAndSelect('note.reply', 'reply')
		.leftJoinAndSelect('note.renote', 'renote')
		.leftJoinAndSelect('reply.user', 'replyUser')
		.leftJoinAndSelect('renote.user', 'renoteUser');

	generateChannelQuery(query, user);
	generateRepliesQuery(query, user);
	generateVisibilityQuery(query, user);
	if (user) generateMutedUserQuery(query, user);
	if (user) generateMutedNoteQuery(query, user);
	if (user) generateBlockedUserQuery(query, user);

	if (ps.withFiles) {
		query.andWhere('note.fileIds != \'{}\'');
	}

	if (ps.fileType != null) {
		query.andWhere('note.fileIds != \'{}\'');
		query.andWhere(new Brackets(qb => {
			for (const type of ps.fileType!) {
				const i = ps.fileType!.indexOf(type);
				qb.orWhere(`:type${i} = ANY(note.attachedFileTypes)`, { [`type${i}`]: type });
			}
		}));

		if (ps.excludeNsfw) {
			query.andWhere('note.cw IS NULL');
			query.andWhere('0 = (SELECT COUNT(*) FROM drive_file df WHERE df.id = ANY(note."fileIds") AND df."isSensitive" = TRUE)');
		}
	}
	//#endregion

	const timeline = await query.take(ps.limit!).getMany();

	process.nextTick(() => {
		if (user) {
			activeUsersChart.update(user);
		}
	});

	return await Notes.packMany(timeline, user);
});
