import { Inject, Injectable } from '@nestjs/common';
import { DI_SYMBOLS } from '@/di-symbols.js';
import type { Signins , Users } from '@/models/index.js';
import { Config } from '@/config/types.js';
import { IdService } from '@/services/IdService.js';
import type { ILocalUser } from '@/models/entities/user.js';
import { GlobalEventService } from '@/services/GlobalEventService.js';
import type Koa from 'koa';

@Injectable()
export class SigninService {
	constructor(
		@Inject(DI_SYMBOLS.config)
		private config: Config,

		@Inject('signinsRepository')
		private signinsRepository: typeof Signins,

		private idService: IdService,
		private globalEventService: GlobalEventService,
	) {
	}

	public signin(ctx: Koa.Context, user: ILocalUser, redirect = false) {
		if (redirect) {
			//#region Cookie
			ctx.cookies.set('igi', user.token!, {
				path: '/',
				// SEE: https://github.com/koajs/koa/issues/974
				// When using a SSL proxy it should be configured to add the "X-Forwarded-Proto: https" header
				secure: this.config.url.startsWith('https'),
				httpOnly: false,
			});
			//#endregion
	
			ctx.redirect(this.config.url);
		} else {
			ctx.body = {
				id: user.id,
				i: user.token,
			};
			ctx.status = 200;
		}
	
		(async () => {
			// Append signin history
			const record = await this.signinsRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				userId: user.id,
				ip: ctx.ip,
				headers: ctx.headers,
				success: true,
			}).then(x => this.signinsRepository.findOneByOrFail(x.identifiers[0]));
	
			// Publish signin event
			this.globalEventService.publishMainStream(user.id, 'signin', await this.signinsRepository.pack(record));
		})();
	}
}

