/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type DroppedItem = DroppedFile | DroppedDirectory;

export type DroppedFile = {
	isFile: true;
	path: string;
	file: File;
};

export type DroppedDirectory = {
	isFile: false;
	path: string;
	children: DroppedItem[];
}

export async function extractDroppedItems(ev: DragEvent): Promise<DroppedItem[]> {
	const dropItems = ev.dataTransfer?.items;
	if (!dropItems || dropItems.length === 0) {
		return [];
	}

	const apiTestItem = dropItems[0];
	if ('webkitGetAsEntry' in apiTestItem) {
		return readDataTransferItems(dropItems);
	} else {
		// webkitGetAsEntryに対応していない場合はfilesから取得する（ディレクトリのサポートは出来ない）
		const dropFiles = ev.dataTransfer.files;
		if (dropFiles.length === 0) {
			return [];
		}

		const droppedFiles = Array.of<DroppedFile>();
		for (let i = 0; i < dropFiles.length; i++) {
			const file = dropFiles.item(i);
			if (file) {
				droppedFiles.push({
					isFile: true,
					path: file.name,
					file,
				});
			}
		}

		return droppedFiles;
	}
}

/**
 * ドラッグ＆ドロップされたファイルのリストからディレクトリ構造とファイルへの参照（{@link File}）を取得する。
 */
export async function readDataTransferItems(itemList: DataTransferItemList): Promise<DroppedItem[]> {
	async function readEntry(entry: FileSystemEntry): Promise<DroppedItem> {
		if (entry.isFile) {
			return {
				isFile: true,
				path: entry.fullPath,
				file: await readFile(entry as FileSystemFileEntry),
			};
		} else {
			return {
				isFile: false,
				path: entry.fullPath,
				children: await readDirectory(entry as FileSystemDirectoryEntry),
			};
		}
	}

	function readFile(fileSystemFileEntry: FileSystemFileEntry): Promise<File> {
		return new Promise((resolve, reject) => {
			fileSystemFileEntry.file(resolve, reject);
		});
	}

	function readDirectory(fileSystemDirectoryEntry: FileSystemDirectoryEntry): Promise<DroppedItem[]> {
		return new Promise(async (resolve) => {
			const allEntries = Array.of<FileSystemEntry>();
			const reader = fileSystemDirectoryEntry.createReader();
			while (true) {
				const entries = await new Promise<FileSystemEntry[]>((res, rej) => reader.readEntries(res, rej));
				if (entries.length === 0) {
					break;
				}
				allEntries.push(...entries);
			}

			resolve(await Promise.all(allEntries.map(readEntry)));
		});
	}

	// 扱いにくいので配列に変換
	const items = Array.of<DataTransferItem>();
	for (let i = 0; i < itemList.length; i++) {
		items.push(itemList[i]);
	}

	return Promise.all(
		items
			.map(it => it.webkitGetAsEntry())
			.filter(it => it)
			.map(it => readEntry(it!)),
	);
}

/**
 * {@link DroppedItem}のリストからディレクトリを再帰的に検索し、ファイルのリストを取得する。
 */
export function flattenDroppedFiles(items: DroppedItem[]): DroppedFile[] {
	const result = Array.of<DroppedFile>();
	for (const item of items) {
		if (item.isFile) {
			result.push(item);
		} else {
			result.push(...flattenDroppedFiles(item.children));
		}
	}
	return result;
}
