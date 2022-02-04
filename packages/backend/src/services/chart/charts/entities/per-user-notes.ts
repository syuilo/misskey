import Chart from '../../core';

export const name = 'perUserNotes';

export const schema = {
	'total': { accumulate: true },
	'inc': {},
	'dec': {},
	'diffs.normal': {},
	'diffs.reply': {},
	'diffs.renote': {},
};

export const entity = Chart.schemaToEntity(name, schema, true);
