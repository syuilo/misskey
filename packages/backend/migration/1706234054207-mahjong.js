/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class Mahjong1706234054207 {
    name = 'Mahjong1706234054207'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "mahjong_game" ("id" character varying(32) NOT NULL, "startedAt" TIMESTAMP WITH TIME ZONE, "endedAt" TIMESTAMP WITH TIME ZONE, "user1Id" character varying(32), "user2Id" character varying(32), "user3Id" character varying(32), "user4Id" character varying(32), "isEnded" boolean NOT NULL DEFAULT false, "winnerId" character varying(32), "timeLimitForEachTurn" smallint NOT NULL DEFAULT '90', "logs" jsonb NOT NULL DEFAULT '[]', CONSTRAINT "PK_77db54c0a9785d387e3fbbdd2f0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "mahjong_game" ADD CONSTRAINT "FK_b98c78761a845b69e6540401264" FOREIGN KEY ("user1Id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "mahjong_game" ADD CONSTRAINT "FK_f17b0ba519ae28f188a7915ad6f" FOREIGN KEY ("user2Id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "mahjong_game" ADD CONSTRAINT "FK_64314ffd3cb59475b0d06330058" FOREIGN KEY ("user3Id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "mahjong_game" ADD CONSTRAINT "FK_58a75f1ea2a810ae3986f72a0e3" FOREIGN KEY ("user4Id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "mahjong_game" DROP CONSTRAINT "FK_58a75f1ea2a810ae3986f72a0e3"`);
        await queryRunner.query(`ALTER TABLE "mahjong_game" DROP CONSTRAINT "FK_64314ffd3cb59475b0d06330058"`);
        await queryRunner.query(`ALTER TABLE "mahjong_game" DROP CONSTRAINT "FK_f17b0ba519ae28f188a7915ad6f"`);
        await queryRunner.query(`ALTER TABLE "mahjong_game" DROP CONSTRAINT "FK_b98c78761a845b69e6540401264"`);
        await queryRunner.query(`DROP TABLE "mahjong_game"`);
    }
}
