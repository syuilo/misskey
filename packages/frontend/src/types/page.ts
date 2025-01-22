/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';

export type SlimPage = Pick<Misskey.entities.Page,
	'alignCenter' |
	'attachedFiles' |
	'content' |
	'eyeCatchingImage' |
	'eyeCatchingImageId' |
	'font' |
	'title' |
	'user' |
	'userId'
>;
