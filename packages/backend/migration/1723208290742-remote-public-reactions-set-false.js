/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class RemotePublicReactionsSetFalse1723208290742 {
    name = 'RemotePublicReactionsSetFalse1723208290742'

    async up(queryRunner) {
        await queryRunner.query(`UPDATE "user_profile" SET "publicReactions" = FALSE WHERE "userHost" IS NOT NULL`);
    }

    async down(queryRunner) {
        // no valid down migration
    }
}
