import * as Koa from 'koa';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import { publishMainStream } from '../../../services/stream';
import signin from '../common/signin';
import config from '../../../config';
import { Users, Signins, UserProfiles, UserSecurityKeys, AttestationChallenges } from '../../../models';
import { ILocalUser } from '../../../models/entities/user';
import { genId } from '../../../misc/gen-id';
import { ensure } from '../../../prelude/ensure';
import { verifyLogin, hash } from '../2fa';

export default async (ctx: Koa.BaseContext) => {
	ctx.set('Access-Control-Allow-Origin', config.url);
	ctx.set('Access-Control-Allow-Credentials', 'true');

	const body = ctx.request.body as any;
	const username = body['username'];
	const password = body['password'];
	const token = body['token'];

	if (typeof username != 'string') {
		ctx.status = 400;
		return;
	}

	if (typeof password != 'string') {
		ctx.status = 400;
		return;
	}

	if (token != null && typeof token != 'string') {
		ctx.status = 400;
		return;
	}

	// Fetch user
	const user = await Users.findOne({
		usernameLower: username.toLowerCase(),
		host: null
	}) as ILocalUser;

	if (user == null) {
		ctx.throw(404, {
			error: 'user not found'
		});
		return;
	}

	const profile = await UserProfiles.findOne(user.id).then(ensure);

	// Compare password
	const same = await bcrypt.compare(password, profile.password!);

	async function fail(status?: number, failure?: {error: string}) {
		// Append signin history
		const record = await Signins.save({
			id: genId(),
			createdAt: new Date(),
			userId: user.id,
			ip: ctx.ip,
			headers: ctx.headers,
			success: !!(status || failure)
		});

		// Publish signin event
		publishMainStream(user.id, 'signin', await Signins.pack(record));

		if (status && failure) {
			ctx.throw(status, failure);
		}
	}

	if (same) {
		if (profile.twoFactorEnabled) {
			if (token) {
				const verified = (speakeasy as any).totp.verify({
					secret: profile.twoFactorSecret,
					encoding: 'base32',
					token: token
				});

				if (verified) {
					signin(ctx, user);
					return;
				} else {
					await fail(403, {
						error: 'invalid token'
					});
					return;
				}
			} else {
				const clientDataJSON = Buffer.from(body.clientDataJSON, 'hex');
				const clientData = JSON.parse(clientDataJSON.toString('utf-8'));
				const challenge = await AttestationChallenges.findOne({
					userId: user.id,
					id: body.challengeId,
					registrationChallenge: false,
					challenge: hash(clientData.challenge).toString('hex')
				});
				if (!challenge) {
					await fail(403, {
						error: 'non-existent challenge'
					});
					return;
				}

				await AttestationChallenges.delete({
					userId: user.id,
					id: body.challengeId
				});

				if (new Date().getTime() - challenge.createdAt.getTime() >= 5 * 60 * 1000) {
					await fail(403, {
						error: 'non-existent challenge'
					});
					return;
				}

				const securityKey = await UserSecurityKeys.findOne({
					id: Buffer.from(
						body.credentialId
							.replace(/\-/g, '+')
							.replace(/_/g, '/'),
							'base64'
					).toString('hex')
				});

				if (!securityKey) {
					await fail(403, {
						error: 'invalid credentialId'
					});
					return;
				}

				const isValid = verifyLogin({
					publicKey: Buffer.from(securityKey.publicKey, 'hex'),
					authenticatorData: Buffer.from(body.authenticatorData, 'hex'),
					clientDataJSON,
					clientData,
					signature: Buffer.from(body.signature, 'hex'),
					challenge: challenge.challenge
				});
				if (isValid) {
					signin(ctx, user);
				} else {
					await fail(403, {
						error: 'invalid challenge data'
					});
					return;
				}
			}
		} else {
			signin(ctx, user);
			return;
		}
	} else {
		await fail(403, {
			error: 'incorrect password'
		});
		return;
	}

	await fail();
	return;
};
