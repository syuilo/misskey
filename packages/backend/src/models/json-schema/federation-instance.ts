/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const packedFederationInstanceSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		firstRetrievedAt: {
			type: 'string',
			optional: false, nullable: false,
			format: 'date-time',
		},
		host: {
			type: 'string',
			optional: false, nullable: false,
			example: 'misskey.example.com',
		},
		usersCount: {
			type: 'number',
			optional: false, nullable: false,
		},
		notesCount: {
			type: 'number',
			optional: false, nullable: false,
		},
		followingCount: {
			type: 'number',
			optional: false, nullable: false,
		},
		followersCount: {
			type: 'number',
			optional: false, nullable: false,
		},
		isNotResponding: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		isSuspended: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		suspensionState: {
			type: 'string',
			nullable: false, optional: false,
			enum: ['none', 'manuallySuspended', 'goneSuspended', 'autoSuspendedForNotResponding'],
		},
		isBlocked: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		softwareName: {
			type: 'string',
			optional: false, nullable: true,
			example: 'misskey',
		},
		softwareVersion: {
			type: 'string',
			optional: false, nullable: true,
		},
		openRegistrations: {
			type: 'boolean',
			optional: false, nullable: true,
			example: true,
		},
		name: {
			type: 'string',
			optional: false, nullable: true,
		},
		description: {
			type: 'string',
			optional: false, nullable: true,
		},
		maintainerName: {
			type: 'string',
			optional: false, nullable: true,
		},
		maintainerEmail: {
			type: 'string',
			optional: false, nullable: true,
		},
		isSilenced: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		isMediaSilenced: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		iconUrl: {
			type: 'string',
			optional: false, nullable: true,
			format: 'url',
		},
		faviconUrl: {
			type: 'string',
			optional: false, nullable: true,
			format: 'url',
		},
		themeColor: {
			type: 'string',
			optional: false, nullable: true,
		},
		infoUpdatedAt: {
			type: 'string',
			optional: false, nullable: true,
			format: 'date-time',
		},
		latestRequestReceivedAt: {
			type: 'string',
			optional: false, nullable: true,
			format: 'date-time',
		},
		moderationNote: {
			type: 'string',
			optional: true, nullable: true,
		},
		httpMessageSignaturesImplementationLevel: {
			type: 'string',
			optional: false, nullable: false,
		},
	},
} as const;
