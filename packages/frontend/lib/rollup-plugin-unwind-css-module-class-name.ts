/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { generate } from 'astring';
import { walk } from '../node_modules/estree-walker/src/index.js';
import type * as estree from 'estree';
import type * as estreeWalker from 'estree-walker';
import type { Plugin } from 'vite';

function isFalsyIdentifier(identifier: estree.Identifier): boolean {
	return identifier.name === 'undefined' || identifier.name === 'NaN';
}

function normalizeClassWalker(tree: estree.Node, stack: string | undefined): string | null {
	if (tree.type === 'Identifier') return isFalsyIdentifier(tree) ? '' : null;
	if (tree.type === 'Literal') return typeof tree.value === 'string' ? tree.value : '';
	if (tree.type === 'BinaryExpression') {
		if (tree.operator !== '+') return null;
		const left = normalizeClassWalker(tree.left, stack);
		const right = normalizeClassWalker(tree.right, stack);
		if (left === null || right === null) return null;
		return `${left}${right}`;
	}
	if (tree.type === 'TemplateLiteral') {
		if (tree.expressions.some((x) => x.type !== 'Literal' && (x.type !== 'Identifier' || !isFalsyIdentifier(x)))) return null;
		return tree.quasis.reduce((a, c, i) => {
			const v = i === tree.quasis.length - 1 ? '' : (tree.expressions[i] as Partial<estree.Literal>).value;
			return a + c.value.raw + (typeof v === 'string' ? v : '');
		}, '');
	}
	if (tree.type === 'ArrayExpression') {
		const values = tree.elements.map((treeNode) => {
			if (treeNode === null) return '';
			if (treeNode.type === 'SpreadElement') return normalizeClassWalker(treeNode.argument, stack);
			return normalizeClassWalker(treeNode, stack);
		});
		if (values.some((x) => x === null)) return null;
		return values.join(' ');
	}
	if (tree.type === 'ObjectExpression') {
		const values = tree.properties.map((treeNode) => {
			if (treeNode.type === 'SpreadElement') return normalizeClassWalker(treeNode.argument, stack);
			let x = treeNode.value;
			let inveted = false;
			while (x.type === 'UnaryExpression' && x.operator === '!') {
				x = x.argument;
				inveted = !inveted;
			}
			if (x.type === 'Literal') {
				if (inveted === !x.value) {
					return treeNode.key.type === 'Identifier' ? treeNode.computed ? null : treeNode.key.name : treeNode.key.type === 'Literal' ? treeNode.key.value : '';
				} else {
					return '';
				}
			}
			if (x.type === 'Identifier') {
				if (inveted !== isFalsyIdentifier(x)) {
					return '';
				} else {
					return null;
				}
			}
			return null;
		});
		if (values.some((x) => x === null)) return null;
		return values.join(' ');
	}
	if (
		tree.type !== 'CallExpression' &&
		tree.type !== 'ChainExpression' &&
		tree.type !== 'ConditionalExpression' &&
		tree.type !== 'LogicalExpression' &&
		tree.type !== 'MemberExpression') {
		console.error(stack ? `Unexpected node type: ${tree.type} (in ${stack})` : `Unexpected node type: ${tree.type}`);
	}
	return null;
}

export function normalizeClass(tree: estree.Node, stack?: string): string | null {
	const walked = normalizeClassWalker(tree, stack);
	return walked && walked.replace(/^\s+|\s+(?=\s)|\s+$/g, '');
}

