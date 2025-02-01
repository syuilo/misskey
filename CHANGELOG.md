## 2025.2.0

### General
-

### Client
- Fix: 一部環境でセンシティブなファイルを含むノートの非表示が効かない問題 
- Fix: データセーバー有効時にもユーザーページの「ファイル」タブで画像が読み込まれてしまう問題を修正

### Server
- Fix: 個別お知らせページのmetaタグ出力の条件が間違っていたのを修正


## 2025.1.0

### Note
- [重要] ノート検索プロバイダの追加に伴い、configファイル（default.ymlなど）の構成が少し変わります.
  - 新しい設定項目"fulltextSearch.provider"が追加されました. sqlLike, sqlPgroonga, meilisearchのいずれかを設定出来ます.
  - すでにMeilisearchをお使いの場合、 **"fulltextSearch.provider"を"meilisearch"に設定する必要** があります.
  - 詳細は #14730 および `.config/example.yml` または `.config/docker_example.yml`の'Fulltext search configuration'をご参照願います.
- 【開発者向け】従来の開発モードでHMRが機能しない問題が修正されたため、バックエンド・フロントエンド分離型の開発モードが削除されました。開発環境においてconfigの変更が必要となる可能性があります。

### General
- Feat: カスタム絵文字管理画面をリニューアル #10996
	* β版として公開のため、旧画面も引き続き利用可能です

