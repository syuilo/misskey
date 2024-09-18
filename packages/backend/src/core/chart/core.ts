/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * チャートエンジン
 *
 * Tests located in test/chart
 */

import * as nestedProperty from 'nested-property';
import { EntitySchema, LessThan, Between } from 'typeorm';
import { dateUTC, isTimeSame, isTimeBefore, subtractTime, addTime } from '@/misc/prelude/time.js';
import type Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';
import { MiRepository, miRepository } from '@/models/_.js';
import type { DataSource, ObjectLiteral, Repository } from 'typeorm';

const COLUMN_PREFIX = '___' as const;
const UNIQUE_TEMP_COLUMN_PREFIX = 'unique_temp___' as const;
const COLUMN_DELIMITER = '_' as const;

type Schema = Record<string, {
	uniqueIncrement?: boolean;

	intersection?: string[] | ReadonlyArray<string>;

	range?: 'big' | 'small' | 'medium';

	// previousな値を引き継ぐかどうか
	accumulate?: boolean;
}>;

type KeyToColumnName<T extends string> = T extends `${infer R1}.${infer R2}` ? `${R1}${typeof COLUMN_DELIMITER}${KeyToColumnName<R2>}` : T;

type Columns<S extends Schema> = {
	[K in keyof S as `${typeof COLUMN_PREFIX}${KeyToColumnName<string & K>}`]: number;
};

type TempColumnsForUnique<S extends Schema> = {
	[K in keyof S as `${typeof UNIQUE_TEMP_COLUMN_PREFIX}${KeyToColumnName<string & K>}`]: S[K]['uniqueIncrement'] extends true ? string[] : never;
};

type RawRecord<S extends Schema> = {
	id: number;

	/**
	 * 集計のグループ
	 */
	group?: string | null;

	/**
	 * 集計日時のUnixタイムスタンプ(秒)
	 */
	date: number;
} & TempColumnsForUnique<S> & Columns<S>;

const camelToSnake = (str: string): string => {
	return str.replace(/([A-Z])/g, s => '_' + s.charAt(0).toLowerCase());
};

const removeDuplicates = (array: any[]) => Array.from(new Set(array));

type Commit<S extends Schema> = {
	[K in keyof S]?: S[K]['uniqueIncrement'] extends true ? string[] : number;
};

export type KVs<S extends Schema> = {
	[K in keyof S]: number;
};

type ChartResult<T extends Schema> = {
	[P in keyof T]: number[];
};

type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer R) => any ? R : never;

type UnflattenSingleton<K extends string, V> = K extends `${infer A}.${infer B}`
	? { [_ in A]: UnflattenSingleton<B, V>; }
	: { [_ in K]: V; };

type Unflatten<T extends Record<string, any>> = UnionToIntersection<
	{
		[K in Extract<keyof T, string>]: UnflattenSingleton<K, T[K]>;
	}[Extract<keyof T, string>]
>;

type ToJsonSchema<S> = {
	type: 'object';
	properties: {
		[K in keyof S]: S[K] extends number[] ? { type: 'array'; items: { type: 'number'; }; } : ToJsonSchema<S[K]>;
	},
	required: (keyof S)[];
};

type MiAndOrmRepository<T extends ObjectLiteral> = Repository<T> & MiRepository<T>;

export function getJsonSchema<S extends Schema>(schema: S): ToJsonSchema<Unflatten<ChartResult<S>>> {
	const unflatten = (str: string, parent: Record<string, any>) => {
		const keys = str.split('.');
		const key = keys.shift();
		const nextKey = keys[0];

		if (key == null) return;

		if (parent.properties[key] == null) {
			parent.properties[key] = nextKey ? {
				type: 'object',
				properties: {},
				required: [],
			} : {
				type: 'array',
				items: {
					type: 'number',
				},
			};
		}

		if (nextKey) unflatten(keys.join('.'), parent.properties[key] as Record<string, any>);
	};

	const jsonSchema = {
		type: 'object',
		properties: {} as Record<string, unknown>,
		required: [],
	};

	for (const k in schema) {
		unflatten(k, jsonSchema);
	}

	return jsonSchema as ToJsonSchema<Unflatten<ChartResult<S>>>;
}

