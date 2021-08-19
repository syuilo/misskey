import $ from 'cafy';
import { ID } from '@/misc/cafy-id.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';
import { Antennas } from '@/models/index.js';
import { publishInternalEvent } from '@/services/stream.js';

export const meta = {
	tags: ['antennas'],

	requireCredential: true as const,

	kind: 'write:account',

	params: {
		antennaId: {
			validator: $.type(ID),
		}
	},

	errors: {
		noSuchAntenna: {
			message: 'No such antenna.',
			code: 'NO_SUCH_ANTENNA',
			id: 'b34dcf9d-348f-44bb-99d0-6c9314cfe2df'
		}
	}
};

export default define(meta, async (ps, user) => {
	const antenna = await Antennas.findOne({
		id: ps.antennaId,
		userId: user.id
	});

	if (antenna == null) {
		throw new ApiError(meta.errors.noSuchAntenna);
	}

	await Antennas.delete(antenna.id);

	publishInternalEvent('antennaDeleted', antenna);
});
