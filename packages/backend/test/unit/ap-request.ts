/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as assert from 'assert';
import { verifyDraftSignature, parseRequestSignature, genEd25519KeyPair, genRsaKeyPair, importPrivateKey } from '@misskey-dev/node-http-message-signatures';
import { createSignedGet, createSignedPost } from '@/core/activitypub/ApRequestService.js';

export const buildParsedSignature = (signingString: string, signature: string, algorithm: string) => {
	return {
		scheme: 'Signature',
		params: {
			keyId: 'KeyID',	// dummy, not used for verify
			algorithm: algorithm,
			headers: ['(request-target)', 'date', 'host', 'digest'],	// dummy, not used for verify
			signature: signature,
		},
		signingString: signingString,
		algorithm: algorithm.toUpperCase(),
		keyId: 'KeyID',	// dummy, not used for verify
	};
};

async function getKeyPair(level: string) {
	if (level === '00') {
		return await genRsaKeyPair();
	} else if (level === '01') {
		return await genEd25519KeyPair();
	}
	throw new Error('Invalid level');
}

describe('ap-request post', () => {
	const url = 'https://example.com/inbox';
	const activity = { a: 1 };
	const body = JSON.stringify(activity);
	const headers = {
		'User-Agent': 'UA',
	};

	describe.each(['00', '01'])('createSignedPost with verify', (level) => {
		test('pem', async () => {
			const keypair = await getKeyPair(level);
			const key = { keyId: 'x', 'privateKeyPem': keypair.privateKey };

			const req = await createSignedPost({ level, key, url, body, additionalHeaders: headers });

			const parsed = parseRequestSignature(req.request);
			expect(parsed.version).toBe('draft');
			expect(Array.isArray(parsed.value)).toBe(false);
			const verify = await verifyDraftSignature(parsed.value as any, keypair.publicKey);
			assert.deepStrictEqual(verify, true);
		});
		test('imported', async () => {
			const keypair = await getKeyPair(level);
			const key = { keyId: 'x', 'privateKey': await importPrivateKey(keypair.privateKey) };

			const req = await createSignedPost({ level, key, url, body, additionalHeaders: headers });

			const parsed = parseRequestSignature(req.request);
			expect(parsed.version).toBe('draft');
			expect(Array.isArray(parsed.value)).toBe(false);
			const verify = await verifyDraftSignature(parsed.value as any, keypair.publicKey);
			assert.deepStrictEqual(verify, true);
		});
	});
});

describe('ap-request get', () => {
	describe.each(['00', '01'])('createSignedGet with verify', (level) => {
		test('pass', async () => {
			const keypair = await getKeyPair(level);
			const key = { keyId: 'x', 'privateKeyPem': keypair.privateKey };
			const url = 'https://example.com/outbox';
			const headers = {
				'User-Agent': 'UA',
			};

			const req = await createSignedGet({ level, key, url, additionalHeaders: headers });

			const parsed = parseRequestSignature(req.request);
			expect(parsed.version).toBe('draft');
			expect(Array.isArray(parsed.value)).toBe(false);
			const verify = await verifyDraftSignature(parsed.value as any, keypair.publicKey);
			assert.deepStrictEqual(verify, true);
		});
	});
});