/**
 * 様々なチャートの管理を司るクラス
 */
// eslint-disable-next-line import/no-default-export
export default abstract class Chart<T extends Schema> {
	private logger: Logger;

	public schema: T;

	private name: string;
	private buffer: {
		diff: Commit<T>;
		group: string | null;
	}[] = [];
	// ↓にしたいけどfindOneとかで型エラーになる
	//private repositoryForHour: MiAndOrmRepository<RawRecord<T>>;
	//private repositoryForDay: MiAndOrmRepository<RawRecord<T>>;
	protected repositoryForHour: MiAndOrmRepository<{ id: number; group?: string | null; date: number; }>;
	protected repositoryForDay: MiAndOrmRepository<{ id: number; group?: string | null; date: number; }>;
	/**
	 * 1日に一回程度実行されれば良いような計算処理を入れる(主にCASCADE削除などアプリケーション側で感知できない変動によるズレの修正用)
	 */
	protected abstract tickMajor(group: string | null): Promise<Partial<KVs<T>>>;

	/**
	 * 少なくとも最小スパン内に1回は実行されて欲しい計算処理を入れる
	 */
	protected abstract tickMinor(group: string | null): Promise<Partial<KVs<T>>>;

	private static convertSchemaToColumnDefinitions(schema: Schema): Record<string, { type: string; array?: boolean; default?: any; }> {
		const columns = {} as Record<string, { type: string; array?: boolean; default?: any; }>;
		for (const [k, v] of Object.entries(schema)) {
			const name = k.replaceAll('.', COLUMN_DELIMITER);
			const type = v.range === 'big' ? 'bigint' : v.range === 'small' ? 'smallint' : 'integer';
			if (v.uniqueIncrement) {
				columns[UNIQUE_TEMP_COLUMN_PREFIX + name] = {
					type: 'varchar',
					array: true,
					default: '{}',
				};
				columns[COLUMN_PREFIX + name] = {
					type,
					default: 0,
				};
			} else {
				columns[COLUMN_PREFIX + name] = {
					type,
					default: 0,
				};
			}
		}
		return columns;
	}

	protected static dateToTimestamp(x: Date): number {
		return Math.floor(x.getTime() / 1000);
	}

	protected static parseDate(date: Date): [number, number, number, number, number, number, number] {
		const y = date.getUTCFullYear();
		const m = date.getUTCMonth();
		const d = date.getUTCDate();
		const h = date.getUTCHours();
		const _m = date.getUTCMinutes();
		const _s = date.getUTCSeconds();
		const _ms = date.getUTCMilliseconds();

		return [y, m, d, h, _m, _s, _ms];
	}

	protected static getCurrentDate() {
		return Chart.parseDate(new Date());
	}

	public static schemaToEntity(name: string, schema: Schema, grouped = false): {
		hour: EntitySchema,
		day: EntitySchema,
	} {
		const createEntity = (span: 'hour' | 'day'): EntitySchema => new EntitySchema({
			name:
				span === 'hour' ? `ChartX${name}` :
				span === 'day' ? `ChartDayX${name}` :
				new Error('not happen') as never,
			tableName:
				span === 'hour' ? `__chart__${camelToSnake(name)}` :
				span === 'day' ? `__chart_day__${camelToSnake(name)}` :
				new Error('not happen') as never,
			columns: {
				id: {
					type: 'integer',
					primary: true,
					generated: true,
				},
				date: {
					type: 'integer',
				},
				...(grouped ? {
					group: {
						type: 'varchar',
						length: 128,
					},
				} : {}),
				...Chart.convertSchemaToColumnDefinitions(schema),
			},
			indices: [{
				columns: grouped ? ['date', 'group'] : ['date'],
				unique: true,
			}],
			uniques: [{
				columns: grouped ? ['date', 'group'] : ['date'],
			}],
			relations: {
				/* TODO
					group: {
						target: () => Foo,
						type: 'many-to-one',
						onDelete: 'CASCADE',
					},
				*/
			},
		});

		return {
			hour: createEntity('hour'),
			day: createEntity('day'),
		};
	}

