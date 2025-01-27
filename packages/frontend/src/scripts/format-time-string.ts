/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const defaultLocaleStringFormats: { [index: string]: string } = {
	'weekday': 'narrow',
	'era': 'narrow',
	'year': 'numeric',
	'month': 'numeric',
	'day': 'numeric',
	'hour': 'numeric',
	'minute': 'numeric',
	'second': 'numeric',
	'timeZoneName': 'short',
};

function formatLocaleString(date: Date, format: string): string {
	return format.replace(/\{\{(\w+)(:(\w+))?\}\}/g, (match: string, kind: string, unused?, option?: string) => {
		if (['weekday', 'era', 'year', 'month', 'day', 'hour', 'minute', 'second', 'timeZoneName'].includes(kind)) {
			return date.toLocaleString(window.navigator.language, { [kind]: option ? option : defaultLocaleStringFormats[kind] });
		} else {
			return match;
		}
	});
}

export function formatDateTimeString(date: Date, format: string): string {
	return format
		.replace(/yyyy/g, date.getFullYear().toString())
		.replace(/yy/g, date.getFullYear().toString().slice(-2))
		.replace(/MMMM/g, date.toLocaleString(window.navigator.language, { month: 'long' }))
		.replace(/MMM/g, date.toLocaleString(window.navigator.language, { month: 'short' }))
		.replace(/MM/g, (`0${date.getMonth() + 1}`).slice(-2))
		.replace(/M/g, (date.getMonth() + 1).toString())
		.replace(/dd/g, (`0${date.getDate()}`).slice(-2))
		.replace(/d/g, date.getDate().toString())
		.replace(/HH/g, (`0${date.getHours()}`).slice(-2))
		.replace(/H/g, date.getHours().toString())
		.replace(/hh/g, (`0${(date.getHours() % 12) || 12}`).slice(-2))
		.replace(/h/g, ((date.getHours() % 12) || 12).toString())
		.replace(/mm/g, (`0${date.getMinutes()}`).slice(-2))
		.replace(/m/g, date.getMinutes().toString())
		.replace(/ss/g, (`0${date.getSeconds()}`).slice(-2))
		.replace(/s/g, date.getSeconds().toString())
		.replace(/tt/g, date.getHours() >= 12 ? 'PM' : 'AM');
}

export function formatTimeString(date: Date, format: string): string {
	return format.replace(/\[(([^\[]|\[\])*)\]|(([yMdHhmst])\4{0,3})/g, (match: string, localeformat?: string, unused?, datetimeformat?: string) => {
		if (localeformat) return formatLocaleString(date, localeformat);
		if (datetimeformat) return formatDateTimeString(date, datetimeformat);
		return match;
	});
}
