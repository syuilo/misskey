/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { action } from '@storybook/addon-actions';
import { StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import { commonHandlers } from '../../../.storybook/mocks.js';
import { boolean, choose, country, date, firstName, integer, lastName, text } from '../../../.storybook/fake-utils.js';
import MkGrid from './MkGrid.vue';
import { GridContext, GridEvent } from '@/components/grid/grid-event.js';
import { DataSource, GridSetting } from '@/components/grid/grid.js';
import { GridColumnSetting } from '@/components/grid/column.js';

function d(p: {
	check?: boolean,
	name?: string,
	email?: string,
	age?: number,
	birthday?: string,
	gender?: string,
	country?: string,
	reportCount?: number,
	createdAt?: string,
}, seed: string) {
	const prefix = text(10, seed);

	return {
		check: p.check ?? boolean(seed),
		name: p.name ?? `${firstName(seed)} ${lastName(seed)}`,
		email: p.email ?? `${prefix}@example.com`,
		age: p.age ?? integer(20, 80, seed),
		birthday: date({}, seed).toISOString(),
		gender: p.gender ?? choose(['male', 'female', 'other', 'unknown'], seed),
		country: p.country ?? country(seed),
		reportCount: p.reportCount ?? integer(0, 9999, seed),
		createdAt: p.createdAt ?? date({}, seed).toISOString(),
	};
}

const defaultCols: GridColumnSetting[] = [
	{ bindTo: 'check', icon: 'ti-check', type: 'boolean', width: 50 },
	{ bindTo: 'name', title: 'Name', type: 'text', width: 'auto' },
	{ bindTo: 'email', title: 'Email', type: 'text', width: 'auto' },
	{ bindTo: 'age', title: 'Age', type: 'number', width: 50 },
	{ bindTo: 'birthday', title: 'Birthday', type: 'date', width: 'auto' },
	{ bindTo: 'gender', title: 'Gender', type: 'text', width: 80 },
	{ bindTo: 'country', title: 'Country', type: 'text', width: 120 },
	{ bindTo: 'reportCount', title: 'ReportCount', type: 'number', width: 'auto' },
	{ bindTo: 'createdAt', title: 'CreatedAt', type: 'date', width: 'auto' },
];

function createArgs(overrides?: { settings?: Partial<GridSetting>, data?: DataSource[] }) {
	const refData = ref<ReturnType<typeof d>[]>([]);
	for (let i = 0; i < 100; i++) {
		refData.value.push(d({}, i.toString()));
	}

	return {
		settings: {
			row: overrides?.settings?.row,
			cols: [
				...defaultCols.filter(col => overrides?.settings?.cols?.every(c => c.bindTo !== col.bindTo) ?? true),
				...overrides?.settings?.cols ?? [],
			],
			cells: overrides?.settings?.cells,
		},
		data: refData.value,
	};
}

function createRender(params: { settings: GridSetting, data: DataSource[] }) {
	return {
		render(args) {
			return {
				components: {
					MkGrid,
				},
				setup() {
					return {
						args,
					};
				},
				data() {
					return {
						data: args.data,
					};
				},
				computed: {
					props() {
						return {
							...args,
						};
					},
					events() {
						return {
							event: (event: GridEvent, context: GridContext) => {
								switch (event.type) {
									case 'cell-value-change': {
										args.data[event.row.index][event.column.setting.bindTo] = event.newValue;
									}
								}
							},
						};
					},
				},
				template: '<div style="padding:20px"><MkGrid v-bind="props" v-on="events" /></div>',
			};
		},
		args: {
			...params,
		},
		parameters: {
			layout: 'fullscreen',
			msw: {
				handlers: [
					...commonHandlers,
				],
			},
		},
	} satisfies StoryObj<typeof MkGrid>;
}

export const Default = createRender(createArgs());

export const NoNumber = createRender(createArgs({
	settings: {
		row: {
			showNumber: false,
		},
	},
}));

export const NoSelectable = createRender(createArgs({
	settings: {
		row: {
			selectable: false,
		},
	},
}));

export const Editable = createRender(createArgs({
	settings: {
		cols: defaultCols.map(col => ({ ...col, editable: true })),
	},
}));

export const AdditionalRowStyle = createRender(createArgs({
	settings: {
		cols: defaultCols.map(col => ({ ...col, editable: true })),
		row: {
			styleRules: [
				{
					condition: ({ row }) => AdditionalRowStyle.args.data[row.index].check as boolean,
					applyStyle: {
						style: {
							backgroundColor: 'lightgray',
						},
					},
				},
			],
		},
	},
}));

export const ContextMenu = createRender(createArgs({
	settings: {
		cols: [
			{
				bindTo: 'check', icon: 'ti-check', type: 'boolean', width: 50, contextMenuFactory: (col, context) => [
					{
						type: 'button',
						text: 'Check All',
						action: () => {
							for (const d of ContextMenu.args.data) {
								d.check = true;
							}
						},
					},
					{
						type: 'button',
						text: 'Uncheck All',
						action: () => {
							for (const d of ContextMenu.args.data) {
								d.check = false;
							}
						},
					},
				],
			},
		],
		row: {
			contextMenuFactory: (row, context) => [
				{
					type: 'button',
					text: 'Delete',
					action: () => {
						const idxes = context.rangedRows.map(r => r.index);
						const newData = ContextMenu.args.data.filter((d, i) => !idxes.includes(i));

						ContextMenu.args.data.splice(0);
						ContextMenu.args.data.push(...newData);
					},
				},
			],
		},
		cells: {
			contextMenuFactory: (col, row, value, context) => [
				{
					type: 'button',
					text: 'Delete',
					action: () => {
						for (const cell of context.rangedCells) {
							ContextMenu.args.data[cell.row.index][cell.column.setting.bindTo] = undefined;
						}
					},
				},
			],
		},
	},
}));
