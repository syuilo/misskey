import { toUnicode } from 'punycode/';

export type Acct = {
	username: string;
	host: string | null;
};

export const getAcct = (user: Acct) => {
	return user.host == null ? user.username : `${user.username}@${user.host}`;
};

export const getAcctUi = (user: Acct) => {
	return user.host == null ? user.username: `${user.username}@${toUnicode(user.host)}`;
};

export const parseAcct = (acct: string): Acct => {
	if (acct.startsWith('@')) acct = acct.substr(1);
	const split = acct.split('@', 2);
	return { username: split[0], host: split[1] || null };
};