	private lock: (key: string) => Promise<() => void>;

	constructor(
		db: DataSource,
		lock: (key: string) => Promise<() => void>,
		logger: Logger,
		name: string,
		schema: T,
		grouped = false,
	) {
		this.name = name;
		this.schema = schema;
		this.lock = lock;
		this.logger = logger;

		const { hour, day } = Chart.schemaToEntity(name, schema, grouped);
		this.repositoryForHour = db.getRepository<{ id: number; group?: string | null; date: number; }>(hour).extend(miRepository);
		this.repositoryForDay = db.getRepository<{ id: number; group?: string | null; date: number; }>(day).extend(miRepository);
	}

	@bindThis
	private convertRawRecord(x: RawRecord<T>): KVs<T> {
		const kvs = {} as Record<string, number>;
		for (const k of Object.keys(x).filter((k) => k.startsWith(COLUMN_PREFIX)) as (keyof Columns<T>)[]) {
			kvs[(k as string).substring(COLUMN_PREFIX.length).split(COLUMN_DELIMITER).join('.')] = x[k] as unknown as number;
		}
		return kvs as KVs<T>;
	}

	@bindThis
	private getNewLog(latest: KVs<T> | null): KVs<T> {
		const log = {} as Record<keyof T, number>;
		for (const [k, v] of Object.entries(this.schema) as ([keyof typeof this['schema'], this['schema'][string]])[]) {
			if (v.accumulate && latest) {
				log[k] = latest[k];
			} else {
				log[k] = 0;
			}
		}
		return log as KVs<T>;
	}

	@bindThis
	private getLatestLog(group: string | null, span: 'hour' | 'day'): Promise<RawRecord<T> | null> {
		const repository =
			span === 'hour' ? this.repositoryForHour :
			span === 'day' ? this.repositoryForDay :
			new Error('not happen') as never;

		return repository.findOne({
			where: group ? {
				group: group,
			} : {},
			order: {
				date: -1,
			},
		}).then(x => x ?? null) as Promise<RawRecord<T> | null>;
	}

