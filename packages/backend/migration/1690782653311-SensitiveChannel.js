export class SensitiveChannel1690782653311 {
	name = 'SensitiveChannel1690782653311'

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "channel"
			ADD "isSensitive" boolean NOT NULL DEFAULT false`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "isSensitive"`);
	}
}
