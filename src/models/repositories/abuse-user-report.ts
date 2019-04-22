import { EntityRepository, Repository } from 'typeorm';
import { Users } from '..';
import { AbuseUserReport } from '../entities/abuse-user-report';
import { ensure } from '../../prelude/ensure';

@EntityRepository(AbuseUserReport)
export class AbuseUserReportRepository extends Repository<AbuseUserReport> {
	public packMany(
		reports: any[],
	) {
		return Promise.all(reports.map(x => this.pack(x)));
	}

	public async pack(
		src: AbuseUserReport['id'] | AbuseUserReport,
	) {
		const report = typeof src === 'object' ? src : await this.findOne(src).then(ensure);

		return await rap({
			id: report.id,
			createdAt: report.createdAt,
			reporterId: report.reporterId,
			userId: report.userId,
			reporter: Users.pack(report.reporter || report.reporterId, null, {
				detail: true
			}),
			user: Users.pack(report.user || report.userId, null, {
				detail: true
			}),
		});
	}
}