	/**
	 * 現在(=今のHour or Day)のログをデータベースから探して、あればそれを返し、なければ作成して返します。
	 */
	@bindThis
	private async claimCurrentLog(group: string | null, span: 'hour' | 'day'): Promise<RawRecord<T>> {
		const [y, m, d, h] = Chart.getCurrentDate();

		const current = dateUTC(
			span === 'hour' ? [y, m, d, h] :
			span === 'day' ? [y, m, d] :
			new Error('not happen') as never);

		const repository =
			span === 'hour' ? this.repositoryForHour :
			span === 'day' ? this.repositoryForDay :
			new Error('not happen') as never;

		// 現在(=今のHour or Day)のログ
		const currentLog = await repository.findOneBy({
			date: Chart.dateToTimestamp(current),
			...(group ? { group: group } : {}),
		}) as RawRecord<T> | undefined;

		// ログがあればそれを返して終了
		if (currentLog != null) {
			return currentLog;
		}

		let log: RawRecord<T>;
		let data: KVs<T>;

		// 集計期間が変わってから、初めてのチャート更新なら
		// 最も最近のログを持ってくる
		// * 例えば集計期間が「日」である場合で考えると、
		// * 昨日何もチャートを更新するような出来事がなかった場合は、
		// * ログがそもそも作られずドキュメントが存在しないということがあり得るため、
		// * 「昨日の」と決め打ちせずに「もっとも最近の」とします
		const latest = await this.getLatestLog(group, span);

		if (latest != null) {
			// 空ログデータを作成
			data = this.getNewLog(this.convertRawRecord(latest));
		} else {
			// ログが存在しなかったら
			// (Misskeyインスタンスを建てて初めてのチャート更新時など)

			// 初期ログデータを作成
			data = this.getNewLog(null);

			this.logger.info(`${this.name + (group ? `:${group}` : '')}(${span}): Initial commit created`);
		}

		const date = Chart.dateToTimestamp(current);
		const lockKey = group ? `${this.name}:${date}:${span}:${group}` : `${this.name}:${date}:${span}`;

		const unlock = await this.lock(lockKey);
		try {
			// ロック内でもう1回チェックする
			const currentLog = await repository.findOneBy({
				date: date,
				...(group ? { group: group } : {}),
			}) as RawRecord<T> | undefined;

			// ログがあればそれを返して終了
			if (currentLog != null) return currentLog;

			const columns = {} as Record<string, number | unknown[]>;
			for (const [k, v] of Object.entries(data)) {
				const name = k.replaceAll('.', COLUMN_DELIMITER);
				columns[COLUMN_PREFIX + name] = v;
			}

			// 新規ログ挿入
			log = await repository.insertOne({
				date: date,
				...(group ? { group: group } : {}),
				...columns,
			}) as RawRecord<T>;

			this.logger.info(`${this.name + (group ? `:${group}` : '')}(${span}): New commit created`);

			return log;
		} finally {
			unlock();
		}
	}

	protected commit(diff: Commit<T>, group: string | null = null): void {
		for (const [k, v] of Object.entries(diff)) {
			if (v == null || v === 0 || (Array.isArray(v) && v.length === 0)) delete diff[k];
		}
		this.buffer.push({
			diff, group,
		});
	}

