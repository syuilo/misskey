import type { Schema } from '@/misc/schema.js';
import { RolePolicies } from '@/core/RoleService.js';

export interface IEndpointMeta {
	readonly stability?: 'deprecated' | 'experimental' | 'stable';

	readonly tags?: ReadonlyArray<string>;

	readonly errors?: {
		readonly [key: string]: {
			readonly message: string;
			readonly code: string;
			readonly id: string;
		};
	};

	readonly res?: Schema;

	/**
	 * このエンドポイントにリクエストするのにユーザー情報が必須か否か
	 * 省略した場合は false として解釈されます。
	 */
	readonly requireCredential?: boolean;

	/**
	 * isModeratorなロールを必要とするか
	 */
	readonly requireModerator?: boolean;

	/**
	 * isAdministratorなロールを必要とするか
	 */
	readonly requireAdmin?: boolean;

	readonly requireRolePolicy?: keyof RolePolicies;

	/**
	 * エンドポイントのリミテーションに関するやつ
	 * 省略した場合はリミテーションは無いものとして解釈されます。
	 */
	readonly limit?: {

		/**
		 * 複数のエンドポイントでリミットを共有したい場合に指定するキー
		 */
		readonly key?: string;

		/**
		 * リミットを適用する期間(ms)
		 * このプロパティを設定する場合、max プロパティも設定する必要があります。
		 */
		readonly duration?: number;

		/**
		 * durationで指定した期間内にいくつまでリクエストできるのか
		 * このプロパティを設定する場合、duration プロパティも設定する必要があります。
		 */
		readonly max?: number;

		/**
		 * 最低でもどれくらいの間隔を開けてリクエストしなければならないか(ms)
		 */
		readonly minInterval?: number;
	};

	/**
	 * ファイルの添付を必要とするか否か
	 * 省略した場合は false として解釈されます。
	 */
	readonly requireFile?: boolean;

	/**
	 * サードパーティアプリからはリクエストすることができないか否か
	 * 省略した場合は false として解釈されます。
	 */
	readonly secure?: boolean;

	/**
	 * エンドポイントの種類
	 * パーミッションの実現に利用されます。
	 */
	readonly kind?: string;

	readonly description?: string;

	/**
	 * GETでのリクエストを許容するか否か
	 */
	readonly allowGet?: boolean;

	/**
	 * 正常応答をキャッシュ (Cache-Control: public) する秒数
	 */
	readonly cacheSec?: number;
}

export interface IEndpoint {
	name: string;
	meta: IEndpointMeta;
	params: Schema;
}
