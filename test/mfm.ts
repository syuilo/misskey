/*
 * Tests of MFM
 */

import * as assert from 'assert';

import analyze from '../src/mfm/parse';
import toHtml from '../src/mfm/html';

function _node(name: string, children: any[], props: any) {
	return children ? { name, children, props } : { name, props };
}

function node(name: string, props?: any) {
	return _node(name, null, props);
}

function nodeWithChildren(name: string, children: any[], props?: any) {
	return _node(name, children, props);
}

function text(text: string) {
	return node('text', { text });
}

describe('Text', () => {
	it('can be analyzed', () => {
		const tokens = analyze('@himawari @hima_sub@namori.net お腹ペコい :cat: #yryr');
		assert.deepEqual([
			node('mention', { canonical: '@himawari', username: 'himawari', host: null }),
			text(' '),
			node('mention', { canonical: '@hima_sub@namori.net', username: 'hima_sub', host: 'namori.net' }),
			text(' '),
			node('emoji', { name: 'cat' }),
			text(' '),
			node('hashtag', { hashtag: 'yryr' }),
		], tokens);
	});

	describe('elements', () => {
		describe('bold', () => {
			it('simple', () => {
				const tokens = analyze('**foo**');
				assert.deepEqual([
					nodeWithChildren('bold', [
						text('foo')
					]),
				], tokens);
			});

			it('with other texts', () => {
				const tokens = analyze('bar**foo**bar');
				assert.deepEqual([
					text('bar'),
					nodeWithChildren('bold', [
						text('foo')
					]),
					text('bar'),
				], tokens);
			});
		});

		it('big', () => {
			const tokens = analyze('***Strawberry*** Pasta');
			assert.deepEqual([
				nodeWithChildren('big', [
					text('Strawberry')
				]),
				text(' Pasta'),
			], tokens);
		});

		describe('motion', () => {
			it('by triple brackets', () => {
				const tokens = analyze('(((foo)))');
				assert.deepEqual([
					nodeWithChildren('motion', [
						text('foo')
					]),
				], tokens);
			});

			it('by triple brackets (with other texts)', () => {
				const tokens = analyze('bar(((foo)))bar');
				assert.deepEqual([
					text('bar'),
					nodeWithChildren('motion', [
						text('foo')
					]),
					text('bar'),
				], tokens);
			});

			it('by <motion> tag', () => {
				const tokens = analyze('<motion>foo</motion>');
				assert.deepEqual([
					nodeWithChildren('motion', [
						text('foo')
					]),
				], tokens);
			});

			it('by <motion> tag (with other texts)', () => {
				const tokens = analyze('bar<motion>foo</motion>bar');
				assert.deepEqual([
					text('bar'),
					nodeWithChildren('motion', [
						text('foo')
					]),
					text('bar'),
				], tokens);
			});
		});

		describe('mention', () => {
			it('local', () => {
				const tokens = analyze('@himawari foo');
				assert.deepEqual([
					node('mention', { canonical: '@himawari', username: 'himawari', host: null }),
					text(' foo')
				], tokens);
			});

			it('remote', () => {
				const tokens = analyze('@hima_sub@namori.net foo');
				assert.deepEqual([
					node('mention', { canonical: '@hima_sub@namori.net', username: 'hima_sub', host: 'namori.net' }),
					text(' foo')
				], tokens);
			});

			it('remote punycode', () => {
				const tokens = analyze('@hima_sub@xn--q9j5bya.xn--zckzah foo');
				assert.deepEqual([
					node('mention', { canonical: '@hima_sub@なもり.テスト', username: 'hima_sub', host: 'xn--q9j5bya.xn--zckzah' }),
					text(' foo')
				], tokens);
			});

			it('ignore', () => {
				const tokens = analyze('idolm@ster');
				assert.deepEqual([
					text('idolm@ster')
				], tokens);

				const tokens2 = analyze('@a\n@b\n@c');
				assert.deepEqual([
					node('mention', { canonical: '@a', username: 'a', host: null }),
					text('\n'),
					node('mention', { canonical: '@b', username: 'b', host: null }),
					text('\n'),
					node('mention', { canonical: '@c', username: 'c', host: null })
				], tokens2);

				const tokens3 = analyze('**x**@a');
				assert.deepEqual([
					nodeWithChildren('bold', [
						text('x')
					]),
					node('mention', { canonical: '@a', username: 'a', host: null })
				], tokens3);
			});
		});

		it('hashtag', () => {
			const tokens1 = analyze('Strawberry Pasta #alice');
			assert.deepEqual([
				text('Strawberry Pasta '),
				node('hashtag', { hashtag: 'alice' })
			], tokens1);

			const tokens2 = analyze('Foo #bar, baz #piyo.');
			assert.deepEqual([
				text('Foo '),
				node('hashtag', { hashtag: 'bar' }),
				text(', baz '),
				node('hashtag', { hashtag: 'piyo' }),
				text('.'),
			], tokens2);

			const tokens3 = analyze('#Foo!');
			assert.deepEqual([
				node('hashtag', { hashtag: 'Foo' }),
				text('!'),
			], tokens3);
		});

		describe('quote', () => {
			it('basic', () => {
				const tokens1 = analyze('> foo\nbar\nbaz');
				assert.deepEqual([
					nodeWithChildren('quote', [
						text('foo\nbar\nbaz')
					])
				], tokens1);

				const tokens2 = analyze('before\n> foo\nbar\nbaz\n\nafter');
				assert.deepEqual([
					text('before\n'),
					nodeWithChildren('quote', [
						text('foo\nbar\nbaz')
					]),
					text('\nafter')
				], tokens2);

				const tokens3 = analyze('piyo> foo\nbar\nbaz');
				assert.deepEqual([
					text('piyo> foo\nbar\nbaz')
				], tokens3);

				const tokens4 = analyze('> foo\n> bar\n> baz');
				assert.deepEqual([
					nodeWithChildren('quote', [
						text('foo\nbar\nbaz')
					])
				], tokens4);

				const tokens5 = analyze('"\nfoo\nbar\nbaz\n"');
				assert.deepEqual([
					nodeWithChildren('quote', [
						text('foo\nbar\nbaz')
					])
				], tokens5);
			});

			it('nested', () => {
				const tokens = analyze('>> foo\n> bar');
				assert.deepEqual([
					nodeWithChildren('quote', [
						nodeWithChildren('quote', [
							text('foo')
						]),
						text('bar')
					])
				], tokens);
			});
		});

		describe('url', () => {
			it('simple', () => {
				const tokens = analyze('https://example.com');
				assert.deepEqual([
					node('url', { url: 'https://example.com' })
				], tokens);
			});

			it('ignore trailing period', () => {
				const tokens = analyze('https://example.com.');
				assert.deepEqual([
					node('url', { url: 'https://example.com' }),
					text('.')
				], tokens);
			});

			it('with comma', () => {
				const tokens = analyze('https://example.com/foo?bar=a,b');
				assert.deepEqual([
					node('url', { url: 'https://example.com/foo?bar=a,b' })
				], tokens);
			});

			it('ignore trailing comma', () => {
				const tokens = analyze('https://example.com/foo, bar');
				assert.deepEqual([
					node('url', { url: 'https://example.com/foo' }),
					text(', bar')
				], tokens);
			});

			it('with brackets', () => {
				const tokens = analyze('https://example.com/foo(bar)');
				assert.deepEqual([
					node('url', { url: 'https://example.com/foo(bar)' })
				], tokens);
			});

			it('ignore parent brackets', () => {
				const tokens = analyze('(https://example.com/foo)');
				assert.deepEqual([
					text('('),
					node('url', { url: 'https://example.com/foo' }),
					text(')')
				], tokens);
			});

			it('ignore parent brackets with internal brackets', () => {
				const tokens = analyze('(https://example.com/foo(bar))');
				assert.deepEqual([
					text('('),
					node('url', { url: 'https://example.com/foo(bar)' }),
					text(')')
				], tokens);
			});
		});

		it('link', () => {
			const tokens = analyze('[foo](https://example.com)');
			assert.deepEqual([
				nodeWithChildren('link', [
					text('foo')
				], { url: 'https://example.com', silent: false })
			], tokens);
		});

		it('emoji', () => {
			const tokens1 = analyze(':cat:');
			assert.deepEqual([
				node('emoji', { name: 'cat' })
			], tokens1);

			const tokens2 = analyze(':cat::cat::cat:');
			assert.deepEqual([
				node('emoji', { name: 'cat' }),
				node('emoji', { name: 'cat' }),
				node('emoji', { name: 'cat' })
			], tokens2);

			const tokens3 = analyze('🍎');
			assert.deepEqual([
				node('emoji', { emoji: '🍎' })
			], tokens3);
		});

		it('block code', () => {
			const tokens = analyze('```\nvar x = "Strawberry Pasta";\n```');
			assert.deepEqual([
				node('blockCode', { code: 'var x = "Strawberry Pasta";' })
			], tokens);
		});

		it('inline code', () => {
			const tokens = analyze('`var x = "Strawberry Pasta";`');
			assert.deepEqual([
				node('inlineCode', { code: 'var x = "Strawberry Pasta";' })
			], tokens);
		});

		it('math', () => {
			const fomula = 'x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}';
			const text = `\\(${fomula}\\)`;
			const tokens = analyze(text);
			assert.deepEqual([
				node('math', { formula: fomula })
			], tokens);
		});

		it('search', () => {
			const tokens1 = analyze('a b c 検索');
			assert.deepEqual([
				node('search', { query: 'a b c' })
			], tokens1);

			const tokens2 = analyze('a b c Search');
			assert.deepEqual([
				node('search', { query: 'a b c' })
			], tokens2);

			const tokens3 = analyze('a b c search');
			assert.deepEqual([
				node('search', { query: 'a b c' })
			], tokens3);

			const tokens4 = analyze('a b c SEARCH');
			assert.deepEqual([
				node('search', { query: 'a b c' })
			], tokens4);
		});

		it('title', () => {
			const tokens1 = analyze('【yee】\nhaw');
			assert.deepEqual([
				nodeWithChildren('title', [
					text('yee')
				]),
				text('haw')
			], tokens1[0]);

			const tokens2 = analyze('[yee]\nhaw');
			assert.deepEqual([
				nodeWithChildren('title', [
					text('yee')
				]),
				text('haw')
			], tokens2[0]);

			const tokens3 = analyze('a [a]\nb [b]\nc [c]');
			assert.deepEqual([
				text('a [a]\nb [b]\nc [c]')
			], tokens3[0]);

			const tokens4 = analyze('foo\n【bar】\nbuzz');
			assert.deepEqual([
				text('foo\n'),
				nodeWithChildren('title', [
					text('bar')
				]),
				text('\nbuzz'),
			], tokens4);
		});
	});

	describe('toHtml', () => {
		it('br', () => {
			const input = 'foo\nbar\nbaz';
			const output = '<p>foo<br>bar<br>baz</p>';
			assert.equal(toHtml(analyze(input)), output);
		});
	});
});
