<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<span v-if="!available">Loading<MkEllipsis/></span>
	<div v-if="props.provider == 'mcaptcha'">
		<div id="mcaptcha__widget-container" class="m-captcha-style"></div>
		<div ref="captchaEl"></div>
	</div>
	<div v-if="props.provider == 'testcaptcha'" style="background: #eee; border: solid 1px #888; padding: 8px; color: #000; max-width: 320px; display: flex; gap: 10px; align-items: center; box-shadow: 2px 2px 6px #0004; border-radius: 4px;">
		<img src="/client-assets/testcaptcha.png" style="width: 60px; height: 60px; "/>
		<div v-if="testcaptchaPassed">
			<div style="color: green;">Test captcha passed!</div>
		</div>
		<div v-else>
			<div style="font-size: 13px; margin-bottom: 4px;">Type "ai-chan-kawaii" to pass captcha</div>
			<input v-model="testcaptchaInput" data-cy-testcaptcha-input/>
			<button type="button" data-cy-testcaptcha-submit @click="testcaptchaSubmit">Submit</button>
		</div>
	</div>
	<div v-else ref="captchaEl"></div>
</div>
</template>

<script lang="ts" setup>
import { ref, shallowRef, computed, onMounted, onBeforeUnmount, watch, onUnmounted } from 'vue';
import { defaultStore } from '@/store.js';

// APIs provided by Captcha services
// see: https://docs.hcaptcha.com/configuration/#javascript-api
// see: https://developers.google.com/recaptcha/docs/display?hl=ja
// see: https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/#explicitly-render-the-turnstile-widget
export type Captcha = {
	render(container: string | Node, options: {
		readonly [_ in 'sitekey' | 'theme' | 'type' | 'size' | 'tabindex' | 'callback' | 'expired' | 'expired-callback' | 'error-callback' | 'endpoint']?: unknown;
	}): string;
	remove(id: string): void;
	execute(id: string): void;
	reset(id?: string): void;
	getResponse(id: string): string;
};

export type CaptchaProvider = 'hcaptcha' | 'recaptcha' | 'turnstile' | 'mcaptcha' | 'testcaptcha';

type CaptchaContainer = {
	readonly [_ in CaptchaProvider]?: Captcha;
};

declare global {
	// Window を拡張してるため、空ではない
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	interface Window extends CaptchaContainer { }
}

const props = defineProps<{
	provider: CaptchaProvider;
	sitekey: string | null; // null will show error on request
	secretKey?: string | null;
	instanceUrl?: string | null;
	modelValue?: string | null;
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', v: string | null): void;
}>();

const available = ref(false);

const captchaEl = shallowRef<HTMLDivElement | undefined>();
const captchaWidgetId = ref<string | undefined>(undefined);
const testcaptchaInput = ref('');
const testcaptchaPassed = ref(false);

const variable = computed(() => {
	switch (props.provider) {
		case 'hcaptcha': return 'hcaptcha';
		case 'recaptcha': return 'grecaptcha';
		case 'turnstile': return 'turnstile';
		case 'mcaptcha': return 'mcaptcha';
		case 'testcaptcha': return 'testcaptcha';
	}
});

const loaded = !!window[variable.value];

const src = computed(() => {
	switch (props.provider) {
		case 'hcaptcha': return 'https://js.hcaptcha.com/1/api.js?render=explicit&recaptchacompat=off';
		case 'recaptcha': return 'https://www.recaptcha.net/recaptcha/api.js?render=explicit';
		case 'turnstile': return 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
		case 'mcaptcha': return null;
		case 'testcaptcha': return null;
	}
});

const scriptId = computed(() => `script-${props.provider}`);

const captcha = computed<Captcha>(() => window[variable.value] || {} as unknown as Captcha);

watch(() => [props.instanceUrl, props.sitekey, props.secretKey], async () => {
	// 変更があったときはリフレッシュと再レンダリングをしておかないと、変更後の値で再検証が出来ない
	if (available.value) {
		callback(undefined);
		clearWidget();
		await requestRender();
	}
});

if (loaded || props.provider === 'mcaptcha' || props.provider === 'testcaptcha') {
	available.value = true;
} else if (src.value !== null) {
	(document.getElementById(scriptId.value) ?? document.head.appendChild(Object.assign(document.createElement('script'), {
		async: true,
		id: scriptId.value,
		src: src.value,
	})))
		.addEventListener('load', () => available.value = true);
}

function reset() {
	if (captcha.value.reset && captchaWidgetId.value !== undefined) {
		try {
			captcha.value.reset(captchaWidgetId.value);
		} catch (error: unknown) {
			// ignore
			if (_DEV_) console.warn(error);
		}
	}
	testcaptchaPassed.value = false;
	testcaptchaInput.value = '';
}

function remove() {
	if (captcha.value.remove && captchaWidgetId.value) {
		try {
			if (_DEV_) console.log('remove', props.provider, captchaWidgetId.value);
			captcha.value.remove(captchaWidgetId.value);
		} catch (error: unknown) {
			// ignore
			if (_DEV_) console.warn(error);
		}
	}
}

async function requestRender() {
	if (captcha.value.render && captchaEl.value instanceof Element && props.sitekey) {
		// reCAPTCHAのレンダリング重複判定を回避するため、captchaEl配下に仮のdivを用意する.
		// （同じdivに対して複数回renderを呼び出すとreCAPTCHAはエラーを返すので）
		const elem = document.createElement('div');
		captchaEl.value.appendChild(elem);

		captchaWidgetId.value = captcha.value.render(elem, {
			sitekey: props.sitekey,
			theme: defaultStore.state.darkMode ? 'dark' : 'light',
			callback: callback,
			'expired-callback': () => callback(undefined),
			'error-callback': () => callback(undefined),
		});
	} else if (props.provider === 'mcaptcha' && props.instanceUrl && props.sitekey) {
		const { default: Widget } = await import('@mcaptcha/vanilla-glue');
		new Widget({
			siteKey: {
				instanceUrl: new URL(props.instanceUrl),
				key: props.sitekey,
			},
		});
	} else {
		window.setTimeout(requestRender, 1);
	}
}

function clearWidget() {
	if (props.provider === 'mcaptcha') {
		const container = document.getElementById('mcaptcha__widget-container');
		if (container) {
			container.innerHTML = '';
		}
	} else {
		reset();
		remove();

		if (captchaEl.value) {
			// レンダリング先のコンテナの中身を掃除し、フォームが増殖するのを抑止
			captchaEl.value.innerHTML = '';
		}
	}
}

function callback(response?: string) {
	emit('update:modelValue', typeof response === 'string' ? response : null);
}

function onReceivedMessage(message: MessageEvent) {
	if (message.data.token) {
		if (props.instanceUrl && new URL(message.origin).host === new URL(props.instanceUrl).host) {
			callback(message.data.token);
		}
	}
}

function testcaptchaSubmit() {
	testcaptchaPassed.value = testcaptchaInput.value === 'ai-chan-kawaii';
	callback(testcaptchaPassed.value ? 'testcaptcha-passed' : undefined);
	if (!testcaptchaPassed.value) testcaptchaInput.value = '';
}

onMounted(() => {
	if (available.value) {
		window.addEventListener('message', onReceivedMessage);
		requestRender();
	} else {
		watch(available, requestRender);
	}
});

onUnmounted(() => {
	window.removeEventListener('message', onReceivedMessage);
});

onBeforeUnmount(() => {
	clearWidget();
});

defineExpose({
	reset,
});

</script>
