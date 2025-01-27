/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { URL } from 'node:url';
import { Inject, Injectable } from '@nestjs/common';
import * as parse5 from 'parse5';
import { Window, XMLSerializer } from 'happy-dom';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { intersperse } from '@/misc/prelude/array.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import type { IMentionedRemoteUsers } from '@/models/Note.js';
import { bindThis } from '@/decorators.js';
import type { DefaultTreeAdapterMap } from 'parse5';
import type * as mfm from 'mfm-js';

const treeAdapter = parse5.defaultTreeAdapter;
type Node = DefaultTreeAdapterMap['node'];
type ChildNode = DefaultTreeAdapterMap['childNode'];

const urlRegex = /^https?:\/\/[\w\/:%#@$&?!()\[\]~.,=+\-]+/;
const urlRegexFull = /^https?:\/\/[\w\/:%#@$&?!()\[\]~.,=+\-]+$/;

@Injectable()
export class MfmService {
	constructor(
		@Inject(DI.config)
		private config: Config,
	) {
	}

	@bindThis
	public fromHtml(html: string, hashtagNames?: string[]): string {
		// some AP servers like Pixelfed use br tags as well as newlines
		html = html.replace(/<br\s?\/?>\r?\n/gi, '\n');

		const normalizedHashtagNames = hashtagNames == null ? undefined : new Set<string>(hashtagNames.map(x => normalizeForSearch(x)));

		const dom = parse5.parseFragment(html);

		let text = '';

		for (const n of dom.childNodes) {
			analyze(n);
		}

		return text.trim();

		function getText(node: Node): string {
			if (treeAdapter.isTextNode(node)) return node.value;
			if (!treeAdapter.isElementNode(node)) return '';
			if (node.nodeName === 'br') return '\n';

			if (node.childNodes) {
				return node.childNodes.map(n => getText(n)).join('');
			}

			return '';
		}

		function appendChildren(childNodes: ChildNode[]): void {
			if (childNodes) {
				for (const n of childNodes) {
					analyze(n);
				}
			}
		}

		function analyze(node: Node) {
			if (treeAdapter.isTextNode(node)) {
				text += node.value;
				return;
			}

			// Skip comment or document type node
			if (!treeAdapter.isElementNode(node)) {
				return;
			}

			switch (node.nodeName) {
				case 'br': {
					text += '\n';
					break;
				}

				case 'a': {
					const txt = getText(node);
					const rel = node.attrs.find(x => x.name === 'rel');
					const href = node.attrs.find(x => x.name === 'href');

					// ハッシュタグ
					if (normalizedHashtagNames && href && normalizedHashtagNames.has(normalizeForSearch(txt))) {
						text += txt;
						// メンション
					} else if (txt.startsWith('@') && !(rel && rel.value.startsWith('me '))) {
						const part = txt.split('@');

						if (part.length === 2 && href) {
							//#region ホスト名部分が省略されているので復元する
							const acct = `${txt}@${(new URL(href.value)).hostname}`;
							text += acct;
							//#endregion
						} else if (part.length === 3) {
							text += txt;
						}
						// その他
					} else {
						const generateLink = () => {
							if (!href && !txt) {
								return '';
							}
							if (!href) {
								return txt;
							}
							if (!txt || txt === href.value) {	// #6383: Missing text node
								if (href.value.match(urlRegexFull)) {
									return href.value;
								} else {
									return `<${href.value}>`;
								}
							}
							if (href.value.match(urlRegex) && !href.value.match(urlRegexFull)) {
								return `[${txt}](<${href.value}>)`;	// #6846
							} else {
								return `[${txt}](${href.value})`;
							}
						};

						text += generateLink();
					}
					break;
				}

				case 'h1': {
					text += '【';
					appendChildren(node.childNodes);
					text += '】\n';
					break;
				}

				case 'b':
				case 'strong': {
					text += '**';
					appendChildren(node.childNodes);
					text += '**';
					break;
				}

				case 'small': {
					text += '<small>';
					appendChildren(node.childNodes);
					text += '</small>';
					break;
				}

				case 's':
				case 'del': {
					text += '~~';
					appendChildren(node.childNodes);
					text += '~~';
					break;
				}

				case 'i':
				case 'em': {
					text += '<i>';
					appendChildren(node.childNodes);
					text += '</i>';
					break;
				}

				case 'ruby': {
					let ruby: [string, string][] = [];
					for (const child of node.childNodes) {
						if (child.nodeName === 'rp') {
							continue;
						}
						if (treeAdapter.isTextNode(child) && !/\s|\[|\]/.test(child.value)) {
							ruby.push([child.value, '']);
							continue;
						}
						if (child.nodeName === 'rt' && ruby.length > 0) {
							const rt = getText(child);
							if (/\s|\[|\]/.test(rt)) {
								// If any space is included in rt, it is treated as a normal text
								ruby = [];
								appendChildren(node.childNodes);
								break;
							} else {
								ruby.at(-1)![1] = rt;
								continue;
							}
						}
						// If any other element is included in ruby, it is treated as a normal text
						ruby = [];
						appendChildren(node.childNodes);
						break;
					}
					for (const [base, rt] of ruby) {
						text += `$[ruby ${base} ${rt}]`;
					}
					break;
				}

				// block code (<pre><code>)
				case 'pre': {
					if (node.childNodes.length === 1 && node.childNodes[0].nodeName === 'code') {
						text += '\n```\n';
						text += getText(node.childNodes[0]);
						text += '\n```\n';
					} else {
						appendChildren(node.childNodes);
					}
					break;
				}

				// inline code (<code>)
				case 'code': {
					text += '`';
					appendChildren(node.childNodes);
					text += '`';
					break;
				}

				case 'blockquote': {
					const t = getText(node);
					if (t) {
						text += '\n> ';
						text += t.split('\n').join('\n> ');
					}
					break;
				}

				case 'p':
				case 'h2':
				case 'h3':
				case 'h4':
				case 'h5':
				case 'h6': {
					text += '\n\n';
					appendChildren(node.childNodes);
					break;
				}

				// other block elements
				case 'div':
				case 'header':
				case 'footer':
				case 'article':
				case 'li':
				case 'dt':
				case 'dd': {
					text += '\n';
					appendChildren(node.childNodes);
					break;
				}

				default:	// includes inline elements
				{
					appendChildren(node.childNodes);
					break;
				}
			}
		}
	}

	@bindThis
	public toHtml(nodes: mfm.MfmNode[] | null, mentionedRemoteUsers: IMentionedRemoteUsers = []) {
		if (nodes == null) {
			return null;
		}

		const { happyDOM, window } = new Window();

		const doc = window.document;

		const body = doc.createElement('p');

		function appendChildren(children: mfm.MfmNode[], targetElement: any): void {
			if (children) {
				for (const child of children.map(x => (handlers as any)[x.type](x))) targetElement.appendChild(child);
			}
		}

		function fnDefault(node: mfm.MfmFn) {
			const el = doc.createElement('i');
			appendChildren(node.children, el);
			return el;
		}

		const handlers: { [K in mfm.MfmNode['type']]: (node: mfm.NodeType<K>) => any } = {
			bold: (node) => {
				const el = doc.createElement('b');
				appendChildren(node.children, el);
				return el;
			},

			small: (node) => {
				const el = doc.createElement('small');
				appendChildren(node.children, el);
				return el;
			},

			strike: (node) => {
				const el = doc.createElement('del');
				appendChildren(node.children, el);
				return el;
			},

			italic: (node) => {
				const el = doc.createElement('i');
				appendChildren(node.children, el);
				return el;
			},

			fn: (node) => {
				switch (node.props.name) {
					case 'unixtime': {
						const text = node.children[0].type === 'text' ? node.children[0].props.text : '';
						try {
							const date = new Date(parseInt(text, 10) * 1000);
							const el = doc.createElement('time');
							el.setAttribute('datetime', date.toISOString());
							el.textContent = date.toISOString();
							return el;
						} catch (err) {
							return fnDefault(node);
						}
					}

					case 'ruby': {
						if (node.children.length === 1) {
							const child = node.children[0];
							const text = child.type === 'text' ? child.props.text : '';
							const rubyEl = doc.createElement('ruby');
							const rtEl = doc.createElement('rt');

							// ruby未対応のHTMLサニタイザーを通したときにルビが「劉備（りゅうび）」となるようにする
							const rpStartEl = doc.createElement('rp');
							rpStartEl.appendChild(doc.createTextNode('('));
							const rpEndEl = doc.createElement('rp');
							rpEndEl.appendChild(doc.createTextNode(')'));

							rubyEl.appendChild(doc.createTextNode(text.split(' ')[0]));
							rtEl.appendChild(doc.createTextNode(text.split(' ')[1]));
							rubyEl.appendChild(rpStartEl);
							rubyEl.appendChild(rtEl);
							rubyEl.appendChild(rpEndEl);
							return rubyEl;
						} else {
							const rt = node.children.at(-1);

							if (!rt) {
								return fnDefault(node);
							}

							const text = rt.type === 'text' ? rt.props.text : '';
							const rubyEl = doc.createElement('ruby');
							const rtEl = doc.createElement('rt');

							// ruby未対応のHTMLサニタイザーを通したときにルビが「劉備（りゅうび）」となるようにする
							const rpStartEl = doc.createElement('rp');
							rpStartEl.appendChild(doc.createTextNode('('));
							const rpEndEl = doc.createElement('rp');
							rpEndEl.appendChild(doc.createTextNode(')'));

							appendChildren(node.children.slice(0, node.children.length - 1), rubyEl);
							rtEl.appendChild(doc.createTextNode(text.trim()));
							rubyEl.appendChild(rpStartEl);
							rubyEl.appendChild(rtEl);
							rubyEl.appendChild(rpEndEl);
							return rubyEl;
						}
					}

					default: {
						return fnDefault(node);
					}
				}
			},

			blockCode: (node) => {
				const pre = doc.createElement('pre');
				const inner = doc.createElement('code');
				inner.textContent = node.props.code;
				pre.appendChild(inner);
				return pre;
			},

			center: (node) => {
				const el = doc.createElement('div');
				appendChildren(node.children, el);
				return el;
			},

			emojiCode: (node) => {
				return doc.createTextNode(`\u200B:${node.props.name}:\u200B`);
			},

			unicodeEmoji: (node) => {
				return doc.createTextNode(node.props.emoji);
			},

			hashtag: (node) => {
				const a = doc.createElement('a');
				a.setAttribute('href', `${this.config.url}/tags/${node.props.hashtag}`);
				a.textContent = `#${node.props.hashtag}`;
				a.setAttribute('rel', 'tag');
				return a;
			},

			inlineCode: (node) => {
				const el = doc.createElement('code');
				el.textContent = node.props.code;
				return el;
			},

			mathInline: (node) => {
				const el = doc.createElement('code');
				el.textContent = node.props.formula;
				return el;
			},

			mathBlock: (node) => {
				const el = doc.createElement('code');
				el.textContent = node.props.formula;
				return el;
			},

			link: (node) => {
				const a = doc.createElement('a');
				a.setAttribute('href', node.props.url);
				appendChildren(node.children, a);
				return a;
			},

			mention: (node) => {
				const a = doc.createElement('a');
				const { username, host, acct } = node.props;
				const remoteUserInfo = mentionedRemoteUsers.find(remoteUser => remoteUser.username.toLowerCase() === username.toLowerCase() && remoteUser.host?.toLowerCase() === host?.toLowerCase());
				a.setAttribute('href', remoteUserInfo
					? (remoteUserInfo.url ? remoteUserInfo.url : remoteUserInfo.uri)
					: `${this.config.url}/${acct.endsWith(`@${this.config.url}`) ? acct.substring(0, acct.length - this.config.url.length - 1) : acct}`);
				a.className = 'u-url mention';
				a.textContent = acct;
				return a;
			},

			quote: (node) => {
				const el = doc.createElement('blockquote');
				appendChildren(node.children, el);
				return el;
			},

			text: (node) => {
				if (!node.props.text.match(/[\r\n]/)) {
					return doc.createTextNode(node.props.text);
				}

				const el = doc.createElement('span');
				const nodes = node.props.text.split(/\r\n|\r|\n/).map(x => doc.createTextNode(x));

				for (const x of intersperse<FIXME | 'br'>('br', nodes)) {
					el.appendChild(x === 'br' ? doc.createElement('br') : x);
				}

				return el;
			},

			url: (node) => {
				const a = doc.createElement('a');
				a.setAttribute('href', node.props.url);
				a.textContent = node.props.url;
				return a;
			},

			search: (node) => {
				const a = doc.createElement('a');
				a.setAttribute('href', `https://www.google.com/search?q=${node.props.query}`);
				a.textContent = node.props.content;
				return a;
			},

			plain: (node) => {
				const el = doc.createElement('span');
				appendChildren(node.children, el);
				return el;
			},
		};

		appendChildren(nodes, body);

		// Remove the unnecessary namespace
		const serialized = new XMLSerializer().serializeToString(body).replace(/^\s*<p xmlns=\"http:\/\/www.w3.org\/1999\/xhtml\">/, '<p>');

		happyDOM.close().catch(err => {});

		return serialized;
	}
}