export function unwindCssModuleClassName(ast: estree.Node): void {
	(walk as typeof estreeWalker.walk)(ast, {
		enter(node, parent): void {
			//#region
			if (parent?.type !== 'Program') return;
			if (node.type !== 'VariableDeclaration') return;
			if (node.declarations.length !== 1) return;
			if (node.declarations[0].id.type !== 'Identifier') return;
			const name = node.declarations[0].id.name;
			if (node.declarations[0].init?.type !== 'CallExpression') return;
			if (node.declarations[0].init.callee.type !== 'Identifier') return;
			if (node.declarations[0].init.callee.name !== '_export_sfc') return;
			if (node.declarations[0].init.arguments.length !== 2) return;
			if (node.declarations[0].init.arguments[0].type !== 'Identifier') return;
			const ident = node.declarations[0].init.arguments[0].name;
			if (!ident.startsWith('_sfc_main')) return;
			if (node.declarations[0].init.arguments[1].type !== 'ArrayExpression') return;
			if (node.declarations[0].init.arguments[1].elements.length === 0) return;
			const __cssModulesIndex = node.declarations[0].init.arguments[1].elements.findIndex((x) => {
				if (x?.type !== 'ArrayExpression') return false;
				if (x.elements.length !== 2) return false;
				if (x.elements[0]?.type !== 'Literal') return false;
				if (x.elements[0].value !== '__cssModules') return false;
				if (x.elements[1]?.type !== 'Identifier') return false;
				return true;
			});
			if (!~__cssModulesIndex) return;
			/* This region assumeed that the entered node looks like the following code.
			 *
			 * ```ts
			 * const SomeComponent = _export_sfc(_sfc_main, [["foo", bar], ["__cssModules", cssModules]]);
			 * ```
			 */
			//#endregion
			//#region
			const cssModuleForestName = ((node.declarations[0].init.arguments[1].elements[__cssModulesIndex] as estree.ArrayExpression).elements[1] as estree.Identifier).name;
			const cssModuleForestNode = parent.body.find((x) => {
				if (x.type !== 'VariableDeclaration') return false;
				if (x.declarations.length !== 1) return false;
				if (x.declarations[0].id.type !== 'Identifier') return false;
				if (x.declarations[0].id.name !== cssModuleForestName) return false;
				if (x.declarations[0].init?.type !== 'ObjectExpression') return false;
				return true;
			}) as unknown as estree.VariableDeclaration;
			const moduleForest = new Map((cssModuleForestNode.declarations[0].init as estree.ObjectExpression).properties.flatMap((property) => {
				if (property.type !== 'Property') return [];
				if (property.key.type !== 'Literal') return [];
				if (property.value.type !== 'Identifier') return [];
				return [[property.key.value as string, property.value.name as string]];
			}));
			/* This region collected a VariableDeclaration node in the module that looks like the following code.
			 *
			 * ```ts
			 * const cssModules = {
			 *   "$style": style0,
			 * };
			 * ```
			 */
			//#endregion
			//#region
			const sfcMain = parent.body.find((x) => {
				if (x.type !== 'VariableDeclaration') return false;
				if (x.declarations.length !== 1) return false;
				if (x.declarations[0].id.type !== 'Identifier') return false;
				if (x.declarations[0].id.name !== ident) return false;
				return true;
			}) as unknown as estree.VariableDeclaration;
			if (sfcMain.declarations[0].init?.type !== 'CallExpression') return;
			if (sfcMain.declarations[0].init.callee.type !== 'Identifier') return;
			if (sfcMain.declarations[0].init.callee.name !== 'defineComponent') return;
			if (sfcMain.declarations[0].init.arguments.length !== 1) return;
			if (sfcMain.declarations[0].init.arguments[0].type !== 'ObjectExpression') return;
			const setup = sfcMain.declarations[0].init.arguments[0].properties.find((x) => {
				if (x.type !== 'Property') return false;
				if (x.key.type !== 'Identifier') return false;
				if (x.key.name !== 'setup') return false;
				return true;
			}) as unknown as estree.Property;
			if (setup.value.type !== 'FunctionExpression') return;
			const render = setup.value.body.body.find((x) => {
				if (x.type !== 'ReturnStatement') return false;
				return true;
			}) as unknown as estree.ReturnStatement;
			if (render.argument?.type !== 'ArrowFunctionExpression') return;
			if (render.argument.params.length !== 2) return;
			const ctx = render.argument.params[0];
			if (ctx.type !== 'Identifier') return;
			if (ctx.name !== '_ctx') return;
			if (render.argument.body.type !== 'BlockStatement') return;
			/* This region assumed that `sfcMain` looks like the following code.
			 *
			 * ```ts
			 * const _sfc_main = defineComponent({
			 *   setup(_props) {
			 *     ...
			 *     return (_ctx, _cache) => {
			 *       ...
			 *     };
			 *   },
			 * });
			 * ```
			 */
			//#endregion
			for (const [key, value] of moduleForest) {
				//#region
				const cssModuleTreeNode = parent.body.find((x) => {
					if (x.type !== 'VariableDeclaration') return false;
					if (x.declarations.length !== 1) return false;
					if (x.declarations[0].id.type !== 'Identifier') return false;
					if (x.declarations[0].id.name !== value) return false;
					return true;
				}) as unknown as estree.VariableDeclaration;
				if (cssModuleTreeNode.declarations[0].init?.type !== 'ObjectExpression') return;
				const moduleTree = new Map(cssModuleTreeNode.declarations[0].init.properties.flatMap((property) => {
					if (property.type !== 'Property') return [];
					const actualKey = property.key.type === 'Identifier' ? property.key.name : property.key.type === 'Literal' ? property.key.value : null;
					if (typeof actualKey !== 'string') return [];
					if (property.value.type === 'Literal') return [[actualKey, property.value.value as string]];
					if (property.value.type !== 'Identifier') return [];
					const labelledValue = property.value.name;
					const actualValue = parent.body.find((x) => {
						if (x.type !== 'VariableDeclaration') return false;
						if (x.declarations.length !== 1) return false;
						if (x.declarations[0].id.type !== 'Identifier') return false;
						if (x.declarations[0].id.name !== labelledValue) return false;
						return true;
					}) as unknown as estree.VariableDeclaration;
					if (actualValue.declarations[0].init?.type !== 'Literal') return [];
					return [[actualKey, actualValue.declarations[0].init.value as string]];
				}));
				/* This region collected VariableDeclaration nodes in the module that looks like the following code.
				 *
				 * ```ts
				 * const foo = "bar";
				 * const baz = "qux";
				 * const style0 = {
				 *   foo: foo,
				 *   baz: baz,
				 * };
				 * ```
				 */
				//#endregion
				//#region
				(walk as typeof estreeWalker.walk)(render.argument.body, {
					enter(childNode) {
						if (childNode.type !== 'MemberExpression') return;
						if (childNode.object.type !== 'MemberExpression') return;
						if (childNode.object.object.type !== 'Identifier') return;
						if (childNode.object.object.name !== ctx.name) return;
						if (childNode.object.property.type !== 'Identifier') return;
						if (childNode.object.property.name !== key) return;
						if (childNode.property.type !== 'Identifier') return;
						const actualValue = moduleTree.get(childNode.property.name);
						if (actualValue === undefined) return;
						this.replace({
							type: 'Literal',
							value: actualValue,
						});
					},
				});
				/* This region inlined the reference identifier of the class name in the render function into the actual literal, as in the following code.
				 *
				 * ```ts
				 * const _sfc_main = defineComponent({
				 *   setup(_props) {
				 *     ...
				 *     return (_ctx, _cache) => {
				 *       ...
				 *       return openBlock(), createElementBlock("div", {
				 *         class: normalizeClass(_ctx.$style.foo),
				 *       }, null);
				 *     };
				 *   },
				 * });
				 * ```
				 *
				 * ↓
				 *
				 * ```ts
				 * const _sfc_main = defineComponent({
				 *   setup(_props) {
				 *     ...
				 *     return (_ctx, _cache) => {
				 *       ...
				 *       return openBlock(), createElementBlock("div", {
				 *         class: normalizeClass("bar"),
				 *       }, null);
				 *     };
				 *   },
				 * });
				 */
				//#endregion
				//#region
				(walk as typeof estreeWalker.walk)(render.argument.body, {
					enter(childNode) {
						if (childNode.type !== 'MemberExpression') return;
						if (childNode.object.type !== 'MemberExpression') return;
						if (childNode.object.object.type !== 'Identifier') return;
						if (childNode.object.object.name !== ctx.name) return;
						if (childNode.object.property.type !== 'Identifier') return;
						if (childNode.object.property.name !== key) return;
						if (childNode.property.type !== 'Identifier') return;
						console.error(`Undefined style detected: ${key}.${childNode.property.name} (in ${name})`);
						this.replace({
							type: 'Identifier',
							name: 'undefined',
						});
					},
				});
				/* This region replaced the reference identifier of missing class names in the render function with `undefined`, as in the following code.
				 *
				 * ```ts
				 * const _sfc_main = defineComponent({
				 *   setup(_props) {
				 *     ...
				 *     return (_ctx, _cache) => {
				 *       ...
				 *       return openBlock(), createElementBlock("div", {
				 *         class: normalizeClass(_ctx.$style.hoge),
				 *       }, null);
				 *     };
				 *   },
				 * });
				 * ```
				 *
				 * ↓
				 *
				 * ```ts
				 * const _sfc_main = defineComponent({
				 *   setup(_props) {
				 *     ...
				 *     return (_ctx, _cache) => {
				 *       ...
				 *       return openBlock(), createElementBlock("div", {
				 *         class: normalizeClass(undefined),
				 *       }, null);
				 *     };
				 *   },
				 * });
				 * ```
				 */
				//#endregion
				//#region
				(walk as typeof estreeWalker.walk)(render.argument.body, {
					enter(childNode) {
						if (childNode.type !== 'CallExpression') return;
						if (childNode.callee.type !== 'Identifier') return;
						if (childNode.callee.name !== 'normalizeClass') return;
						if (childNode.arguments.length !== 1) return;
						const normalized = normalizeClass(childNode.arguments[0], name);
						if (normalized === null) return;
						this.replace({
							type: 'Literal',
							value: normalized,
						});
					},
				});
				/* This region compiled the `normalizeClass` call into a pseudo-AOT compilation, as in the following code.
				 *
				 * ```ts
				 * const _sfc_main = defineComponent({
				 *   setup(_props) {
				 *     ...
				 *     return (_ctx, _cache) => {
				 *       ...
				 *       return openBlock(), createElementBlock("div", {
				 *         class: normalizeClass("bar"),
				 *       }, null);
				 *     };
				 *   },
				 * });
				 * ```
				 *
				 * ↓
				 *
				 * ```ts
				 * const _sfc_main = defineComponent({
				 *   setup(_props) {
				 *     ...
				 *     return (_ctx, _cache) => {
				 *       ...
				 *       return openBlock(), createElementBlock("div", {
				 *         class: "bar",
				 *       }, null);
				 *     };
				 *   },
				 * });
				 * ```
				 */
				//#endregion
			}
			//#region
			if (node.declarations[0].init.arguments[1].elements.length === 1) {
				(walk as typeof estreeWalker.walk)(ast, {
					enter(childNode) {
						if (childNode.type !== 'Identifier') return;
						if (childNode.name !== ident) return;
						this.replace({
							type: 'Identifier',
							name: node.declarations[0].id.name,
						});
					},
				});
				this.remove();
				/* NOTE: The above logic is valid as long as the following two conditions are met.
				 *
				 * - the uniqueness of `ident` is kept throughout the module
				 * - `_export_sfc` is noop when the second argument is an empty array
				 *
				 * Otherwise, the below logic should be used instead.

				this.replace({
					type: 'VariableDeclaration',
					declarations: [{
						type: 'VariableDeclarator',
						id: {
							type: 'Identifier',
							name: node.declarations[0].id.name,
						},
						init: {
							type: 'Identifier',
							name: ident,
						},
					}],
					kind: 'const',
				});
				 */
			} else {
				this.replace({
					type: 'VariableDeclaration',
					declarations: [{
						type: 'VariableDeclarator',
						id: {
							type: 'Identifier',
							name: node.declarations[0].id.name,
						},
						init: {
							type: 'CallExpression',
							callee: {
								type: 'Identifier',
								name: '_export_sfc',
							},
							arguments: [{
								type: 'Identifier',
								name: ident,
							}, {
								type: 'ArrayExpression',
								elements: node.declarations[0].init.arguments[1].elements.slice(0, __cssModulesIndex).concat(node.declarations[0].init.arguments[1].elements.slice(__cssModulesIndex + 1)),
							}],
						},
					}],
					kind: 'const',
				});
			}
			/* This region removed the `__cssModules` reference from the second argument of `_export_sfc`, as in the following code.
			 *
			 * ```ts
			 * const SomeComponent = _export_sfc(_sfc_main, [["foo", bar], ["__cssModules", cssModules]]);
			 * ```
			 *
			 * ↓
			 *
			 * ```ts
			 * const SomeComponent = _export_sfc(_sfc_main, [["foo", bar]]);
			 * ```
			 *
			 * When the declaration becomes noop, it is removed as follows.
			 *
			 * ```ts
			 * const _sfc_main = defineComponent({
			 *   ...
			 * });
			 * const SomeComponent = _export_sfc(_sfc_main, []);
			 * ```
			 *
			 * ↓
			 *
			 * ```ts
			 * const SomeComponent = defineComponent({
			 *   ...
			 * });
			 */
			//#endregion
		},
	});
}

// eslint-disable-next-line import/no-default-export
export default function pluginUnwindCssModuleClassName(): Plugin {
	return {
		name: 'UnwindCssModuleClassName',
		renderChunk(code): { code: string } {
			const ast = this.parse(code) as unknown as estree.Node;
			unwindCssModuleClassName(ast);
			return { code: generate(ast) };
		},
	};
}
