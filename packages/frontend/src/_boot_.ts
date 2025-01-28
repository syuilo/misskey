/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// https://vitejs.dev/config/build-options.html#build-modulepreload
import 'vite/modulepreload-polyfill';

if (import.meta.env.DEV) {
	await import('@tabler/icons-webfont/dist/tabler-icons.scss');
} else {
	await import('icons-subsetter/built/tabler-icons-frontend.css');
}

import '@/style.scss';
import { mainBoot } from '@/boot/main-boot.js';
import { subBoot } from '@/boot/sub-boot.js';

const subBootPaths = ['/share', '/auth', '/miauth', '/oauth', '/signup-complete'];

if (subBootPaths.some(i => location.pathname === i || location.pathname.startsWith(i + '/'))) {
	subBoot();
} else {
	mainBoot();
}
