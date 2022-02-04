import Chart from '../../core';

export const name = 'test';

export const schema = {
	'foo.total': { accumulate: true },
	'foo.inc': {},
	'foo.dec': {},
};

export const entity = Chart.schemaToEntity(name, schema);
