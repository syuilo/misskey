/**
 * AiScript
 * compiler & type checker
 */

import autobind from 'autobind-decorator';

import {
	faSuperscript,
	faAlignLeft,
	faShareAlt,
	faSquareRootAlt,
	faList,
	faQuoteRight,
	faEquals,
	faGreaterThan,
	faLessThan,
	faGreaterThanEqual,
	faLessThanEqual,
	faExclamation,
	faNotEqual,
	faDice,
	faSortNumericUp,
} from '@fortawesome/free-solid-svg-icons';

export type Block = {
	type: string;
	args: Block[];
	value: any;
};

export type Variable = Block & {
	id: string;
	name: string;
};

type TypeError = {
	arg: number;
	expect: string;
	actual: string;
};

const funcDefs = {
	not: {
		in: ['boolean'], out: 'boolean', icon: faExclamation,
	},
	eq: {
		in: [0, 0], out: 'boolean', icon: faEquals,
	},
	gt: {
		in: ['number', 'number'], out: 'boolean', icon: faGreaterThan,
	},
	lt: {
		in: ['number', 'number'], out: 'boolean', icon: faLessThan,
	},
	gt_eq: {
		in: ['number', 'number'], out: 'boolean', icon: faGreaterThanEqual,
	},
	lt_eq: {
		in: ['number', 'number'], out: 'boolean', icon: faLessThanEqual,
	},
	if: {
		in: ['boolean', 0, 0], out: 0, icon: faShareAlt,
	},
	rannum: {
		in: ['number', 'number'], out: 'number', icon: faDice,
	},
	random: {
		in: ['number'], out: 'boolean', icon: faDice,
	},
	random_pick: {
		in: [0], out: 0, icon: faDice,
	},
};

const blockDefs = [{
	type: 'text', out: 'string', icon: faQuoteRight,
}, {
	type: 'multiLineText', out: 'string', icon: faAlignLeft,
}, {
	type: 'textList', out: 'stringArray', icon: faList,
}, {
	type: 'expression', out: null, icon: faSuperscript,
}, {
	type: 'number', out: 'number', icon: faSortNumericUp,
}, {
	type: 'ref', out: null, icon: faSuperscript,
}, ...Object.entries(funcDefs).map(([k, v]) => ({
	type: k, out: v.out || null, icon: v.icon
}))];

export class AiScript {
	private variables: Variable[];
	private envVars: { name: string, value: any }[];

	public static envVarsDef = {
		AI: 'string',
		NAME: 'string',
		NOTES_COUNT: 'number',
		LOGIN: 'boolean',
	};

	public static blockDefs = blockDefs;
	public static funcDefs = funcDefs;

	constructor(variables: Variable[], user?: any, visitor?: any) {
		this.variables = variables;

		this.envVars = [
			{ name: 'AI', value: 'kawaii' },
			{ name: 'LOGIN', value: visitor != null },
			{ name: 'NAME', value: visitor ? visitor.name : '' }
		];
	}

	@autobind
	public static isLiteralBlock(v: Block) {
		if (v.type === null) return true;
		if (v.type === 'text') return true;
		if (v.type === 'multiLineText') return true;
		if (v.type === 'textList') return true;
		if (v.type === 'number') return true;
		if (v.type === 'expression') return true;
		if (v.type === 'ref') return true;
		return false;
	}

	@autobind
	public typeCheck(v: Block): TypeError | null {
		if (AiScript.isLiteralBlock(v)) return null;

		const def = AiScript.funcDefs[v.type];
		if (def == null) {
			throw new Error('Unknown type: ' + v.type);
		}

		const generic: string[] = [];

		for (let i = 0; i < def.in.length; i++) {
			const arg = def.in[i];
			const type = this.typeInference(v.args[i]);
			if (type === null) continue;

			if (typeof arg === 'number') {
				if (generic[arg] === undefined) {
					generic[arg] = type;
				} else if (type !== generic[arg]) {
					return {
						arg: i,
						expect: generic[arg],
						actual: type
					};
				}
			} else if (type !== arg) {
				return {
					arg: i,
					expect: arg,
					actual: type
				};
			}
		}

		return null;
	}

