/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import cssnano from 'cssnano';
import * as yaml from 'js-yaml';
import postcss from 'postcss';
import * as terser from 'terser';

import { build as buildLocales } from '../locales/index.js';
import generateDTS from '../locales/generateDTS.js';
import meta from '../package.json' with { type: "json" };
import buildTarball from './tarball.mjs';

const configDir = fileURLToPath(new URL('../.config', import.meta.url));
const configPath = process.env.MISSKEY_CONFIG_YML
	? path.resolve(configDir, process.env.MISSKEY_CONFIG_YML)
	: process.env.NODE_ENV === 'test'
		? path.resolve(configDir, 'test.yml')
		: path.resolve(configDir, 'default.yml');

let locales = buildLocales();

async function loadConfig() {
	return fs.readFile(configPath, 'utf-8').then(data => yaml.load(data)).catch(() => null);
}

async function copyFrontendFonts() {
  await fs.cp('./packages/frontend/node_modules/three/examples/fonts', './built/_frontend_dist_/fonts', { dereference: true, recursive: true });
}

async function copyFrontendLocales() {
  generateDTS();

  await fs.mkdir('./built/_frontend_dist_/locales', { recursive: true });

  const v = { '_version_': meta.version };

  for (const [lang, locale] of Object.entries(locales)) {
    await fs.writeFile(`./built/_frontend_dist_/locales/${lang}.${meta.version}.json`, JSON.stringify({ ...locale, ...v }), 'utf-8');
  }
}

async function copyBackendViews() {
  await fs.cp('./packages/backend/src/server/web/views', './packages/backend/built/server/web/views', { recursive: true });
}

async function buildBackendScript() {
  await fs.mkdir('./packages/backend/built/server/web', { recursive: true });

  for (const file of [
    './packages/backend/src/server/web/boot.js',
    './packages/backend/src/server/web/boot.embed.js',
    './packages/backend/src/server/web/bios.js',
    './packages/backend/src/server/web/cli.js'
  ]) {
    let source = await fs.readFile(file, { encoding: 'utf-8' });
    source = source.replaceAll('LANGS', JSON.stringify(Object.keys(locales)));
    const { code } = await terser.minify(source, { toplevel: true });
    await fs.writeFile(`./packages/backend/built/server/web/${path.basename(file)}`, code);
  }
}

async function buildBackendStyle() {
  await fs.mkdir('./packages/backend/built/server/web', { recursive: true });

  for (const file of [
    './packages/backend/src/server/web/style.css',
    './packages/backend/src/server/web/style.embed.css',
    './packages/backend/src/server/web/bios.css',
    './packages/backend/src/server/web/cli.css',
    './packages/backend/src/server/web/error.css'
  ]) {
    const source = await fs.readFile(file, { encoding: 'utf-8' });
    const { css } = await postcss([cssnano({ zindex: false })]).process(source, { from: undefined });
    await fs.writeFile(`./packages/backend/built/server/web/${path.basename(file)}`, css);
  }
}

async function build() {
  await Promise.all([
    copyFrontendFonts(),
    copyFrontendLocales(),
    copyBackendViews(),
    buildBackendScript(),
    buildBackendStyle(),
		loadConfig().then(config => config?.publishTarballInsteadOfProvideRepositoryUrl && buildTarball()),
  ]);
}

await build();

if (process.argv.includes('--watch')) {
	const watcher = fs.watch('./locales');
	for await (const event of watcher) {
		const filename = event.filename?.replaceAll('\\', '/');
		if (/^[a-z]+-[A-Z]+\.yml/.test(filename)) {
			console.log(`update ${filename} ...`)
			locales = buildLocales();
			await copyFrontendLocales()
		}
	}
}
