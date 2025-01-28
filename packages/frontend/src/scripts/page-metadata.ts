/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { inject, isRef, onActivated, onBeforeUnmount, provide, ref, toValue, watch } from 'vue';
import type { MaybeRefOrGetter, Ref } from 'vue';

export type PageMetadata = {
	title: string;
	subtitle?: string;
	icon?: string | null;
	avatar?: Misskey.entities.User | null;
	userName?: Misskey.entities.User | null;
	needWideArea?: boolean;
};

type PageMetadataGetter = () => PageMetadata;
type PageMetadataReceiver = (getter: PageMetadataGetter) => void;

const RECEIVER_KEY = Symbol('ReceiverKey');
const setReceiver = (v: PageMetadataReceiver): void => {
	provide<PageMetadataReceiver>(RECEIVER_KEY, v);
};
const getReceiver = (): PageMetadataReceiver | undefined => {
	return inject<PageMetadataReceiver>(RECEIVER_KEY);
};

const METADATA_KEY = Symbol('MetadataKey');
const setMetadata = (v: Ref<PageMetadata | null>): void => {
	provide<Ref<PageMetadata | null>>(METADATA_KEY, v);
};
const getMetadata = (): Ref<PageMetadata | null> | undefined => {
	return inject<Ref<PageMetadata | null>>(METADATA_KEY);
};

export const definePageMetadata = (maybeRefOrGetterMetadata: MaybeRefOrGetter<PageMetadata>): void => {
	const metadataRef = ref(toValue(maybeRefOrGetterMetadata));
	const metadataGetter = () => metadataRef.value;
	const receiver = getReceiver();

	// setup handler
	receiver?.(metadataGetter);

	// update handler
	onBeforeUnmount(watch(
		() => toValue(maybeRefOrGetterMetadata),
		(metadata) => {
			metadataRef.value = metadata;
			receiver?.(metadataGetter);
		},
		{ deep: true },
	));
	onActivated(() => {
		receiver?.(metadataGetter);
	});
};

export const provideMetadataReceiver = (receiver: PageMetadataReceiver): void => {
	setReceiver(receiver);
};

export const provideReactiveMetadata = (metadataRef: Ref<PageMetadata | null>): void => {
	setMetadata(metadataRef);
};

export const injectReactiveMetadata = (): Ref<PageMetadata | null> => {
	const metadataRef = getMetadata();
	return isRef(metadataRef) ? metadataRef : ref(null);
};
