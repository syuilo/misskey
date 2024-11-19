/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class APMultipleKeys1709269211718 {
    name = 'APMultipleKeys1709269211718'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_publickey" DROP CONSTRAINT "UQ_10c146e4b39b443ede016f6736d"`);
    }

    async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "user_publickey" ADD CONSTRAINT "UQ_10c146e4b39b443ede016f6736d" UNIQUE ("userId")`);
    }
}
