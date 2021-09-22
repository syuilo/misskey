import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import { publishDriveStream } from '@/services/stream';
import define from '../../../define';
import { ApiError } from '../../../error';
import { DriveFiles, DriveFolders } from '@/models/index';
import { DB_MAX_IMAGE_COMMENT_LENGTH } from '@/misc/hard-limits';

export const meta = {
	tags: ['drive'],

	requireCredential: true as const,

	kind: 'write:drive',

	params: {
		fileId: {
			validator: $.type(ID),
		},

		folderId: {
			validator: $.optional.nullable.type(ID),
			default: undefined as any,
		},

		name: {
			validator: $.optional.str.pipe(DriveFiles.validateFileName),
			default: undefined as any,
		},

		isSensitive: {
			validator: $.optional.bool,
			default: undefined as any,
		},

		comment: {
			validator: $.optional.nullable.str.max(DB_MAX_IMAGE_COMMENT_LENGTH),
			default: undefined as any,
		}
	},

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'e7778c7e-3af9-49cd-9690-6dbc3e6c972d'
		},

		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '01a53b27-82fc-445b-a0c1-b558465a8ed2'
		},

		noSuchFolder: {
			message: 'No such folder.',
			code: 'NO_SUCH_FOLDER',
			id: 'ea8fb7a5-af77-4a08-b608-c0218176cd73'
		},
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		ref: 'DriveFile'
	}
};

export default define(meta, async (ps, user) => {
	const file = await DriveFiles.findOne(ps.fileId);

	if (file == null) {
		throw new ApiError(meta.errors.noSuchFile);
	}

	if (!user.isAdmin && !user.isModerator && (file.userId !== user.id)) {
		throw new ApiError(meta.errors.accessDenied);
	}

	if (ps.name) file.name = ps.name;

	if (ps.comment !== undefined) file.comment = ps.comment;

	if (ps.isSensitive !== undefined) file.isSensitive = ps.isSensitive;

	if (ps.folderId !== undefined) {
		if (ps.folderId === null) {
			file.folderId = null;
		} else {
			const folder = await DriveFolders.findOne({
				id: ps.folderId,
				userId: user.id
			});

			if (folder == null) {
				throw new ApiError(meta.errors.noSuchFolder);
			}

			file.folderId = folder.id;
		}
	}

	await DriveFiles.update(file.id, {
		name: file.name,
		comment: file.comment,
		folderId: file.folderId,
		isSensitive: file.isSensitive
	});

	const fileObj = await DriveFiles.pack(file, { self: true });

	// Publish fileUpdated event
	publishDriveStream(user.id, 'fileUpdated', fileObj);

	return fileObj;
});
