import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { genId } from '@/misc/gen-id.js';
import { AnnouncementReads, Announcements, Users } from '@/models/index.js';
import { publishMainStream } from '@/services/stream.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['account'],

	requireCredential: true,

	kind: 'write:account',

	errors: {
		noSuchAnnouncement: {
			message: 'No such announcement.',
			code: 'NO_SUCH_ANNOUNCEMENT',
			id: '184663db-df88-4bc2-8b52-fb85f0681939',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		announcementId: { type: 'string', format: 'misskey:id' },
	},
	required: ['announcementId'],
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
			// Check if announcement exists
			const announcement = await Announcements.findOneBy({ id: ps.announcementId });

			if (announcement == null) {
				throw new ApiError(meta.errors.noSuchAnnouncement);
			}

			// Check if already read
			const read = await AnnouncementReads.findOneBy({
				announcementId: ps.announcementId,
				userId: user.id,
			});

			if (read != null) {
				return;
			}

			// Create read
			await AnnouncementReads.insert({
				id: genId(),
				createdAt: new Date(),
				announcementId: ps.announcementId,
				userId: user.id,
			});

			if (!await this.usersRepository.getHasUnreadAnnouncement(user.id)) {
				publishMainStream(user.id, 'readAllAnnouncements');
			}
		});
	}
}
