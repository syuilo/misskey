/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class FeaturedUpdateRatio1716449324926 {
    name = 'FeaturedUpdateRatio1716449324926'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "featuredUpdateRatio" double precision NOT NULL DEFAULT '0.3'`);
    }

    async down(queryRunner) {
         await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "featuredUpdateRatio"`);
    }
}
