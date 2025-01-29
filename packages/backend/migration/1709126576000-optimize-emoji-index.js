/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class OptimizeEmojiIndex1709126576000 {
	name = 'OptimizeEmojiIndex1709126576000'

	async up(queryRunner) {
		await queryRunner.query(`CREATE INDEX "IDX_EMOJI_ROLE_IDS" ON "emoji" using gin ("roleIdsThatCanBeUsedThisEmojiAsReaction")`)
		await queryRunner.query(`CREATE INDEX "IDX_EMOJI_CATEGORY" ON "emoji" ("category")`)
	}

	async down(queryRunner) {
		await queryRunner.query(`DROP INDEX "IDX_EMOJI_CATEGORY"`)
		await queryRunner.query(`DROP INDEX "IDX_EMOJI_ROLE_IDS"`)
	}
}
