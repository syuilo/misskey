/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { genEd25519KeyPair, genRsaKeyPair } from '@misskey-dev/node-http-message-signatures';

export async function genRSAAndEd25519KeyPair(rsaModulusLength = 4096) {
	const [rsa, ed25519] = await Promise.all([genRsaKeyPair(rsaModulusLength), genEd25519KeyPair()]);
	return {
		publicKey: rsa.publicKey,
		privateKey: rsa.privateKey,
		ed25519PublicKey: ed25519.publicKey,
		ed25519PrivateKey: ed25519.privateKey,
	};
}
