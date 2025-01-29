import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import * as esbuild from 'esbuild';
import { build } from 'esbuild';
import { globSync } from 'glob';
import { execa } from 'execa';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);
const _package = JSON.parse(fs.readFileSync(_dirname + '/package.json', 'utf-8'));

const entryPoints = globSync('./src/**/**.{ts,tsx}');

/** @type {import('esbuild').BuildOptions} */
const options = {
	entryPoints,
	minify: process.env.NODE_ENV === 'production',
	outdir: './built',
	target: 'es2022',
	platform: 'browser',
	format: 'esm',
	sourcemap: 'linked',
};

// built配下をすべて削除する
const args = process.argv.slice(2).map(arg => arg.toLowerCase());

// built配下をすべて削除する
if (!args.includes('--no-clean')) {
	fs.rmSync('./built', { recursive: true, force: true });
}

if (args.includes('--watch')) {
	await watchSrc();
} else {
	await buildSrc();
}

async function buildSrc() {
	console.log(`[${_package.name}] start building...`);

	await build(options)
		.then(() => {
			console.log(`[${_package.name}] build succeeded.`);
		})
		.catch((err) => {
			process.stderr.write(err.stderr);
			process.exit(1);
		});

	if (process.env.NODE_ENV === 'production') {
		console.log(`[${_package.name}] skip building d.ts because NODE_ENV is production.`);
	} else {
		await buildDts();
	}

	console.log(`[${_package.name}] finish building.`);
}

function buildDts() {
	return execa(
		'tsc',
		[
			'--project', 'tsconfig.json',
			'--outDir', 'built',
			'--declaration', 'true',
			'--emitDeclarationOnly', 'true',
		],
		{
			stdout: process.stdout,
			stderr: process.stderr,
		},
	);
}

async function watchSrc() {
	const plugins = [{
		name: 'gen-dts',
		setup(build) {
			build.onStart(() => {
				console.log(`[${_package.name}] detect changed...`);
			});
			build.onEnd(async result => {
				if (result.errors.length > 0) {
					console.error(`[${_package.name}] watch build failed:`, result);
					return;
				}
				await buildDts();
			});
		},
	}];

	console.log(`[${_package.name}] start watching...`);

	const context = await esbuild.context({ ...options, plugins });
	await context.watch();

	await new Promise((resolve, reject) => {
		process.on('SIGHUP', resolve);
		process.on('SIGINT', resolve);
		process.on('SIGTERM', resolve);
		process.on('uncaughtException', reject);
		process.on('exit', resolve);
	}).finally(async () => {
		await context.dispose();
		console.log(`[${_package.name}] finish watching.`);
	});
}
