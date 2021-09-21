import * as crypto from 'crypto';
import { URL } from 'url';

type Request = {
	url: string;
	method: string;
	headers: Record<string, string>;
};

type PrivateKey = {
	privateKeyPem: string;
	keyId: string;
};

export function createSignedPost(args: { key: PrivateKey, url: string, body: string, additionalHeaders: Record<string, string> }) {
	const u = new URL(args.url);
	const digestHeader = `SHA-256=${crypto.createHash('sha256').update(args.body).digest('base64')}`;

	const request: Request = {
		url: u.href,
		method: 'POST',
		headers:  objectAssignWithLcKey({
			'Date': new Date().toUTCString(),
			'Host': u.hostname,
			'Content-Type': 'application/activity+json',
			'Digest': digestHeader,
		}, args.additionalHeaders),
	};

	const result = signToRequest(request, args.key, ['(request-target)', 'date', 'host', 'digest']);

	return {
		request,
		signingString: result.signingString,
		signature: result.signature,
		signatureHeader: result.signatureHeader,
	};
}

export function createSignedGet(args: { key: PrivateKey, url: string, additionalHeaders: Record<string, string> }) {
	const u = new URL(args.url);

	const request: Request = {
		url: u.href,
		method: 'GET',
		headers:  objectAssignWithLcKey({
			'Accept': 'application/activity+json, application/ld+json',
			'Date': new Date().toUTCString(),
			'Host': new URL(args.url).hostname,
		}, args.additionalHeaders),
	};

	const result = signToRequest(request, args.key, ['(request-target)', 'date', 'host', 'accept']);

	return {
		request,
		signingString: result.signingString,
		signature: result.signature,
		signatureHeader: result.signatureHeader,
	};
}

function signToRequest(request: Request, key: PrivateKey, includeHeaders: string[]) {
	const signingString = genSigningString(request, includeHeaders);
	const signature = crypto.sign('sha256', Buffer.from(signingString), key.privateKeyPem).toString('base64');
	const signatureHeader = `keyId="${key.keyId}",algorithm="rsa-sha256",headers="${includeHeaders.join(' ')}",signature="${signature}"`;

	request.headers = objectAssignWithLcKey(request.headers, {
		Signature: signatureHeader
	});

	return {
		request,
		signingString,
		signature,
		signatureHeader,
	};
}

function genSigningString(request: Request, includeHeaders: string[]) {
	request.headers = lcObjectKey(request.headers);

	const results: string[] = [];

	for (const key of includeHeaders.map(x => x.toLowerCase())) {
		if (key === '(request-target)') {
			results.push(`(request-target): ${request.method.toLowerCase()} ${new URL(request.url).pathname}`);
		} else {
			results.push(`${key}: ${request.headers[key]}`);
		}
	}

	return results.join('\n');
}

function lcObjectKey(src: Record<string, string>) {
	const dst: Record<string, string> = {};
	for (const key of Object.keys(src).filter(x => x != '__proto__' && typeof src[x] === 'string')) dst[key.toLowerCase()] = src[key];
	return dst;
}

function objectAssignWithLcKey(a: Record<string, string>, b: Record<string, string>) {
	return Object.assign(lcObjectKey(a), lcObjectKey(b));
}
