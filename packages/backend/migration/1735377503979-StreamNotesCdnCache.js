/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class StreamNotesCdnCache1735377503979 {
    name = 'StreamNotesCdnCache1735377503979'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "enableStreamNotesCdnCache" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableStreamNotesCdnCache"`);
    }
}