	@bindThis
	public async save(): Promise<void> {
		if (this.buffer.length === 0) {
			this.logger.info(`${this.name}: Write skipped`);
			return;
		}

		// TODO: 前の時間のログがbufferにあった場合のハンドリング
		// 例えば、save が20分ごとに行われるとして、前回行われたのは 01:50 だったとする。
		// 次に save が行われるのは 02:10 ということになるが、もし 01:55 に新規ログが buffer に追加されたとすると、
		// そのログは本来は 01:00~ のログとしてDBに保存されて欲しいのに、02:00~ のログ扱いになってしまう。
		// これを回避するための実装は複雑になりそうなため、一旦保留。

		const update = async (logHour: RawRecord<T>, logDay: RawRecord<T>): Promise<void> => {
			const finalDiffs = {} as Record<string, number | string[]>;

			for (const diff of this.buffer.filter(q => q.group == null || (q.group === logHour.group)).map(q => q.diff)) {
				for (const [k, v] of Object.entries(diff)) {
					if (finalDiffs[k] == null) {
						finalDiffs[k] = v;
					} else {
						if (typeof finalDiffs[k] === 'number') {
							(finalDiffs[k] as number) += v as number;
						} else {
							(finalDiffs[k] as string[]) = (finalDiffs[k] as string[]).concat(v);
						}
					}
				}
			}

			const queryForHour: Record<keyof RawRecord<T>, number | (() => string)> = {} as any;
			const queryForDay: Record<keyof RawRecord<T>, number | (() => string)> = {} as any;
			for (const [k, v] of Object.entries(finalDiffs)) {
				if (typeof v === 'number') {
					const name = COLUMN_PREFIX + k.replaceAll('.', COLUMN_DELIMITER) as string & keyof Columns<T>;
					if (v > 0) queryForHour[name] = () => `"${name}" + ${v}`;
					if (v < 0) queryForHour[name] = () => `"${name}" - ${Math.abs(v)}`;
					if (v > 0) queryForDay[name] = () => `"${name}" + ${v}`;
					if (v < 0) queryForDay[name] = () => `"${name}" - ${Math.abs(v)}`;
				} else if (Array.isArray(v) && v.length > 0) { // ユニークインクリメント
					const tempColumnName = UNIQUE_TEMP_COLUMN_PREFIX + k.replaceAll('.', COLUMN_DELIMITER) as string & keyof TempColumnsForUnique<T>;
					// TODO: item をSQLエスケープ
					const itemsForHour = v.filter(item => !(logHour[tempColumnName] as unknown as string[]).includes(item)).map(item => `"${item}"`);
					const itemsForDay = v.filter(item => !(logDay[tempColumnName] as unknown as string[]).includes(item)).map(item => `"${item}"`);
					if (itemsForHour.length > 0) queryForHour[tempColumnName] = () => `array_cat("${tempColumnName}", '{${itemsForHour.join(',')}}'::varchar[])`;
					if (itemsForDay.length > 0) queryForDay[tempColumnName] = () => `array_cat("${tempColumnName}", '{${itemsForDay.join(',')}}'::varchar[])`;
				}
			}

			// bake cardinality
			for (const [k, v] of Object.entries(finalDiffs)) {
				if (this.schema[k].uniqueIncrement) {
					const name = COLUMN_PREFIX + k.replaceAll('.', COLUMN_DELIMITER) as keyof Columns<T>;
					const tempColumnName = UNIQUE_TEMP_COLUMN_PREFIX + k.replaceAll('.', COLUMN_DELIMITER) as keyof TempColumnsForUnique<T>;
					const cardinalityOfHour = new Set([...(v as string[]), ...(logHour[tempColumnName] as unknown as string[])]).size;
					const cardinalityOfDay = new Set([...(v as string[]), ...(logDay[tempColumnName] as unknown as string[])]).size;
					queryForHour[name] = cardinalityOfHour;
					queryForDay[name] = cardinalityOfDay;
				}
			}

			// compute intersection
			// TODO: intersectionに指定されたカラムがintersectionだった場合の対応
			for (const [k, v] of Object.entries(this.schema)) {
				const intersection = v.intersection;
				if (intersection) {
					const name = COLUMN_PREFIX + k.replaceAll('.', COLUMN_DELIMITER) as keyof Columns<T>;
					const firstKey = intersection[0];
					const firstTempColumnName = UNIQUE_TEMP_COLUMN_PREFIX + firstKey.replaceAll('.', COLUMN_DELIMITER) as keyof TempColumnsForUnique<T>;
					const firstValues = finalDiffs[firstKey] as string[] | undefined;
					const currentValuesForHour = new Set([...(firstValues ?? []), ...(logHour[firstTempColumnName] as unknown as string[])]);
					const currentValuesForDay = new Set([...(firstValues ?? []), ...(logDay[firstTempColumnName] as unknown as string[])]);
					for (let i = 1; i < intersection.length; i++) {
						const targetKey = intersection[i];
						const targetTempColumnName = UNIQUE_TEMP_COLUMN_PREFIX + targetKey.replaceAll('.', COLUMN_DELIMITER) as keyof TempColumnsForUnique<T>;
						const targetValues = finalDiffs[targetKey] as string[] | undefined;
						const targetValuesForHour = new Set([...(targetValues ?? []), ...(logHour[targetTempColumnName] as unknown as string[])]);
						const targetValuesForDay = new Set([...(targetValues ?? []), ...(logDay[targetTempColumnName] as unknown as string[])]);
						currentValuesForHour.forEach(v => {
							if (!targetValuesForHour.has(v)) currentValuesForHour.delete(v);
						});
						currentValuesForDay.forEach(v => {
							if (!targetValuesForDay.has(v)) currentValuesForDay.delete(v);
						});
					}
					queryForHour[name] = currentValuesForHour.size;
					queryForDay[name] = currentValuesForDay.size;
				}
			}

			// ログ更新
			await Promise.all([
				this.repositoryForHour.createQueryBuilder()
					.update()
					.set(queryForHour as any)
					.where('id = :id', { id: logHour.id })
					.execute(),
				this.repositoryForDay.createQueryBuilder()
					.update()
					.set(queryForDay as any)
					.where('id = :id', { id: logDay.id })
					.execute(),
			]);

			this.logger.info(`${this.name + (logHour.group ? `:${logHour.group}` : '')}: Updated`);

			// TODO: この一連の処理が始まった後に新たにbufferに入ったものは消さないようにする
			this.buffer = this.buffer.filter(q => q.group != null && (q.group !== logHour.group));
		};

		const groups = removeDuplicates(this.buffer.map(log => log.group));

		await Promise.all(
			groups.map(group =>
				Promise.all([
					this.claimCurrentLog(group, 'hour'),
					this.claimCurrentLog(group, 'day'),
				]).then(([logHour, logDay]) =>
					update(logHour, logDay))));
	}

