import { Inject, Injectable } from '@nestjs/common';
import { getJsonSchema } from '@/services/chart/core.js';
import { perUserNotesChart } from '@/services/chart/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';

export const meta = {
	tags: ['charts', 'users', 'notes'],

	res: getJsonSchema(perUserNotesChart.schema),

	allowGet: true,
	cacheSec: 60 * 60,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		span: { type: 'string', enum: ['day', 'hour'] },
		limit: { type: 'integer', minimum: 1, maximum: 500, default: 30 },
		offset: { type: 'integer', nullable: true, default: null },
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['span', 'userId'],
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
			return await perUserNotesChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null, ps.userId);
		});
	}
}
