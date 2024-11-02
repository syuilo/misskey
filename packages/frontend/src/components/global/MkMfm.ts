/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { VNode, h, SetupContext, provide } from 'vue';
import * as mfm from 'mfm-js';
import * as Misskey from 'misskey-js';
import { host } from '@@/js/config.js';
import MkUrl from '@/components/global/MkUrl.vue';
import MkTime from '@/components/global/MkTime.vue';
import MkLink from '@/components/MkLink.vue';
import MkMention from '@/components/MkMention.vue';
import MkEmoji from '@/components/global/MkEmoji.vue';
import MkCustomEmoji from '@/components/global/MkCustomEmoji.vue';
import MkCode from '@/components/MkCode.vue';
import MkCodeInline from '@/components/MkCodeInline.vue';
import MkGoogle from '@/components/MkGoogle.vue';
import MkSparkle from '@/components/MkSparkle.vue';
import MkA, { MkABehavior } from '@/components/global/MkA.vue';
import { defaultStore } from '@/store.js';

function safeParseFloat(str: unknown): number | null {
	if (typeof str !== 'string' || str === '') return null;
	const num = parseFloat(str);
	if (isNaN(num)) return null;
	return num;
}

const QUOTE_STYLE = `
display: block;
margin: 8px;
padding: 6px 0 6px 12px;
color: var(--MI_THEME-fg);
border-left: solid 3px var(--MI_THEME-fg);
opacity: 0.7;
`.split('\n').join(' ');

type MfmProps = {
	text: string;
	plain?: boolean;
	nowrap?: boolean;
	author?: Misskey.entities.UserLite;
	isNote?: boolean;
	emojiUrls?: Record<string, string>;
	rootScale?: number;
	nyaize?: boolean | 'respect';
	parsedNodes?: mfm.MfmNode[] | null;
	enableEmojiMenu?: boolean;
	enableEmojiMenuReaction?: boolean;
	linkNavigationBehavior?: MkABehavior;
};

type MfmEvents = {
	clickEv(id: string): void;
};

