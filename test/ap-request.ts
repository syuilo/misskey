import * as assert from 'assert';
import { genRsaKeyPair } from '../src/misc/gen-key-pair';
import { createSignedPost, createSignedGet } from '../src/remote/activitypub/ap-request';
const httpSignature = require('http-signature');

export const buildParsedSignature = (signingString: string, signature: string, algorithm: string) => {
	return {
		scheme: 'Signature',
		params: {
			keyId: 'KeyID',	// dummy, not used for verify
			algorithm: algorithm,
			headers: [ '(request-target)', 'date', 'host', 'digest' ],	// dummy, not used for verify
			signature: signature,
		},
		signingString: signingString,
		algorithm: algorithm?.toUpperCase(),
		keyId: 'KeyID',	// dummy, not used for verify
	};
};

describe('ap-request', () => {
	it('createSignedPost with verify', async () => {
		const keypair = await genRsaKeyPair();
		const key = { keyId: 'x', 'privateKeyPem': keypair.privateKey };
		const url = 'https://example.com/inbox';
		const activity = { a: 1 };
		const body = JSON.stringify(activity);
		const headers = {
			'User-Agent': 'UA'
		};

		const req = createSignedPost({ key, url, body, additionalHeaders: headers });

		const parsed = buildParsedSignature(req.signingString, req.signature, 'rsa-sha256');

		const result = httpSignature.verifySignature(parsed, keypair.publicKey);
		assert.deepStrictEqual(result, true);
	});

	it('createSignedGet with verify', async () => {
		const keypair = await genRsaKeyPair();
		const key = { keyId: 'x', 'privateKeyPem': keypair.privateKey };
		const url = 'https://example.com/outbox';
		const headers = {
			'User-Agent': 'UA'
		};

		const req = createSignedGet({ key, url, additionalHeaders: headers });

		const parsed = buildParsedSignature(req.signingString, req.signature, 'rsa-sha256');

		const result = httpSignature.verifySignature(parsed, keypair.publicKey);
		assert.deepStrictEqual(result, true);
	});
});
