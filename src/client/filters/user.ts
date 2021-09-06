import { getAcctUi } from '@/misc/acct';
import getUserName from '@/misc/get-user-name';
import { url } from '@client/config';

export const userName = user => {
	return getUserName(user);
};

export const userPage = (user, path?, absolute = false) => {
	return `${absolute ? url : ''}/@${getAcctUi(user)}${(path ? `/${path}` : '')}`;
};