// eslint-disable-next-line import/no-default-export
export default function (props: MfmProps, { emit }: { emit: SetupContext<MfmEvents>['emit'] }) {
	// こうしたいところだけど functional component 内では provide は使えない
	//provide('linkNavigationBehavior', props.linkNavigationBehavior);

	const isNote = props.isNote ?? true;
	const shouldNyaize = props.nyaize ? props.nyaize === 'respect' ? props.author?.isCat : false : false;

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (props.text == null || props.text === '') return;

	const rootAst = props.parsedNodes ?? (props.plain ? mfm.parseSimple : mfm.parse)(props.text);

	const validTime = (t: string | boolean | null | undefined) => {
		if (t == null) return null;
		if (typeof t === 'boolean') return null;
		return t.match(/^\-?[0-9.]+s$/) ? t : null;
	};

	const validColor = (c: unknown): string | null => {
		if (typeof c !== 'string') return null;
		return c.match(/^[0-9a-f]{3,6}$/i) ? c : null;
	};

	const useAnim = defaultStore.state.advancedMfm && defaultStore.state.animatedMfm;

	/**
	 * Gen Vue Elements from MFM AST
	 * @param ast MFM AST
	 * @param scale How times large the text is
	 * @param disableNyaize Whether nyaize is disabled or not
	 */
	const genEl = (ast: mfm.MfmNode[], scale: number, disableNyaize = false) => ast.map((token): VNode | string | (VNode | string)[] => {
		switch (token.type) {
			case 'text': {
				let text = token.props.text.replace(/(\r\n|\n|\r)/g, '\n');
				if (!disableNyaize && shouldNyaize) {
					text = Misskey.nyaize(text);
				}

				if (!props.plain) {
					const res: (VNode | string)[] = [];
					for (const t of text.split('\n')) {
						res.push(h('br'));
						res.push(t);
					}
					res.shift();
					return res;
				} else {
					return [text.replace(/\n/g, ' ')];
				}
			}

			case 'bold': {
				return [h('b', genEl(token.children, scale))];
			}

			case 'strike': {
				return [h('del', genEl(token.children, scale))];
			}

			case 'italic': {
				return h('i', {
					style: 'font-style: oblique;',
				}, genEl(token.children, scale));
			}

			case 'fn': {
				// TODO: CSSを文字列で組み立てていくと token.props.args.~~~ 経由でCSSインジェクションできるのでよしなにやる
				let style: string | undefined;
				switch (token.props.name) {
					case 'tada': {
						const speed = validTime(token.props.args.speed) ?? '1s';
						const delay = validTime(token.props.args.delay) ?? '0s';
						style = 'font-size: 150%;' + (useAnim ? `animation: global-tada ${speed} linear infinite both; animation-delay: ${delay};` : '');
						break;
					}
					case 'jelly': {
						const speed = validTime(token.props.args.speed) ?? '1s';
						const delay = validTime(token.props.args.delay) ?? '0s';
						style = (useAnim ? `animation: mfm-rubberBand ${speed} linear infinite both; animation-delay: ${delay};` : '');
						break;
					}
					case 'twitch': {
						const speed = validTime(token.props.args.speed) ?? '0.5s';
						const delay = validTime(token.props.args.delay) ?? '0s';
						style = useAnim ? `animation: mfm-twitch ${speed} ease infinite; animation-delay: ${delay};` : '';
						break;
					}
					case 'shake': {
						const speed = validTime(token.props.args.speed) ?? '0.5s';
						const delay = validTime(token.props.args.delay) ?? '0s';
						style = useAnim ? `animation: mfm-shake ${speed} ease infinite; animation-delay: ${delay};` : '';
						break;
					}
					case 'spin': {
						const direction =
							token.props.args.left ? 'reverse' :
							token.props.args.alternate ? 'alternate' :
							'normal';
						const anime =
							token.props.args.x ? 'mfm-spinX' :
							token.props.args.y ? 'mfm-spinY' :
							'mfm-spin';
						const speed = validTime(token.props.args.speed) ?? '1.5s';
						const delay = validTime(token.props.args.delay) ?? '0s';
						style = useAnim ? `animation: ${anime} ${speed} linear infinite; animation-direction: ${direction}; animation-delay: ${delay};` : '';
						break;
					}
					case 'jump': {
						const speed = validTime(token.props.args.speed) ?? '0.75s';
						const delay = validTime(token.props.args.delay) ?? '0s';
						style = useAnim ? `animation: mfm-jump ${speed} linear infinite; animation-delay: ${delay};` : '';
						break;
					}
					case 'bounce': {
						const speed = validTime(token.props.args.speed) ?? '0.75s';
						const delay = validTime(token.props.args.delay) ?? '0s';
						style = useAnim ? `animation: mfm-bounce ${speed} linear infinite; transform-origin: center bottom; animation-delay: ${delay};` : '';
						break;
					}
					case 'flip': {
						const transform =
							(token.props.args.h && token.props.args.v) ? 'scale(-1, -1)' :
							token.props.args.v ? 'scaleY(-1)' :
							'scaleX(-1)';
						style = `transform: ${transform};`;
						break;
					}
					case 'x2': {
						return h('span', {
							class: defaultStore.state.advancedMfm ? 'mfm-x2' : '',
						}, genEl(token.children, scale * 2));
					}
					case 'x3': {
						return h('span', {
							class: defaultStore.state.advancedMfm ? 'mfm-x3' : '',
						}, genEl(token.children, scale * 3));
					}
					case 'x4': {
						return h('span', {
							class: defaultStore.state.advancedMfm ? 'mfm-x4' : '',
						}, genEl(token.children, scale * 4));
					}
					case 'font': {
						const family =
							token.props.args.serif ? 'serif' :
							token.props.args.monospace ? 'monospace' :
							token.props.args.cursive ? 'cursive' :
							token.props.args.fantasy ? 'fantasy' :
							token.props.args.emoji ? 'emoji' :
							token.props.args.math ? 'math' :
							null;
						if (family) style = `font-family: ${family};`;
						break;
					}
					case 'blur': {
						return h('span', {
							class: '_mfm_blur_',
						}, genEl(token.children, scale));
					}
					case 'rainbow': {
						if (!useAnim) {
							return h('span', {
								class: '_mfm_rainbow_fallback_',
							}, genEl(token.children, scale));
						}
						const speed = validTime(token.props.args.speed) ?? '1s';
						const delay = validTime(token.props.args.delay) ?? '0s';
						style = `animation: mfm-rainbow ${speed} linear infinite; animation-delay: ${delay};`;
						break;
					}
					case 'sparkle': {
						if (!useAnim) {
							return genEl(token.children, scale);
						}
						return h(MkSparkle, {}, genEl(token.children, scale));
					}
					case 'rotate': {
						const degrees = safeParseFloat(token.props.args.deg) ?? 90;
						style = `transform: rotate(${degrees}deg); transform-origin: center center;`;
						break;
					}
					case 'position': {
						if (!defaultStore.state.advancedMfm) break;
						const x = safeParseFloat(token.props.args.x) ?? 0;
						const y = safeParseFloat(token.props.args.y) ?? 0;
						style = `transform: translateX(${x}em) translateY(${y}em);`;
						break;
					}
					case 'scale': {
						if (!defaultStore.state.advancedMfm) {
							style = '';
							break;
						}
						const x = Math.min(safeParseFloat(token.props.args.x) ?? 1, 5);
						const y = Math.min(safeParseFloat(token.props.args.y) ?? 1, 5);
						style = `transform: scale(${x}, ${y});`;
						scale = scale * Math.max(x, y);
						break;
					}
					case 'fg': {
						let color = validColor(token.props.args.color);
						color = color ?? 'f00';
						style = `color: #${color}; overflow-wrap: anywhere;`;
						break;
					}
					case 'bg': {
						let color = validColor(token.props.args.color);
						color = color ?? 'f00';
						style = `background-color: #${color}; overflow-wrap: anywhere;`;
						break;
					}
					case 'border': {
						let color = validColor(token.props.args.color);
						color = color ? `#${color}` : 'var(--MI_THEME-accent)';
						let b_style = token.props.args.style;
						if (
							typeof b_style !== 'string' ||
							!['hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']
								.includes(b_style)
						) b_style = 'solid';
						const width = safeParseFloat(token.props.args.width) ?? 1;
						const radius = safeParseFloat(token.props.args.radius) ?? 0;
						style = `border: ${width}px ${b_style} ${color}; border-radius: ${radius}px;${token.props.args.noclip ? '' : ' overflow: clip;'}`;
						break;
					}
					case 'ruby': {
						if (token.children.length === 1) {
							const child = token.children[0];
							let text = child.type === 'text' ? child.props.text : '';
							if (!disableNyaize && shouldNyaize) {
								text = Misskey.nyaize(text);
							}
							return h('ruby', {}, [text.split(' ')[0], h('rt', text.split(' ')[1])]);
						} else {
							const rt = token.children.at(-1)!;
							let text = rt.type === 'text' ? rt.props.text : '';
							if (!disableNyaize && shouldNyaize) {
								text = Misskey.nyaize(text);
							}
							return h('ruby', {}, [...genEl(token.children.slice(0, token.children.length - 1), scale), h('rt', text.trim())]);
						}
					}
					case 'unixtime': {
						const child = token.children[0];
						const unixtime = parseInt(child.type === 'text' ? child.props.text : '');
						return h('span', {
							style: 'display: inline-block; font-size: 90%; border: solid 1px var(--MI_THEME-divider); border-radius: 999px; padding: 4px 10px 4px 6px;',
						}, [
							h('i', {
								class: 'ti ti-clock',
								style: 'margin-right: 0.25em;',
							}),
							h(MkTime, {
								key: Math.random(),
								time: unixtime * 1000,
								mode: 'detail',
							}),
						]);
					}
					case 'clickable': {
						return h('span', { onClick(ev: MouseEvent): void {
							ev.stopPropagation();
							ev.preventDefault();
							const clickEv = typeof token.props.args.ev === 'string' ? token.props.args.ev : '';
							emit('clickEv', clickEv);
						} }, genEl(token.children, scale));
					}
				}
				if (style === undefined) {
					return h('span', {}, ['$[', token.props.name, ' ', ...genEl(token.children, scale), ']']);
				} else {
					return h('span', {
						style: 'display: inline-block; ' + style,
					}, genEl(token.children, scale));
				}
			}

			case 'small': {
				return [h('small', {
					style: 'opacity: 0.7;',
				}, genEl(token.children, scale))];
			}

			case 'center': {
				return [h('div', {
					style: 'text-align:center;',
				}, genEl(token.children, scale))];
			}

			case 'url': {
				return [h(MkUrl, {
					key: Math.random(),
					url: token.props.url,
					rel: 'nofollow noopener',
					navigationBehavior: props.linkNavigationBehavior,
				})];
			}

			case 'link': {
				return [h(MkLink, {
					key: Math.random(),
					url: token.props.url,
					rel: 'nofollow noopener',
					navigationBehavior: props.linkNavigationBehavior,
				}, genEl(token.children, scale, true))];
			}

			case 'mention': {
				return [h(MkMention, {
					key: Math.random(),
					host: (token.props.host == null && props.author && props.author.host != null ? props.author.host : token.props.host) ?? host,
					username: token.props.username,
					navigationBehavior: props.linkNavigationBehavior,
				})];
			}

			case 'hashtag': {
				return [h(MkA, {
					key: Math.random(),
					to: isNote ? `/tags/${encodeURIComponent(token.props.hashtag)}` : `/user-tags/${encodeURIComponent(token.props.hashtag)}`,
					style: 'color:var(--MI_THEME-hashtag);',
					behavior: props.linkNavigationBehavior,
				}, `#${token.props.hashtag}`)];
			}

			case 'blockCode': {
				return [h(MkCode, {
					key: Math.random(),
					code: token.props.code,
					lang: token.props.lang ?? undefined,
				})];
			}

			case 'inlineCode': {
				return [h(MkCodeInline, {
					key: Math.random(),
					code: token.props.code,
				})];
			}

			case 'quote': {
				if (!props.nowrap) {
					return [h('div', {
						style: QUOTE_STYLE,
					}, genEl(token.children, scale, true))];
				} else {
					return [h('span', {
						style: QUOTE_STYLE,
					}, genEl(token.children, scale, true))];
				}
			}

			case 'emojiCode': {
				if (props.author?.host == null) {
					return [h(MkCustomEmoji, {
						key: Math.random(),
						name: token.props.name,
						normal: props.plain,
						host: null,
						useOriginalSize: scale >= 2.5,
						menu: props.enableEmojiMenu,
						menuReaction: props.enableEmojiMenuReaction,
						fallbackToImage: false,
					})];
				} else {
					// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
					if (props.emojiUrls && (props.emojiUrls[token.props.name] == null)) {
						return [h('span', `:${token.props.name}:`)];
					} else {
						return [h(MkCustomEmoji, {
							key: Math.random(),
							name: token.props.name,
							url: props.emojiUrls && props.emojiUrls[token.props.name],
							normal: props.plain,
							host: props.author.host,
							useOriginalSize: scale >= 2.5,
						})];
					}
				}
			}

			case 'unicodeEmoji': {
				return [h(MkEmoji, {
					key: Math.random(),
					emoji: token.props.emoji,
					menu: props.enableEmojiMenu,
					menuReaction: props.enableEmojiMenuReaction,
				})];
			}

			case 'mathInline': {
				return [h('code', token.props.formula)];
			}

			case 'mathBlock': {
				return [h('code', token.props.formula)];
			}

			case 'search': {
				return [h(MkGoogle, {
					key: Math.random(),
					q: token.props.query,
				})];
			}

			case 'plain': {
				return [h('span', genEl(token.children, scale, true))];
			}

			default: {
				// @ts-expect-error 存在しないASTタイプ
				console.error('unrecognized ast type:', token.type);

				return [];
			}
		}
	}).flat(Infinity) as (VNode | string)[];

	return h('span', {
		// https://codeday.me/jp/qa/20190424/690106.html
		style: props.nowrap ? 'white-space: pre; word-wrap: normal; overflow: hidden; text-overflow: ellipsis;' : 'white-space: pre-wrap;',
	}, genEl(rootAst, props.rootScale ?? 1));
}
