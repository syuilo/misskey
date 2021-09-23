# シェアページ
`/share`を開くと、共有用の投稿フォームを開くことができます。
ここではシェアページで利用できるクエリ文字列の一覧を示します。

## クエリ文字列一覧
### 文字

<dl>
<dt>title</dt>
<dd>タイトルです。本文の先頭に[ … ]と挿入されます。</dd>
<dt>text</dt>
<dd>本文です。</dd>
<dt>url</dt>
<dd>URLです。末尾に挿入されます。</dd>
</dl>


### リプライ情報
以下のいずれか

<dl>
<dt>replyId</dt>
<dd>リプライ先のノートid</dd>
<dt>replyUri</dt>
<dd>リプライ先のUrl（リモートのノートオブジェクトを指定）</dd>
</dl>

### Renote情報
以下のいずれか

<dl>
<dt>renoteId</dt>
<dd>Renote先のノートid</dd>
<dt>renoteUri</dt>
<dd>Renote先のUrl（リモートのノートオブジェクトを指定）</dd>
</dl>

### 公開範囲
※specifiedに相当する値はvisibility=specifiedとvisibleAccts/visibleUserIdsで指定する

<dl>
<dt>visibility</dt>
<dd>公開範囲 ['public' | 'home' | 'followers' | 'specified']</dd>
<dt>localOnly</dt>
<dd>0(false) or 1(true)</dd>
<dt>visibleUserIds</dt>
<dd>specified時のダイレクト先のユーザーid カンマ区切りで</dd>
<dt>visibleAccts</dt>
<dd>specified時のダイレクト先のacct（＠?username[＠host]） カンマ区切りで</dd>
</dl>

### ファイル
<dl>
<dt>fileIds</dt>
<dd>添付したいファイルのid（カンマ区切りで）</dd>
</dl>
