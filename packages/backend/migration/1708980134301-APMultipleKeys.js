/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class APMultipleKeys1708980134301 {
    name = 'APMultipleKeys1708980134301'

    async up(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_171e64971c780ebd23fae140bb"`);
        await queryRunner.query(`ALTER TABLE "user_keypair" ADD "ed25519PublicKey" character varying(128)`);
        await queryRunner.query(`ALTER TABLE "user_keypair" ADD "ed25519PrivateKey" character varying(128)`);
        await queryRunner.query(`ALTER TABLE "user_publickey" DROP CONSTRAINT "FK_10c146e4b39b443ede016f6736d"`);
        await queryRunner.query(`ALTER TABLE "user_publickey" DROP CONSTRAINT "PK_10c146e4b39b443ede016f6736d"`);
        await queryRunner.query(`ALTER TABLE "user_publickey" ADD CONSTRAINT "PK_0db6a5fdb992323449edc8ee421" PRIMARY KEY ("userId", "keyId")`);
        await queryRunner.query(`ALTER TABLE "user_publickey" DROP CONSTRAINT "PK_0db6a5fdb992323449edc8ee421"`);
        await queryRunner.query(`ALTER TABLE "user_publickey" ADD CONSTRAINT "PK_171e64971c780ebd23fae140bba" PRIMARY KEY ("keyId")`);
        await queryRunner.query(`ALTER TABLE "user_publickey" ADD CONSTRAINT "UQ_10c146e4b39b443ede016f6736d" UNIQUE ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_10c146e4b39b443ede016f6736" ON "user_publickey" ("userId") `);
        await queryRunner.query(`ALTER TABLE "user_publickey" ADD CONSTRAINT "FK_10c146e4b39b443ede016f6736d" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_publickey" DROP CONSTRAINT "FK_10c146e4b39b443ede016f6736d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_10c146e4b39b443ede016f6736"`);
        await queryRunner.query(`ALTER TABLE "user_publickey" DROP CONSTRAINT "UQ_10c146e4b39b443ede016f6736d"`);
        await queryRunner.query(`ALTER TABLE "user_publickey" DROP CONSTRAINT "PK_171e64971c780ebd23fae140bba"`);
        await queryRunner.query(`ALTER TABLE "user_publickey" ADD CONSTRAINT "PK_0db6a5fdb992323449edc8ee421" PRIMARY KEY ("userId", "keyId")`);
        await queryRunner.query(`ALTER TABLE "user_publickey" DROP CONSTRAINT "PK_0db6a5fdb992323449edc8ee421"`);
        await queryRunner.query(`ALTER TABLE "user_publickey" ADD CONSTRAINT "PK_10c146e4b39b443ede016f6736d" PRIMARY KEY ("userId")`);
        await queryRunner.query(`ALTER TABLE "user_publickey" ADD CONSTRAINT "FK_10c146e4b39b443ede016f6736d" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "followersVisibility" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "followersVisibility" TYPE "public"."user_profile_followersVisibility_enum_old" USING "followersVisibility"::"text"::"public"."user_profile_followersVisibility_enum_old"`);
        await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "followersVisibility" SET DEFAULT 'public'`);
        await queryRunner.query(`ALTER TABLE "user_keypair" DROP COLUMN "ed25519PrivateKey"`);
        await queryRunner.query(`ALTER TABLE "user_keypair" DROP COLUMN "ed25519PublicKey"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_171e64971c780ebd23fae140bb" ON "user_publickey" ("keyId") `);
    }
}