	@bindThis
	public async tick(major: boolean, group: string | null = null): Promise<void> {
		const data = major ? await this.tickMajor(group) : await this.tickMinor(group);

		const columns = {} as Record<keyof Columns<T>, number>;
		for (const [k, v] of Object.entries(data) as ([keyof typeof data, number])[]) {
			const name = COLUMN_PREFIX + (k as string).replaceAll('.', COLUMN_DELIMITER) as keyof Columns<T>;
			columns[name] = v;
		}

		if (Object.keys(columns).length === 0) {
			return;
		}

		const update = async (logHour: RawRecord<T>, logDay: RawRecord<T>): Promise<void> => {
			await Promise.all([
				this.repositoryForHour.createQueryBuilder()
					.update()
					.set(columns)
					.where('id = :id', { id: logHour.id })
					.execute(),
				this.repositoryForDay.createQueryBuilder()
					.update()
					.set(columns)
					.where('id = :id', { id: logDay.id })
					.execute(),
			]);
		};

		return Promise.all([
			this.claimCurrentLog(group, 'hour'),
			this.claimCurrentLog(group, 'day'),
		]).then(([logHour, logDay]) =>
			update(logHour, logDay));
	}

	@bindThis
	public resync(group: string | null = null): Promise<void> {
		return this.tick(true, group);
	}

	@bindThis
	public async clean(): Promise<void> {
		const current = dateUTC(Chart.getCurrentDate());

		// 一日以上前かつ三日以内
		const gt = Chart.dateToTimestamp(current) - (60 * 60 * 24 * 3);
		const lt = Chart.dateToTimestamp(current) - (60 * 60 * 24);

		const columns = {} as Record<keyof TempColumnsForUnique<T>, []>;
		for (const [k, v] of Object.entries(this.schema)) {
			if (v.uniqueIncrement) {
				const name = UNIQUE_TEMP_COLUMN_PREFIX + k.replaceAll('.', COLUMN_DELIMITER) as keyof TempColumnsForUnique<T>;
				columns[name] = [];
			}
		}

		if (Object.keys(columns).length === 0) {
			return;
		}

		await Promise.all([
			this.repositoryForHour.createQueryBuilder()
				.update()
				.set(columns)
				.where('date > :gt', { gt })
				.andWhere('date < :lt', { lt })
				.execute(),
			this.repositoryForDay.createQueryBuilder()
				.update()
				.set(columns)
				.where('date > :gt', { gt })
				.andWhere('date < :lt', { lt })
				.execute(),
		]);
	}

