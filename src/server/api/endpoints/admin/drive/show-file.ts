import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import define from '../../../define';
import DriveFile from '../../../../../models/drive-file';
import { ApiError } from '../../../error';

export const meta = {
	requireCredential: true,
	requireModerator: true,

	params: {
		fileId: {
			validator: $.type(ID),
			transform: transform,
		},
	},

	errors: {
		fileNotFound: {
			message: 'File not found.',
			code: 'FILE_NOT_FOUND',
			id: 'caf3ca38-c6e5-472e-a30c-b05377dcc240'
		}
	}
};

export default define(meta, async (ps, me) => {
	const file = await DriveFile.findOne({
		_id: ps.fileId
	});

	if (file == null) {
		throw new ApiError(meta.errors.fileNotFound);
	}

	return file;
});
