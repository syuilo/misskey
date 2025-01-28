/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import type { Ref } from 'vue';
import type { SoundStore } from '@/store.js';
import type { SoundType } from '@/scripts/sound.js';
import { getSoundDuration, playMisskeySfxFile, soundsTypes } from '@/scripts/sound.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';

export async function soundSettingsButton(soundSetting: Ref<SoundStore>): Promise<void> {
	function getSoundTypeName(f: SoundType): string {
		switch (f) {
			case null:
				return i18n.ts.none;
			case '_driveFile_':
				return i18n.ts._soundSettings.driveFile;
			default:
				return f;
		}
	}

	const { canceled, result } = await os.form(i18n.ts.sound, {
		type: {
			type: 'enum',
			label: i18n.ts.sound,
			default: soundSetting.value.type ?? 'none',
			enum: soundsTypes.map(f => ({
				value: f ?? 'none', label: getSoundTypeName(f),
			})),
		},
		soundFile: {
			type: 'drive-file',
			label: i18n.ts.file,
			defaultFileId: soundSetting.value.type === '_driveFile_' ? soundSetting.value.fileId : null,
			hidden: v => v.type !== '_driveFile_',
			validate: async (file: Misskey.entities.DriveFile) => {
				if (!file.type.startsWith('audio')) {
					os.alert({
						type: 'warning',
						title: i18n.ts._soundSettings.driveFileTypeWarn,
						text: i18n.ts._soundSettings.driveFileTypeWarnDescription,
					});
					return false;
				}

				const duration = await getSoundDuration(file.url);
				if (duration >= 2000) {
					const { canceled } = await os.confirm({
						type: 'warning',
						title: i18n.ts._soundSettings.driveFileDurationWarn,
						text: i18n.ts._soundSettings.driveFileDurationWarnDescription,
						okText: i18n.ts.continue,
						cancelText: i18n.ts.cancel,
					});
					if (canceled) return false;
				}

				return true;
			},
		},
		volume: {
			type: 'range',
			label: i18n.ts.volume,
			default: soundSetting.value.volume ?? 1,
			textConverter: (v) => `${Math.floor(v * 100)}%`,
			min: 0,
			max: 1,
			step: 0.05,
		},
		listen: {
			type: 'button',
			content: i18n.ts.listen,
			action: (_, v) => {
				const sound = buildSoundStore(v);
				if (!sound) return;
				playMisskeySfxFile(sound);
			},
		},
	});
	if (canceled) return;

	const res = buildSoundStore(result);
	if (res) soundSetting.value = res;

	function buildSoundStore(result: any): SoundStore | null {
		const type = (result.type === 'none' ? null : result.type) as SoundType;
		const volume = result.volume as number;
		const fileId = result.soundFile?.id ?? (soundSetting.value.type === '_driveFile_' ? soundSetting.value.fileId : undefined);
		const fileUrl = result.soundFile?.url ?? (soundSetting.value.type === '_driveFile_' ? soundSetting.value.fileUrl : undefined);

		if (type === '_driveFile_') {
			if (!fileUrl || !fileId) {
				os.alert({
					type: 'warning',
					text: i18n.ts._soundSettings.driveFileWarn,
				});
				return null;
			}
			return { type, volume, fileId, fileUrl };
		} else {
			return { type, volume };
		}
	}
}
