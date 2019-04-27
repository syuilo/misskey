/**
 * AiScript
 * compiler & type checker
 */

import autobind from 'autobind-decorator';

export type Block = {
	type: string;
	args: Block[];
	value: any;
};

export type Variable = Block & {
	id: string;
	name: string;
};

export function isLiteralBlock(v: Block) {
	if (v.type === null) return true;
	if (v.type === 'text') return true;
	if (v.type === 'multiLineText') return true;
	if (v.type === 'number') return true;
	if (v.type === 'expression') return true;
	if (v.type === 'ref') return true;
	return false;
}

type TypeError = {
	arg: number;
	expect: string;
	actual: string;
};

const funcDefs = {
	not: {
		in: ['boolean'],
		out: 'boolean'
	},
	eq: {
		in: [0, 0],
		out: 'boolean'
	},
	gt: {
		in: ['number', 'number'],
		out: 'boolean'
	},
	lt: {
		in: ['number', 'number'],
		out: 'boolean'
	},
	gtEq: {
		in: ['number', 'number'],
		out: 'boolean'
	},
	ltEq: {
		in: ['number', 'number'],
		out: 'boolean'
	},
	if: {
		in: ['boolean', 0, 0],
		out: 0
	},
	randomNumber: {
		in: ['number', 'number'],
		out: 'number'
	},
	random: {
		in: ['number'],
		out: 'boolean'
	},
};

const blockDefs = [{
	type: 'text', out: 'string'
}, {
	type: 'multiLineText', out: 'string'
}, {
	type: 'textList', out: 'stringArray'
}, {
	type: 'expression', out: null
}, {
	type: 'number', out: 'number'
}, {
	type: 'ref', out: null
}, ...Object.entries(funcDefs).map(([k, v]) => ({
	type: k, out: v.out || null
}))];

export class AiScript {
	private variables: Variable[];
	private variableValues: { name: string, value: any }[] = [];
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
	public typeCheck(v: Block): TypeError | null {
		if (isLiteralBlock(v)) return null;

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
	public compile(v: Block): string {
		const camelToSnake = p => p.replace(/([A-Z])/g, s => '_' + s.charAt(0).toLowerCase());

		if (v.type === 'expression') {
			return v.value;
		} else if (v.type === 'ref') {
			if (AiScript.envVarsDef[v.value]) {
				return v.value;
			} else {
				return this.variables.find(va => va.id === v.value).name;
			}
		} else if (v.type === 'text') {
			return '"' + v.value + '"'; // todo escape
		} else if (v.type === 'multiLineText') {
			return '"' + v.value + '"'; // todo escape
		} else if (v.type === 'number') {
			return v.value;
		} else {
			const fn = AiScript.funcDefs[v.type];
			if (fn == null) {
				throw new Error('Unknown type: ' + v.type);
			}

			const args: string[] = [];
			for (let i = 0; i < fn.in.length; i++) {
				args.push(this.compile(v.args[i]));
			}

			return `${camelToSnake(v.type)}(${args.join(', ')})`;
		}
	}

	@autobind
	public evaluateExpression(expression: string): any {
		const num = expression.trim().match(/^[0-9]+$/);
		if (num) {
			return parseInt(num[0], 10);
		}

		const str = expression.trim().match(/^"(.+?)"$/);
		if (str) {
			return this.interpolate(str[0].slice(1, -1));
		}

		const variable = expression.trim().match(/^[a-zA-Z]+$/);
		if (variable) {
			return this.getVariableValue(variable[0]);
		}

		const funcName = expression.substr(0, expression.indexOf('('));
		const argsPart = expression.substr(expression.indexOf('(')).slice(1, -1);

		const args = [];

		let argExpression = '';
		let pendingOpenBrackets = 0;
		for (let i = 0; i < argsPart.length; i++) {
			const char = argsPart[i];
			if (char === ',' && pendingOpenBrackets === 0) {
				args.push(this.evaluateExpression(argExpression));
				i++;
				argExpression = '';
				continue;
			} else if (char === '(') {
				pendingOpenBrackets++;
			} else if (char === ')') {
				pendingOpenBrackets--;
			}
			argExpression += char;
		}
		if (argExpression.length > 0) {
			args.push(this.evaluateExpression(argExpression));
		}

		const funcs = {
			not: (a) => !a,
			eq: (a, b) => a === b,
			gt: (a, b) => a > b,
			lt: (a, b) => a < b,
			gt_eq: (a, b) => a >= b,
			lt_eq: (a, b) => a <= b,
			if: (bool, a, b) => bool ? a : b,
			random: (probability) => Math.floor(Math.random() * 100) < probability,
			random_number: (min, max) => min + Math.floor(Math.random() * (max - min + 1))
		};

		const res = funcs[funcName](...args);

		console.log(funcName, args, res);

		return res;
	}

	@autobind
	private getVariableValue(name: string): any {
		const v = this.variableValues.find(v => v.name === name);
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

	@autobind
	public interpolate(str: string) {
		return str.replace(/\{(.+?)\}/g, match => this.getVariableValue(match.slice(1, -1).trim()).toString());
	}

	@autobind
	public calcVariables() {
		this.variableValues = [];
		for (const v of this.variables) {
			this.variableValues.push({
				name: v.name,
				value: this.evaluateVariable(v)
			});
		}
	}

	@autobind
	public evaluateVariable(v) {
		const bin = this.compile(v);
		console.log('Complied:', bin);
		return this.evaluateExpression(bin);
	}
}
