/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddAntennaHideNotesInSensitiveChannel1736230492103 {
    name = 'AddAntennaHideNotesInSensitiveChannel1736230492103'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "antenna" ADD "hideNotesInSensitiveChannel" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "antenna" DROP COLUMN "hideNotesInSensitiveChannel"`);
    }
}
