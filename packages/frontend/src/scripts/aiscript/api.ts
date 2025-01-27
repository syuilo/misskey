/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { errors, utils, values } from '@syuilo/aiscript';
import * as Misskey from 'misskey-js';
import { url, lang } from '@@/js/config.js';
import { assertStringAndIsIn } from './common.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { $i } from '@/account.js';
import { miLocalStorage } from '@/local-storage.js';
import { customEmojis } from '@/custom-emojis.js';

const DIALOG_TYPES = [
	'error',
	'info',
	'success',
	'warning',
	'waiting',
	'question',
] as const;

export function aiScriptReadline(q: string): Promise<string> {
	return new Promise(ok => {
		os.inputText({
			title: q,
		}).then(({ result: a }) => {
			ok(a ?? '');
		});
	});
}

export function createAiScriptEnv(opts: { storageKey: string, token?: string }) {
	return {
		USER_ID: $i ? values.STR($i.id) : values.NULL,
		USER_NAME: $i?.name ? values.STR($i.name) : values.NULL,
		USER_USERNAME: $i ? values.STR($i.username) : values.NULL,
		CUSTOM_EMOJIS: utils.jsToVal(customEmojis.value),
		LOCALE: values.STR(lang),
		SERVER_URL: values.STR(url),
		'Mk:dialog': values.FN_NATIVE(async ([title, text, type]) => {
			utils.assertString(title);
			utils.assertString(text);
			if (type != null) {
				assertStringAndIsIn(type, DIALOG_TYPES);
			}
			await os.alert({
				type: type ? type.value : 'info',
				title: title.value,
				text: text.value,
			});
			return values.NULL;
		}),
		'Mk:confirm': values.FN_NATIVE(async ([title, text, type]) => {
			utils.assertString(title);
			utils.assertString(text);
			if (type != null) {
				assertStringAndIsIn(type, DIALOG_TYPES);
			}
			const confirm = await os.confirm({
				type: type ? type.value : 'question',
				title: title.value,
				text: text.value,
			});
			return confirm.canceled ? values.FALSE : values.TRUE;
		}),
		'Mk:api': values.FN_NATIVE(async ([ep, param, token]) => {
			utils.assertString(ep);
			if (ep.value.includes('://')) {
				throw new errors.AiScriptRuntimeError('invalid endpoint');
			}
			if (token) {
				utils.assertString(token);
				// バグがあればundefinedもあり得るため念のため
				if (typeof token.value !== 'string') throw new Error('invalid token');
			}
			const actualToken: string | null = token?.value ?? opts.token ?? null;
			if (param == null) {
				throw new errors.AiScriptRuntimeError('expected param');
			}
			utils.assertObject(param);
			return misskeyApi(ep.value, utils.valToJs(param) as object, actualToken).then(res => {
				return utils.jsToVal(res);
			}, err => {
				return values.ERROR('request_failed', utils.jsToVal(err));
			});
		}),
		/* セキュリティ上の問題があるため無効化
		'Mk:apiExternal': values.FN_NATIVE(async ([host, ep, param, token]) => {
			utils.assertString(host);
			utils.assertString(ep);
			if (token) utils.assertString(token);
			return os.apiExternal(host.value, ep.value, utils.valToJs(param), token?.value).then(res => {
				return utils.jsToVal(res);
			}, err => {
				return values.ERROR('request_failed', utils.jsToVal(err));
			});
		}),
		*/
		'Mk:save': values.FN_NATIVE(([key, value]) => {
			utils.assertString(key);
			utils.expectAny(value);
			miLocalStorage.setItem(`aiscript:${opts.storageKey}:${key.value}`, JSON.stringify(utils.valToJs(value)));
			return values.NULL;
		}),
		'Mk:load': values.FN_NATIVE(([key]) => {
			utils.assertString(key);
			return utils.jsToVal(miLocalStorage.getItemAsJson(`aiscript:${opts.storageKey}:${key.value}`) ?? null);
		}),
		'Mk:remove': values.FN_NATIVE(([key]) => {
			utils.assertString(key);
			miLocalStorage.removeItem(`aiscript:${opts.storageKey}:${key.value}`);
			return values.NULL;
		}),
		'Mk:url': values.FN_NATIVE(() => {
			return values.STR(window.location.href);
		}),
		'Mk:nyaize': values.FN_NATIVE(([text]) => {
			utils.assertString(text);
			return values.STR(Misskey.nyaize(text.value));
		}),
	};
}
