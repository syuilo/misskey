import { deepStrictEqual, strictEqual } from 'node:assert';
import test, { describe } from 'node:test';
import * as Misskey from 'misskey-js';
import { createAccount, fetchAdmin, resolveRemoteNote, uploadFile } from './utils.js';

const [
	[, aAdminClient],
	[, bAdminClient],
] = await Promise.all([
	fetchAdmin('a.local'),
	fetchAdmin('b.local'),
]);

describe('Drive', () => {
	describe('Upload image in a.local and resolve from b.local', async () => {
		const [uploader, uploaderClient] = await createAccount('a.local', aAdminClient);

		const image = await uploadFile('a.local', '../../test/resources/192.jpg', uploader.i);
		const noteWithImage = (await uploaderClient.request('notes/create', { fileIds: [image.id] })).createdNote;
		const uri = `https://a.local/notes/${noteWithImage.id}`;
		const noteInBServer = await resolveRemoteNote(uri, bAdminClient);
		strictEqual(noteInBServer.files != null, true);
		strictEqual(noteInBServer.files!.length, 1);
		const imageInBServer = noteInBServer.files![0];

		await test('Check consistency of DriveFile', () => {
			// console.log(`a.local: ${JSON.stringify(image, null, '\t')}`);
			// console.log(`b.local: ${JSON.stringify(imageInBServer, null, '\t')}`);

			const toBeDeleted: (keyof Misskey.entities.DriveFile)[] = [
				'id',
				'createdAt',
				'size',
				'url',
				'thumbnailUrl',
				'userId',
			];
			const _Image: Partial<Misskey.entities.DriveFile> = structuredClone(image);
			const _ImageInBServer: Partial<Misskey.entities.DriveFile> = structuredClone(imageInBServer);

			for (const image of [_Image, _ImageInBServer]) {
				for (const field of toBeDeleted) {
					delete image[field];
				}
			}

			deepStrictEqual(_Image, _ImageInBServer);
		});

		const updatedImage = await uploaderClient.request('drive/files/update', {
			fileId: image.id,
			name: 'updated_192.jpg',
			isSensitive: true,
		});

		const updatedImageInBServer = await bAdminClient.request('drive/files/show', {
			fileId: imageInBServer.id,
		});

		await test('Update', async () => {
			// console.log(`a.local: ${JSON.stringify(updatedImage, null, '\t')}`);
			// console.log(`b.local: ${JSON.stringify(updatedImageInBServer, null, '\t')}`);

			// FIXME: not updated with `drive/files/update`
			strictEqual(updatedImage.isSensitive, true);
			strictEqual(updatedImage.name, 'updated_192.jpg');
			strictEqual(updatedImageInBServer.isSensitive, false);
			strictEqual(updatedImageInBServer.name, '192.jpg');
		});

		const noteWithUpdatedImage = (await uploaderClient.request('notes/create', { fileIds: [updatedImage.id] })).createdNote;
		const uriUpdated = `https://a.local/notes/${noteWithUpdatedImage.id}`;
		const noteWithUpdatedImageInBServer = await resolveRemoteNote(uriUpdated, bAdminClient);
		strictEqual(noteWithUpdatedImageInBServer.files != null, true);
		strictEqual(noteWithUpdatedImageInBServer.files!.length, 1);
		const reupdatedImageInBServer = noteWithUpdatedImageInBServer.files![0];

		await test('Re-update with attaching to Note', async () => {
			// console.log(`b.local: ${JSON.stringify(reupdatedImageInBServer, null, '\t')}`);

			// `isSensitive` is updated
			strictEqual(reupdatedImageInBServer.isSensitive, true);
			// FIXME: but `name` is not updated
			strictEqual(reupdatedImageInBServer.name, '192.jpg');
		});
	});
});
