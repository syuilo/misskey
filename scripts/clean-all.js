/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const { execSync } = require('child_process');
const fs = require('fs');

(async () => {
	fs.rmSync(__dirname + '/../packages/backend/built', { recursive: true, force: true });
	fs.rmSync(__dirname + '/../packages/backend/node_modules', { recursive: true, force: true });

	fs.rmSync(__dirname + '/../packages/frontend/built', { recursive: true, force: true });
	fs.rmSync(__dirname + '/../packages/frontend/node_modules', { recursive: true, force: true });

	fs.rmSync(__dirname + '/../packages/sw/built', { recursive: true, force: true });
	fs.rmSync(__dirname + '/../packages/sw/node_modules', { recursive: true, force: true });

	fs.rmSync(__dirname + '/../packages/misskey-js/built', { recursive: true, force: true });
	fs.rmSync(__dirname + '/../packages/misskey-js/node_modules', { recursive: true, force: true });

	fs.rmSync(__dirname + '/../packages/misskey-reversi/built', { recursive: true, force: true });
	fs.rmSync(__dirname + '/../packages/misskey-reversi/node_modules', { recursive: true, force: true });

	fs.rmSync(__dirname + '/../packages/misskey-bubble-game/built', { recursive: true, force: true });
	fs.rmSync(__dirname + '/../packages/misskey-bubble-game/node_modules', { recursive: true, force: true });

	fs.rmSync(__dirname + '/../packages/misskey-mahjong/built', { recursive: true, force: true });
	fs.rmSync(__dirname + '/../packages/misskey-mahjong/node_modules', { recursive: true, force: true });

	fs.rmSync(__dirname + '/../built', { recursive: true, force: true });
	fs.rmSync(__dirname + '/../node_modules', { recursive: true, force: true });

	execSync('pnpm store prune', {
		cwd: __dirname + '/../',
		stdio: 'inherit',
	});
})();
