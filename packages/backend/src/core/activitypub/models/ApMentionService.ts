import { Inject, Injectable } from '@/di-decorators.js';
import promiseLimit from 'promise-limit';
import { DI } from '@/di-symbols.js';
import type { User } from '@/models/index.js';
import type { Config } from '@/config.js';
import { toArray, unique } from '@/misc/prelude/array.js';
import { bindThis } from '@/decorators.js';
import { isMention } from '../type.js';
import { ApResolverService, Resolver } from '../ApResolverService.js';
import { ApPersonService } from './ApPersonService.js';
import type { IObject, IApMention } from '../type.js';

@Injectable()
export class ApMentionService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.ApResolverService)
		private apResolverService: ApResolverService,

		@Inject(DI.ApPersonService)
		private apPersonService: ApPersonService,
	) {
	}

	@bindThis
	public async extractApMentions(tags: IObject | IObject[] | null | undefined, resolver: Resolver) {
		const hrefs = unique(this.extractApMentionObjects(tags).map(x => x.href as string));

		const limit = promiseLimit<User | null>(2);
		const mentionedUsers = (await Promise.all(
			hrefs.map(x => limit(() => this.apPersonService.resolvePerson(x, resolver).catch(() => null))),
		)).filter((x): x is User => x != null);
	
		return mentionedUsers;
	}
	
	@bindThis
	public extractApMentionObjects(tags: IObject | IObject[] | null | undefined): IApMention[] {
		if (tags == null) return [];
		return toArray(tags).filter(isMention);
	}
}
