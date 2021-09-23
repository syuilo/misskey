import * as Misskey from 'misskey-js';

export const getAcct = (user: Misskey.Acct) => {
	return user.host == null ? user.username : `${user.username}@${user.host}`;
};

export const parseAcct = (acct: string): Misskey.Acct => {
	if (acct.startsWith('@')) acct = acct.substr(1);
	const split = acct.split('@', 2);
	return { username: split[0], host: split[1] || null };
};
