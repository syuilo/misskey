/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { throttle } from 'throttle-debounce';
import { markRaw } from 'vue';
import { notificationTypes } from 'misskey-js';
import type { BasicTimelineType } from '@/timelines.js';
import { Storage } from '@/pizzax.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { deepClone } from '@/scripts/clone.js';
import type { SoundStore } from '@/store.js';

type ColumnWidget = {
	name: string;
	id: string;
	data: Record<string, any>;
};

export const columnTypes = [
	'main',
	'widgets',
	'notifications',
	'tl',
	'antenna',
	'list',
	'channel',
	'mentions',
	'direct',
	'roleTimeline',
] as const;

export type ColumnType = typeof columnTypes[number];

export type Column = {
	id: string;
	type: ColumnType;
	name: string | null;
	width: number;
	widgets?: ColumnWidget[];
	active?: boolean;
	flexible?: boolean;
	antennaId?: string;
	listId?: string;
	channelId?: string;
	roleId?: string;
	excludeTypes?: typeof notificationTypes[number][];
	tl?: BasicTimelineType;
	withRenotes?: boolean;
	withReplies?: boolean;
	withSensitive?: boolean;
	onlyFiles?: boolean;
	soundSetting: SoundStore;
};

export const deckStore = markRaw(new Storage('deck', {
	profile: {
		where: 'deviceAccount',
		default: 'default',
	},
	columns: {
		where: 'deviceAccount',
		default: [] as Column[],
	},
	layout: {
		where: 'deviceAccount',
		default: [] as Column['id'][][],
	},
	columnAlign: {
		where: 'deviceAccount',
		default: 'left' as 'left' | 'right' | 'center',
	},
	alwaysShowMainColumn: {
		where: 'deviceAccount',
		default: true,
	},
	navWindow: {
		where: 'deviceAccount',
		default: true,
	},
	useSimpleUiForNonRootPages: {
		where: 'deviceAccount',
		default: true,
	},
}));

export const loadDeck = async () => {
	let deck;

	try {
		deck = await misskeyApi('i/registry/get', {
			scope: ['client', 'deck', 'profiles'],
			key: deckStore.state.profile,
		});
	} catch (err) {
		if (err.code === 'NO_SUCH_KEY') {
			// 後方互換性のため
			if (deckStore.state.profile === 'default') {
				saveDeck();
				return;
			}

			deckStore.set('columns', []);
			deckStore.set('layout', []);
			return;
		}
		throw err;
	}

	deckStore.set('columns', deck.columns);
	deckStore.set('layout', deck.layout);
};

// TODO: deckがloadされていない状態でsaveすると意図せず上書きが発生するので対策する
export const saveDeck = throttle(1000, () => {
	misskeyApi('i/registry/set', {
		scope: ['client', 'deck', 'profiles'],
		key: deckStore.state.profile,
		value: {
			columns: deckStore.reactiveState.columns.value,
			layout: deckStore.reactiveState.layout.value,
		},
	});
});

export async function getProfiles(): Promise<string[]> {
	return await misskeyApi('i/registry/keys', {
		scope: ['client', 'deck', 'profiles'],
	});
}

export async function deleteProfile(key: string): Promise<void> {
	return await misskeyApi('i/registry/remove', {
		scope: ['client', 'deck', 'profiles'],
		key: key,
	});
}

export function addColumn(column: Column) {
	if (column.name === undefined) column.name = null;
	deckStore.push('columns', column);
	deckStore.push('layout', [column.id]);
	saveDeck();
}

export function removeColumn(id: Column['id']) {
	deckStore.set('columns', deckStore.state.columns.filter(c => c.id !== id));
	deckStore.set('layout', deckStore.state.layout
		.map(ids => ids.filter(_id => _id !== id))
		.filter(ids => ids.length > 0));
	saveDeck();
}

export function swapColumn(a: Column['id'], b: Column['id']) {
	const aX = deckStore.state.layout.findIndex(ids => ids.indexOf(a) !== -1);
	const aY = deckStore.state.layout[aX].findIndex(id => id === a);
	const bX = deckStore.state.layout.findIndex(ids => ids.indexOf(b) !== -1);
	const bY = deckStore.state.layout[bX].findIndex(id => id === b);
	const layout = deepClone(deckStore.state.layout);
	layout[aX][aY] = b;
	layout[bX][bY] = a;
	deckStore.set('layout', layout);
	saveDeck();
}

export function swapLeftColumn(id: Column['id']) {
	const layout = deepClone(deckStore.state.layout);
	deckStore.state.layout.some((ids, i) => {
		if (ids.includes(id)) {
			const left = deckStore.state.layout[i - 1];
			if (left) {
				layout[i - 1] = deckStore.state.layout[i];
				layout[i] = left;
				deckStore.set('layout', layout);
			}
			return true;
		}
	});
	saveDeck();
}

