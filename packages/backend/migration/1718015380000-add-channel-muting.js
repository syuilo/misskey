/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddChannelMuting1718015380000 {
	name = 'AddChannelMuting1718015380000'

	async up(queryRunner) {
		await queryRunner.query(`
			CREATE TABLE "channel_muting"
			(
				"id"        varchar(32) NOT NULL,
				"userId"    varchar(32) NOT NULL,
				"channelId" varchar(32) NOT NULL,
				"expiresAt" timestamp with time zone,
				CONSTRAINT "PK_channel_muting_id" PRIMARY KEY ("id"),
				CONSTRAINT "FK_channel_muting_userId" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
				CONSTRAINT "FK_channel_muting_channelId" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE NO ACTION
			);
			CREATE INDEX "IDX_channel_muting_userId" ON "channel_muting" ("userId");
			CREATE INDEX "IDX_channel_muting_channelId" ON "channel_muting" ("channelId");

			ALTER TABLE note ADD "renoteChannelId" varchar(32);
			COMMENT ON COLUMN note."renoteChannelId" is '[Denormalized]';
		`);
	}

	async down(queryRunner) {
		await queryRunner.query(`
			ALTER TABLE note DROP COLUMN "renoteChannelId";

			ALTER TABLE "channel_muting"
				DROP CONSTRAINT "FK_channel_muting_userId";
			ALTER TABLE "channel_muting"
				DROP CONSTRAINT "FK_channel_muting_channelId";
			DROP INDEX "IDX_channel_muting_userId";
			DROP INDEX "IDX_channel_muting_channelId";
			DROP TABLE "channel_muting";
		`);
	}
}
