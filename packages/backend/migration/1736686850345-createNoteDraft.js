/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class CreateNoteDraft1736686850345 {
    name = 'CreateNoteDraft1736686850345'

    async up(queryRunner) {
			await queryRunner.query(`
				CREATE TABLE "note_draft" (
					"id" varchar NOT NULL,
					"replyId" varchar NULL,
					"renoteId" varchar NULL,
					"text" text NULL,
					"cw" varchar(512) NULL,
					"userId" varchar NOT NULL,
					"localOnly" boolean DEFAULT false,
					"reactionAcceptance" varchar(64) NULL,
					"visibility" varchar NOT NULL,
					"fileIds" varchar[] DEFAULT '{}',
					"visibleUserIds" varchar[] DEFAULT '{}',
					"hashtag" varchar(128) NULL,
					"channelId" varchar NULL,
					"hasPoll" boolean DEFAULT false,
					"pollChoices" varchar(256)[] DEFAULT '{}',
					"pollMultiple" boolean NULL,
					"pollExpiresAt" TIMESTAMP WITH TIME ZONE NULL,
					"pollExpiredAfter" bigint NULL,
					PRIMARY KEY ("id")
				)`);

			await queryRunner.query(`
				CREATE INDEX "IDX_NOTE_DRAFT_REPLY_ID" ON "note_draft" ("replyId")
			`);

			await queryRunner.query(`
				CREATE INDEX "IDX_NOTE_DRAFT_RENOTE_ID" ON "note_draft" ("renoteId")
			`);

			await queryRunner.query(`
				CREATE INDEX "IDX_NOTE_DRAFT_USER_ID" ON "note_draft" ("userId")
			`);

			await queryRunner.query(`
				CREATE INDEX "IDX_NOTE_DRAFT_FILE_IDS" ON "note_draft" USING GIN ("fileIds")
			`);

			await queryRunner.query(`
				CREATE INDEX "IDX_NOTE_DRAFT_VISIBLE_USER_IDS" ON "note_draft" USING GIN ("visibleUserIds")
			`);

			await queryRunner.query(`
				CREATE INDEX "IDX_NOTE_DRAFT_CHANNEL_ID" ON "note_draft" ("channelId")
			`);

			await queryRunner.query(`
				ALTER TABLE "note_draft"
				ADD CONSTRAINT "FK_NOTE_DRAFT_REPLY_ID" FOREIGN KEY ("replyId") REFERENCES "note"("id") ON DELETE CASCADE
			`);

			await queryRunner.query(`
				ALTER TABLE "note_draft"
				ADD CONSTRAINT "FK_NOTE_DRAFT_RENOTE_ID" FOREIGN KEY ("renoteId") REFERENCES "note"("id") ON DELETE CASCADE
			`);

			await queryRunner.query(`
				ALTER TABLE "note_draft"
				ADD CONSTRAINT "FK_NOTE_DRAFT_USER_ID" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
			`);

			await queryRunner.query(`
				ALTER TABLE "note_draft"
				ADD CONSTRAINT "FK_NOTE_DRAFT_CHANNEL_ID" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE CASCADE
			`);
    }

    async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "note_draft" DROP CONSTRAINT "FK_NOTE_DRAFT_CHANNEL_ID"`);
			await queryRunner.query(`ALTER TABLE "note_draft" DROP CONSTRAINT "FK_NOTE_DRAFT_USER_ID"`);
			await queryRunner.query(`ALTER TABLE "note_draft" DROP CONSTRAINT "FK_NOTE_DRAFT_RENOTE_ID"`);
			await queryRunner.query(`ALTER TABLE "note_draft" DROP CONSTRAINT "FK_NOTE_DRAFT_REPLY_ID"`);
			await queryRunner.query(`DROP INDEX "IDX_NOTE_DRAFT_CHANNEL_ID"`);
			await queryRunner.query(`DROP INDEX "IDX_NOTE_DRAFT_VISIBLE_USER_IDS"`);
			await queryRunner.query(`DROP INDEX "IDX_NOTE_DRAFT_FILE_IDS"`);
			await queryRunner.query(`DROP INDEX "IDX_NOTE_DRAFT_USER_ID"`);
			await queryRunner.query(`DROP INDEX "IDX_NOTE_DRAFT_RENOTE_ID"`);
			await queryRunner.query(`DROP INDEX "IDX_NOTE_DRAFT_REPLY_ID"`);
			await queryRunner.query(`DROP TABLE "note_draft"`);
    }
}
