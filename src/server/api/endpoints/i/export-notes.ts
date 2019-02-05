import define from '../../define';
import { createExportNotesJob } from '../../../../queue';
import ms = require('ms');

export const meta = {
	secure: true,
	requireCredential: true,
	limit: {
		duration: ms('1day'),
		max: 1,
	},
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	createExportNotesJob(user);

	res();
}));
