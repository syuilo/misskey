/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class HttpSignImplLv1709242519122 {
    name = 'HttpSignImplLv1709242519122'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" ADD "httpMessageSignaturesImplementationLevel" character varying(16) NOT NULL DEFAULT '00'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "httpMessageSignaturesImplementationLevel"`);
    }
}
