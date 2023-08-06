// @ts-nocheck
/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function byteify(string: string, encoding: 'ascii' | 'base64' | 'hex') {
	switch (encoding) {
		case 'ascii':
			return Uint8Array.from(string, c => c.charCodeAt(0));
		case 'base64':
			return Uint8Array.from(
				atob(
					string
						.replace(/-/g, '+')
						.replace(/_/g, '/'),
				),
				c => c.charCodeAt(0),
			);
		case 'hex':
			return new Uint8Array(
				string
					.match(/.{1,2}/g)
					.map(byte => parseInt(byte, 16)),
			);
	}
}

export function hexify(buffer: ArrayBuffer) {
	return Array.from(new Uint8Array(buffer))
		.reduce(
			(str, byte) => str + byte.toString(16).padStart(2, '0'),
			'',
		);
}

export function stringify(buffer: ArrayBuffer) {
	return String.fromCharCode(... new Uint8Array(buffer));
}
