/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { correctFilename } from '@/misc/correct-filename.js';

describe(correctFilename, () => {
    it('no ext to null', () => {
        expect(correctFilename('test', null)).toBe('test.unknown');
    });
    it('no ext to jpg', () => {
        expect(correctFilename('test', 'jpg')).toBe('test.jpg');
    });
    it('jpg to webp', () => {
        expect(correctFilename('test.jpg', 'webp')).toBe('test.jpg.webp');
    });
    it('jpeg to jpg', () => {
        expect(correctFilename('test.jpeg', 'jpg')).toBe('test.jpeg');
    });
    it('JPEG to jpg', () => {
        expect(correctFilename('test.JPEG', 'jpg')).toBe('test.JPEG');
    });
    it('jpg to jpg', () => {
        expect(correctFilename('test.jpg', 'jpg')).toBe('test.jpg');
    });
    it('tiff to tif', () => {
        expect(correctFilename('test.tiff', 'tif')).toBe('test.tiff');
    });
    it('skip gz', () => {
        expect(correctFilename('test.unitypackage', 'gz')).toBe('test.unitypackage');
    });
    it('skip text file', () => {
        expect(correctFilename('test.txt', null)).toBe('test.txt');
    });
});
