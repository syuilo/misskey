/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class PreferPopularUserFactor1720879227657 {
	name = 'PreferPopularUserFactor1720879227657'

	async up(queryRunner) {
		await queryRunner.query(`CREATE TYPE "meta_preferPopularUserFactor_enum" AS ENUM('follower', 'pv', 'none')`)
		await queryRunner.query(`ALTER TABLE "meta" ADD "preferPopularUserFactor" "meta_preferPopularUserFactor_enum" NOT NULL DEFAULT 'follower'`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "preferPopularUserFactor"`);
		await queryRunner.query(`DROP TYPE "meta_preferPopularUserFactor_enum"`);
	}
}