export function swapRightColumn(id: Column['id']) {
	const layout = deepClone(deckStore.state.layout);
	deckStore.state.layout.some((ids, i) => {
		if (ids.includes(id)) {
			const right = deckStore.state.layout[i + 1];
			if (right) {
				layout[i + 1] = deckStore.state.layout[i];
				layout[i] = right;
				deckStore.set('layout', layout);
			}
			return true;
		}
	});
	saveDeck();
}

export function swapUpColumn(id: Column['id']) {
	const layout = deepClone(deckStore.state.layout);
	const idsIndex = deckStore.state.layout.findIndex(ids => ids.includes(id));
	const ids = deepClone(deckStore.state.layout[idsIndex]);
	ids.some((x, i) => {
		if (x === id) {
			const up = ids[i - 1];
			if (up) {
				ids[i - 1] = id;
				ids[i] = up;

				layout[idsIndex] = ids;
				deckStore.set('layout', layout);
			}
			return true;
		}
	});
	saveDeck();
}

export function swapDownColumn(id: Column['id']) {
	const layout = deepClone(deckStore.state.layout);
	const idsIndex = deckStore.state.layout.findIndex(ids => ids.includes(id));
	const ids = deepClone(deckStore.state.layout[idsIndex]);
	ids.some((x, i) => {
		if (x === id) {
			const down = ids[i + 1];
			if (down) {
				ids[i + 1] = id;
				ids[i] = down;

				layout[idsIndex] = ids;
				deckStore.set('layout', layout);
			}
			return true;
		}
	});
	saveDeck();
}

export function stackLeftColumn(id: Column['id']) {
	let layout = deepClone(deckStore.state.layout);
	const i = deckStore.state.layout.findIndex(ids => ids.includes(id));
	layout = layout.map(ids => ids.filter(_id => _id !== id));
	layout[i - 1].push(id);
	layout = layout.filter(ids => ids.length > 0);
	deckStore.set('layout', layout);
	saveDeck();
}

export function popRightColumn(id: Column['id']) {
	let layout = deepClone(deckStore.state.layout);
	const i = deckStore.state.layout.findIndex(ids => ids.includes(id));
	const affected = layout[i];
	layout = layout.map(ids => ids.filter(_id => _id !== id));
	layout.splice(i + 1, 0, [id]);
	layout = layout.filter(ids => ids.length > 0);
	deckStore.set('layout', layout);

	const columns = deepClone(deckStore.state.columns);
	for (const column of columns) {
		if (affected.includes(column.id)) {
			column.active = true;
		}
	}
	deckStore.set('columns', columns);

	saveDeck();
}

export function addColumnWidget(id: Column['id'], widget: ColumnWidget) {
	const columns = deepClone(deckStore.state.columns);
	const columnIndex = deckStore.state.columns.findIndex(c => c.id === id);
	const column = deepClone(deckStore.state.columns[columnIndex]);
	if (column == null) return;
	if (column.widgets == null) column.widgets = [];
	column.widgets.unshift(widget);
	columns[columnIndex] = column;
	deckStore.set('columns', columns);
	saveDeck();
}

export function removeColumnWidget(id: Column['id'], widget: ColumnWidget) {
	const columns = deepClone(deckStore.state.columns);
	const columnIndex = deckStore.state.columns.findIndex(c => c.id === id);
	const column = deepClone(deckStore.state.columns[columnIndex]);
	if (column == null || column.widgets == null) return;
	column.widgets = column.widgets.filter(w => w.id !== widget.id);
	columns[columnIndex] = column;
	deckStore.set('columns', columns);
	saveDeck();
}

export function setColumnWidgets(id: Column['id'], widgets: ColumnWidget[]) {
	const columns = deepClone(deckStore.state.columns);
	const columnIndex = deckStore.state.columns.findIndex(c => c.id === id);
	const column = deepClone(deckStore.state.columns[columnIndex]);
	if (column == null) return;
	column.widgets = widgets;
	columns[columnIndex] = column;
	deckStore.set('columns', columns);
	saveDeck();
}

export function updateColumnWidget(id: Column['id'], widgetId: string, widgetData: any) {
	const columns = deepClone(deckStore.state.columns);
	const columnIndex = deckStore.state.columns.findIndex(c => c.id === id);
	const column = deepClone(deckStore.state.columns[columnIndex]);
	if (column == null || column.widgets == null) return;
	column.widgets = column.widgets.map(w => w.id === widgetId ? {
		...w,
		data: widgetData,
	} : w);
	columns[columnIndex] = column;
	deckStore.set('columns', columns);
	saveDeck();
}

export function updateColumn(id: Column['id'], column: Partial<Column>) {
	const columns = deepClone(deckStore.state.columns);
	const columnIndex = deckStore.state.columns.findIndex(c => c.id === id);
	const currentColumn = deepClone(deckStore.state.columns[columnIndex]);
	if (currentColumn == null) return;
	for (const [k, v] of Object.entries(column)) {
		currentColumn[k] = v;
	}
	columns[columnIndex] = currentColumn;
	deckStore.set('columns', columns);
	saveDeck();
}
