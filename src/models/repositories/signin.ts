import { EntityRepository, Repository } from 'typeorm';
import { Signin } from '@/models/entities/signin';

@EntityRepository(Signin)
export class SigninRepository extends Repository<Signin> {
	public async pack(
		src: Signin,
	) {
		return src;
	}
}