	@bindThis
	public async getChartRaw(span: 'hour' | 'day', amount: number, cursor: Date | null, group: string | null = null): Promise<ChartResult<T>> {
		const [y, m, d, h, _m, _s, _ms] = cursor ? Chart.parseDate(subtractTime(addTime(cursor, 1, span), 1)) : Chart.getCurrentDate();
		const [y2, m2, d2, h2] = cursor ? Chart.parseDate(addTime(cursor, 1, span)) : [] as never;

		const lt = dateUTC([y, m, d, h, _m, _s, _ms]);

		const gt =
			span === 'day' ? subtractTime(cursor ? dateUTC([y2, m2, d2, 0]) : dateUTC([y, m, d, 0]), amount - 1, 'day') :
			span === 'hour' ? subtractTime(cursor ? dateUTC([y2, m2, d2, h2]) : dateUTC([y, m, d, h]), amount - 1, 'hour') :
			new Error('not happen') as never;

		const repository =
			span === 'hour' ? this.repositoryForHour :
			span === 'day' ? this.repositoryForDay :
			new Error('not happen') as never;

		// ログ取得
		let logs = await repository.find({
			where: {
				date: Between(Chart.dateToTimestamp(gt), Chart.dateToTimestamp(lt)),
				...(group ? { group: group } : {}),
			},
			order: {
				date: -1,
			},
		}) as RawRecord<T>[];

		// 要求された範囲にログがひとつもなかったら
		if (logs.length === 0) {
			// もっとも新しいログを持ってくる
			// (すくなくともひとつログが無いと補間できないため)
			const recentLog = await repository.findOne({
				where: group ? {
					group: group,
				} : {},
				order: {
					date: -1,
				},
			}) as RawRecord<T> | undefined;

			if (recentLog) {
				logs = [recentLog];
			}

		// 要求された範囲の最も古い箇所に位置するログが存在しなかったら
		} else if (!isTimeSame(new Date(logs.at(-1)!.date * 1000), gt)) {
			// 要求された範囲の最も古い箇所時点での最も新しいログを持ってきて末尾に追加する
			// (補間できないため)
			const outdatedLog = await repository.findOne({
				where: {
					date: LessThan(Chart.dateToTimestamp(gt)),
					...(group ? { group: group } : {}),
				},
				order: {
					date: -1,
				},
			}) as RawRecord<T> | undefined;

			if (outdatedLog) {
				logs.push(outdatedLog);
			}
		}

		const chart: KVs<T>[] = [];

		for (let i = (amount - 1); i >= 0; i--) {
			const current =
				span === 'hour' ? subtractTime(dateUTC([y, m, d, h]), i, 'hour') :
				span === 'day' ? subtractTime(dateUTC([y, m, d]), i, 'day') :
				new Error('not happen') as never;

			const log = logs.find(l => isTimeSame(new Date(l.date * 1000), current));

			if (log) {
				chart.unshift(this.convertRawRecord(log));
			} else {
				// 補間
				const latest = logs.find(l => isTimeBefore(new Date(l.date * 1000), current));
				const data = latest ? this.convertRawRecord(latest) : null;
				chart.unshift(this.getNewLog(data));
			}
		}

		const res = {} as ChartResult<T>;

		/**
		 * [{ foo: 1, bar: 5 }, { foo: 2, bar: 6 }, { foo: 3, bar: 7 }]
		 * を
		 * { foo: [1, 2, 3], bar: [5, 6, 7] }
		 * にする
		 */
		for (const record of chart) {
			for (const [k, v] of Object.entries(record) as ([keyof typeof record, number])[]) {
				if (res[k]) {
					res[k].push(v);
				} else {
					res[k] = [v];
				}
			}
		}

		return res;
	}

	@bindThis
	public async getChart(span: 'hour' | 'day', amount: number, cursor: Date | null, group: string | null = null): Promise<Unflatten<ChartResult<T>>> {
		const result = await this.getChartRaw(span, amount, cursor, group);
		const object = {};
		for (const [k, v] of Object.entries(result)) {
			nestedProperty.set(object, k, v);
		}
		return object as Unflatten<ChartResult<T>>;
	}
}
