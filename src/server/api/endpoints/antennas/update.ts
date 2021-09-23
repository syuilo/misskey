import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { ApiError } from '../../error';
import { Antennas, UserLists, UserGroupJoinings } from '@/models/index';
import { publishInternalEvent } from '@/services/stream';

export const meta = {
	tags: ['antennas'],

	requireCredential: true as const,

	kind: 'write:account',

	params: {
		antennaId: {
			validator: $.type(ID),
		},

		name: {
			validator: $.str.range(1, 100)
		},

		src: {
			validator: $.str.or(['home', 'all', 'users', 'list', 'group'])
		},

		userListId: {
			validator: $.nullable.optional.type(ID),
		},

		userGroupId: {
			validator: $.nullable.optional.type(ID),
		},

		keywords: {
			validator: $.arr($.arr($.str))
		},

		excludeKeywords: {
			validator: $.arr($.arr($.str))
		},

		users: {
			validator: $.arr($.str)
		},

		caseSensitive: {
			validator: $.bool
		},

		withReplies: {
			validator: $.bool
		},

		withFile: {
			validator: $.bool
		},

		notify: {
			validator: $.bool
		}
	},

	errors: {
		noSuchAntenna: {
			message: 'No such antenna.',
			code: 'NO_SUCH_ANTENNA',
			id: '10c673ac-8852-48eb-aa1f-f5b67f069290'
		},

		noSuchUserList: {
			message: 'No such user list.',
			code: 'NO_SUCH_USER_LIST',
			id: '1c6b35c9-943e-48c2-81e4-2844989407f7'
		},

		noSuchUserGroup: {
			message: 'No such user group.',
			code: 'NO_SUCH_USER_GROUP',
			id: '109ed789-b6eb-456e-b8a9-6059d567d385'
		}
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		ref: 'Antenna'
	}
};

export default define(meta, async (ps, user) => {
	// Fetch the antenna
	const antenna = await Antennas.findOne({
		id: ps.antennaId,
		userId: user.id
	});

	if (antenna == null) {
		throw new ApiError(meta.errors.noSuchAntenna);
	}

	let userList;
	let userGroupJoining;

	if (ps.src === 'list' && ps.userListId) {
		userList = await UserLists.findOne({
			id: ps.userListId,
			userId: user.id,
		});

		if (userList == null) {
			throw new ApiError(meta.errors.noSuchUserList);
		}
	} else if (ps.src === 'group' && ps.userGroupId) {
		userGroupJoining = await UserGroupJoinings.findOne({
			userGroupId: ps.userGroupId,
			userId: user.id,
		});

		if (userGroupJoining == null) {
			throw new ApiError(meta.errors.noSuchUserGroup);
		}
	}

	await Antennas.update(antenna.id, {
		name: ps.name,
		src: ps.src,
		userListId: userList ? userList.id : null,
		userGroupJoiningId: userGroupJoining ? userGroupJoining.id : null,
		keywords: ps.keywords,
		excludeKeywords: ps.excludeKeywords,
		users: ps.users,
		caseSensitive: ps.caseSensitive,
		withReplies: ps.withReplies,
		withFile: ps.withFile,
		notify: ps.notify,
	});

	publishInternalEvent('antennaUpdated', await Antennas.findOneOrFail(antenna.id));

	return await Antennas.pack(antenna.id);
});
