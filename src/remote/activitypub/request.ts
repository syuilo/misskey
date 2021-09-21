import config from '@/config/index';
import { getUserKeypair } from '@/misc/keypair-store';
import { User } from '@/models/entities/user';
import { getResponse } from '../../misc/fetch';
import { createSignedPost, createSignedGet } from './ap-request';

export default async (user: { id: User['id'] }, url: string, object: any) => {
	const body = JSON.stringify(object);

	const keypair = await getUserKeypair(user.id);

	const req = createSignedPost({
		key: {
			privateKeyPem: keypair.privateKey,
			keyId: `${config.url}/users/${user.id}#main-key`
		},
		url,
		body,
		additionalHeaders: {
			'User-Agent': config.userAgent,
		}
	});

	await getResponse({
		url,
		method: req.request.method,
		headers: req.request.headers,
		body,
	});
};

/**
 * Get AP object with http-signature
 * @param user http-signature user
 * @param url URL to fetch
 */
export async function signedGet(url: string, user: { id: User['id'] }) {
	const keypair = await getUserKeypair(user.id);

	const req = createSignedGet({
		key: {
			privateKeyPem: keypair.privateKey,
			keyId: `${config.url}/users/${user.id}#main-key`
		},
		url,
		additionalHeaders: {
			'User-Agent': config.userAgent,
		}
	});

	const res = await getResponse({
		url,
		method: req.request.method,
		headers: req.request.headers
	});

	return await res.json();
}