	@autobind
	public getExpectedType(v: Block, slot: number): string | null {
		const def = AiScript.funcDefs[v.type];
		if (def == null) {
			throw new Error('Unknown type: ' + v.type);
		}

		const generic: string[] = [];

		for (let i = 0; i < def.in.length; i++) {
			const arg = def.in[i];
			const type = this.typeInference(v.args[i]);
			if (type === null) continue;

			if (typeof arg === 'number') {
				if (generic[arg] === undefined) {
					generic[arg] = type;
				}
			}
		}

		if (typeof def.in[slot] === 'number') {
			return generic[def.in[slot]] || null;
		} else {
			return def.in[slot];
		}
	}

	@autobind
	public typeInference(v: Block): string | null {
		if (v.type === null) return null;
		if (v.type === 'text') return 'string';
		if (v.type === 'multiLineText') return 'string';
		if (v.type === 'textList') return 'stringArray';
		if (v.type === 'number') return 'number';
		if (v.type === 'expression') return null;
		if (v.type === 'ref') {
			const variable = this.variables.find(va => va.id === v.value);
			if (variable) {
				return this.typeInference(variable);
			} else {
				const envVar = AiScript.envVarsDef[v.value];
				if (envVar) {
					return envVar;
				} else {
					return null;
				}
			}
		}

		const generic: string[] = [];

		const def = AiScript.funcDefs[v.type];

		for (let i = 0; i < def.in.length; i++) {
			const arg = def.in[i];
			if (typeof arg === 'number') {
				const type = this.typeInference(v.args[i]);

				if (generic[arg] === undefined) {
					generic[arg] = type;
				} else {
					if (type !== generic[arg]) {
						generic[arg] = null;
					}
				}
			}
		}

		if (typeof def.out === 'number') {
			return generic[def.out];
		} else {
			return def.out;
		}
	}

	@autobind
	public getVariablesByType(type: string | null): Variable[] {
		if (type == null) return this.variables;
		return this.variables.filter(x => (this.typeInference(x) === null) || (this.typeInference(x) === type));
	}

	@autobind
	public getEnvVariablesByType(type: string | null): string[] {
		if (type == null) return Object.keys(AiScript.envVarsDef);
		return Object.entries(AiScript.envVarsDef).filter(([k, v]) => type === v).map(([k, v]) => k);
	}

	@autobind
	private interpolate(str: string, values: { name: string, value: any }[]) {
		return str.replace(/\{(.+?)\}/g, match => this.getVariableValue(match.slice(1, -1).trim(), values).toString());
	}

	@autobind
	public evaluateVars() {
		const values: { name: string, value: any }[] = [];
		for (const v of this.variables) {
			values.push({
				name: v.name,
				value: this.evaluate(v, values)
			});
		}
		return values;
	}

	@autobind
	private evaluate(block: Block, values: { name: string, value: any }[]): any {
		if (block.type === null) {
			return null;
		}

		if (block.type === 'number') {
			return parseInt(block.value, 10);
		}

		if (block.type === 'text' || block.type === 'multiLineText') {
			return this.interpolate(block.value, values);
		}

		if (block.type === 'textList') {
			return block.value.trim().split('\n');
		}

		if (block.type === 'ref') {
			const name = this.variables.find(x => x.id === block.value).name;
			return this.getVariableValue(name, values);
		}

		if (block.args === undefined) return null;

		const funcs = {
			not: (a) => !a,
			eq: (a, b) => a === b,
			gt: (a, b) => a > b,
			lt: (a, b) => a < b,
			gt_eq: (a, b) => a >= b,
			lt_eq: (a, b) => a <= b,
			if: (bool, a, b) => bool ? a : b,
			random: (probability) => Math.floor(Math.random() * 100) < probability,
			rannum: (min, max) => min + Math.floor(Math.random() * (max - min + 1)),
			random_pick: (list) => list[Math.floor(Math.random() * list.length)]
		};

		const fnName = block.type;

		const fn = funcs[fnName];
		if (fn == null) {
			console.error('Unknown function: ' + fnName);
			throw new Error('Unknown function: ' + fnName);
		}

		const args = block.args.map(x => this.evaluate(x, values));

		const res = fn(...args);

		console.log(fnName, args, res);

		return res;
	}

	@autobind
	private getVariableValue(name: string, values: { name: string, value: any }[]): any {
		const v = values.find(v => v.name === name);
		if (v) {
			return v.value;
		} else {
			if (AiScript.envVarsDef[name]) {
				return this.envVars.find(x => x.name === name).value;
			} else {
				throw new Error(`Script: No such variable '${name}'`);
			}
		}
	}
}
