import { get } from 'idb-keyval';

export async function getAccountFromId(id: string) {
	const accounts = await get<{ token: string; id: string }[]>('accounts');
	if (!accounts) {
		console.log('Accounts are not recorded');
		return;
	}
	return accounts.find(e => e.id === id);
}