### Client
- Enhance: PC画面でチャンネルが複数列で表示されるように  
  (Cherry-picked from https://github.com/Otaku-Social/maniakey/pull/13)
- Enhance: 照会に失敗した場合、その理由を表示するように
- Enhance: ワードミュートで検知されたワードを表示できるように
- Enhance: リモートのノートのリンクをコピーできるように
- Enhance: 連合がホワイトリスト化・無効化されているサーバー向けのデザイン修正
- Enhance: AiScriptのセーブデータを明示的に削除する関数`Mk:remove`を追加
- Enhance: ノートの添付ファイルを一覧で遡れる「ファイル」タブを追加  
  (Based on https://github.com/Otaku-Social/maniakey/pull/14)
- Enhance: AiScriptの拡張API関数において引数の型チェックをより厳格に
- Enhance: クエリパラメータでuiを一時的に変更できるように #15240
- Enhance: リモート絵文字のインポート時に詳細を確認できるように #15336
- Fix: 画面サイズが変わった際にナビゲーションバーが自動で折りたたまれない問題を修正
- Fix: サーバー情報メニューに区切り線が不足していたのを修正
- Fix: ノートがログインしているユーザーしか見れない場合にログインダイアログを閉じるとその後の動線がなくなる問題を修正
- Fix: 公開範囲がホームのノートの埋め込みウィジェットが読み込まれない問題を修正  
  (Cherry-picked from https://activitypub.software/TransFem-org/Sharkey/-/merge_requests/803)
- Fix: 絵文字管理画面で一部の絵文字が表示されない問題を修正
- Fix: プラグイン `register_note_view_interruptor` でノートのサーバー情報の書き換えができない問題を修正
- Fix: Botプロテクションの設定変更時は実際に検証を通過しないと保存できないように( #15137 )
- Fix: ノート検索が使用できない場合でもチャンネルのノート検索欄がでていた問題を修正
- Fix: `Ui:C:select`で値の変更が画面に反映されない問題を修正
- Fix: MiAuth認可画面で、認可処理に失敗した場合でもコールバックURLに遷移してしまう問題を修正  
  (Cherry-picked from https://github.com/TeamNijimiss/misskey/commit/800359623e41a662551d774de15b0437b6849bb4)
- Fix: ノート作成画面でファイルの添付可能個数を超えてもノートボタンが押せていた問題を修正
- Fix: 「アカウントを管理」画面で、ユーザー情報の取得に失敗したアカウント（削除されたアカウントなど）が表示されない問題を修正
- Fix: MacOSでChrome系ブラウザを使用している場合に、Misskeyを閉じた際に他のタブのオーディオ機能と干渉する問題を修正
- Fix: 言語データのキャッシュ状況によっては、埋め込みウィジェットが正しく起動しない問題を修正
- Fix: 「削除して編集」でノートの引用を解除出来なかった問題を修正( #14476 )
- Fix: RSSウィジェットが正しく表示されない問題を修正  
  (Cherry-picked from https://activitypub.software/TransFem-org/Sharkey/-/merge_requests/857)
- Fix: ワードミュートの保存失敗時にAPIエラーが握りつぶされる事があるのを修正
- Fix: アンケートでリモートの絵文字が正しく描画できない問題の修正
  (Cherry-picked from https://github.com/yojo-art/cherrypick/pull/153)
- Fix: 非ログイン時のサーバー概要画面のメニューボタンが押せないことがあるのを修正  
  (Cherry-picked from https://activitypub.software/TransFem-org/Sharkey/-/merge_requests/656)
- Fix: URLにはじめから`#pswp`が含まれている場合に画像ビューワーがブラウザの戻るボタンで閉じられない問題を修正
- Fix: ロール作成画面で設定できるアイコンデコレーションの最大取付個数を16に制限
- Fix: Firefox Nightlyなどでアイコンが読み込めない問題を修正

### Server
- Enhance: pg_bigmが利用できるよう、ノートの検索をILIKE演算子でなくLIKE演算子でLOWER()をかけたテキストに対して行うように
- Enhance: ノート検索の選択肢としてpgroongaに対応 ( #14730 )
- Enhance: チャート更新時にDBに同時接続しないように  
  (Cherry-picked from https://activitypub.software/TransFem-org/Sharkey/-/merge_requests/830)
- Enhance: config(default.yml)からSQLログ全文を出力するか否かを設定可能に ( #15266 )
- Fix: ユーザーのプロフィール画面をアドレス入力などで直接表示した際に概要タブの描画に失敗する問題の修正( #15032 )
- Fix: 起動前の疎通チェックが機能しなくなっていた問題を修正  
  (Cherry-picked from https://activitypub.software/TransFem-org/Sharkey/-/merge_requests/737)
- Fix: ノートの閲覧にログイン必須にしてもFeedでノートが表示されてしまう問題を修正
- Fix: 絵文字の連合でライセンス欄を相互にやり取りするように ( #10859, #14109 )
- Fix: ロックダウンされた期間指定のノートがStreaming経由でLTLに出現するのを修正 ( #15200 )
- Fix: disableClustering設定時の初期化ロジックを調整( #15223 )
- Fix: URLとURIが異なるエンティティの照会に失敗する問題を修正( #15039 )
- Fix: ActivityPubリクエストかどうかの判定が正しくない問題を修正  
  (Cherry-picked from https://github.com/MisskeyIO/misskey/pull/869)
- Fix: `/api/pages/update`にて`name`を指定せずにリクエストするとエラーが発生する問題を修正
- Fix: AIセンシティブ判定が arm64 環境で動作しない問題を修正
- Fix: 非Misskey系のソフトウェアからHTML`<ruby>`タグを含むノートを受信した場合、MFMの読み仮名（ルビ）文法に変換して表示
- Fix: 連合OFFで投稿されたノートに対する冗長な処理を抑止 ( #15018 )
- Fix: `/api.json`のレスポンスが2回目のリクエスト以降おかしくなる問題を修正

### Misskey.js
- Feat: allow setting `binaryType` of WebSocket connection

## 2024.11.0

### Note
- Node.js 20.xは非推奨になりました。Node.js 22.x (LTS)の利用を推奨します。
  - なお、Node.js 23.xは対応していません。
- DockerのNode.jsが22.11.0に更新されました

### General
- Feat: コンテンツの表示にログインを必須にできるように
- Feat: 過去のノートを非公開化/フォロワーのみ表示可能にできるように
- Enhance: 依存関係の更新
- Enhance: l10nの更新
- Fix: お知らせ作成時に画像URL入力欄を空欄に変更できないのを修正 ( #14976 )

### Client
- Enhance: Bull DashboardでRelationship Queueの状態も確認できるように  
  (Cherry-picked from https://github.com/MisskeyIO/misskey/pull/751)
- Enhance: ドライブでソートができるように
- Enhance: アイコンデコレーション管理画面の改善
- Enhance: 「単なるラッキー」の取得条件を変更
- Enhance: 投稿フォームでEscキーを押したときIME入力中ならフォームを閉じないように（ #10866 ）  
- Enhance: MiAuth, OAuthの認可画面の改善
  - どのアカウントで認証しようとしているのかがわかるように
  - 認証するアカウントを切り替えられるように
- Enhance: Self-XSS防止用の警告を追加
- Enhance: カタルーニャ語 (ca-ES) に対応
- Enhance: 個別お知らせページではMetaタグを出力するように
- Enhance: ノート詳細画面にロールのバッジを表示
- Enhance: 過去に送信したフォローリクエストを確認できるように  
  (Based on https://activitypub.software/TransFem-org/Sharkey/-/merge_requests/663)
- Enhance: サイドバーを簡単に展開・折りたたみできるように ( #14981 )
- Enhance: リノートメニューに「リノートの詳細」を追加
- Enhance: 非ログイン状態でMisskeyを開いた際のパフォーマンスを向上
- Fix: 通知の範囲指定の設定項目が必要ない通知設定でも範囲指定の設定がでている問題を修正
- Fix: Turnstileが失敗・期限切れした際にも成功扱いとなってしまう問題を修正  
  (Cherry-picked from https://github.com/MisskeyIO/misskey/pull/768)
- Fix: デッキのタイムラインカラムで「センシティブなファイルを含むノートを表示」設定が使用できなかった問題を修正
- Fix: Encode RSS urls with escape sequences before fetching allowing query parameters to be used
- Fix: リンク切れを修正
- Fix: ノート投稿ボタンにホバー時のスタイルが適用されていないのを修正  
  (Cherry-picked from https://github.com/taiyme/misskey/pull/305)
- Fix: メールアドレス登録有効化時の「完了」ダイアログボックスの表示条件を修正
- Fix: 画面幅が狭い環境でデザインが崩れる問題を修正  
	(Cherry-picked from https://github.com/MisskeyIO/misskey/pull/815)
- Fix: TypeScriptの型チェック対象ファイルを限定してビルドを高速化するように  
	(Cherry-picked from https://activitypub.software/TransFem-org/Sharkey/-/merge_requests/725)

### Server
- Enhance: DockerのNode.jsを22.11.0に更新
- Enhance: 起動前の疎通チェックで、DBとメイン以外のRedisの疎通確認も行うように  
  (Based on https://activitypub.software/TransFem-org/Sharkey/-/merge_requests/588)  
  (Cherry-picked from https://activitypub.software/TransFem-org/Sharkey/-/merge_requests/715)
- Enhance: リモートユーザーの照会をオリジナルにリダイレクトするように
- Fix: sharedInboxが無いActorに紐づくリモートユーザーを照会できない
- Fix: Aproving request from GtS appears with some delay
- Fix: フォロワーへのメッセージの絵文字をemojisに含めるように
- Fix: Nested proxy requestsを検出した際にブロックするように
  [ghsa-gq5q-c77c-v236](https://github.com/misskey-dev/misskey/security/advisories/ghsa-gq5q-c77c-v236)
- Fix: 招待コードの発行可能な残り数算出に使用すべきロールポリシーの値が違う問題を修正  
  (Cherry-picked from https://activitypub.software/TransFem-org/Sharkey/-/merge_requests/706)
- Fix: 連合への配信時に、acctの大小文字が区別されてしまい正しくメンションが処理されないことがある問題を修正  
  (Cherry-picked from https://activitypub.software/TransFem-org/Sharkey/-/merge_requests/711)
- Fix: ローカルユーザーへのメンションを含むノートが連合される際に正しいURLに変換されないことがある問題を修正  
  (Cherry-picked from https://activitypub.software/TransFem-org/Sharkey/-/merge_requests/712)
- Fix: FTT無効時にユーザーリストタイムラインが使用できない問題を修正  
  (Cherry-picked from https://activitypub.software/TransFem-org/Sharkey/-/merge_requests/709)
- Fix: User Webhookテスト機能のMock Payloadを修正  
- Fix: アカウント削除のモデレーションログが動作していないのを修正 (#14996)  
- Fix: リノートミュートが新規投稿通知に対して作用していなかった問題を修正
- Fix: Inboxの処理で生じるエラーを誤ってActivityとして処理することがある問題を修正  
  (Cherry-picked from https://activitypub.software/TransFem-org/Sharkey/-/merge_requests/730)
- Fix: セキュリティに関する修正

### Misskey.js
- Fix: Stream初期化時、別途WebSocketを指定する場合の型定義を修正

## 2024.10.1

### Note
- スパム対策として、モデレータ権限を持つユーザのアクティビティが7日以上確認できない場合は自動的に招待制へと切り替え（コントロールパネル -> モデレーション -> "誰でも新規登録できるようにする"をオフに変更）るようになりました。 ( #13437 )
	- 切り替わった際はモデレーターへお知らせとして通知されます。登録をオープンな状態で継続したい場合は、コントロールパネルから再度設定を行ってください。

### General
- Feat: ユーザーの名前に禁止ワードを設定できるように

### Client
- Enhance: タイムライン表示時のパフォーマンスを向上
- Enhance: アーカイブした個人宛のお知らせを表示・編集できるように
- Enhance: l10nの更新
- Fix: メールアドレス不要でCaptchaが有効な場合にアカウント登録完了後自動でのログインに失敗する問題を修正

### Server
- Feat: モデレータ権限を持つユーザが全員7日間活動しなかった場合は自動的に招待制へと切り替えるように ( #13437 )
- Enhance: 個人宛のお知らせは「わかった」を押すと自動的にアーカイブされるように
- Fix: `admin/emoji/update`エンドポイントのidのみ指定した時不正なエラーが発生するバグを修正
- Fix: RBT有効時、リノートのリアクションが反映されない問題を修正
- Fix: キューのエラーログを簡略化するように  
  (Cherry-picked from https://activitypub.software/TransFem-org/Sharkey/-/merge_requests/649)

## 2024.10.0

### Note
- セキュリティ向上のため、サーバー初期設定時に使用する初期パスワードを設定できるようになりました。今後Misskeyサーバーを新たに設置する際には、初回の起動前にコンフィグファイルの`setupPassword`をコメントアウトし、初期パスワードを設定することをおすすめします。（すでに初期設定を完了しているサーバーについては、この変更に伴い対応する必要はありません）  
  - ホスティングサービスを運営している場合は、コンフィグファイルを構築する際に`setupPassword`をランダムな値に設定し、ユーザーに通知するようにシステムを更新することをおすすめします。
  - なお、初期パスワードが設定されていない場合でも初期設定を行うことが可能です（UI上で初期パスワードの入力欄を空欄にすると続行できます）。
- ユーザーデータを読み込む際の型が一部変更されました。
	- `twoFactorEnabled`, `usePasswordLessLogin`, `securityKeys`: 自分とモデレーター以外のユーザーからは取得できなくなりました

### General
- Feat: サーバー初期設定時に初期パスワードを設定できるように
- Feat: 通報にモデレーションノートを残せるように
- Feat: 通報の解決種別を設定できるように
- Enhance: 通報の解決と転送を個別に行えるように
- Enhance: セキュリティ向上のため、サインイン時もCAPTCHAを求めるようになりました
- Enhance: 依存関係の更新
- Enhance: l10nの更新
- Enhance: Playの「人気」タブで10件以上表示可能に #14399
- Fix: 連合のホワイトリストが正常に登録されない問題を修正

### Client
- Enhance: デザインの調整
- Enhance: ログイン画面の認証フローを改善
- Fix: クライアント上での時間ベースの実績獲得動作が実績獲得後も発動していた問題を修正  
  (Cherry-picked from https://activitypub.software/TransFem-org/Sharkey/-/merge_requests/657)

### Server
- Enhance: セキュリティ向上のため、ログイン時にメール通知を行うように
- Enhance: 自分とモデレーター以外のユーザーから二要素認証関連のデータが取得できないように
- Enhance: 通報および通報解決時に送出されるSystemWebhookにユーザ情報を含めるように ( #14697 )
- Fix: `admin/abuse-user-reports`エンドポイントのスキーマが間違っていた問題を修正

## 2024.9.0

### General
- Feat: ノート単体・ユーザーのノート・クリップのノートの埋め込み機能
  - 埋め込みコードやウェブサイトへの実装方法の詳細は https://misskey-hub.net/docs/for-users/features/embed/ をご覧ください
- Feat: パスキーでログインボタンを実装 (#14574)
- Feat: フォローされた際のメッセージを設定できるように
- Feat: 連合をホワイトリスト制にできるように
- Feat: UserWebhookとSystemWebhookのテスト送信機能を追加 (#14445)
- Feat: モデレーターはユーザーにかかわらずファイルが添付されているノートを検索できるように  
  (Cherry-picked from https://github.com/MisskeyIO/misskey/pull/680)
- Feat: データエクスポートが完了した際に通知を発行するように
- Enhance: ユーザーによるコンテンツインポートの可否をロールポリシーで制御できるように
- Enhance: 依存関係の更新
- Enhance: l10nの更新

### Client
- Enhance: サイズ制限を超過するファイルをアップロードしようとした際にエラーを出すように
- Enhance: アイコンデコレーション管理画面にプレビューを追加
- Enhance: コントロールパネル内のファイル一覧でセンシティブなファイルを区別しやすく
- Enhance: ScratchpadにUIインスペクターを追加
- Enhance: Play編集画面の項目の並びを少しリデザイン
- Enhance: 各種メニューをドロワー表示するかどうか設定可能に
- Enhance: AiScriptのMk:C:containerのオプションに`borderStyle`と`borderRadius`を追加
- Enhance: CWでも絵文字をクリックしてメニューを表示できるように
- Fix: サーバーメトリクスが2つ以上あるとリロード直後の表示がおかしくなる問題を修正
- Fix: コントロールパネル内のAp requests内のチャートの表示がおかしかった問題を修正
- Fix: 月の違う同じ日はセパレータが表示されないのを修正
- Fix: タッチ画面でレンジスライダーを操作するとツールチップが複数表示される問題を修正  
  (Cherry-picked from https://github.com/taiyme/misskey/pull/265)
- Fix: 縦横比が極端なカスタム絵文字を表示する際にレイアウトが崩れる箇所があるのを修正  
  (Cherry-picked from https://github.com/MisskeyIO/misskey/pull/725)
- Fix: 設定変更時のリロード確認ダイアログが複数個表示されることがある問題を修正
- Fix: ファイルの詳細ページのファイルの説明で改行が正しく表示されない問題を修正  
  (Cherry-picked from https://activitypub.software/TransFem-org/Sharkey/-/commit/bde6bb0bd2e8b0d027e724d2acdb8ae0585a8110)
- Fix: 一部画面のページネーションが動作しにくくなっていたのを修正 ( #12766 , #11449 )

### Server
- Feat: Misskey® Reactions Boost Technology™ (RBT)により、リアクションの作成負荷を低減することが可能に
- Fix: アンテナの書き込み時にキーワードが与えられなかった場合のエラーをApiErrorとして投げるように
  - この変更により、公式フロントエンドでは入力の不備が内部エラーとして報告される代わりに一般的なエラーダイアログで報告されます
- Fix: ファイルがサイズの制限を超えてアップロードされた際にエラーを返さなかった問題を修正
- Fix: 外部ページを解析する際に、ページに紐づけられた関連リソースも読み込まれてしまう問題を修正  
  (Cherry-picked from https://activitypub.software/TransFem-org/Sharkey/-/commit/26e0412fbb91447c37e8fb06ffb0487346063bb8)
- Fix: Continue importing from file if single emoji import fails
- Fix: `Retry-After`ヘッダーが送信されなかった問題を修正  
  (Cherry-picked from https://activitypub.software/TransFem-org/Sharkey/-/commit/8a982c61c01909e7540ff1be9f019df07c3f0624)
- Fix: サーバーサイドのDOM解析完了時にリソースを開放するように  
  (Cherry-picked from https://activitypub.software/TransFem-org/Sharkey/-/merge_requests/634)
- Fix: `<link rel="alternate">`を追って照会するのはOKレスポンスが返却された場合のみに  
  (Cherry-picked from https://activitypub.software/TransFem-org/Sharkey/-/merge_requests/633)
- Fix: メールにスタイルが適用されていなかった問題を修正

## 2024.8.0

### General
- Enhance: モデレーターはすべてのユーザーのフォロー・フォロワーの一覧を見られるように
- Enhance: アカウントの削除のモデレーションログを残すように
- Enhance: 不適切なページ、ギャラリー、Playを管理者権限で削除できるように
- Fix: リモートユーザのフォロー・フォロワーの一覧が非公開設定の場合も表示できてしまう問題を修正

### Client
- Enhance: 「自分のPlay」ページにおいてPlayが非公開かどうかが一目でわかるように
- Enhance: 不適切なページ、ギャラリー、Playを通報できるように
- Fix: Play編集時に公開範囲が「パブリック」にリセットされる問題を修正
- Fix: ページ遷移に失敗することがある問題を修正
- Fix: iOSでユーザー名などがリンクとして誤検知される現象を抑制
- Fix: mCaptchaを使用していてもbotプロテクションに関する警告が消えないのを修正
- Fix: ユーザーのモデレーションページにおいてユーザー名にドットが入っているとシステムアカウントとして表示されてしまう問題を修正
- Fix: 特定の条件下でノートの削除ボタンが出ないのを修正

### Server
- Enhance: 照会時にURLがhtmlかつheadタグ内に`rel="alternate"`, `type="application/activity+json"`の`link`タグがある場合に追ってリンク先を照会できるように
- Enhance: 凍結されたアカウントのフォローリクエストを表示しないように
- Fix: WSの`readAllNotifications` メッセージが `body` を持たない場合に動作しない問題 #14374
  - 通知ページや通知カラム(デッキ)を開いている状態において、新たに発生した通知が既読されない問題が修正されます。
  - これにより、プッシュ通知が有効な同条件下の環境において、プッシュ通知が常に発生してしまう問題も修正されます。
- Fix: Play各種エンドポイントの返り値に`visibility`が含まれていない問題を修正
- Fix: サーバー情報取得の際にモデレーター限定の情報が取得できないことがあるのを修正  
  (Cherry-picked from https://activitypub.software/TransFem-org/Sharkey/-/merge_requests/582)
- Fix: 公開範囲がダイレクトのノートをユーザーアクティビティのチャート生成に使用しないように  
  (Cherry-picked from https://github.com/MisskeyIO/misskey/pull/679)
- Fix: ActivityPubのエンティティタイプ判定で不明なタイプを受け取った場合でも処理を継続するように
  - キュー処理のつまりが改善される可能性があります
- Fix: リバーシの対局設定の変更が反映されないのを修正
- Fix: 無制限にストリーミングのチャンネルに接続できる問題を修正
- Fix: ベースロールのポリシーを変更した際にモデログに記録されないのを修正  
  (Cherry-picked from https://github.com/MisskeyIO/misskey/pull/700)
- Fix: Prevent memory leak from memory caches (#14310)
- Fix: More reliable memory cache eviction (#14311)

## 2024.7.0

### Note
- デッキUIの新着ノートをサウンドで通知する機能の追加（v2024.5.0）に伴い、以前から動作しなくなっていたクライアント設定内の「アンテナ受信」「チャンネル通知」サウンドを削除しました。
- Streaming APIにて入力が不正な場合にはそのメッセージを無視するようになりました。 #14251

### General
- Feat: 通報を受けた際、または解決した際に、予め登録した宛先に通知を飛ばせるように(mail or webhook) #13705
- Feat: ユーザーのアイコン/バナーの変更可否をロールで設定可能に
  - 変更不可となっていても、設定済みのものを解除してデフォルト画像に戻すことは出来ます
- Feat: ユーザ作成時にSystemWebhookを送信可能に #14281
- Feat: メディアサイレンスを実装 #13842
  - メディアサイレンスされたサーバーに所属するアカウントによるファイルはすべてセンシティブとして扱われ、カスタム絵文字が使用できないようになります。
- Enhance: 管理画面でアーカイブにしたお知らせを表示・編集できるように
- Fix: 配信停止したインスタンス一覧が見れなくなる問題を修正
- Fix: Dockerコンテナの立ち上げ時に`pnpm`のインストールで固まることがある問題
- Fix: デフォルトテーマに無効なテーマコードを入力するとUIが使用できなくなる問題を修正
- 翻訳の更新
- 依存関係の更新

### Client
- Feat: ユーザーページから「このユーザーのノートを検索」できるように (#14128)
- Feat: 検索ページはクエリを受け付けるようになりました (#14128)
- Enhance: 検索ページのUI改善 (#14128)
- Enhance: 内蔵APIドキュメントのデザイン・パフォーマンスを改善
- Enhance: 非ログイン時に他サーバーに遷移するアクションを追加
- Enhance: 非ログイン時のハイライトTLのデザインを改善
- Enhance: フロントエンドのアクセシビリティ改善  
  (Based on https://github.com/taiyme/misskey/pull/226)
- Enhance: サーバー情報ページ・お問い合わせページを改善  
  (Cherry-picked from https://github.com/taiyme/misskey/pull/238)
- Enhance: AiScriptを0.19.0にアップデート
- Enhance: Allow negative delay for MFM animation elements (`tada`, `jelly`, `twitch`, `shake`, `spin`, `jump`, `bounce`, `rainbow`)
- Enhance: センシティブなメディアを開く際に確認ダイアログを出せるように
- Enhance: 検索(ノート/ユーザー)で `#` から始まる文字列を入力すると、そのハッシュタグのノート/ユーザー一覧ページが表示できるように
- Enhance: 検索(ノート/ユーザー)において、入力に空白が含まれている場合は照会を行わないように
- Enhance: 検索(ノート/ユーザー)において、照会を行うかどうか、ハッシュタグのノート/ユーザー一覧ページを表示するかどうかの確認ダイアログを出すように
- Enhance: 検索(ノート/ユーザー)で `@` から始まる文字列(`@user@host`など)を入力すると、そのユーザーを照会できるように
- Enhance: ドライブのファイル・フォルダをドラッグしなくても移動できるように  
  (Cherry-picked from https://github.com/nafu-at/misskey/commit/b89c2af6945c6a9f9f10e83f54d2bcf0f240b0b4, https://github.com/nafu-at/misskey/commit/8a7d710c6acb83f50c83f050bd1423c764d60a99)
- Enhance: デッキのアンテナ・リスト選択画面からそれぞれを新規作成できるように
- Enhance: ブラウザのコンテキストメニューを使用できるように
- Enhance: 連合の「連合中」,「購読中」,「配信中」に対してブロックしているサーバー、配信停止しているサーバーを含めないように
- Fix: `/about#federation` ページなどで各インスタンスのチャートが表示されなくなっていた問題を修正
- Fix: ユーザーページの追加情報のラベルを投稿者のサーバーの絵文字で表示する (#13968)
- Fix: リバーシの対局を正しく共有できないことがある問題を修正
- Fix: コントロールパネルでベースロールのポリシーを編集してもUI上では変更が反映されない問題を修正 
- Fix: アンテナの編集画面のボタンに隙間を追加
- Fix: テーマプレビューが見れない問題を修正
- Fix: ショートカットキーが連打できる問題を修正  
  (Cherry-picked from https://github.com/taiyme/misskey/pull/234)
- Fix: MkSignin.vueのcredentialRequestからReactivityを削除（ProxyがPasskey認証処理に渡ることを避けるため）
- Fix: 「アニメーション画像を再生しない」がオンのときでもサーバーのバナー画像・背景画像がアニメーションしてしまう問題を修正  
  (Cherry-picked from https://activitypub.software/TransFem-org/Sharkey/-/merge_requests/574)
- Fix: Twitchの埋め込みが開けない問題を修正
- Fix: 子メニューの高さがウィンドウからはみ出ることがある問題を修正
- Fix: 個人宛てのダイアログ形式のお知らせが即時表示されない問題を修正
- Fix: 一部の画像がセンシティブ指定されているときに画面に何も表示されないことがあるのを修正
- Fix: リアクションしたユーザー一覧のユーザー名がはみ出る問題を修正  
  (Cherry-picked from https://github.com/MisskeyIO/misskey/pull/672)
- Fix: `/share`ページにおいて絵文字ピッカーを開くことができない問題を修正
- Fix: deck uiの通知音が重なる問題 (#14029)
- Fix: ダイレクト投稿の"削除して編集"において、宛先が保持されていなかった問題を修正
- Fix: 投稿フォームへのURL貼り付けによる引用が下書きに保存されていなかった問題を修正
- Fix: "削除して編集"や下書きにおいて、リアクションの受け入れ設定が保持/保存されていなかった問題を修正
- Fix: 照会に `#` から始まる文字列を入力してそのハッシュタグのページを表示する際、入力が `#` のみの場合に「指定されたURLに該当するページはありませんでした。」が表示されてしまう問題を修正
- Fix: 照会に `@` から始まる文字列を入力してユーザーを照会する際、入力が `@` のみの場合に「問題が発生しました」が表示されてしまう問題を修正
- Fix: 投稿フォームにノートのURLを貼り付けて"引用として添付"した場合、投稿文を空にすることによるRenote化が出来なかった問題を修正
- Fix: フォロー中のユーザーに関する"TLに他の人への返信を含める"の設定が分かりづらい問題を修正
- Fix: タイムラインページを開いた時、`TLに他の人への返信を含める`がオフのときに`ファイル付きのみ`をオンにできない問題を修正
- Fix: deck uiでタイムラインを切り替えた際にTLの設定項目が更新されず、`TLに他の人への返信を含める`のトグルが表示されない問題を修正
- Fix: ウィジェットのタイムライン選択欄に無効化されたタイムラインが表示される問題を修正
- Fix: サウンドにドライブの音声を使用している際にドライブの音声が再生できなくなると設定が変更できなくなる問題を修正

### Server
- Feat: レートリミット制限に引っかかったときに`Retry-After`ヘッダーを返すように (#13949)
- Enhance: エンドポイント`clips/update`の必須項目を`clipId`のみに
- Enhance: エンドポイント`admin/roles/update`の必須項目を`roleId`のみに
- Enhance: エンドポイント`pages/update`の必須項目を`pageId`のみに
- Enhance: エンドポイント`gallery/posts/update`の必須項目を`postId`のみに
- Enhance: エンドポイント`i/webhook/update`の必須項目を`webhookId`のみに
- Enhance: エンドポイント`admin/ad/update`の必須項目を`id`のみに
- Enhance: `default.yml`内の`url`, `db.db`, `db.user`, `db.pass`を環境変数から読み込めるように
- Enhance: エンドポイント`api/meta`にプロパティ`noteSearchableScope`が増え、`string`値`local`または`global`を返却します
- Fix: チャート生成時にinstance.suspensionStateに置き換えられたinstance.isSuspendedが参照されてしまう問題を修正
- Fix: ユーザーのフィードページのMFMをHTMLに展開するように (#14006)
- Fix: アンテナ・クリップ・リスト・ウェブフックがロールポリシーの上限より一つ多く作れてしまうのを修正 (#14036)
- Fix: notRespondingSinceが実装される前に不通になったインスタンスが自動的に配信停止にならない (#14059)
- Fix: FTT有効時、タイムライン用エンドポイントで`sinceId`にキャッシュ内最古のものより古いものを指定した場合に正しく結果が返ってこない問題を修正
- Fix: 自分以外のクリップ内のノート個数が見えることがあるのを修正
- Fix: 空文字列のリアクションはフォールバックされるように
- Fix: リノートにリアクションできないように
- Fix: ユーザー名の前後に空白文字列がある場合は省略するように
- Fix: プロフィール編集時に名前を空白文字列のみにできる問題を修正
- Fix: ユーザ名のサジェスト時に表示される内容と順番を調整(以下の順番になります) #14149
  1. フォロー中かつアクティブなユーザ
  2. フォロー中かつ非アクティブなユーザ
  3. フォローしていないアクティブなユーザ
  4. フォローしていない非アクティブなユーザ

  また、自分自身のアカウントもサジェストされるようになりました。
- Fix: 一般ユーザーから見たユーザーのバッジの一覧に公開されていないものが含まれることがある問題を修正  
  (Cherry-picked from https://github.com/MisskeyIO/misskey/pull/652)
- Fix: ユーザーのリアクション一覧でミュート/ブロックが機能していなかった問題を修正
- Fix: FTT有効時にリモートユーザーのノートがHTLにキャッシュされる問題を修正
- Fix: 一部の通知がローカル上のリモートユーザーに対して行われていた問題を修正
- Fix: エラーメッセージの誤字を修正 (#14213)
- Fix: ソーシャルタイムラインにローカルタイムラインに表示される自分へのリプライが表示されない問題を修正
- Fix: リノートのミュートが適用されるまでに時間がかかることがある問題を修正  
  (Cherry-picked from https://github.com/Type4ny-Project/Type4ny/commit/e9601029b52e0ad43d9131b555b614e56c84ebc1)
- Fix: Steaming APIが不正なデータを受けた場合の動作が不安定である問題 #14251
- Fix: `users/search`において `@` から始まる文字列が与えられた際の処理が正しくなかった問題を修正
  - 名前や自己紹介に `@` から始まる文言が含まれるユーザーも検索できるようになります
- Fix: 一部のMisskey以外のソフトウェアからファイルを受け取れない問題
  (Cherry-picked from https://github.com/Secineralyr/misskey.dream/pull/73/commits/652eaff1e8aa00b890d71d2e1e52c263c1e67c76)
  - NOTE: `drive_file`の`url`, `uri`, `src`の上限が512から1024に変更されます
	  Migrationではカラム定義の変更のみが行われます。
		サーバー管理者は各サーバーの必要に応じ`drive_file` `("uri")`に対するインデックスを張りなおすことでより安定しDBの探索が行われる可能性があります。詳細 は [GitHub](https://github.com/misskey-dev/misskey/pull/14323#issuecomment-2257562228)で確認可能です
- Fix: 自分のフォロワー限定投稿に対するリプライがホームタイムラインで見えないことが有る問題を修正
- Fix: フォローしていないユーザによるフォロワー限定投稿に対するリプライがソーシャルタイムラインで表示されることがある問題を修正

### Misskey.js
- Feat: `/drive/files/create` のリクエストに対応（`multipart/form-data`に対応）
- Feat: `/admin/role/create` のロールポリシーの型を修正

## 2024.5.0

### Note
- コントロールパネル内にあるサマリープロキシの設定個所がセキュリティから全般へ変更となります。
- 悪意のある第三者がリモートユーザーになりすましたアクティビティを受け取れてしまう問題を修正しました。詳しくは[GitHub security advisory](https://github.com/misskey-dev/misskey/security/advisories/GHSA-2vxv-pv3m-3wvj)をご覧ください。
- 管理者向け権限 `read:admin:show-users` は `read:admin:show-user` に統合されました。必要に応じてAPIトークンを再発行してください。

### General
- Feat: エラートラッキングにSentryを使用できるようになりました
- Enhance: URLプレビューの有効化・無効化を設定できるように #13569
- Enhance: アンテナでBotによるノートを除外できるように  
  (Cherry-picked from https://github.com/MisskeyIO/misskey/pull/545)
- Enhance: クリップのノート数を表示するように
- Enhance: コンディショナルロールの条件として以下を新たに追加 (#13667)
  - 猫ユーザーか
  - botユーザーか
  - サスペンド済みユーザーか
  - 鍵アカウントユーザーか
  - 「アカウントを見つけやすくする」が有効なユーザーか
- Enhance: Goneを出さずに終了したサーバーへの配信停止を自動的に行うように
  - もしそのようなサーバーからから配信が届いた場合には自動的に配信を再開します
- Enhance: 配信停止の理由を表示するように
- Enhance: サーバーのお問い合わせ先URLを設定できるようになりました
- Fix: Play作成時に設定した公開範囲が機能していない問題を修正
- Fix: 正規化されていない状態のhashtagが連合されてきたhtmlに含まれているとhashtagが正しくhashtagに復元されない問題を修正
- Fix: みつけるのアンケート欄にてチャンネルのアンケートが含まれてしまう問題を修正

### Client
- Feat: アップロードするファイルの名前をランダム文字列にできるように
- Feat: 個別のお知らせにリンクで飛べるように  
  (Based on https://github.com/MisskeyIO/misskey/pull/639)
- Enhance: 自分のノートの添付ファイルから直接ファイルの詳細ページに飛べるように
- Enhance: 広告がMisskeyと同一ドメインの場合はRouterで遷移するように
- Enhance: リアクション・いいねの総数を表示するように
- Enhance: リアクション受け入れが「いいねのみ」の場合はリアクション絵文字一覧を表示しないように
- Enhance: 設定>プラグインのページからプラグインの簡易的なログやエラーを見られるように
  - 実装の都合により、プラグインは１つエラーを起こした時に即時停止するようになりました
- Enhance: ページのデザインを変更
- Enhance: 2要素認証（ワンタイムパスワード）の入力欄を改善
- Enhance: 「今日誕生日のフォロー中ユーザー」ウィジェットを手動でリロードできるように
- Enhance: 映像・音声の再生にブラウザのネイティブプレイヤーを使用できるように
- Enhance: 映像・音声の再生メニューに「再生速度」「ループ再生」「ピクチャインピクチャ」を追加
- Enhance: 映像・音声の再生にキーボードショートカットが使えるように
- Enhance: ノートについているリアクションの「もっと！」から、リアクションの一覧を表示できるように
- Enhance: リプライにて引用がある場合テキストが空でもノートできるように
  - 引用したいノートのURLをコピーしリプライ投稿画面にペーストして添付することで達成できます
- Enhance: フォローするかどうかの確認ダイアログを出せるように
- Enhance: Playを手動でリロードできるように
- Enhance: 通報のコメント内のリンクをクリックした際、ウィンドウで開くように
- Enhance: `Ui:C:postForm` および `Ui:C:postFormButton` に `localOnly` と `visibility` を設定できるように
- Enhance: AiScriptを0.18.0にバージョンアップ
- Enhance: 通常のノートでも、お気に入りに登録したチャンネルにリノートできるように
- Enhance: 長いテキストをペーストした際にテキストファイルとして添付するかどうかを選択できるように
- Enhance: 新着ノートをサウンドで通知する機能をdeck UIに追加しました
- Enhance: コントロールパネルのクイックアクションからファイルを照会できるように
- Enhance: コントロールパネルのクイックアクションから通常の照会を行えるように
- Fix: 一部のページ内リンクが正しく動作しない問題を修正
- Fix: 周年の実績が閏年を考慮しない問題を修正
- Fix: ローカルURLのプレビューポップアップが左上に表示される
- Fix: WebGL2をサポートしないブラウザで「季節に応じた画面の演出」が有効になっているとき、Misskeyが起動できなくなる問題を修正  
  (Cherry-picked from https://activitypub.software/TransFem-org/Sharkey/-/merge_requests/459)
- Fix: ページタイトルでローカルユーザーとリモートユーザーの区別がつかない問題を修正  
  (Cherry-picked from https://github.com/MisskeyIO/misskey/pull/528)
- Fix: コードブロックのシンタックスハイライトで使用される定義ファイルをCDNから取得するように #13177
  - CDNから取得せずMisskey本体にバンドルする場合は`pacakges/frontend/vite.config.ts`を修正してください。
- Fix: タイムゾーンによっては、「今日誕生日のフォロー中ユーザー」ウィジェットが正しく動作しない問題を修正
- Fix: CWのみの引用リノートが詳細ページで純粋なリノートとして誤って扱われてしまう問題を修正
- Fix: ノート詳細ページにおいてCW付き引用リノートのCWボタンのラベルに「引用」が含まれていない問題を修正
- Fix: ダイアログの入力で字数制限に違反していてもEnterキーが押せてしまう問題を修正
- Fix: ダイレクト投稿の宛先が保存されない問題を修正
- Fix: Playのページを離れたときに、Playが正常に初期化されない問題を修正
- Fix: ページのOGP URLが間違っているのを修正
- Fix: リバーシの対局を正しく共有できないことがある問題を修正
- Fix: 通知をグループ化している際に、人数が正常に表示されないことがある問題を修正
- Fix: 連合なしの状態の読み書きができない問題を修正
- Fix: `/share` で日本語等を含むurlがurlエンコードされない問題を修正
- Fix: ファイルを5つ以上添付してもテキストがないとノートが折りたたまれない問題を修正

### Server
- Enhance: エンドポイント`antennas/update`の必須項目を`antennaId`のみに
- Enhance: misskey-dev/summaly@5.1.0の取り込み（プレビュー生成処理の効率化）
- Enhance: ドライブのファイルがNSFWかどうか個別に連合されるように (#13756)
  - 可能な場合、ノートの添付ファイルのセンシティブ判定がファイル単位になります
- Fix: リモートから配送されたアクティビティにJSON-LD compactionをかける
- Fix: フォローリクエストを作成する際に既存のものは削除するように  
  (Cherry-picked from https://activitypub.software/TransFem-org/Sharkey/-/merge_requests/440)
- Fix: エンドポイント`notes/translate`のエラーを改善
- Fix: CleanRemoteFilesProcessorService report progress from 100% (#13632)
- Fix: 一部の音声ファイルが映像ファイルとして扱われる問題を修正
- Fix: リプライのみの引用リノートと、CWのみの引用リノートが純粋なリノートとして誤って扱われてしまう問題を修正
- Fix: 登録にメール認証が必須になっている場合、登録されているメールアドレスを削除できないように  
  (Cherry-picked from https://github.com/MisskeyIO/misskey/pull/606)
- Fix: Add Cache-Control to Bull Board
- Fix: nginx経由で/files/にRangeリクエストされた場合に正しく応答できないのを修正
- Fix: 一部のタイムラインのストリーミングでインスタンスミュートが効かない問題を修正
- Fix: グローバルタイムラインで返信が表示されないことがある問題を修正
- Fix: リノートをミュートしたユーザの投稿のリノートがミュートされる問題を修正
- Fix: AP Link等は添付ファイル扱いしないようになど (#13754)
- Fix: FTTが有効かつsinceIdのみを指定した場合に帰って来るレスポンスが逆順である問題を修正
- Fix: `/i/notifications`に `includeTypes`か`excludeTypes`を指定しているとき、通知が存在するのに空配列を返すことがある問題を修正
- Fix: 複数idを指定する`users/show`が関係ないユーザを返すことがある問題を修正
- Fix: `/tags` と `/user-tags` が検索エンジンにインデックスされないように
- Fix: もともとセンシティブではないと連合されていたファイルがセンシティブとして連合された場合にセンシティブとしてそのファイルを扱うように
  - センシティブとして連合したファイルは非センシティブとして連合されてもセンシティブとして扱われます

## 2024.3.1

### General
-

### Client
- Fix: 絵文字関係の不具合を修正 (#13485)
  - 履歴に残っている or ピン留めされた絵文字がコントロールパネルより削除されていた際にリアクションデッキが表示できなくなる
  - Unicode絵文字が履歴に残っている or ピン留めされているとリアクションデッキが表示できなくなる
- Fix: カスタム絵文字の画像読み込みに失敗した際はテキストではなくダミー画像を表示 #13487

### Server
-

## 2024.3.0

### General
- Enhance: 投稿者のロールに応じて、一つのノートに含むことのできるメンションとダイレクト投稿の宛先の人数に上限を設定できるように
  * デフォルトのメンション上限は20アカウントに設定されます。（管理者はベースロールの設定で変更可能です。）
  * 連合の問い合わせに応答しないサーバーのリモートユーザーへのメンションは、上限の人数に含めない実装になっています。
- Enhance: 通知がミュート、凍結を考慮するようになりました
- Enhance: サーバーごとにモデレーションノートを残せるように
- Enhance: コンディショナルロールの条件に「マニュアルロールへのアサイン」を追加
- Enhance: 通知の受信設定に「フォロー中またはフォロワー」を追加
- Enhance: 通知の履歴をリセットできるように
- Fix: ダイレクトなノートに対してはダイレクトでしか返信できないように

### Client
- Enhance: ノート作成画面のファイル添付メニューの区切り線の位置を調整
- Fix: syuilo/misskeyの時代からあるインスタンスが改変されたバージョンであると誤認識される問題
- Fix: MFMのオートコンプリートが出るべき状況で出ないことがある問題を修正
- Fix: チャートのラベルが消えている問題を修正
- Fix: 画面表示後最初の音声再生が爆音になることがある問題を修正
- Fix: 設定のバックアップ作成時に名前を入力しなかった場合、ローカライゼーションがおかしくなる問題を修正
- Fix: ページ`/admin/emojis`の絵文字編集ダイアログで「リアクションとして使えるロール」を追加する際に何も選択せずOKを押下すると画面が固まる問題を修正
- Fix: 絵文字サジェストの順位で、絵文字自体の名前が同じものよりもタグで一致しているものが優先されてしまう問題を修正
- Fix: ユーザの情報のポップアップが消えなくなることがある問題を修正

### Server
- Enhance: エンドポイント`flash/update`の`flashId`以外のパラメータは必須ではなくなりました
- Fix: nodeinfoにenableMcaptchaとenableTurnstileが無いのを修正
- Fix: 破損した通知をクライアントに送信しないように
	* 通知欄が無限にリロードされる問題が改善する可能性があります
- Fix: 禁止キーワードを含むノートがDelayed Queueに追加されて再処理される問題を修正
- Fix: 自分がフォローしていないアカウントのフォロワー限定ノートが閲覧できることがある問題を修正
- Fix: タイムラインのオプションで「リノートを表示」を無効にしている際、投票のみの引用リノートが流れてこない問題を修正
- Fix: エンドポイント`admin/emoji/update`の各種修正
  - 必須パラメータを`id`または`name`のいずれかのみに
  - `id`の代わりに`name`で絵文字を指定可能に（`id`・`name`両指定時は従来通り`name`を変更する挙動）
  - `category`および`licence`が指定なしの時勝手にnullに上書きされる挙動を修正
- Fix: 通知の受信設定で「相互フォロー」が正しく動作しない問題を修正

## 2024.2.0

### Note
- 外部サイトからプラグインをインストールする場合のパスが`/install-extentions`から`/install-extensions`に変わります。以前のパスからは自動でリダイレクトされるようになっていますが、新しいパスに変更することをお勧めします。

### General
- Feat: [mCaptcha](https://github.com/mCaptcha/mCaptcha)のサポートを追加
- Feat: Add support for TrueMail
- Feat: AGPLv3ライセンスに誤って違反するのを防止する機能を追加
	- 管理者がrepositoryUrlを変更したり、またはソースコードを直接頒布することを選択できるようになります
	- 本体のソースコードに改変を加えた際に、ライセンスに基づく適切な案内を表示します
- Enhance: モデレーターはすべてのユーザーのリアクション一覧を見られるように
- Fix: リストライムラインの「リノートを表示」が正しく機能しない問題を修正
- Fix: リモートユーザーのリアクション一覧がすべて見えてしまうのを修正
  * すべてのリモートユーザーのリアクション一覧を見えないようにします
- Fix: 特定のキーワード及び正規表現にマッチする文字列を含むノートが投稿された際、エラーに出来るような設定項目を追加 #13207
  * デフォルトは空欄なので適用前と同等の動作になります

### Client
- Feat: 新しいゲームを追加
- Feat: 音声・映像プレイヤーを追加
- Feat: 絵文字の詳細ダイアログを追加
- Feat: 枠線をつけるMFM`$[border.width=1,style=solid,color=fff,radius=0 ...]`を追加
  - デフォルトで枠線からはみ出る部分が隠されるようにしました。初期と同じ挙動にするには`$[border.noclip`が必要です
- Feat: スワイプでタブを切り替えられるように
- Enhance: MFM等のコードブロックに全文コピー用のボタンを追加
- Enhance: ハッシュタグ入力時に、本文の末尾の行に何も書かれていない場合は新たにスペースを追加しないように
- Enhance: チャンネルノートのピン留めをノートのメニューからできるように
- Enhance: 管理者の場合はAPI tokenの発行画面で管理機能に関する権限を付与できるように
- Enhance: AiScriptを0.17.0に更新　[CHANGELOG](https://github.com/aiscript-dev/aiscript/blob/bb89d132b633a622d3cb0eff0d0cc7e476c0cfdd/CHANGELOG.md)
  - 配列の範囲外・非整数のインデックスへの代入が完全禁止になるので注意
- Enhance: 絵文字ピッカー・オートコンプリートで、完全一致した絵文字を優先的に表示するように
- Enhance: Playの説明欄にMFMを使えるように
- Enhance: チャンネルノートの場合は詳細ページからその前後のノートを見れるように
- Enhance: 季節に応じた画面の演出を南半球でも利用できるように
- Enhance: タイムラインフィルターの設定をすべて保持できるように
	- 今までの「TLに他の人への返信を含める」設定は一旦リセットされます
- Enhance: タイムラインフィルターに「センシティブなファイルを含むノートを表示」を追加
- Enhance: ノート作成画面のファイル添付メニューから直接ファイルを削除できるように
- Enhance: MFMの属性でオートコンプリートが使用できるように #12735
- Enhance: 絵文字編集ダイアログをモーダルではなくウィンドウで表示するように
- Enhance: リモートのユーザーはメニューから直接リモートで表示できるように
- Enhance: リモートへの引用リノートと同一のリンクにはリンクプレビューを表示しないように
- Enhance: コードのシンタックスハイライトにテーマを適用できるように
- Enhance: リアクション権限がない場合、ハートにフォールバックするのではなくリアクションピッカーなどから打てないように
  - リモートのユーザーにローカルのみのカスタム絵文字をリアクションしようとした場合
  - センシティブなリアクションを認めていないユーザーにセンシティブなカスタム絵文字をリアクションしようとした場合
  - ロールが必要な絵文字をリアクションしようとした場合
- Enhance: ページ遷移時にPlayerを閉じるように
- Enhance: 通報ページのユーザをクリックした際にユーザをウィンドウで開くように
- Enhance: ノートの通報時にリモートのノートであっても自インスタンスにおけるノートのリンクを含むように
- Enhance: オフライン表示のデザインを改善・多言語対応
- Fix: ネイティブモードの絵文字がモノクロにならないように
- Fix: v2023.12.0で追加された「モデレーターがユーザーのアイコンもしくはバナー画像を未設定状態にできる機能」が管理画面上で正しく表示されていない問題を修正
- Fix: AiScriptの`readline`関数が不正な値を返すことがある問題のv2023.12.0時点での修正がPlay以外に適用されていないのを修正
- Fix: v2023.12.1で追加された`$[clickable ...]`および`onClickEv`が正しく機能していないのを修正
- Fix: Renoteのキーボードショートカットが機能していなかった問題を修正
- Fix: 投稿フォームでアンケートの日時指定をした状態で再読み込みをすると期日が復元されない問題を修正
- Fix: アンケートを設定したノートを「削除して編集」をするとアンケートの期日が引き継がれず、リセットされてしまう問題を修正
- Fix: デッキのプロファイル作成時に名前を空にできる問題を修正
- Fix: テーマ作成時に名称が空欄でも作成できてしまう問題を修正
- Fix: プラグインで`Plugin:register_note_post_interruptor`を使用すると、ノートが投稿できなくなる問題を修正
- Fix: iOSで大きな画像を変換してアップロードできない問題を修正
- Fix: 「アニメーション画像を再生しない」もしくは「データセーバー（アイコン）」を有効にしていても、アイコンデコレーションのアニメーションが停止されない問題を修正
- Fix: 画像をクロップするとクロップ後の解像度が異様に低くなる問題の修正
- Fix: 画像をクロップ時、正常に完了できない問題の修正
- Fix: キャプションが空の画像をクロップするとキャプションにnullという文字列が入ってしまう問題の修正
- Fix: プロフィールを編集してもリロードするまで反映されない問題を修正
- Fix: エラー画像URLを設定した後解除すると，デフォルトの画像が表示されない問題の修正
- Fix: MkCodeEditorで行がずれていってしまう問題の修正
- Fix: Summaly proxy利用時にプレイヤーが動作しないことがあるのを修正 #13196

### Server
- Enhance: 連合先のレートリミットを超過した際にリトライするようになりました
- Enhance: ActivityPub Deliver queueでBodyを事前処理するように (#12916)
- Enhance: クリップをエクスポートできるように
- Enhance: `/files`のファイルに対してHTTP Rangeリクエストを行えるように
- Enhance: `api.json`のOpenAPI Specificationを3.1.0に更新
- Enhance: 連合向けのノート配信を軽量化 #13192
- Fix: `drive/files/update`でファイル名のバリデーションが機能していない問題を修正
- Fix: `notes/create`で、`text`が空白文字のみで構成されているか`null`であって、かつ`text`だけであるリクエストに対するレスポンスが400になるように変更
- Fix: `notes/create`で、`text`が空白文字のみで構成されていてかつリノート、ファイルまたは投票を含んでいるリクエストに対するレスポンスの`text`が`""`から`null`になるように変更
- Fix: ipv4とipv6の両方が利用可能な環境でallowedPrivateNetworksが設定されていた場合プライベートipの検証ができていなかった問題を修正
- Fix: properly handle cc followers
- Fix: ジョブに関する設定の名前を修正 relashionshipJobPerSec -> relationshipJobPerSec
- Fix: コントロールパネル->モデレーション->「誰でも新規登録できるようにする」の初期値をONからOFFに変更 #13122
- Fix: リモートユーザーが復活してもキャッシュにより該当ユーザーのActivityが受け入れられないのを修正 #13273

## 2023.12.2

### General
- v2023.12.1でDockerを利用してサーバーを起動できない問題を修正

### Client
- Enhance: 検索画面においてEnterキー押下で検索できるように

## 2023.12.1

### Note
- アクセストークンの権限が再整理されたため、一部のAPIが古いAPIトークンでは動作しなくなりました。\
  権限不足になる場合には権限を再設定して再生成してください。

### General
- Enhance: ローカリゼーションの更新
- Fix: 自分のdirect noteがuser list timelineに追加されない

### Client
- Feat: AiScript専用のMFM構文`$[clickable.ev=EVENTNAME ...]`を追加。`Mk:C:mfm`のオプション`onClickEv`に関数を渡すと、クリック時に`EVENTNAME`を引数にして呼び出す
- Enhance: MFM入力補助ボタンを投稿フォームに表示できるように #12787
- Fix: 一部のモデログ(logYellowでの表示対象)について、表示の色が変わらない問題を修正
- Fix: `fg`/`bg`MFMに長い単語を指定すると、オーバーフローされずはみ出る問題を修正

### Server
- Enhance: センシティブワードの設定がハッシュタグトレンドにも適用されるようになりました
- Enhance: `oauth/token`エンドポイントのCORS対応
- Fix: 1702718871541-ffVisibility.jsのdownが壊れている
- Fix:「非センシティブのみ（リモートはいいねのみ）」を設定していても、センシティブに設定されたカスタム絵文字をリアクションできる問題を修正
- Fix: ロールアサイン時の通知で，ロールアイコンが縮小されずに表示される問題を修正
- Fix: サードパーティアプリケーションがWebsocket APIに無条件にアクセスできる問題を修正
- Fix: サードパーティアプリケーションがユーザーの許可なしに非公開の情報を見ることができる問題を修正

## 2023.12.0

### Note
- 依存関係の更新に伴い、Node.js 20.10.0が最小要件になりました
- 絵文字の追加辞書を既にインストールしている場合は、お手数ですが再インストールのほどお願いします
- 絵文字ピッカーにピン留め表示する絵文字設定が「リアクション用」と「絵文字入力用」に分かれました。以前の設定は「リアクション用」として使用されます。  

	**影響：**  
	それにより、投稿フォームから表示される絵文字ピッカーのピン留め絵文字がリセットされたように感じるかもしれません（新設された"ピン留め（全般）"の設定が使われるため）。   
	投稿用のピン留め絵文字をアップデート前の状態にするには、以下の手順で操作します。

	1. 「設定」メニューに移動し、「絵文字ピッカー」タブを選択します。
	2. 「ピン留 (全般)」のタブを選択します。
	3. 「リアクション設定から上書きする」ボタンを押すことで、アップデート前の状態に戻すことができます。

### General
- Feat: メールアドレスの認証にverifymail.ioを使えるように (cherry-pick from https://github.com/TeamNijimiss/misskey/commit/971ba07a44550f68d2ba31c62066db2d43a0caed)
- Feat: モデレーターがユーザーのアイコンもしくはバナー画像を未設定状態にできる機能を追加 (cherry-pick from https://github.com/TeamNijimiss/misskey/commit/e0eb5a752f6e5616d6312bb7c9790302f9dbff83)
- Feat: TL上からノートが見えなくなるワードミュートであるハードミュートを追加
- Enhance: 指定したドメインのメールアドレスの登録を弾くことができるように
- Enhance: 公開ロールにアサインされたときに通知が作成されるように
- Enhance: アイコンデコレーションを複数設定できるように
- Enhance: アイコンデコレーションの位置を微調整できるように
- Enhance: つながりの公開範囲をフォロー/フォロワーで個別に設定可能に #12072
- Enhance: ローカリゼーションの更新
- Enhance: 依存関係の更新
- Fix: MFM `$[unixtime ]` に不正な値を入力した際に発生する各種エラーを修正

### Client
- Feat: 今日誕生日のフォロー中のユーザーを一覧表示できるウィジェットを追加
- Feat: 画面に雪を降らせられるように
- Enhance: MFMのアニメーション要素（`tada`, `jelly`, `twitch`, `shake`, `spin`, `jump`, `bounce`, `rainbow`）に `delay` オプションを追加
- Enhance: センシティブと判断されたウェブサイトのサムネイルを非表示に
  - ウェブサイトをセンシティブと判断する仕組みが動いていないため、summalyProxyを使用しないと機能しません。
- Enhance: 投稿フォームの絵文字ピッカーをリアクション時に使用するものと同じのを使用するように #12336 #12560
- Enhance: リアクション用ピン留め絵文字と投稿時の絵文字入力用ピン留め絵文字を分けて設定できるように #12560
- Enhance: 絵文字のオートコンプリート機能強化 #12364
- Enhance: ユーザーのRawデータを表示するページが復活
- Enhance: リアクション選択時に音を鳴らせるように
- Enhance: サウンドにドライブのファイルを使用できるように
- Enhance: ナビゲーションバーに項目「キャッシュを削除」を追加
- Enhance: Shareページで投稿を完了すると、親ウィンドウ（親フレーム）にpostMessageするように
- Enhance: チャンネル、クリップ、ページ、Play、ギャラリーにURLのコピーボタンを設置 #11305
- Enhance: ノートプレビューに「内容を隠す」が反映されるように
- Enhance: データセーバーでコードハイライトの読み込みを削減できるように
- Enhance: データセーバーの適用範囲を個別で設定できるように
	- 従来のデータセーバーの設定はリセットされます
- Enhance: タイムライン上のタブからリスト、アンテナ、チャンネルの管理ページにジャンプできるように
- Enhance: ユーザー名、プロフィール、お知らせ、ページの編集画面でMFMや絵文字のオートコンプリートが使用できるように
- Enhance: プロフィール、お知らせの編集画面でMFMのプレビューを表示できるように
- Enhance: 絵文字の詳細ページに記載される情報を追加
- Enhance: リアクションの表示幅制限を設定可能に
- Enhance: Unicode 15.0のサポート
- Enhance: コードブロックのハイライト機能を利用するには言語を明示的に指定させるように
	- MFMでコードブロックを利用する際に意図しないハイライトが起こらないようになりました
	- 逆に、MFMでコードハイライトを利用したい際は言語を明示的に指定する必要があります  
	（例: ` ```js ` → Javascript, ` ```ais ` → AiScript）
-	Enhance: 絵文字などのオートコンプリートでShift+Tabを押すと前の候補を選択できるように
- Enhance: チャンネルに新規の投稿がある場合にバッジを表示させる
- Enhance: サウンド設定に「サウンドを出力しない」と「Misskeyがアクティブな時のみサウンドを出力する」を追加
- Enhance: 設定したタグをトレンドに表示させないようにする項目を管理画面で設定できるように
- Enhance: 絵文字ピッカーのカテゴリに「/」を入れることでフォルダ分け表示できるように
- Fix: 「設定のバックアップ」で一部の項目がバックアップに含まれていなかった問題を修正
- Fix: ウィジェットのジョブキューにて音声の発音方法変更に追従できていなかったのを修正 #12367
- Fix: コードエディタが正しく表示されない問題を修正
- Fix: プロフィールの「ファイル」にセンシティブな画像がある際のデザインを修正
- Fix: 一度に大量の通知が入った際に通知音が音割れする問題を修正
- Fix: 共有機能をサポートしていないブラウザの場合は共有ボタンを非表示にする #11305
- Fix: 通知のグルーピング設定を変更してもリロードされるまで表示が変わらない問題を修正 #12470
- Fix: 長い名前のチャンネルにおける投稿フォームの表示が崩れる問題を修正
- Fix: セキュリティ向上のためAiScriptの`Mk:apiExternal`を無効化
- Fix: ノート中の絵文字をタップして「リアクションする」からリアクションした際にリアクションサウンドが鳴らない不具合を修正
- Fix: ノート中のリアクションの表示を微調整 #12650
- Fix: AiScriptの`readline`が不正な値を返すことがある問題を修正
- Fix: 投票のみ/画像のみの引用RNが、通知欄でただのRNとして判定されるバグを修正
- Fix: CWをつけて引用RNしても、普通のRNとして扱われてしまうバグを修正しました。
- Fix: 「画像が1枚のみのメディアリストの高さ」を「デフォルト」以外に設定していると、CWの中などに添付された画像が見られないバグを修正
- Fix: DeepL TranslationのPro accountトグルスイッチが表示されていなかったのを修正
- Fix: twitterの埋め込みカード内リンクからリンク先を開けない問題を修正
- Fix: WebKitブラウザー上でも「デバイスの画面を常にオンにする」機能が効くように
- Fix: ページ一覧ページの表示がモバイル環境において崩れているのを修正
- Fix: MFMでルビの中のテキストがnyaizeされない問題を修正

### Server
- Enhance: MFM `$[ruby ]` が他ソフトウェアと連合されるように
- Enhance: Meilisearchを有効にした検索で、ユーザーのミュートやブロックを考慮するように
- Enhance: カスタム絵文字のインポート時の動作を改善
- Enhance: json-schema(OpenAPIの戻り値として使用されるスキーマ定義)を出来る限り最新化 #12311
- Fix: 時間経過により無効化されたアンテナを再有効化したとき、サーバ再起動までその状況が反映されないのを修正 #12303
- Fix: ロールタイムラインが保存されない問題を修正
- Fix: api.jsonの生成ロジックを改善 #12402
- Fix: 招待コードが使い回せる問題を修正
- Fix: 特定の条件下でチャンネルやユーザーのノート一覧に最新のノートが表示されなくなる問題を修正
- Fix: 何もノートしていないユーザーのフィードにアクセスするとエラーになる問題を修正
- Fix: リストタイムラインにてミュートが機能しないケースがある問題と、チャンネル投稿がストリーミングで流れてきてしまう問題を修正 #10443
- Fix: 「みつける」のなかにミュートしたユーザが現れてしまう問題を修正 #12383
- Fix: Social/Local/Home Timelineにてインスタンスミュートが効かない問題
- Fix: ユーザのノート一覧にてインスタンスミュートが効かない問題
- Fix: チャンネルのノート一覧にてインスタンスミュートが効かない問題
- Fix: 「みつける」が年越し時に壊れる問題を修正
- Fix: アカウントをブロックした際に、自身のユーザーのページでノートが相手に表示される問題を修正
- Fix: モデレーションログがモデレーターは閲覧できないように修正
- Fix: ハッシュタグのトレンド除外設定が即時に効果を持つように修正
- Fix: HTTP Digestヘッダのアルゴリズム部分に大文字の"SHA-256"しか使えない

## 2023.11.1

### Note
- 悪意のある第三者がリモートユーザーになりすました任意のアクティビティを受け取れてしまう問題を修正しました。詳しくは[GitHub security advisory](https://github.com/misskey-dev/misskey/security/advisories/GHSA-3f39-6537-3cgc)をご覧ください。

### General
- Feat: 管理者がコントロールパネルからメールアドレスの照会を行えるようになりました
- Enhance: ローカリゼーションの更新
- Enhance: 依存関係の更新

### Client
- Enhance: MFMでルビを振れるように
	- 例: `$[ruby 三須木 みすき]`
- Enhance: MFMでUNIX時間を指定して日時を表示できるように
	- 例: `$[unixtime 1701356400]`
- Enhance: プラグインでエラーが発生した場合のハンドリングを強化
- Enhance: 細かなUIのブラッシュアップ
- Fix: 効果音が再生されるとデバイスで再生している動画や音声が停止する問題を修正 #12339
- Fix: デッキに表示されたチャンネルの表示先チャンネルを切り替えた際、即座に反映されない問題を修正 #12236
- Fix: プラグインでノートの表示を書き換えられない問題を修正
- Fix: アイコンデコレーションが見切れる場合がある問題を修正
- Fix: 「フォロー中の人全員の返信を含める/含めないようにする」のボタンを押下した際の確認が機能していない問題を修正
- Fix: 非ログイン時に「メモを追加」を表示しないように変更 #12309
- Fix: 絵文字ピッカーでの検索が更新されない問題を修正
- Fix: 特定の条件下でノートがnyaizeされない問題を修正

### Server
- Enhance: FTTのデータベースへのフォールバック処理を行うかどうかを設定可能に
- Fix: トークンのないプラグインをアンインストールするときにエラーが出ないように
- Fix: 投稿通知がオンでもダイレクト投稿はユーザーに通知されないようにされました
- Fix: ユーザタイムラインの「ノート」選択時にリノートが混ざり込んでしまうことがある問題の修正 #12306
- Fix: LTLに特定条件下にてチャンネルへの投稿が混ざり込む現象を修正
- Fix: ActivityPub: 追加情報のカスタム絵文字がユーザー情報のtagに含まれない問題を修正
- Fix: ActivityPubに関するセキュリティの向上
- Fix: 非公開の投稿に対して返信できないように

## 2023.11.0

### Note
- iOS 16.4未満を使用している場合はiOS 16.4以上にアップデートをお願いします

### General
- Feat: アイコンデコレーション機能
	- サーバーで用意された画像をアイコンに重ねることができます
	- 画像のテンプレートはこちらです: https://misskey-hub.net/brand-assets/
		- 最大でも黄色いエリア内にデコレーションを収めることを推奨します。
		- 画像は512x512pxを推奨します。
- Feat: チャンネル設定にリノート／引用リノートの可否を設定できる項目を追加
- Enhance: アカウント登録時のメールアドレス認証に30分の有効期限を設定
  - 有効期限が切れた後であれば、登録時に使用した招待コードを再度利用できるように変更しました。
  - ユーザーが誤ったメールアドレスを入力した場合に招待コードが失効してしまう問題が解消されます。
- Enhance: すでにフォローしたすべての人の返信をTLに追加できるように
- Enhance: 未読の通知数を表示できるように
- Enhance: 通知されず、確認の必要もないお知らせ(silence)を作成可能になりました
- Enhance: ローカリゼーションの更新
- Enhance: 依存関係の更新
- Change: CWを使用する場合、注釈を空にすることは許可されなくなりました

### Client
- Feat: プラグイン・テーマを外部サイトから直接インストールできるようになりました
	- 外部サイトでの実装が必要です。詳細は Misskey Hub をご覧ください
	  https://misskey-hub.net/docs/for-developers/publish-on-your-website/
- Feat: 通知をグルーピングして表示するオプション(オプトアウト)
- Feat: Misskeyの基本的なチュートリアルを実装
- Feat: スワイプしてタイムラインを再読込できるように
	- PCの場合は右上のボタンからでも再読込できます
- Enhance: タイムラインの自動更新を無効にできるように
- Enhance: コードのシンタックスハイライトエンジンをShikiに変更
  - AiScriptのシンタックスハイライトに対応
  - MFMでAiScriptをハイライトする場合、コードブロックの開始部分を ` ```is ` もしくは ` ```aiscript ` としてください
- Enhance: データセーバー有効時はアニメーション付きのアバター画像が停止するように
- Enhance: プラグインを削除した際には、使用されていたアクセストークンも同時に削除されるようになりました
- Enhance: プラグインで`Plugin:register_note_view_interruptor`を用いてnoteの代わりにnullを返却することでノートを非表示にできるようになりました
- Enhance: AiScript関数`Mk:nyaize()`が追加されました
- Enhance: 情報→ツール はナビゲーションバーにツールとして独立した項目になりました
- Enhance: ノート内の絵文字をクリックすることで、コピーおよびリアクションができるように
- Enhance: その他細かなブラッシュアップ
- Fix: 投稿フォームでのユーザー変更がプレビューに反映されない問題を修正
- Fix: ユーザーページの ノート > ファイル付き タブにリプライが表示されてしまう
- Fix: 「検索」MFMにおいて一部の検索キーワードが正しく認識されない問題を修正
- Fix: 一部の言語でMisskey Webがクラッシュする問題を修正
- Fix: チャンネルの作成・更新時に失敗した場合何も表示されない問題を修正 #11983
- Fix: 個人カードのemojiがバッテリーになっている問題を修正
- Fix: 標準テーマと同じIDを使用してインストールできてしまう問題を修正
- Fix: 絵文字ピッカーでバッテリーの絵文字が複数表示される問題を修正 #12197
- Fix: 11以上されているリアクションにおいてツールチップで示されるリアクション数が本来よりも1多い問題を修正 #12174
- Fix: サイレンス状態で公開範囲のパブリックを選択できてしまう問題を修正 #12224
- Fix: In deck layout, replies option is not saved after refresh
- Fix: アーカイブしたお知らせがコントロールパネルに表示される問題を修正
- Note: アップデート後、サウンドに関する設定が初期化されます

### Server
- Feat: Registry APIがサードパーティから利用可能になりました
- Enhance: RedisへのTLのキャッシュ(FTT)をオフにできるように
- Enhance: フォローしているチャンネルをフォロー解除した時（またはその逆）、タイムラインに反映される間隔を改善
- Enhance: プロフィールの自己紹介欄のMFMが連合するようになりました
	- 相手がMisskey v2023.11.0以降である必要があります
- Enhance: チャンネル取得時のパフォーマンスを向上
- Enhance: AP: ApplicationタイプのアカウントをisBotとして扱うように
- Fix: リストTLに自分のフォロワー限定投稿が含まれない問題を修正
- Fix: ローカルタイムラインに投稿者自身の投稿への返信が含まれない問題を修正
- Fix: 自分のフォローしているユーザーの自分のフォローしていないユーザーの visibility: followers な投稿への返信がストリーミングで流れてくる問題を修正
- Fix: RedisへのTLキャッシュが有効の場合にHTL/LTL/STLが空になることがある問題を修正
- Fix: STLでフォローしていないチャンネルが取得される問題を修正
- Fix: `hashtags/trend`にてRedisからトレンドの情報が取得できない際にInternal Server Errorになる問題を修正
- Fix: HTLをリロードまたは遡行したとき、フォローしているチャンネルのノートが含まれない問題を修正 #11765 #12181
- Fix: リノートをリノートできるのを修正
- Fix: アクセストークンを削除すると、通知が取得できなくなる場合がある問題を修正
- Fix: 自身の宛先なしダイレクト投稿がストリーミングで流れてこない問題を修正
- Fix: サーバーサイドからのテスト通知を正しく行えるように修正
- Fix: GTLの「リノートを表示」オプションが機能しないのを修正 #12233

## 2023.10.2

### General
- Feat: アンテナでローカルの投稿のみ収集できるようになりました
- Feat: サーバーサイレンス機能が追加されました
- Enhance: 新規にフォローした人の返信をデフォルトでTLに追加できるオプションを追加
- Enhance: HTL/LTL/STLを2023.10.0アップデート以前まで遡れるように
- Enhance: フォロー/フォロー解除したときに過去分のHTLにも含まれる投稿が反映されるように
- Enhance: ローカリゼーションの更新
- Enhance: 依存関係の更新

### Client
- Enhance: TLの返信表示オプションを記憶するように
- Enhance: 投稿されてから時間が経過しているノートであることを視覚的に分かりやすく

### Server
- Enhance: タイムライン取得時のパフォーマンスを向上
- Enhance: ストリーミングAPIのパフォーマンスを向上
- Fix: users/notesでDBから参照した際にチャンネル投稿のみ取得される問題を修正
- Fix: コントロールパネルの設定項目が正しく保存できない問題を修正
- Fix: 管理者権限のロールを持っていても一部のAPIが使用できないことがある問題を修正
- Change: ユーザーのisCatがtrueでも、サーバーではnyaizeが行われなくなりました
  - isCatな場合、クライアントでnyaize処理を行うことを推奨します

## 2023.10.1
### General
- Enhance: ローカルタイムライン、ソーシャルタイムラインで返信を含むかどうか設定可能に

### Client
- Fix: 絵文字ピッカーで横に長いカスタム絵文字が見切れる問題を修正

### Server
- Fix: フォローしているユーザーからの自分の投稿への返信がタイムラインに含まれない問題を修正
- Fix: users/notesでセンシティブチャンネルの投稿が含まれる場合がある問題を修正

## 2023.10.0
### NOTE
- 2023.9.2で導入されたノート編集機能はクオリティの高い実装が困難であることが判明したため撤回されました
- アップデートを行うと、タイムラインが一時的にリセットされます
	- アンテナ内のノートも含む
- ソフトミュート設定はクライアントではなくサーバー側に保存されるようになったため、アップデートを行うとソフトミュートの設定がリセットされます

### Changes
- API: users/notes, notes/local-timeline で fileType 指定はできなくなりました
- API: notes/featured でページネーションは他APIと同様 untilId を使って行うようになりました

### General
- Feat: ユーザーごとに他ユーザーへの返信をタイムラインに含めるか設定可能になりました
- Feat: ユーザーリスト内のメンバーごとに他ユーザーへの返信をユーザーリストタイムラインに含めるか設定可能になりました
- Feat: ユーザーごとのハイライト
- Feat: プライバシーポリシー・運営者情報（Impressum）の指定が可能になりました
	- プライバシーポリシーはサーバー登録時に同意確認が入ります
- Feat: タイムラインがリアルタイム更新中に広告を挿入できるようになりました
	- デフォルトは無効
	- 頻度はコントロールパネルから設定できます。運営中のサーバーのTLの流速を見て、最適な値を指定してください。
- Enhance: ソフトワードミュートとハードワードミュートは統合されました
- Enhance: モデレーションログ機能の強化
- Enhance: ローカリゼーションの更新
- Enhance: 依存関係の更新
- Fix: ダイレクト投稿をリノートできてしまう問題を修正
- Fix: ユーザーリストTLにチャンネル投稿が含まれる問題を修正

### Client
- Feat: 「ファイルの詳細」ページを追加
	- ドライブのファイルの拡大プレビューができるように
	- ファイルが添付されたノートの一覧が表示できるように
- Enhance: 二要素認証のバックアップコード一覧をテキストファイルでダウンロード可能に
- Enhance: 動画再生時のデフォルトボリュームを30%に
- Fix: リアクションしたユーザ一覧のUIが稀に左上に残ってしまう不具合を修正

### Server
- Enhance: drive/files/attached-notes がページネーションに対応しました
- Enhance: タイムライン取得時のパフォーマンスを大幅に向上
- Enhance: ハイライト取得時のパフォーマンスを大幅に向上
- Enhance: トレンドハッシュタグ取得時のパフォーマンスを大幅に向上
- Enhance: WebSocket接続が多い場合のパフォーマンスを向上
- Enhance: 不要なPostgreSQLのインデックスを削除しパフォーマンスを向上
- Fix: 連合なしアンケートに投票をするとUpdateがリモートに配信されてしまうのを修正
- Fix: nodeinfoにおいてCORS用のヘッダーが設定されていないのを修正
- Fix: 同じ種類のTLのストリーミングを複数接続できない問題を修正
- Fix: アンテナTLを途中までしかページネーションできなくなることがある問題を修正
- Fix: 「ファイル付きのみ」のTLでファイル無しの新着ノートが流れる問題を修正
- Fix: プロセスが終了しない、あるいは非常に時間がかかる問題を修正

## 2023.9.3
### General
- Enhance: ノートの翻訳機能の利用可否をロールで設定可能に

### Client
- Enhance: AiScriptでホストのアドレスを参照する定数`SERVER_URL`を追加
- Enhance: モデレーションログ機能の強化
- Enhance: ローカリゼーションの更新

### Server
- Fix: Redisに古いバージョンのキャッシュが残っている場合、キャッシュが消えるまでの間通知が届かなくなる問題を修正
- Fix: 後方互換性の修正

## 2023.9.2

### General
- Feat: ノートの編集をできるように
	- ロールで編集可否を設定可能
- Feat: 通知を種類ごとに 全員から受け取る/フォロー中のユーザーのみ受け取る/フォロワーのみ受け取る/相互のみ受け取る/指定したリストのメンバーのみ受け取る/受け取らない から選べるように
- Enhance: タイムラインからRenoteを除外するオプションを追加
- Enhance: ユーザーページのノート一覧でRenoteを除外できるように
- Enhance: タイムラインでファイルが添付されたノートのみ表示するオプションを追加
- Enhance: モデレーションログ機能の強化
- Enhance: 依存関係の更新
- Enhance: ローカリゼーションの更新

### Client
- Enhance: Plugin:register_post_form_actionを用いてCWを取得・変更できるように
- Enhance: admin/ad/listにて掲載中の広告が絞り込めるように
- Enhance: AiScriptにリモートサーバーのAPIを叩く用の関数を追加（`Mk:apiExternal`）

### Server
- Enhance: MasterプロセスのPIDを書き出せるように
- Enhance: admin/ad/createにてレスポンス200、設定した広告情報を返すように

## 2023.9.1

### General
- Enhance: モデレーションログ機能の強化

### Client
- Fix: ノートのメニューにある「詳細」ボタンの表示がログイン/ログアウト状態で統一されていない問題を修正

### Server
- Fix: お知らせのページネーションが機能しない
- Fix: 「ユーザーの新規投稿」の通知設定を切り替えるとサーバー内部エラーが出る

## 2023.9.0

### Note
- meilisearchを使用する場合、v1.2以上が必要です

### General
- Feat: OAuth 2.0のサポート
- Feat: お知らせ機能の強化
	- ユーザー個別のお知らせを作成可能に
	- お知らせのバナー表示やダイアログ表示が可能に
	- お知らせのアイコンを設定可能に
- Feat: チャンネルをセンシティブ指定できるようになりました
	- センシティブチャンネルのNoteのReNoteはデフォルトでHome TLに流れるようになりました
	- センシティブチャンネルのノートはユーザープロフィールに表示されません
- Feat: 二要素認証のバックアップコードが生成されるようになりました
	- ref. https://github.com/MisskeyIO/misskey/pull/121
- Feat: 二要素認証でパスキーをサポートするようになりました
- Feat: 指定したユーザーが投稿したときに通知できるようになりました
- Feat: プロフィールでのリンク検証
- Feat: モデレーションログ機能
- Feat: 通知をテストできるようになりました
- Feat: PWAのアイコンが設定できるようになりました
- Enhance: サーバー名の略称が設定できるようになりました
- Enhance: アンテナの受信ソースに指定したユーザを除外するものを追加
- Enhance: 二要素認証設定時のセキュリティを強化
	- パスワード入力が必要な操作を行う際、二要素認証が有効であれば確認コードの入力も必要になりました
- Enhance: manifest.jsonをオーバーライド可能に
- Enhance: 依存関係の更新
- Enhance: ローカリゼーションの更新

### Client
- Feat: 任意のユーザーリストをタイムラインページにピン留めできるように
	- 設定->クライアント設定->全般 から設定可能です
- Feat: Playで直接投稿フォームを埋め込めるように(`Ui:C:postForm`)
- Feat: クライアントを起動している間、デバイスの画面が自動でオフになるのを防ぐオプションを追加
- Feat: 新しい実績を追加
- Enhance: ノート詳細ページでリノート一覧、リアクション一覧タブを追加
	- ノートのメニューからは当該項目は消えました
- Enhance: センシティブなメディアを目立たせる設定を追加
- Enhance: プロフィールにその人が作ったPlayの一覧出せるように
- Enhance: メニューのスイッチの動作を改善
- Enhance: 絵文字ピッカーの検索の表示件数を100件に増加
- Enhance: 投稿フォームのプレビューの表示状態を記憶するように
- Enhance: ユーザーメニューでスイッチでユーザーリストに追加・削除できるように
- Enhance: 自分が押したリアクションのデザインを改善
- Enhance: ノート検索にローカルのみ検索可能なオプションの追加
- Enhance: Renote自体を通報できるように
- Enhance: データセーバーモードの強化
- Enhance: Renoteを管理者権限で削除可能に
- Enhance: `$[rainbow ]`記法が、動きのあるMFMが無効になっていても使用できるようになりました
- Enhance: Playの操作を行うAPI TokenをAPIコンソールから発行できるように
- Enhance: リアクションの表示サイズをより大きくできるように
- Enhance: AiScriptを0.16.0に更新
- Enhance: AiScriptからMisskeyサーバーAPIを呼び出す際の制限を撤廃
- Enhance: AiScriptで`LOCALE`として現在の設定言語を取得できるように
- Enhance: Mk:apiが失敗した時にエラー型の値（AiScript 0.16.0で追加）を返すように
- Enhance: ScratchpadでAsync:系関数やボタンのコールバックなどのエラーにもダイアログを出すように（試験的なためPlayなどには未実装）
- Enhance: ノート詳細ページ読み込み時のパフォーマンスが向上しました
- Enhance: タイムラインでリスト/アンテナ選択時のパフォーマンスを改善
- Enhance: 「Moderation note」、「Add moderation note」をローカライズできるように
- Enhance: プラグインのソースコードを確認・コピーできるように
- Enhance: 細かなデザインの調整
- Fix: サーバー情報画面(`/instance-info/{domain}`)でブロックができないのを修正
- Fix: 未読のお知らせの「わかった」をクリック・タップしてもその場で「わかった」が消えない問題を修正
- Fix: iOSで画面を回転させるとテキストサイズが変わる問題を修正
- Fix: word mute for sub note is not applied
- Fix: タイムラインを下にスクロールしてノート画面に移動して再び戻ったら以前のスクロール位置を失う問題を修正
- Fix: Misskeyプラグインをインストールする際のAiScriptバージョンのチェックが0.14.0以降に対応していない問題を修正
- Fix: 他のサーバーのユーザーへ「メッセージを送信」した時の初期テキストのメンションが間違っている問題を修正
- Fix: 環境によってはMisskey Webが開けない問題を修正
- Fix: プラグインの権限リストが見れない問題を修正
- Fix: 複数の階層があるメニューで、短くタップすると正常に動かない場合がある問題を修正
- Fix: アニメーションがオフのとき、スマホで子メニューの選択ができない問題を修正
- Fix: ドロワーメニューで、親メニュー項目をマウスでホバーすると子メニューが表示されてしまう問題を修正
- Fix: AiScriptでMk:apiが外部と通信できる問題を修正

### Server
- Change: cacheRemoteFilesの初期値はfalseになりました
- Enhance: ファイルアップロード時等にファイル名の拡張子を修正する関数(correctFilename)の挙動を改善
- Enhance: Webhookのペイロードにサーバーのurlが含まれるようになりました
- Enhance: Webhook設定でsecretを空に出来るように
- Enhance: 使われていないアンテナの自動停止を設定可能に
- Enhance: nodeinfo 2.1対応
- Enhance: 自分へのメンション一覧を取得する際のパフォーマンスを向上
- Enhance: Docker環境でjemallocを使用することでメモリ使用量を削減
- Enhance: ID生成方式としてaidxを追加、かつデフォルトに
- Enhance: Add address bind config option (outgoingAddress)
- Fix: MK_ONLY_SERVERオプションを指定した際にクラッシュする問題を修正
- Fix: notes/reactionsのページネーションが機能しない問題を修正
- Fix: ノート検索 `notes/search` にてhostを指定した際に検索結果に反映されるように
- Fix: 一部のfeatured noteを照会できない問題を修正
- Fix: muteがapiからのuser list timeline取得で機能しない問題を修正
- Fix: ジョブキュー管理画面の認証を回避できる問題を修正
- Fix: 一部のサーバー内部エラーがスタックトレースを返さないように修正
- Fix: 一部のリモートユーザーをフォローすることができない問題を修正

## 13.14.2

### Client
- リストTLで、ユーザーが追加・削除されてもTLを初期化しないように
- URL取得変数を関数に変更　CURRENT_URL -> Mk:url()
- Fix: モバイル表示のときページ下部がナビゲーションバーに隠れる問題を修正
- Fix: 一部モーダルダイアログでスクロールできない問題を修正
- Fix: Selecting all emojis in Custom emoji is impossible
- Fix: PhotoSwipeによるメモリリークの修正

### Server
- Fix: APIのオフセットが壊れていたせいで「もっと見る」でもっと見れない問題を修正
- Fix: 外部サーバーの投稿がタイムラインに表示されないことがある問題を修正

## 13.14.1

### General
- 招待機能を改善しました
  * 過去に発行した招待コードを確認できるようになりました  
  * ロールごとに招待コードの発行数制限と制限対象期間、有効期限を設定できるようになりました  
  * 招待コードを作成したユーザーと使用したユーザーを確認できるようになりました  
- ユーザーにロールが期限付きでアサインされている場合、その期限をユーザーのモデレーションページで確認できるようになりました
- identicon生成を無効にしてパフォーマンスを向上させることができるようになりました
- サーバーのマシン情報の公開を無効にしてパフォーマンスを向上させることができるようになりました

### Client
- deck UIのカラムのメニューからアンテナとリストの編集画面を開けるように
- ドライブファイルのメニューで画像をクロップできるように
- 画像を動画と同様に簡単に隠せるように
- Enhance: ノートの埋め込みが複数画像と動画を表示されるように
- オリジナル画像を保持せずにアップロードする場合webpでアップロードされるように(Safari以外)
- 見たことのあるRenoteを省略して表示をオンのときに自分のnoteのrenoteを省略するように
- フォルダーやファイルに対しても開発者モード使用時、IDをコピーできるように
- 引用対象を「もっと見る」で展開した場合、「閉じる」で畳めるように
- プロフィールURLをコピーできるボタンを追加 #11190
- `CURRENT_URL`で現在表示中のURLを取得できるように(AiScript)
- ユーザーのContextMenuに「アンテナに追加」ボタンを追加
- フォローやお気に入り登録をしていないチャンネルを開く時は概要ページを開くように
- 画面ビューワをタップした場合、マウスクリックと同様に画像ビューワを閉じるように
- オフライン時の画面にリロードボタンを追加
- Renote時に公開範囲のデフォルト設定が適用されるように
- Deckで非ルートページにアクセスした際に簡易UIで表示しない設定を追加
- ロール設定画面でロールIDを確認できるように
- コンテキストメニュー表示時のパフォーマンスを改善
- フォロー/フォロワー非公開時の表示を改善
- 本文にMFMが含まれている場合に自動でたたまれる機能が、返信先や引用RNにも適用されるように
  - position は対象外になりました
- AiScriptを0.15.0に更新
- Fix: サーバーメトリクスが90度傾いている
- Fix: 非ログイン時にクレデンシャルが必要なページに行くとエラーが出る問題を修正
- Fix: sparkle内にリンクを入れるとクリック不能になる問題の修正
- Fix: ZenUIでポップアップの表示位置がおかしい問題を修正
- Fix: ページ遷移でスクロール位置が保持されない問題を修正
- Fix: フォルダーのページネーションが機能しない #11180
- Fix: 長い文章を投稿する際、プレビューが画面からはみ出る問題を修正
- Fix: システムフォント設定が正しく反映されない問題を修正
- Fix: アンケート終了時のプッシュ通知が正しく表示されない問題を修正
- Fix: MasterVolumeが0の時だけでなく各通知音の音量設定が0のときも、HTMLAudioElement.playが実行されないように変更

### Server
- JSON.parse の回数を削減することで、ストリーミングのパフォーマンスを向上しました
- nsfwjs のモデルロードを排他することで、重複ロードによってメモリ使用量が増加しないように
- 連合の配送ジョブのパフォーマンスを向上（ロック機構の見直し、Redisキャッシュの活用）
- featuredノートのsignedGet回数を減らしました
- ActivityPubの署名用鍵長を2048bitに変更しパフォーマンスを向上(新規アカウントのみ)
- リモートサーバーのセンシティブなファイルのキャッシュだけを無効化できるオプションを追加
- MeilisearchにIndexするノートの範囲を設定できるように
- Export notes with file detail
- Add unix socket support
- 設定ファイルでioredisの全てのオプションを指定可能に
- Fix: エクスポートしたカスタム絵文字のzipが大きいと読み込めない問題を修正
- Fix: リモートサーバーに無意味なActivityPubの配信を行うことがあるのを修正
- Fix: Remove Meilisearch index when notes are deleted
- Fix: 非英語環境でのPostgreSQLのエラーハンドリングを修正
- Fix: インスタンスのアイコンがbase64の場合の挙動を修正
- Fix: ローカルの `Person` を指す `acct` URI を解析するときのバグを修正しました
- Fix: 無効化されたアンテナが再度有効化されないことがある問題を修正

## 13.13.2

### General
- エラー時や項目が存在しないときなどのアイコン画像をサーバー管理者が設定できるように
- ロールが付与されているユーザーリストを非公開にできるように
- サーバーの負荷が非常に高いため、ユーザー統計表示機能を削除しました

### Client
- Fix: タブがバックグラウンドでもstreamが切断されないように

### Server
- Fix: キャッシュが溜まり続けないように

## 13.13.1

### Client
- Fix: タブがアクティブな間はstreamが切断されないように

### Server
- Fix: api/metaで`TypeError: JSON5.parse is not a function`エラーが発生する問題を修正

## 13.13.0

### General
- カスタム絵文字ごとにそれをリアクションとして使えるロールを設定できるように
- カスタム絵文字ごとに連合するかどうか設定できるように
- カスタム絵文字ごとにセンシティブフラグを設定できるように
- センシティブなカスタム絵文字のリアクションを受け入れない設定が可能に
- タイムラインにフォロイーの行った他人へのリプライを含めるかどうかの設定をアカウントに保存するのをやめるように
	- 今後はAPI呼び出し時およびストリーミング接続時に設定するようになります
- リストを公開できるようになりました

### Client
- リアクションの取り消し/変更時に確認ダイアログを出すように
- 開発者モードを追加
- AiScriptを0.13.3に更新
- Deck UIを使用している場合、`/`以外にアクセスした際にZen UIで表示するように
	- メインカラムを設置していない場合の問題を解決
- ハッシュタグのノート一覧ページから、そのハッシュタグで投稿するボタンを追加
- アカウント初期設定ウィザードに戻るボタンを追加
- アカウントの初期設定ウィザードにあとでボタンを追加
- サーバーにカスタム絵文字の種類が多い場合のパフォーマンスの改善
- Fix: URLプレビューで情報が取得できなかった際の挙動を修正
- Fix: Safari、Firefoxでの新規登録時、パスワードマネージャーにメールアドレスが登録されていた挙動を修正
- Fix: ロールタイムラインが無効でも投稿が流れてしまう問題の修正
- Fix: ロールタイムラインにて全ての投稿が流れてしまう問題の修正
- Fix: 「アクセストークンの管理」画面でアプリの情報が表示されない問題の修正
- Fix: Firefoxにおける絵文字ピッカーのTabキーフォーカス問題の修正
- Fix: フォローボタンがテーマのカラースキームによって視認性が悪くなる問題を修正
  - 新しいプロパティ `fgOnWhite` が追加されました

### Server
- bullをbull-mqにアップグレードし、ジョブキューのパフォーマンスを改善
- ストリーミングのパフォーマンスを改善
- Fix: 無効化されたアンテナにアクセスがあった際に再度有効化するように
- Fix: お知らせの画像URLを空にできない問題を修正
- Fix: i/notificationsのsinceIdが機能しない問題を修正
- Fix: pageのピン留めを解除することができない問題を修正

## 13.12.2

## NOTE
Meilisearchの設定に`index`が必要になりました。値はMisskeyサーバーのホスト名にすることをお勧めします(アルファベット、ハイフン、アンダーバーのみ使用可能)。例: `misskey-io`
過去に作成された`notes`インデックスは、`<index名>---notes`にリネームが必要です。例: `misskey-io---notes`

### General
- 投稿したコンテンツのAIによる学習を軽減するオプションを追加

### Client
- ユーザーを指定してのノート検索が可能に
- アカウント初期設定ウィザードにプライバシー設定を追加
- リテンション率チャートに折れ線グラフを追加
- Fix: ブラーエフェクトを有効にしている状態で高負荷になる問題を修正
- Fix: Pageにおいて画像ブロックに画像を設定できない問題を修正
- Fix: カラーバーがリプライには表示されないのを修正
- Fix: チャンネル内の検索ボックスが挙動不審な問題を修正
- Fix: リテンションチャートのレンダリングを修正
- Fix: リアクションエフェクトのレンダリングの問題を修正

### Server
- センシティブワードの登録にAnd、正規表現が使用できるようになりました。
- Fix: ひとつのMeilisearchサーバーを複数のMisskeyサーバーで使えない問題を修正

## 13.12.1

### Client
- プロフィール画面におけるモデレーションノートの表示を調整
- Fix: 一部ダイアログが表示されない問題を修正
- Fix: MkUserInfoのフォローボタンが変な位置にある問題を修正

### Server
- Fix: リモートサーバーの情報が更新できない問題を修正
- Fix: 13.11を経験しない状態で13.12にアップデートした場合ユーザープロフィール関連の画像が消失する問題を修正

## 13.12.0

### NOTE
- Node.js 18.16.0以上が必要になりました

### General
- アカウントの引っ越し（フォロワー引き継ぎ）に対応
- Meilisearchを全文検索に使用できるようになりました
  * 「フォロワーのみ」の投稿は検索結果に表示されません。
- 新規登録前に簡潔なルールをユーザーに表示できる、サーバールール機能を追加
- ユーザーへの自分用メモ機能
  * ユーザーに対して、自分だけが見られるメモを追加できるようになりました。  
    （自分自身に対してもメモを追加できます。）
  * ユーザーメニューから追加できます。  
    （デスクトップ表示ではusernameの右側のボタンからも追加可能）
- チャンネルに色を設定できるようになりました。各ノートに設定した色のインジケーターが表示されます。
- チャンネルをアーカイブできるようになりました。
	* アーカイブすると、チャンネル一覧や検索結果に表示されなくなり、新たな書き込みもできなくなります。
- アンテナのエクスポート・インポートができるようになりました
- ロールタイムラインをロールごとに表示するかどうかの選択できるようになりました。
	* デフォルトがオフになるので、ロールタイムラインを表示する場合はオンにしてください。
- ロールに強制的にNSFWを付与するポリシーを追加
	* アップロード済みのファイルはNSFWにならない為注意してください。
- モデレーションノートがユーザーのプロフィールページからも閲覧および編集できるようになりました。
- カスタム絵文字のライセンスを複数でセットできるようになりました。
- 管理者が予約ユーザー名を設定できるようになりました。
- Fix: フォローリクエストの通知が残る問題を修正

### Client
- アカウント作成時に初期設定ウィザードを表示するように
- チャンネル内検索ができるように
- チャンネル検索ですべてのチャンネルの取得/表示ができるように
- 通知の表示をカスタマイズできるように
- ドライブのファイル一覧から直接ノートを作成できるように
- ノートメニューからRenoteしたユーザーの一覧を見れるように
- コントロールパネルのカスタム絵文字ページおよびaboutのカスタム絵文字の検索インプットで、`:emojiname1::emojiname2:`のように検索して絵文字を検索できるように
  * 絵文字ピッカーから入力可能になります
- データセーバーモードを追加
  * 画像が全て隠れた状態で表示されるようになります
- 閲覧注意設定された画像は表示した状態でもそれが閲覧注意だと分かる表示をするように
- モデレーターはノートに添付された画像上から直接NSFW設定できるように
- 1枚だけのメディアリストの画像のアスペクト比を画像に応じて縦長にするように
- プロフィール設定「追加情報」の項目の削除と並び替えができるように
- 新しい実績を追加
- AiScriptを0.13.2に更新
- Fix: AiScript APIのMk:dialogで何も返していなかったのをNULLを返すように修正
- Fix: 1:1ではない画像のリアクション通知バッジが左や上に寄ってしまっていたのを中央に来るように修正
- Fix: リアクションをホバーした時のユーザーリストで猫耳が切れてしまっていた問題を修正
- Fix: NSFWメディアの上に表示された｢もっと見る｣ボタンが押しづらい問題を修正

### Server
- channel/searchのqueryが空の場合に全てのチャンネルを返すように変更
- 環境変数MISSKEY_CONFIG_YMLで設定ファイルをdefault.ymlから変更可能に
- Fix: 他のサーバーの情報が取得できないことがある問題を修正
- Fix: エクスポートデータの拡張子がunknownになる問題を修正
- Fix: Content-Dispositionのパースでエラーが発生した場合にダウンロードが完了しない問題を修正
- Fix: API: i/update avatarIdとbannerIdにnullを渡した時、画像がリセットされない問題を修正
- Fix: .wav, .flacが再生できない問題を修正（新しくアップロードされたファイルのみ修正が適用されます）
- Fix: 凍結されたユーザーが一部APIのレスポンスに含まれる問題を修正
- Fix: メモリの使用量を`used - buffers - cached`ではなく`total - available`で求めるように（環境によって正常に計測できていなかったため）

## 13.11.3

### General
- 指定したロールを持つユーザーのノートのみが流れるロールタイムラインを追加
	- Deckのカラムとしても追加可能
- カスタム絵文字関連の改善
  * ノートなどに含まれるemojis（populateEmojiの結果）は（プロキシされたURLではなく）オリジナルのURLを指すように
  * MFMでx3/x4もしくはscale.x/yが2.5以上に指定されていた場合にはオリジナル品質の絵文字を使用するように
- カスタム絵文字でリアクションできないことがある問題を修正

### Client
- チャンネルのピン留めされたノートの順番が正しくない問題を修正

### Server
- フォローインポートなどでの大量のフォロー等操作をキューイングするように #10544 @nmkj-io
- Misskey Webでのサーバーサイドエラー画面を改善
- Misskey Webでのサーバーサイドエラーのログが残るように
- ノート作成時のアンテナ追加パフォーマンスを改善
- アンテナとロールTLのuntil/sinceプロパティが動くように

## 13.11.2

### Note
- 13.11.0または13.11.1から13.11.2以降にアップデートする場合、Redisのカスタム絵文字のキャッシュを削除する必要があります(https://github.com/misskey-dev/misskey/issues/10502#issuecomment-1502790755 参照)

### General
- チャンネルの検索用ページの追加

### Client
- 常に広告を見られるオプションを追加
- ユーザーページの画像一覧が表示されない問題を修正
- webhook, 連携アプリ一覧でコンテンツが重複して表示される問題を修正
- iPhoneで絵文字ピッカーの表示が崩れる問題を修正
- iPhoneでウィジェットドロワーの「ウィジェットを編集」が押しにくい問題を修正
- 投稿フォームのデザインを調整
- ギャラリーの人気の投稿が無限にページングされる問題を修正

### Server
- channels/search Endpoint APIの追加
- APIパラメータサイズ上限を32kbから1mbに緩和
- プッシュ通知送信時のパフォーマンスを改善
- ローカルのカスタム絵文字のキャッシュが効いていなかった問題を修正
- アンテナのノート、チャンネルのノート、通知が正常に作成できないことがある問題を修正
- ストリーミングのLTLチャンネルでサーバー側にエラーログが出るのを修正

### Service Worker
- 「通知が既読になったらプッシュ通知を削除する」を復活
  * 「プッシュ通知が更新されました」の挙動を変えた（ホストとバージョンを表示するようにし、一定時間後の削除は行わないように）
- プッシュ通知が実績を解除 (achievementEarned) に対応
- プッシュ通知のアクションから既存のクライアントの投稿フォームを開くことになった際の挙動を修正
- たくさんのプッシュ通知を閉じた際、その通知の数だけnotifications/mark-all-as-readを叩くのをやめるように

## 13.11.1

### General
- チャンネルの投稿を過去までさかのぼれるように

### Client
- PWA時の絵文字ピッカーの位置をホームバーに重ならないように調整
- リスト管理の画面でリストが無限に読み込まれる問題を修正
- 自分のクリップが無限に読み込まれる問題を修正
- チャンネルのお気に入りが無限に読み込まれる問題を修正
- さがすのローカルユーザー（ピンどめ）が無限に生成される問題を修正
- チャンネルを新規作成できない問題を修正
- ユーザープレビューが表示されない問題を修正

### Server
- 通知読み込みでエラーが発生する場合がある問題を修正
- リアクションできないことがある問題を修正
- IDをaid以外に設定している場合の問題を修正
- 連合しているインスタンスについて予期せず配送が全て停止されることがある問題を修正

## 13.11.0

### NOTE
- このバージョンからRedis 7.xが必要です。
- アップデートを行うと全ての通知およびアンテナのノートはリセットされます。

### General
- チャンネルをお気に入りに登録できるように
  - タイムラインのアンテナ選択などでは、フォローしているアンテナの代わりにお気に入りしたアンテナが表示されるようになっています。チャンネルをお気に入りに登録するには、当該チャンネルのページ→概要→⭐️のボタンを押します。
- チャンネルにノートをピン留めできるように

### Client
- 投稿フォームのデザインを改善
- 検索ページでURLを入力した際に照会したときと同等の挙動をするように
- ノートのリアクションを大きく表示するオプションを追加
- ギャラリー一覧にメディア表示と同じように NSFW 設定を反映するように（ホバーで表示）
- オブジェクトストレージの設定画面を分かりやすく
- 広告・お知らせが新規登録時に増殖しないように
-　「にゃああああああああああああああ！！！！！！！！！！！！」 (`isCat`) 有効時にアバターに表示される猫耳について挙動を変更
  - 「UIにぼかし効果を使用」 (`useBlurEffect`) で次の挙動が有効になります
	  - 猫耳のアバター内部部分をぼかしでマスク表示してより猫耳っぽく見えるように
	- 「UIのアニメーションを減らす」 (`reduceAnimation`) で猫耳を撫でられなくなります
- Add Minimizing ("folding") of windows
- 「データセーバー」モードを追加
- 非NSFWメディアが隠れている際にも「閲覧注意」が出てしまう問題を修正

### Server
- PostgreSQLのレプリケーション対応
	- 設定ファイルの `dbReplications` および `dbSlaves` にて設定できます
- イベント用Redisを別サーバーに分離できるように
- ジョブキュー用Redisを別サーバーに分離できるように
- サーバーの全体的なパフォーマンスを向上
- ノート作成時のパフォーマンスを向上
- アンテナのタイムライン取得時のパフォーマンスを向上
- チャンネルのタイムライン取得時のパフォーマンスを向上
- 通知に関する全体的なパフォーマンスを向上
- webhookがcontent-type text/plain;charset=UTF-8 で飛んでくる問題を修正

## 13.10.3

### Changes
- オブジェクトストレージのリージョン指定が必須になりました
  - リージョンの指定の無いサービスは us-east-1 を設定してください
  - 値が空の場合は設定ファイルまたは環境変数の使用を試みます
    - e.g. ~/aws/config, AWS_REGION

### General
- コンディショナルロールの条件に「投稿数が～以下」「投稿数が～以上」を追加
- リアクション非対応AP実装からのLikeアクティビティの解釈を👍から♥に

### Client
- クリップボタンをノートアクションに追加できるように
- センシティブワードの一覧にピン留めユーザーのIDが表示される問題を修正

### Server
- リモートユーザーのチャート生成を無効にするオプションを追加
- リモートサーバーのチャート生成を無効にするオプションを追加
- ドライブのチャートはローカルユーザーのみ生成するように
- 空のアンテナが作成できるのを修正

## 13.10.2

### Server
- 絵文字を編集すると保存できないことがある問題を修正

### Client
- ドライブファイルのメニューが正常に動作しない問題を修正

## 13.10.1

### Client
- Misskey PlayのPlayボタンを押した時にエラーが発生する問題を修正

## 13.10.0

### General
- ユーザーごとにRenoteをミュートできるように
- ノートごとに絵文字リアクションを受け取るか設定できるように
- クリップをお気に入りに登録できるように
- ノート検索の利用可否をロールで制御可能に(デフォルトでオフ)
- ロールの並び順を設定可能に
- カスタム絵文字にライセンス情報を付与できるように
- 指定した文字列を含む投稿の公開範囲をホームにできるように
- 使われてないアンテナは自動停止されるように

### Client
- 設定から自分のロールを確認できるように
- 広告一覧ページを追加
- ドライブクリーナーを追加
- DM作成時にメンションも含むように
- フォロー申請のボタンのデザインを改善
- 付箋ウィジェットの高さを設定可能に
- APオブジェクトを入力してフェッチする機能とユーザーやノートの検索機能を分離
- ナビゲーションバーの項目に「プロフィール」を追加できるように
- ナビゲーションバーのカスタマイズをドラッグ&ドロップで行えるように
- ジョブキューの再試行をワンクリックでできるように
- AiScriptを0.13.1に更新
- oEmbedをサポートしているウェブサイトのプレビューができるように
	- YouTubeをoEmbedでロードし、プレビューで共有ボタンを押すとOSの共有画面がでるように
	- ([FirefoxでSpotifyのプレビューを開けるとフルサイズじゃなくプレビューサイズだけ再生できる問題](https://bugzilla.mozilla.org/show_bug.cgi?id=1792395)があります)
	- (すでにブラウザーでキャッシュされたリンクに対しては以前のプレビュー行動が行われてます。その場合、ブラウザーのキャッシュをクリアしてまた試してください。)
- プロフィールで設定した情報が削除できない問題を修正
- ロールで広告を無効にするとadmin/adsでプレビューがでてこない問題を修正
- /api-consoleページにアクセスすると404が出る問題を修正
- Safariでプラグインが複数ある場合に正常に読み込まれない問題を修正
- Bookwyrmのユーザーのプロフィールページで「リモートで表示」をタップしても反応がない問題を修正
- 非ログイン時の「Misskeyについて」の表示を修正
- PC版にて「設定」「コントロールパネル」のリンクを2度以上続けてクリックした際に空白のページが表示される問題を修正

### Server
- OpenAPIエンドポイントを復旧
- WebP/AVIF/JPEGのweb公開用画像は、サーバーサイドではJPEGではなくWebPに変換するように
- アニメーション画像のサムネイルを生成するように
- アクティブユーザー数チャートの記録上限値を拡張
- Playのソースコード上限文字数を2倍に拡張
- 配送先サーバーが410 Goneで応答してきた場合は自動で配送停止をするように
- avatarBlurHash/bannerBlurHashの型をstringに限定
- タイムライン取得時のパフォーマンスを改善
- SMTP Login id length is too short
- API上で`visibility`を`followers`に設定してrenoteすると連合や削除で不具合が発生する問題を修正
- AWS S3からのファイル削除でNoSuchKeyエラーが出ると進めらない状態になる問題を修正
- `disableCache: true`を設定している場合に絵文字管理操作でエラーが出る問題を修正
- リテンション分析が上手く機能しないことがあるのを修正
- 空のアンテナが作成できないように修正
- 特定の条件で通報が見れない問題を修正
- 絵文字の名前に任意の文字が使用できる問題を修正

## 13.9.2 (2023/03/06)

### Improvements
- クリップ、チャンネルページに共有ボタンを追加
- チャンネルでタイムライン上部に投稿フォームを表示するかどうかのオプションを追加
- ブラウザでメディアプロキシ(/proxy)からファイルを保存した際に、なるべくオリジナルのファイル名を継承するように
- ドライブの「URLからアップロード」で、content-dispositionのfilenameがあればそれをファイル名に
- Identiconがローカルとリモートで同じになるように
  - これまでのIdenticonは異なる画像になります
- サーバーのパフォーマンスを改善

### Bugfixes
- ロールの権限で「一般ユーザー」のロールがいきなり設定できない問題を修正
- ユーザーページのバッジ表示を適切に折り返すように @arrow2nd
- fix(client): みつけるのロール一覧でコンディショナルロールが含まれるのを修正
- macOSでDev Containerが動作しない問題を修正 @RyotaK

## 13.9.1 (2023/03/03)

### Bugfixes
- ノートに添付したファイルが表示されない場合があるのを修正

## 13.9.0 (2023/03/03)

### Improvements
- 時限ロール
- アンテナでCWも検索対象にするように
- ノートの操作部をホバー時のみ表示するオプションを追加
- サウンドを追加
- enhance(client): MFMのx2, scale, positionが含まれていたらノートをたたむように
- サーバーのパフォーマンスを改善

### Bugfixes
- 外部メディアプロキシ使用時にアバタークロップができない問題を修正
- fix(server): メールアドレス更新時にバリデーションが正しく行われていないのを修正
- fix(server): チャンネルでミュートが正しく機能していないのを修正
- プッシュ通知でカスタム絵文字リアクションを表示できなかった問題を修正

## 13.8.1 (2023/02/26)

### Bugfixes
- モバイルでドロワーメニューが表示されない問題を修正

## 13.8.0 (2023/02/26)

### Improvements
- チャンネル内ハイライト
- ホームタイムラインのパフォーマンスを改善
- renoteした際の表示を改善
- バックグラウンドで一定時間経過したらページネーションのアイテム更新をしない
- enhance(client): MkUrlPreviewの閉じるボタンを見やすく
- Add dialog to remove follower
- enhance(client): improve clip menu ux
- 検索画面の統合
- enhance(client): ノートメニューからユーザーメニューを開けるように
- photoswipe 表示時に戻る操作をしても前の画面に戻らないように

### Bugfixes
- Windows環境でswcを使うと正しくビルドできない問題の修正
- fix(client): Android ChromeでPWAとしてインストールできない問題を修正
- 未知のユーザーが deleteActor されたら処理をスキップする
- fix(server): notes/createで、fileIdsと見つかったファイルの数が異なる場合はエラーにする
- fix(server): notes/createのバリデーションが機能していないのを修正
- fix(server): エラーのスタックトレースは返さないように

## 13.7.5 (2023/02/24)

### Note
13.7.0以前から直接このバージョンにアップデートする場合は全ての通知が削除**されません。**

### Improvements
- 紛らわしいため公開範囲の「ローカルのみ」オプションの名称を「連合なし」に変更
- Frontend: スマホ・タブレットの場合、チャンネルの投稿フォームに自動でフォーカスしないように

### Bugfixes
- 全ての通知が削除されてしまうのを修正

## 13.7.3 (2023/02/23)

### Note
~~13.7.0以前から直接このバージョンにアップデートする場合は全ての通知が削除**されません。**~~

### Improvements

### Bugfixes
- Client: 「キャッシュを削除」した後、ローカルのカスタム絵文字が表示されなくなるされなくなる問題を修正
- Client: 通知設定画面で以前からグループの招待を有効化していた場合、通知の表示に失敗する問題の修正
- Client: 通知設定画面に古いトグルが残っていた問題を修正

## 13.7.2 (2023/02/23)

### Note
13.7.0以前からアップデートする場合は全ての通知が削除されます。

### Improvements
- enhance: make pwa icon maskable
- chore(client): tweak custom emoji size

### Bugfixes
- マイグレーションが失敗することがあるのを修正

## 13.7.1 (2023/02/23)

### Improvements
- pnpm buildではswcを使うように

### Bugfixes
- NODE_ENV=productionでビルドできないのを修正

## 13.7.0 (2023/02/22)

### Changes
- チャット機能が削除されました

### Improvements
- Server: URLプレビュー（summaly）はプロキシを通すように
- Client: 2FA設定のUIをまともにした
- セキュリティキーの名前を変更できるように
- enhance(client): add quiz preset for play
- 広告開始時期を設定できるように
- みつけるで公開ロール一覧とそのメンバーを閲覧できるように
- enhance(client): MFMのx3, x4が含まれていたらノートをたたむように
- enhance(client): make possible to reload page of window

### Bugfixes
- ユーザー検索ダイアログでローカルユーザーを絞って検索できない問題を修正
- fix(client): MkHeader及びデッキのカラムでチャンネル一覧を選択したとき、最大5個までしか表示されない
- 管理画面の広告を10個以上見えるように
- Moderation note が保存できない
- ユーザーのハッシュタグ検索が機能していないのを修正

## 13.6.1 (2023/02/12)

### Improvements
- アニメーションを少なくする設定の時、MkPageHeaderのタブアニメーションを無効化
- Backend: activitypub情報がcorsでブロックされないようヘッダーを追加
- enhance: レートリミットを0%にできるように
- チャンネル内Renoteを行えるように

### Bugfixes
- Client: ユーザーページでアクティビティを見ることができない問題を修正

## 13.6.0 (2023/02/11)

### Improvements
- MkPageHeaderをごっそり変えた
  * モバイルではヘッダーは上下に分割され、下段にタブが表示されるように
  * iconOnlyのタブ項目がアクティブな場合にはタブのタイトルを表示するように
  * メインタイムラインではタイトルを表示しない
  * メインタイムラインかつモバイルで表示される左上のアバターを選択するとアカウントメニューが開くように
- ユーザーページのノート一覧をタブとして分離
- コンディショナルロールもバッジとして表示可能に
- enhance(client): ロールをより簡単に付与できるように
- enhance(client): 一度見たノートのRenoteは省略して表示するように
- enhance(client): 迷惑になる可能性のある投稿を行う前に警告を表示
- リアクションの数が多い場合の表示を改善
- 一部のMFM構文をopt-outに

### Bugfixes
- Client: ユーザーページでタブがほとんど見れないことがないように

## 13.5.6 (2023/02/10)

### Improvements
- 非ログイン時にMiAuthを踏んだ際にMiAuthであることを表示する
- /auth/のUIをアップデート
- 利用規約同意UIの調整
- クロップ時の質問を分かりやすく

### Bugfixes
- fix: prevent clipping audio plyr's tooltip

## 13.5.4 (2023/02/09)

### Improvements
- Server: UIのHTML（ノートなどの特別なページを除く）のキャッシュ時間を15秒から30秒に
- i/notificationsのレートリミットを緩和

### Bugfixes
- fix(client): validate url to improve security
- fix(client): dateの初期値が正常に入らない時がある

## 13.5.3 (2023/02/09)

### Improvements
- Client: デッキにチャンネルカラムを追加

## 13.5.2 (2023/02/08)

### Changes
- Revert: perf(client): do not render custom emojis in user names

### Bugfixes
- Client: register_note_view_interruptor not working
- Client: ログイントークンの再生成が出来ない

## 13.5.0 (2023/02/08)

### Changes
- perf(client): do not render custom emojis in user names

### Improvements
- Client: disableShowingAnimatedImagesのデフォルト値をprefers-reduced-motionにする
- enhance(client): tweak medialist style

### Bugfixes
- fix docker health check
- Client: MkEmojiPickerでもChromeで検索ダイアログで変換確定するとそのまま検索されてしまうのを修正
- fix(mfm): default degree not used in rotate
- fix(server): validate urls from ap to improve security

## 13.4.0 (2023/02/05)

### Improvements
- ロールにアイコンを設定してユーザー名の横に表示できるように
- feat: timeline page for non-login users
- 実績の単なるラッキーの獲得確立を調整
- Add Thai language support

### Bugfixes
- fix(server): 自分のノートをお気に入りに登録しても実績解除される問題を修正
- fix(server): clean up file in FileServer
- fix(server): Deny UNIX domain socket
- fix(server): validate filename and emoji name to improve security
- fix(client): validate input response in aiscript
- fix(client): add webhook delete button
- fix(client): tweak notification style
- fix(client): インラインコードを折り返して表示する

## 13.3.3 (2023/02/04)

### Bugfixes
- Server: improve security

## 13.3.2 (2023/02/04)

### Improvements
- 外部メディアプロキシへの対応を強化しました
  外部メディアプロキシのFastify実装を作りました
  https://github.com/misskey-dev/media-proxy
- Server: improve performance

### Bugfixes
- Client: validate urls to improve security

## 13.3.1 (2023/02/04)

### Bugfixes
- Client: カスタム絵文字にアニメーション画像を再生しない設定が適用されていない問題を修正
- Client: オートコンプリートでUnicode絵文字がカスタム絵文字として表示されてしまうのを修正
- Client: Fix Vue-plyr CORS issue
- Client: validate urls to improve security

## 13.3.0 (2023/02/03)
### Changes
- twitter/github/discord連携機能が削除されました
- ハッシュタグごとのチャートが削除されました
- syslogのサポートが削除されました

### Improvements
- ロールで広告の非表示が有効になっている場合は最初から広告を非表示にするように

## 13.2.6 (2023/02/01)
### Changes
- docker-compose.ymlをdocker-compose.yml.exampleにしました。docker-compose.ymlとしてコピーしてから使用してください。

### Improvements
- 絵文字ピッカーのパフォーマンスを改善
- AiScriptを0.12.4に更新

### Bugfixes
- Server: リレーと通信できない問題を修正
- Client: classicモード使用時にwindowサイズによってdefaultに変更された後に、windowサイズが元に戻ったらclassicに戻すように修正 #9669
- Client: Chromeで検索ダイアログで変換確定するとそのまま検索されてしまう問題を修正

## 13.2.4 (2023/01/27)
### Improvements
- リモートカスタム絵文字表示時のパフォーマンスを改善
- Default to `animation: false` when prefers-reduced-motion is set
- リアクション履歴が公開なら、ログインしていなくても表示できるように
- tweak blur setting
- tweak custom emoji cache

### Bugfixes
- fix aggregation of retention
- ダッシュボードでオンラインユーザー数が表示されない問題を修正
- フォロー申請・フォローのボタンが、通知から消えている問題を修正

## 13.2.3 (2023/01/26)
### Improvements
- カスタム絵文字の更新をリアルタイムで反映するように

### Bugfixes
- turnstile-failed: missing-input-secret

## 13.2.2 (2023/01/25)
### Improvements
- サーバーのパフォーマンスを改善

### Bugfixes
- サインイン時に誤ったレートリミットがかかることがある問題を修正
- MFMのposition、rotate、scaleで小数が使えない問題を修正

## 13.2.1 (2023/01/24)
### Improvements
- デザインの調整
- サーバーのパフォーマンスを改善

## 13.2.0 (2023/01/23)

### Improvements
- onlyServer / onlyQueue オプションを復活
- 他人の実績閲覧時は獲得条件を表示しないように
- アニメーション減らすオプション有効時はリアクションのアニメーションを無効に
- カスタム絵文字一覧のパフォーマンスを改善

### Bugfixes
- Aiscript: button is not defined

## 13.1.7 (2023/01/22)

### Improvements
- 新たな実績を追加
- MFMにscaleタグを追加

## 13.1.4 (2023/01/22)

### Improvements
- 新たな実績を追加

### Bugfixes
- Client: ローカリゼーション更新時にリロードが繰り返されることがあるのを修正

## 13.1.3 (2023/01/22)

### Bugfixes
- Client: リアクションのカスタム絵文字の表示の問題を修正

## 13.1.2 (2023/01/22)

### Bugfixes
- Client: リアクションのカスタム絵文字の表示の問題を修正

## 13.1.1 (2023/01/22)

### Improvements
- ローカルのカスタム絵文字を表示する際のパフォーマンスを改善
- Client: 瞬間的に大量の実績を解除した際の挙動を改善

### Bugfixes
- Client: アップデート時にローカリゼーションデータが更新されないことがあるのを修正

## 13.1.0 (2023/01/21)

### Improvements
- 実績機能
- Playのプリセットを追加
- Playのscriptの文字数制限を緩和
- AiScript GUIの強化
- リアクション一覧詳細ダイアログを表示できるように
- 存在しないカスタム絵文字をテキストで表示するように
- Alt text in image viewer
- ジョブキューのプロセスとWebサーバーのプロセスを分離

### Bugfixes
- playを削除する手段がなかったのを修正
- The … button on notes does nothing when not logged in
- twitterと連携するときに autwh is not a function になるのを修正

## 13.0.0 (2023/01/16)

### TL;DR
- New features (Role system, Misskey Play, New widgets, New charts, 🍪👈, etc)
- Rewriten backend
- Better performance (backend and frontend)
- Various usability improvements
- Various UI tweaks

### Notable features
- ロール機能
	- 従来より柔軟にユーザーのポリシーを管理できます。例えば、「インスタンスのパトロンはアンテナを30個まで作れる」「基本的にLTLは見れないが、許可した人だけ見れる」「招待制インスタンスだけどユーザーなら誰でも他者を招待できる」のような運用はもちろん、「ローカルユーザーかつアカウント作成から1日未満のユーザーはパブリックな投稿を行えない」のように複数条件を組み合わせて、自動でロールを付与する設定も可能です。
- Misskey Play
	- 従来の動的なPagesに代わる、新しいプラットフォームです。動的なコンテンツ(アプリケーション)に特化していて、Pagesに比べてはるかに柔軟なアプリケーションを作成可能です。

### Changes
#### For server admins
- Node.js 18.x or later is required
- PostgreSQL 15.x is required
	- Misskey not using 15 specific features at 13.0.0, but may do so in the future.
	- Docker環境でPostgreSQLのアップデートを行う際のガイドはこちら: https://github.com/misskey-dev/misskey/pull/9641#issue-1536336620
- Elasticsearchのサポートが削除されました
	- 代わりに今後任意の検索プロバイダを設定できる仕組みを構想しています。その仕組みを使えば今まで通りElasticsearchも利用できます
- Yarnからpnpmに移行されました
  corepackの有効化を推奨します: `sudo corepack enable`
- インスタンスブロックはサブドメインにも適用されるようになります
- ロールの導入に伴い、いくつかの機能がロールと統合されました
	- モデレーターはロールに統合されました。今までのモデレーター情報は失われるため、予めモデレーター一覧を記録しておき、アップデート後にモデレーターロールを作りアサインし直してください。
	- サイレンスはロールに統合されました。今までのユーザーは恩赦されるため、予めサイレンス一覧を記録しておくのをおすすめします。
	- ユーザーごとのドライブ容量設定はロールに統合されました。
	- インスタンスデフォルトのドライブ容量設定はロールに統合されました。アップデート後、ベースロールもしくはコンディショナルロールでドライブ容量を編集してください。
	- LTL/GTLの解放状態はロールに統合されました。
- Dockerの実行をrootで行わないようにしました。Dockerかつオブジェクトストレージを使用していない場合は`chown -hR 991.991 ./files`を実行してください。
  https://github.com/misskey-dev/misskey/pull/9560

#### For users
- ノートのウォッチ機能が削除されました
- アンケートに投票された際に通知が作成されなくなりました
- ノートの数式埋め込みが削除されました
- 新たに動的なPagesを作ることはできなくなりました
	- 代わりにAiScriptを用いてより柔軟に動的なコンテンツを作成できるMisskey Play機能が実装されています。
- AiScriptが0.12.2にアップデートされました
	- 0.12.xの変更点についてはこちら https://github.com/syuilo/aiscript/blob/master/CHANGELOG.md#0120
	- 0.12.x未満のプラグインは読み込むことはできません
- iOS15以下のデバイスはサポートされなくなりました
- Firefox110以下はサポートされなくなりました
  - 109でもContainerQueriesのフラグを有効にする事で問題なく使用できます

#### For app developers
- API: metaのレスポンスに`emojis`プロパティが含まれなくなりました
	- カスタム絵文字一覧情報を取得するには、`emojis`エンドポイントにリクエストします
- API: カスタム絵文字エンティティに`url`プロパティが含まれなくなりました
	- 絵文字画像を表示するには、`<instance host>/emoji/<emoji name>.webp`にリクエストすると画像が返ります。
	- e.g. `https://p1.a9z.dev/emoji/misskey.webp`
	- remote: `https://p1.a9z.dev/emoji/syuilo_birth_present@mk.f72u.net.webp`
- API: `user`および`note`エンティティに`emojis`プロパティが含まれなくなりました
- API: `user`エンティティに`avatarColor`および`bannerColor`プロパティが含まれなくなりました
- API: `instance`エンティティに`latestStatus`、`lastCommunicatedAt`、`latestRequestSentAt`プロパティが含まれなくなりました
- API: `instance`エンティティの`caughtAt`は`firstRetrievedAt`に名前が変わりました

### Improvements
- Role system @syuilo
- Misskey Play @syuilo
- Introduce retention-rate aggregation @syuilo
- Make possible to export favorited notes @syuilo
- Add per user pv chart @syuilo
- Push notification of Antenna note @tamaina
- AVIF support @tamaina
- Add Cloudflare Turnstile CAPTCHA support @CyberRex0
- レートリミットをユーザーごとに調整可能に @syuilo
- 非モデレーターでも、権限を持つロールをアサインされたユーザーはインスタンスの招待コードを発行できるように @syuilo
- 非モデレーターでも、権限を持つロールをアサインされたユーザーはカスタム絵文字の追加、編集、削除を行えるように @syuilo
- クリップおよびクリップ内のノートの作成可能数を設定可能に @syuilo
- ユーザーリストおよびユーザーリスト内のユーザーの作成可能数を設定可能に @syuilo
- ハードワードミュートの最大文字数を設定可能に @syuilo
- Webhookの作成可能数を設定可能に @syuilo
- ノートをピン留めできる数を設定可能に @syuilo
- Server: signToActivityPubGet is set to true by default @syuilo
- Server: improve syslog performance @syuilo
- Server: Use undici instead of node-fetch and got @tamaina
- Server: Judge instance block by endsWith @tamaina
- Server: improve note scoring for featured notes @CyberRex0
- Server: アンケート選択肢の文字数制限を緩和 @syuilo
- Server: プロフィールの文字数制限を緩和 @syuilo
- Server: add rate limits for some endpoints @syuilo
- Server: improve stats api performance @syuilo
- Server: improve nodeinfo performance @syuilo
- Server: delete outdated notifications regularly to improve db performance @syuilo
- Server: delete outdated hard-mutes regularly to improve db performance @syuilo
- Server: delete outdated notes of antenna regularly to improve db performance @syuilo
- Server: improve activitypub deliver performance @syuilo
- Client: use tabler-icons instead of fontawesome to better design @syuilo
- Client: Add new gabber kick sounds (thanks for noizenecio)
- Client: Add link to user RSS feed in profile menu @ssmucny
- Client: Compress non-animated PNG files @saschanaz
- Client: YouTube window player @sim1222
- Client: show readable error when rate limit exceeded @syuilo
- Client: enhance dashboard of control panel @syuilo
- Client: Vite is upgraded to v4 @syuilo, @tamaina
- Client: HMR is available while yarn dev @tamaina
- Client: Implement the button to subscribe push notification @tamaina
- Client: Implement the toggle to or not to close push notifications when notifications or messages are read @tamaina
- Client: show Unicode emoji tooltip with its name in MkReactionsViewer.reaction @saschanaz
- Client: OpenSearch support @SoniEx2 @chaoticryptidz
- Client: Support remote objects in search @SoniEx2
- Client: user activity page @syuilo
- Client: Make widgets of universal/classic sync between devices @tamaina
- Client: add user list widget @syuilo
- Client: Add AiScript App widget
- Client: add profile widget @syuilo
- Client: add instance info widget @syuilo
- Client: Improve RSS widget @tamaina
- Client: add heatmap of daily active users to about page @syuilo
- Client: introduce fluent emoji @syuilo
- Client: add new theme @syuilo
- Client: add new mfm function (position, fg, bg) @syuilo
- Client: show fireworks when visit user who today is birthday @syuilo
- Client: show bot warning on screen when logged in as bot account @syuilo
- Client: AiScriptからカスタム絵文字一覧を参照できるように @syuilo
- Client: improve overall performance of client @syuilo
- Client: ui tweaks @syuilo
- Client: clicker game @syuilo

### Bugfixes
- Server: Fix @tensorflow/tfjs-core's MODULE_NOT_FOUND error @ikuradon
- Server: 引用内の文章がnyaizeされてしまう問題を修正 @kabo2468
- Server: Bug fix for Pinned Users lookup on instance @squidicuzz
- Server: Fix peers API returning suspended instances @ineffyble
- Server: trim long text of note from ap @syuilo
- Server: Ap inboxの最大ペイロードサイズを64kbに制限 @syuilo
- Server: アンテナの作成数上限を追加 @syuilo
- Server: pages/likeのエラーIDが重複しているのを修正 @syuilo
- Server: pages/updateのパラメータによってはsummaryの値が更新されないのを修正 @syuilo
- Server: Escape SQL LIKE @mei23
- Server: 特定のPNG画像のアップロードに失敗する問題を修正 @usbharu
- Server: 非公開のクリップのURLでOGPレンダリングされる問題を修正 @syuilo
- Server: アンテナタイムライン（ストリーミング）が、フォローしていないユーザーの鍵投稿も拾ってしまう @syuilo
- Server: follow request list api pagination @sim1222
- Server: ドライブ容量超過時のエラーが適切にレスポンスされない問題を修正 @syuilo
- Client: パスワードマネージャーなどでユーザー名がオートコンプリートされない問題を修正 @massongit
- Client: 日付形式の文字列などがカスタム絵文字として表示されるのを修正 @syuilo
- Client: case insensitive emoji search @saschanaz
- Client: 画面の幅が狭いとウィジェットドロワーを閉じる手段がなくなるのを修正 @syuilo
- Client: InAppウィンドウが操作できなくなることがあるのを修正 @tamaina
- Client: use proxied image for instance icon @syuilo
- Client: Webhookの編集画面で、内容を保存することができない問題を修正 @m-hayabusa
- Client: Page編集でブロックの移動が行えない問題を修正 @syuilo
- Client: update emoji picker immediately on all input @saschanaz
- Client: チャートのツールチップが画面に残ることがあるのを修正 @syuilo
- Client: fix wrong link in tutorial @syuilo

### Special thanks
- All contributors
- All who have created instances for the beta test
- All who participated in the beta test

## 12.119.1 (2022/12/03)
### Bugfixes
- Server: Mitigate AP reference chain DoS vector @skehmatics

## 12.119.0 (2022/09/10)

### Improvements
- Client: Add following badge to user preview popup @nvisser
- Client: mobile twitter url can be used as widget @caipira113
- Client: Improve clock widget @syuilo

### Bugfixes
- マイグレーションに失敗する問題を修正
- Server: 他人の通知を既読にできる可能性があるのを修正 @syuilo
- Client: アクセストークン管理画面、アカウント管理画面表示できないのを修正 @futchitwo

## 12.118.1 (2022/08/08)

### Bugfixes
- Client: can not show some setting pages @syuilo

## 12.118.0 (2022/08/07)

### Improvements
- Client: 設定のバックアップ/リストア機能
- Client: Add vi-VN language support
- Client: Add unix time widget @syuilo

### Bugfixes
- Server: リモートユーザーを正しくブロックできるように修正する @xianonn
- Client: 一度作ったwebhookの設定画面を開こうとするとページがフリーズする @syuilo
- Client: MiAuth認証ページが機能していない @syuilo
- Client: 一部のアプリからファイルを投稿フォームへドロップできない場合がある問題を修正 @m-hayabusa

## 12.117.1 (2022/07/19)

### Improvements
- Client: UIのブラッシュアップ @syuilo

### Bugfixes
- Server: ファイルのアップロードに失敗することがある問題を修正 @acid-chicken
- Client: リアクションピッカーがアプリ内ウィンドウの後ろに表示されてしまう問題を修正 @syuilo
- Client: ユーザー情報の取得の再試行を修正 @xianonn
- Client: MFMチートシートの挙動を修正 @syuilo
- Client: 「インスタンスからのお知らせを受け取る」の設定を変更できない問題を修正 @syuilo

## 12.117.0 (2022/07/18)

### Improvements
- Client: ウィンドウを最大化できるように @syuilo
- Client: Shiftキーを押した状態でリンクをクリックするとアプリ内ウィンドウで開くように @syuilo
- Client: デッキを使用している際、Ctrlキーを押した状態でリンクをクリックするとページ遷移を強制できるように @syuilo
- Client: UIのブラッシュアップ @syuilo

## 12.116.1 (2022/07/17)

### Bugfixes
- Client: デッキUI時に ページで表示 ボタンが機能しない問題を修正 @syuilo
- Error During Migration Run to 12.111.x

## 12.116.0 (2022/07/16)

### Improvements
- Client: registry editor @syuilo
- Client: UIのブラッシュアップ @syuilo

### Bugfixes
- Error During Migration Run to 12.111.x
- Server: TypeError: Cannot convert undefined or null to object @syuilo

## 12.115.0 (2022/07/16)

### Improvements
- Client: Deckのプロファイル切り替えを簡単に @syuilo
- Client: UIのブラッシュアップ @syuilo

## 12.114.0 (2022/07/15)

### Improvements
- RSSティッカーで表示順序をシャッフルできるように @syuilo

### Bugfixes
- クライアントが起動しなくなることがある問題を修正 @syuilo

## 12.113.0 (2022/07/13)

### Improvements
- Support <plain> syntax for MFM

### Bugfixes
- Server: Fix crash at startup if TensorFlow is not supported @mei23
- Client: URLエンコードされたルーティングを修正

## 12.112.3 (2022/07/09)

### Improvements
- Make active email validation configurable

### Bugfixes
- Server: Fix Attempts to update all notifications @mei23

## 12.112.2 (2022/07/08)

### Bugfixes
- Fix Docker doesn't work @mei23
  Still not working on arm64 environment. (See 12.112.0)

## 12.112.1 (2022/07/07)
same as 12.112.0

## 12.112.0 (2022/07/07)

### Known issues
- 現在arm64環境ではインストールに失敗します。これは次のバージョンで修正される予定です。

### Changes
- ハイライトがみつけるに統合されました
- カスタム絵文字ページはインスタンス情報ページに統合されました
- 連合ページはインスタンス情報ページに統合されました
- メンション一覧ページは通知一覧ページに統合されました
- ダイレクト投稿一覧ページは通知一覧ページに統合されました
- メニューからアンテナタイムラインを表示する方法は廃止され、タイムライン上部のアイコンからアクセスするようになりました
- メニューからリストタイムラインを表示する方法は廃止され、タイムライン上部のアイコンからアクセスするようになりました

### Improvements
- Server: Allow GET method for some endpoints @syuilo
- Server: Auto NSFW detection @syuilo
- Server: Add rate limit to i/notifications @tamaina
- Client: Improve control panel @syuilo
- Client: Show warning in control panel when there is an unresolved abuse report @syuilo
- Client: Statusbars @syuilo
- Client: Add instance-cloud widget @syuilo
- Client: Add rss-ticker widget @syuilo
- Client: Removing entries from a clip @futchitwo
- Client: Poll highlights in explore page @syuilo
- Client: Improve deck UI @syuilo
- Client: Word mute also checks content warnings @Johann150
- Client: メニューからページをリロードできるように @syuilo
- Client: Improve emoji picker performance @syuilo
- Client: For notes with specified visibility, show recipients when hovering over visibility symbol. @Johann150
- Client: Make widgets available again on a tablet @syuilo
- ユーザーにモデレーションメモを残せる機能 @syuilo
- Make possible to delete an account by admin @syuilo
- Improve player detection in URL preview @mei23
- Add Badge Image to Push Notification #8012 @tamaina
- Server: Improve performance
- Server: Supports IPv6 on Redis transport. @mei23
  IPv4/IPv6 is used by default. You can tune this behavior via `redis.family`.
- Server: Add possibility to log IP addresses of users @syuilo
- Add additional drive capacity change support @CyberRex0

### Bugfixes
- Server: Fix GenerateVideoThumbnail failed @mei23
- Server: Ensure temp directory cleanup @Johann150
- favicons of federated instances not showing @syuilo
- Admin: The checkbox for blocking an instance works again @Johann150
- Client: Prevent access to user pages when not logged in @pixeldesu @Johann150
- Client: Disable some hotkeys (e.g. for creating a post) for not logged in users @pixeldesu
- Client: Ask users that are not logged in to log in when trying to vote in a poll @Johann150
- Instance mutes also apply in antennas etc. @Johann150

## 12.111.1 (2022/06/13)

### Bugfixes
- some fixes of multiple notification read @tamaina
- some GenerateVideoThumbnail failed @Johann150
- Client: デッキでウィジェットの情報が保存されない問題を修正 @syuilo
- Client: ギャラリーの投稿を開こうとすると編集画面が表示される @futchitwo

## 12.111.0 (2022/06/11)
### Note
- Node.js 16.15.0 or later is required

### Improvements
- Supports Unicode Emoji 14.0 @mei23
- プッシュ通知を複数アカウント対応に #7667 @tamaina
- プッシュ通知にクリックやactionを設定 #7667 @tamaina
- ドライブに画像ファイルをアップロードするときオリジナル画像を破棄してwebpublicのみ保持するオプション @tamaina
- Server: always remove completed tasks of job queue @Johann150
- Client: アバターの設定で画像をクロップできるように @syuilo
- Client: make emoji stand out more on reaction button @Johann150
- Client: display URL of QR code for TOTP registration @tamaina
- Client: render quote renote CWs as MFM @pixeldesu
- API: notifications/readは配列でも受け付けるように #7667 @tamaina
- API: ユーザー検索で、クエリがusernameの条件を満たす場合はusernameもLIKE検索するように @tamaina
- MFM: Allow speed changes in all animated MFMs @Johann150
- The theme color is now better validated. @Johann150
  Your own theme color may be unset if it was in an invalid format.
  Admins should check their instance settings if in doubt.
- Perform port diagnosis at startup only when Listen fails @mei23
- Rate limiting is now also usable for non-authenticated users. @Johann150 @mei23
  Admins should make sure the reverse proxy sets the `X-Forwarded-For` header to the original address.

### Bugfixes
- Server: keep file order of note attachement @Johann150
- Server: fix missing foreign key for reports leading to reports page being unusable @Johann150
- Server: fix internal in-memory caching @Johann150
- Server: prevent crash when processing certain PNGs @syuilo
- Server: Fix unable to generate video thumbnails @mei23
- Server: Fix `Cannot find module` issue @mei23
- Federation: Add rel attribute to host-meta @mei23
- Federation: add id for activitypub follows @Johann150
- Federation: use `source` instead of `_misskey_content` @Johann150
- Federation: ensure resolver does not fetch local resources via HTTP(S) @Johann150
- Federation: correctly render empty note text @Johann150
- Federation: Fix quote renotes containing no text being federated correctly @Johann150
- Federation: remove duplicate br tag/newline @Johann150
- Federation: add missing authorization checks @Johann150
- Client: fix profile picture height in mentions @tamaina
- Client: fix abuse reports page to be able to show all reports @Johann150
- Client: fix settings page @tamaina
- Client: fix profile tabs @futchitwo
- Client: fix popout URL @futchitwo
- Client: correctly handle MiAuth URLs with query string @sn0w
- Client: ノート詳細ページの新しいノートを表示する機能の動作が正しくなるように修正する @xianonn
- MFM: more animated functions support `speed` parameter @futchitwo
- MFM: limit large MFM @Johann150

## 12.110.1 (2022/04/23)

### Bugfixes
- Fix GOP rendering @syuilo
- Improve performance of antenna, clip, and list @xianonn

## 12.110.0 (2022/04/11)

### Improvements
- Improve webhook @syuilo
- Client: Show loading icon on splash screen @syuilo

### Bugfixes
- API: parameter validation of users/show was wrong
- Federation: リモートインスタンスへのダイレクト投稿が届かない問題を修正 @syuilo

## 12.109.2 (2022/04/03)

### Bugfixes
- API: admin/update-meta was not working @syuilo
- Client: テーマを切り替えたり読み込んだりするとmeta[name="theme-color"]のcontentがundefinedになる問題を修正 @tamaina

## 12.109.1 (2022/04/02)

### Bugfixes
- API: Renoteが行えない問題を修正

## 12.109.0 (2022/04/02)

### Improvements
- Webhooks @syuilo
- Bull Dashboardを組み込み、ジョブキューの確認や操作を行えるように @syuilo
  - Bull Dashboardを開くには、最初だけ一旦ログアウトしてから再度管理者権限を持つアカウントでログインする必要があります
- Check that installed Node.js version fulfills version requirement @ThatOneCalculator
- Server: overall performance improvements @syuilo
- Federation: avoid duplicate activity delivery @Johann150
- Federation: limit federation of reactions on direct notes @Johann150
- Client: タッチパッド・タッチスクリーンでのデッキの操作性を向上 @tamaina

### Bugfixes
- email address validation was not working @ybw2016v
- API: fix endpoint endpoint @Johann150
- API: fix admin/meta endpoint @syuilo
- API: improved validation and documentation for endpoints that accept different variants of input @Johann150
- API: `notes/create`: The `mediaIds` property is now deprecated. @Johann150
  - Use `fileIds` instead, it has the same behaviour.
- Client: URIエンコーディングが異常でdecodeURIComponentが失敗するとURLが表示できなくなる問題を修正 @tamaina

## 12.108.1 (2022/03/12)

### Bugfixes
- リレーが動作しない問題を修正 @xianonn
- ulidを使用していると動作しない問題を修正 @syuilo
- 外部からOGPが正しく取得できない問題を修正 @syuilo
- instance can not get the files from other instance when there are items in allowedPrivateNetworks in .config/default.yml @ybw2016v

## 12.108.0 (2022/03/09)

### NOTE
このバージョンからNode v16.14.0以降が必要です

### Changes
- ノートの最大文字数を設定できる機能が廃止され、デフォルトで一律3000文字になりました @syuilo
- Misskey can no longer terminate HTTPS connections. @Johann150
  - If you did not use a reverse proxy (e.g. nginx) before, you will probably need to adjust
    your configuration file and set up a reverse proxy. The `https` configuration key is no
    longer recognized!

### Improvements
- インスタンスデフォルトテーマを設定できるように @syuilo
- ミュートに期限を設定できるように @syuilo
- アンケートが終了したときに通知が作成されるように @syuilo
- プロフィールの追加情報を最大16まで保存できるように @syuilo
- 連合チャートにPub&Subを追加 @syuilo
- 連合チャートにActiveを追加 @syuilo
- デフォルトで10秒以上時間がかかるデータベースへのクエリは中断されるように @syuilo
	- 設定ファイルの`db.extra`に`statement_timeout`を設定することでタイムアウト時間を変更できます
- Client: スプラッシュスクリーンにインスタンスのアイコンを表示するように @syuilo

### Bugfixes
- Client: リアクションピッカーの高さが低くなったまま戻らないことがあるのを修正 @syuilo
- Client: ユーザー名オートコンプリートが正しく動作しない問題を修正 @syuilo
- Client: タッチ操作だとウィジェットの編集がしにくいのを修正 @xianonn
- Client: register_note_view_interruptor()が動かないのを修正 @syuilo
- Client: iPhone X以降(?)でページの内容が全て表示しきれないのを修正 @tamaina
- Client: fix image caption on mobile @nullobsi

## 12.107.0 (2022/02/12)

### Improvements
- クライアント: テーマを追加 @syuilo

### Bugfixes
- API: stats APIで内部エラーが発生する問題を修正 @syuilo
- クライアント: ソフトミュートですべてがマッチしてしまう場合があるのを修正 @tamaina
- クライアント: デバイスのスクリーンのセーフエリアを考慮するように @syuilo
- クライアント: 一部環境でサイドバーの投稿ボタンが表示されない問題を修正 @syuilo

## 12.106.3 (2022/02/11)

### Improvements
- クライアント: スマートフォンでの余白を調整 @syuilo

### Bugfixes
- クライアント: ノートの詳細が表示されない問題を修正 @syuilo

## 12.106.2 (2022/02/11)

### Bugfixes
- クライアント: 削除したノートがタイムラインから自動で消えない問題を修正 @syuilo
- クライアント: リアクション数が正しくないことがある問題を修正 @syuilo
- 一部環境でマイグレーションが動作しない問題を修正 @syuilo

## 12.106.1 (2022/02/11)

### Bugfixes
- クライアント: ワードミュートが保存できない問題を修正 @syuilo

## 12.106.0 (2022/02/11)

### Improvements
- Improve federation chart @syuilo
- クライアント: リアクションピッカーのサイズを設定できるように @syuilo
- クライアント: リアクションピッカーの幅、高さ制限を緩和 @syuilo
- Docker: Update to Node v16.13.2 @mei23
- Update dependencies

### Bugfixes
- validate regular expressions in word mutes @Johann150

## 12.105.0 (2022/02/09)

### Improvements
- インスタンスのテーマカラーを設定できるように @syuilo

### Bugfixes
- 一部環境でマイグレーションが失敗する問題を修正 @syuilo

## 12.104.0 (2022/02/09)

### Note
ビルドする前に`yarn clean`を実行してください。

このリリースはマイグレーションの規模が大きいため、インスタンスによってはマイグレーションに時間がかかる可能性があります。
マイグレーションが終わらない場合は、チャートの情報はリセットされてしまいますが`__chart__`で始まるテーブルの**レコード**を全て削除(テーブル自体は消さないでください)してから再度試す方法もあります。

### Improvements
- チャートエンジンの強化 @syuilo
	- テーブルサイズの削減
	- notes/instance/perUserNotesチャートに添付ファイル付きノートの数を追加
	- activeUsersチャートに新しい項目を追加
	- federationチャートに新しい項目を追加
	- apRequestチャートを追加
	- networkチャート廃止
- クライアント: 自インスタンス情報ページでチャートを見れるように @syuilo
- クライアント: デバイスの種類を手動指定できるように @syuilo
- クライアント: UIのアイコンを更新 @syuilo
- クライアント: UIのアイコンをセルフホスティングするように @syuilo
- NodeInfo のユーザー数と投稿数の内容を見直す @xianonn

### Bugfixes
- Client: タイムライン種別を切り替えると「新しいノートがあります」の表示が残留してしまうのを修正 @tamaina
- Client: UIのサイズがおかしくなる問題の修正 @tamaina
- Client: Setting instance information of notes to always show breaks the timeline @Johann150
- Client: 環境に依っては返信する際のカーソル位置が正しくない問題を修正 @syuilo
- Client: コントロールパネルのユーザー、ファイルにて、インスタンスの表示範囲切り替えが機能しない問題を修正 @syuilo
- Client: アップデートお知らせダイアログが出ないのを修正 @syuilo
- Client: Follows/Followers Visibility changes won't be saved unless clicking on an other checkbox @Johann150
- API: Fix API cast @mei23
- add instance favicon where it's missing @solfisher
- チャートの定期resyncが動作していない問題を修正 @syuilo

## 12.103.1 (2022/02/02)

### Bugfixes
- クライアント: ツールチップの表示位置が正しくない問題を修正

## 12.103.0 (2022/02/02)

### Improvements
- クライアント: 連合インスタンスページからインスタンス情報再取得を行えるように

### Bugfixes
- クライアント: 投稿のNSFW画像を表示したあとにリアクションが更新されると画像が非表示になる問題を修正
- クライアント: 「クリップ」ページが開かない問題を修正
- クライアント: トレンドウィジェットが動作しないのを修正
- クライアント: フェデレーションウィジェットが動作しないのを修正
- クライアント: リアクション設定で絵文字ピッカーが開かないのを修正
- クライアント: DMページでメンションが含まれる問題を修正
- クライアント: 投稿フォームのハッシュタグ保持フィールドが動作しない問題を修正
- クライアント: サイドビューが動かないのを修正
- クライアント: ensure that specified users does not get duplicates
- Add `img-src` and `media-src` directives to `Content-Security-Policy` for
  files and media proxy

## 12.102.1 (2022/01/27)
### Bugfixes
- チャットが表示できない問題を修正

## 12.102.0 (2022/01/27)

### NOTE
アップデート後、一部カスタム絵文字が表示できなくなる場合があります。その場合、一旦絵文字管理ページから絵文字を一括エクスポートし、再度コントロールパネルから一括インポートすると直ります。
⚠ 12.102.0以前にエクスポートされたzipとは互換性がありません。アップデートしてからエクスポートを行なってください。

### Changes
- Room機能が削除されました
  - 後日別リポジトリとして復活予定です
- リバーシ機能が削除されました
  - 後日別リポジトリとして復活予定です
- Chat UIが削除されました
- ノートに添付できるファイルの数が16に増えました
- カスタム絵文字にSVGを指定した場合、PNGに変換されて表示されるようになりました

### Improvements
- カスタム絵文字一括編集機能
- カスタム絵文字一括インポート
- 投稿フォームで一時的に投稿するアカウントを切り替えられるように
- Unifying Misskey-specific IRIs in JSON-LD `@context`
- クライアントのパフォーマンス向上
- セキュリティの向上

### Bugfixes
- アップロードエラー時の処理を修正

## 12.101.1 (2021/12/29)

### Bugfixes
- SVG絵文字が表示できないのを修正
- エクスポートした絵文字の拡張子がfalseになることがあるのを修正

## 12.101.0 (2021/12/29)

### Improvements
- クライアント: ノートプレビューの精度を改善
- クライアント: MFM sparkleエフェクトの改善
- クライアント: デザインの調整
- セキュリティの向上

### Bugfixes
- クライアント: 一部のコンポーネントが裏に隠れるのを修正
- fix html blockquote conversion

## 12.100.2 (2021/12/18)

### Bugfixes
- クライアント: Deckカラムの増減がページをリロードするまで正しく反映されない問題を修正
- クライアント: 一部のコンポーネントが裏に隠れるのを修正
- クライアント: カスタム絵文字一覧ページの負荷が高いのを修正

## 12.100.1 (2021/12/17)

### Bugfixes
- クライアント: デザインの調整

## 12.100.0 (2021/12/17)

### Improvements
- クライアント: モバイルでの各種メニュー、リアクションピッカーの表示を改善

### Bugfixes
- クライアント: 一部のコンポーネントが裏に隠れるのを修正

## 12.99.3 (2021/12/14)
### Bugfixes
- クライアント: オートコンプリートがダイアログの裏に隠れる問題を修正

## 12.99.2 (2021/12/14)

## 12.99.1 (2021/12/14)

## 12.99.0 (2021/12/14)

### Improvements
- Added a user-level instance mute in user settings
- フォローエクスポートでミュートしているユーザーを含めないオプションを追加
- フォローエクスポートで使われていないアカウントを含めないオプションを追加
- カスタム絵文字エクスポート機能
- チャートのパフォーマンスの改善
- グループから抜けられるように

### Bugfixes
- クライアント: タッチ機能付きディスプレイを使っていてマウス操作をしている場合に一部機能が動作しない問題を修正
- クライアント: クリップの設定を編集できない問題を修正
- クライアント: メニューなどがウィンドウの裏に隠れる問題を修正

## 12.98.0 (2021/12/03)

### Improvements
- API: /antennas/notes API で日付による絞り込みができるように
- クライアント: アンケートに投票する際に確認ダイアログを出すように
- クライアント: Renoteなノート詳細ページから元のノートページに遷移できるように
- クライアント: 画像ポップアップでクリックで閉じられるように
- クライアント: デザインの調整
- フォロワーを解除できる機能

### Bugfixes
- クライアント: LTLやGTLが無効になっている場合でもUI上にタブが表示される問題を修正
- クライアント: ログインにおいてパスワードが誤っている際のエラーメッセージが正しく表示されない問題を修正
- クライアント: リアクションツールチップ、Renoteツールチップのユーザーの並び順を修正
- クライアント: サウンドのマスターボリュームが正しく保存されない問題を修正
- クライアント: 一部環境において通知が表示されると操作不能になる問題を修正
- クライアント: モバイルでタップしたときにツールチップが表示される問題を修正
- クライアント: リモートインスタンスのノートに返信するとき、対象のノートにそのリモートインスタンス内のユーザーへのメンションが含まれていると、返信テキスト内にローカルユーザーへのメンションとして引き継がれてしまう場合がある問題を修正
- クライアント: 画像ビューワーで全体表示した時に上側の一部しか表示されない画像がある問題を修正
- API: ユーザーを取得時に条件によっては内部エラーになる問題を修正

### Changes
- クライアント: ノートにモデレーターバッジを表示するのを廃止

## 12.97.0 (2021/11/19)

### Improvements
- クライアント: 返信先やRenoteに対しても自動折りたたみされるように
- クライアント: 長いスレッドの表示を改善
- クライアント: 翻訳にもMFMを適用し、元の文章の改行などを保持するように
- クライアント: アカウント削除に確認ダイアログを出すように

### Bugfixes
- クライアント: ユーザー検索の「全て」が動作しない問題を修正
- クライアント: リアクション一覧、Renote一覧ツールチップのスタイルを修正

## 12.96.1 (2021/11/13)
### Improvements
- npm scriptの互換性を向上

## 12.96.0 (2021/11/13)

### Improvements
- フォロー/フォロワーを非公開にできるように
- インスタンスプロフィールレンダリング ready
- 通知のリアクションアイコンをホバーで拡大できるように
- RenoteボタンをホバーでRenoteしたユーザー一覧を表示するように
- 返信の際にメンションを含めるように
- 通報があったときに管理者へEメールで通知されるように
- メールアドレスのバリデーションを強化

### Bugfixes
- アカウント削除処理があると高負荷になる問題を修正
- クライアント: 長いメニューが画面からはみ出す問題を修正
- クライアント: コントロールパネルのジョブキューに個々のジョブが表示されないのを修正
- クライアント: fix missing i18n string
- fix html conversion issue with code blocks

### Changes
- ノートにモバイルからの投稿か否かの情報を含めないように

## 12.95.0 (2021/10/31)

### Improvements
- スレッドミュート機能

### Bugfixes
- リレー向けのActivityが一部実装で除外されてしまうことがあるのを修正
- 削除したノートやユーザーがリモートから参照されると復活することがあるのを修正
- クライアント: ページ編集時のドロップダウンメニューなどが動作しない問題を修正
- クライアント: コントロールパネルのカスタム絵文字タブが切り替わらないように見える問題を修正
- API: ユーザー情報の hasUnreadChannel が常に false になっている問題を修正

## 12.94.1 (2021/10/25)

### Improvements

### Bugfixes
- クライアント: ユーザーページのナビゲーションが失敗する問題を修正

## 12.94.0 (2021/10/25)

### Improvements
- クライアント: 画像ビューアを強化
- クライアント: メンションにユーザーのアバターを表示するように
- クライアント: デザインの調整
- クライアント: twemojiをセルフホスティングするように

### Bugfixes
- クライアント: CWで画像が隠されたとき、画像の高さがおかしいことになる問題を修正

### NOTE
- このバージョンから、iOS 15未満のサポートがされなくなります。対象のバージョンをお使いの方は、iOSのバージョンアップを行ってください。

## 12.93.2 (2021/10/23)

### Bugfixes
- クライアント: ウィジェットを追加できない問題を修正

## 12.93.1 (2021/10/23)

### Bugfixes
- クライアント: 通知上でローカルのリアクションが表示されないのを修正

## 12.93.0 (2021/10/23)

### Improvements
- クライアント: コントロールパネルのパフォーマンスを改善
- クライアント: 自分のリアクション一覧を見れるように
	- 設定により、リアクション一覧を全員に公開することも可能
- クライアント: ユーザー検索の精度を強化
- クライアント: 新しいライトテーマを追加
- クライアント: 新しいダークテーマを追加
- API: ユーザーのリアクション一覧を取得する users/reactions を追加
- API: users/search および users/search-by-username-and-host を強化
- ミュート及びブロックのインポートを行えるように
- クライアント: /share のクエリでリプライやファイル等の情報を渡せるように
- チャートのsyncを毎日0時に自動で行うように

### Bugfixes
- クライアント: テーマの管理が行えない問題を修正
- API: アプリケーション通知が取得できない問題を修正
- クライアント: リモートノートで意図せずローカルカスタム絵文字が使われてしまうことがあるのを修正
- ActivityPub: not reacted な Undo.Like がinboxに滞留するのを修正

### Changes
- 連合の考慮に問題があることなどが分かったため、モデレーターをブロックできない仕様を廃止しました
- データベースにログを保存しないようになりました
	- ログを永続化したい場合はsyslogを利用してください

## 12.92.0 (2021/10/16)

### Improvements
- アカウント登録にメールアドレスの設定を必須にするオプション
- クライアント: 全体的なUIのブラッシュアップ
- クライアント: MFM関数構文のサジェストを実装
- クライアント: ノート本文を投稿フォーム内でプレビューできるように
- クライアント: 未読の通知のみ表示する機能
- クライアント: 通知ページで通知の種類によるフィルタ
- クライアント: アニメーションを減らす設定の適用範囲を拡充
- クライアント: 新しいダークテーマを追加
- クライアント: テーマコンパイラに hue と saturate 関数を追加
- ActivityPub: HTML -> MFMの変換を強化
- API: グループから抜ける users/groups/leave エンドポイントを実装
- API: i/notifications に unreadOnly オプションを追加
- API: ap系のエンドポイントをログイン必須化+レートリミット追加
- MFM: Add tag syntaxes of bold <b></b> and strikethrough <s></s>

### Bugfixes
- Fix createDeleteAccountJob
- admin inbox queue does not show individual jobs
- クライアント: ヘッダーのタブが折り返される問題を修正
- クライアント: ヘッダーにタブが表示されている状態でタイトルをクリックしたときにタブ選択が表示されるのを修正
- クライアント: ユーザーページのタブが機能していない問題を修正
- クライアント: ピン留めユーザーの設定項目がない問題を修正
- クライアント: Deck UIにおいて、重ねたカラムの片方を畳んだ状態で右に出すと表示が壊れる問題を修正
- API: 管理者およびモデレーターをブロックできてしまう問題を修正
- MFM: Mentions in the link label are parsed as text
- MFM: Add a property to the URL node indicating whether it was enclosed in <>
- MFM: Disallows < and > in hashtags

### Changes
- 保守性やユーザビリティの観点から、Misskeyのコマンドラインオプションが削除されました。
	- 必要であれば、代わりに環境変数で設定することができます
- MFM: パフォーマンス、保守性、構文誤認識抑制の観点から、旧関数構文のサポートが削除されました。
	- 旧構文(`[foo bar]`)を使用せず、現行の構文(`$[foo bar]`)を使用してください。

## 12.91.0 (2021/09/22)

### Improvements
- ActivityPub: リモートユーザーのDeleteアクティビティに対応
- ActivityPub: add resolver check for blocked instance
- ActivityPub: deliverキューのメモリ使用量を削減
- API: 管理者用アカウント削除APIを実装(/admin/accounts/delete)
	- リモートユーザーの削除も可能に
- アカウントが凍結された場合に、凍結された旨を表示してからログアウトするように
- 凍結されたアカウントにログインしようとしたときに、凍結されている旨を表示するように
- リスト、アンテナタイムラインを個別ページとして分割
- UIの改善
- MFMにsparklesエフェクトを追加
- 非ログイン自は更新ダイアログを出さないように
- クライアント起動時、アップデートが利用可能な場合エラー表示およびダイアログ表示しないように

### Bugfixes
- アカウントデータのエクスポート/インポート処理ができない問題を修正
- アンテナの既読が付かない問題を修正
- popupで設定ページを表示すると、アカウントの削除ページにアクセスすることができない問題を修正
- "問題が発生しました"ウィンドウを開くと☓ボタンがなくて閉じれない問題を修正

## 12.90.1 (2021/09/05)

### Bugfixes
- Dockerfileを修正
- ノート翻訳時に公開範囲が考慮されていない問題を修正

## 12.90.0 (2021/09/04)

### Improvements
- 藍モード、および藍ウィジェット
	- クライアントに藍ちゃんを召喚することができるようになりました。
- URLからのアップロード, APの添付ファイル, 外部ファイルのプロキシ等では、Privateアドレス等へのリクエストは拒否されるようになりました。
	- developmentで動作している場合は、この制限は適用されません。
	- Proxy使用時には、この制限は適用されません。
		Proxy使用時に同等の制限を行いたい場合は、Proxy側で設定を行う必要があります。
	- `default.yml`にて`allowedPrivateNetworks`にCIDRを追加することにより、宛先ネットワークを指定してこの制限から除外することが出来ます。
- アップロード, ダウンロード出来るファイルサイズにハードリミットが適用されるようになりました。(約250MB)
	- `default.yml`にて`maxFileSize`を変更することにより、制限値を変更することが出来ます。

### Bugfixes
- 管理者が最初にサインアップするページでログインされないのを修正
- CWを維持する設定を復活
- クライアントの表示を修正

## 12.89.2 (2021/08/24)

### Bugfixes
- カスタムCSSを有効にしているとエラーになる問題を修正

## 12.89.1 (2021/08/24)

### Improvements
- クライアントのデザインの調整

### Bugfixes
- 翻訳でDeepLのProアカウントに対応していない問題を修正
- インスタンス設定でDeepLのAuth Keyが空で表示される問題を修正
- セキュリティの向上

## 12.89.0 (2021/08/21)

### Improvements
- アカウント削除の安定性を向上
- 絵文字オートコンプリートの挙動を改修
- localStorageのaccountsはindexedDBで保持するように
- ActivityPub: ジョブキューの試行タイミングを調整 (#7635)
- API: sw/unregisterを追加
- ワードミュートのドキュメントを追加
- クライアントのデザインの調整
- 依存関係の更新

### Bugfixes
- チャンネルを作成しているとアカウントを削除できないのを修正
- ノートの「削除して編集」をするとアンケートの選択肢が[object Object]になる問題を修正

## 12.88.0 (2021/08/17)

### Features
- ノートの翻訳機能を追加
  - 有効にするには、サーバー管理者がDeepLの無料アカウントを登録し、取得した認証キーを「インスタンス設定 > その他 > DeepL Auth Key」に設定する必要があります。
- Misskey更新時にダイアログを表示するように
- ジョブキューウィジェットに警報音を鳴らす設定を追加

### Improvements
- ブロックの挙動を改修
	- ブロックされたユーザーがブロックしたユーザーに対してアクション出来ないようになりました。詳細はドキュメントをご確認ください。
- UIデザインの調整
- データベースのインデックスを最適化
- Proxy使用時にKeep-Aliveをサポート
- DNSキャッシュでネガティブキャッシュをサポート
- 依存関係の更新

### Bugfixes
- タッチ操作でウィンドウを閉じることができない問題を修正
- Renoteされた時刻が投稿された時刻のように表示される問題を修正
- コントロールパネルでファイルを削除した際の表示を修正
- ActivityPub: 長いユーザーの名前や自己紹介の対応

## 12.87.0 (2021/08/12)

### Improvements
- 絵文字オートコンプリートで一文字目は最近使った絵文字をサジェストするように
- 絵文字オートコンプリートのパフォーマンスを改善
- about-misskeyページにドキュメントへのリンクを追加
- Docker: Node.jsを16.6.2に
- 依存関係の更新
- 翻訳の更新

### Bugfixes
- Misskey更新時、テーマキャッシュの影響でスタイルがおかしくなる問題を修正

## 12.86.0 (2021/08/11)

### Improvements
- ドキュメントの更新
	- ドキュメントにchangelogを追加
- ぼかし効果のオプションを追加
- Vueを3.2.1に更新
- UIの調整

### Bugfixes
- ハッシュタグ入力が空のときに#が付くのを修正
- フォローリクエストのEメール通知を修正
