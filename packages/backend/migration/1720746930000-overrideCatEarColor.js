/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class OverrideCatEarColor1720746930000 {
    name = 'OverrideCatEarColor1720746930000'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "overrideCatEarColor" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."overrideCatEarColor" IS 'Whether or not the User manually set their cat ear color.'`);
        await queryRunner.query(`ALTER TABLE "user" ADD "outerCatEarColor" character varying(16) NOT NULL DEFAULT '#5b6880'`);
        await queryRunner.query(`ALTER TABLE "user" ADD "innerCatEarColor" character varying(16) NOT NULL DEFAULT '#df548f'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "innerCatEarColor"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "outerCatEarColor"`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."overrideCatEarColor" IS NULL`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "overrideCatEarColor"`);
    }
}
