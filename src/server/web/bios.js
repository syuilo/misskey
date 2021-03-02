'use strict';

window.onload = async () => {
	const account = JSON.parse(localStorage.getItem('account'));
	const i = account.token;

	const api = (endpoint, data = {}) => {
		const promise = new Promise((resolve, reject) => {
			// Append a credential
			if (i) data.i = i;
	
			// Send request
			fetch(endpoint.indexOf('://') > -1 ? endpoint : `/api/${endpoint}`, {
				method: 'POST',
				body: JSON.stringify(data),
				credentials: 'omit',
				cache: 'no-cache'
			}).then(async (res) => {
				const body = res.status === 204 ? null : await res.json();
	
				if (res.status === 200) {
					resolve(body);
				} else if (res.status === 204) {
					resolve();
				} else {
					reject(body.error);
				}
			}).catch(reject);
		});
		
		return promise;
	};
};
