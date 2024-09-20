import { strictEqual } from 'assert';
import { readFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import * as Misskey from 'misskey-js';
import { SwitchCaseResponseType } from 'misskey-js/api.types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** used for avoiding overload and some endpoints */
type Request = <E extends keyof Misskey.Endpoints, P extends Misskey.Endpoints[E]['req']>(
	endpoint: E, params: P, credential?: string | null
) => Promise<SwitchCaseResponseType<E, P>>;

export const ADMIN_PARAMS = { username: 'admin', password: 'admin' };

export async function signin(host: string, params: Misskey.entities.SigninRequest): Promise<Misskey.entities.SigninResponse> {
	// wait for a second to prevent hit rate limit
	await new Promise(resolve => setTimeout(resolve, 1000));
	console.log(`Sign in to @${params.username}@${host} ...`);
	return await (new Misskey.api.APIClient({
		origin: `https://${host}`,
		fetch: (input, init) => fetch(input, {
			...init,
			headers: {
				...init?.headers,
				'Content-Type': init?.headers['Content-Type'] != null ? init.headers['Content-Type'] : 'application/json',
			},
		}),
	}).request as Request)('signin', params)
		.then(res => {
			console.log(`Signed in to @${params.username}@${host}`);
			return res;
		})
		.catch(async err => {
			if (err.id === '22d05606-fbcf-421a-a2db-b32610dcfd1b') {
				await new Promise(resolve => setTimeout(resolve, Math.random() * 5000));
				return await signin(host, params);
			}
			throw err;
		});
}

const adminCache = new Map<string, Misskey.entities.SigninResponse>();

async function createAdmin(host: string): Promise<Misskey.entities.SignupResponse | undefined> {
	const client = new Misskey.api.APIClient({ origin: `https://${host}` });
	return await client.request('admin/accounts/create', ADMIN_PARAMS).then(res => {
		console.log(`Successfully created admin account: @${ADMIN_PARAMS.username}@${host}`);
		adminCache.set(host, {
			id: res.id,
			// @ts-expect-error FIXME: openapi-typescript generates incorrect response type for this endpoint, so ignore this
			i: res.token,
		});
		return res as Misskey.entities.SignupResponse;
	}).then(async res => {
		await client.request('admin/roles/update-default-policies', {
			policies: {
				rateLimitFactor: 0 as never,
			},
		}, res.token);
		return res;
	}).catch(err => {
		if (err.info.e.message === 'access denied') {
			console.log(`Admin account already exists: @${ADMIN_PARAMS.username}@${host}`);
			return undefined;
		}
		throw err;
	});
}

export async function fetchAdmin(host: string): Promise<[Misskey.entities.SigninResponse, Misskey.api.APIClient]> {
	await new Promise(resolve => setTimeout(resolve, Math.random() * 5000));

	const admin = adminCache.get(host) ?? await signin(host, ADMIN_PARAMS)
		.then(res => {
			adminCache.set(host, res);
			return res;
		})
		.catch(async err => {
			if (err.id === '6cc579cc-885d-43d8-95c2-b8c7fc963280') {
				await createAdmin(host);
				return await signin(host, ADMIN_PARAMS);
			} else if (err.id === '22d05606-fbcf-421a-a2db-b32610dcfd1b') {
				return await signin(host, ADMIN_PARAMS);
			}
			throw err;
		});

	return [admin, new Misskey.api.APIClient({ origin: `https://${host}`, credential: admin.i })];
}

export async function createAccount(host: string, adminClient: Misskey.api.APIClient): Promise<[Misskey.entities.SigninResponse, Misskey.api.APIClient, { username: string; password: string }]> {
	const username = crypto.randomUUID().replaceAll('-', '').substring(0, 20);
	const password = crypto.randomUUID().replaceAll('-', '');
	await adminClient.request('admin/accounts/create', { username, password });
	console.log(`Created an account: @${username}@${host}`);
	const signinRes = await signin(host, { username, password });

	return [
		signinRes,
		new Misskey.api.APIClient({ origin: `https://${host}`, credential: signinRes.i }),
		{ username, password },
	];
}

export async function resolveRemoteUser(url: string, fromClient: Misskey.api.APIClient): Promise<Misskey.entities.UserDetailedNotMe> {
	return new Promise<Misskey.entities.UserDetailedNotMe>((resolve, reject) => {
		fromClient.request('ap/show', { uri: url })
			.then(res => {
				strictEqual(res.type, 'User');
				strictEqual(res.object.url, url);
				resolve(res.object);
			})
			.catch(err => reject(err));
	});
}

export async function resolveRemoteNote(uri: string, fromClient: Misskey.api.APIClient): Promise<Misskey.entities.Note> {
	return new Promise<Misskey.entities.Note>((resolve, reject) => {
		fromClient.request('ap/show', { uri })
			.then(res => {
				strictEqual(res.type, 'Note');
				strictEqual(res.object.uri, uri);
				resolve(res.object);
			})
			.catch(err => reject(err));
	});
}

export async function uploadFile(host: string, path: string, token: string): Promise<Misskey.entities.DriveFile> {
	const filename = path.split('/').pop() ?? 'untitled';
	const blob = new Blob([await readFile(join(__dirname, path))]);

	const body = new FormData();
	body.append('i', token);
	body.append('force', 'true');
	body.append('file', blob);
	body.append('name', filename);

	return new Promise<Misskey.entities.DriveFile>((resolve, reject) => {
		fetch(`https://${host}/api/drive/files/create`, {
			method: 'POST',
			body,
		}).then(async res => {
			resolve(await res.json());
		}).catch(err => {
			reject(err);
		});
	});
}
