/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { Injectable } from '@nestjs/common';
import * as nsfw from 'nsfwjs';
import si from 'systeminformation';
import { Mutex } from 'async-mutex';
import fetch from 'node-fetch';
import { bindThis } from '@/decorators.js';
import { Tensor3D } from '@tensorflow/tfjs-core';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

const REQUIRED_CPU_FLAGS_X64 = ['avx2', 'fma'];
let isSupportedCpu: undefined | boolean = undefined;

@Injectable()
export class AiService {
	private model: nsfw.NSFWJS;
	private modelLoadMutex: Mutex = new Mutex();

	constructor(
	) {
	}

	@bindThis
	public async detectSensitive(path: string): Promise<nsfw.PredictionType[] | null> {
		try {
			if (isSupportedCpu === undefined) {
				isSupportedCpu = await this.computeIsSupportedCpu();
			}

			if (!isSupportedCpu) {
				console.error('This CPU cannot use TensorFlow.');
				return null;
			}

			const tf = await import('@tensorflow/tfjs-node');
			tf.env().global.fetch = fetch;

			if (this.model == null) {
				await this.modelLoadMutex.runExclusive(async () => {
					if (this.model == null) {
						this.model = await nsfw.load(`file://${_dirname}/../../nsfw-model/`, { size: 299 });
					}
				});
			}

			const buffer = await fs.promises.readFile(path);
			const image = await tf.node.decodeImage(buffer, 3) as Tensor3D;
			try {
				const predictions = await this.model.classify(image);
				return predictions;
			} finally {
				image.dispose();
			}
		} catch (err) {
			console.error(err);
			return null;
		}
	}

	private async computeIsSupportedCpu(): Promise<boolean> {
		switch (process.arch) {
			case 'x64': {
				const cpuFlags = await this.getCpuFlags();
				return REQUIRED_CPU_FLAGS_X64.every(required => cpuFlags.includes(required));
			}
			case 'arm64': {
				// As far as I know, no required CPU flags for ARM64.
				return true;
			}
			default: {
				return false;
			}
		}
	}

	@bindThis
	private async getCpuFlags(): Promise<string[]> {
		const str = await si.cpuFlags();
		return str.split(/\s+/);
	}
}
