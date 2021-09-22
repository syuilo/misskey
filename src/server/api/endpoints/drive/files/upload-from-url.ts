import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import * as ms from 'ms';
import uploadFromUrl from '@/services/drive/upload-from-url';
import define from '../../../define';
import { DriveFiles } from '@/models/index';
import { publishMainStream } from '@/services/stream';
import { DB_MAX_IMAGE_COMMENT_LENGTH } from '@/misc/hard-limits';

export const meta = {
	tags: ['drive'],

	limit: {
		duration: ms('1hour'),
		max: 60
	},

	requireCredential: true as const,

	kind: 'write:drive',

	params: {
		url: {
			// TODO: Validate this url
			validator: $.str,
		},

		folderId: {
			validator: $.optional.nullable.type(ID),
			default: null,
		},

		isSensitive: {
			validator: $.optional.bool,
			default: false,
		},

		comment: {
			validator: $.optional.nullable.str.max(DB_MAX_IMAGE_COMMENT_LENGTH),
			default: null,
		},

		marker: {
			validator: $.optional.nullable.str,
			default: null,
		},

		force: {
			validator: $.optional.bool,
			default: false,
		}
	}
};

export default define(meta, async (ps, user) => {
	uploadFromUrl(ps.url, user, ps.folderId, null, ps.isSensitive, ps.force, false, ps.comment).then(file => {
		DriveFiles.pack(file, { self: true }).then(packedFile => {
			publishMainStream(user.id, 'urlUploadFinished', {
				marker: ps.marker,
				file: packedFile
			});
		});
	});
});
