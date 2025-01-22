
describe('Change the language to Japanese', () => {
	beforeEach(() => {
		cy.resetState();

		cy.visit("/", {
			onBeforeLoad(window) {
				Object.defineProperty(window.navigator, 'language', { value: 'ja-JP' })
				Object.defineProperty(window.navigator, 'languages', { value: ['ja'] })
				Object.defineProperty(window.navigator, 'accept_languages', { value: ['ja'] })
			},
			headers: {
				'Accept-Language': 'ja'
			}
		})
		// インスタンス初期セットアップ
		cy.registerUser('admin', 'pass', true);

		// ユーザー作成
		cy.registerUser('alice', 'alice1234');

		cy.login('alice', 'alice1234');
	});

	afterEach(() => {

		// テスト終了直前にページ遷移するようなテストケース(例えばアカウント作成)だと、たぶんCypressのバグでブラウザの内容が次のテストケースに引き継がれてしまう(例えばアカウントが作成し終わった段階からテストが始まる)。
		// waitを入れることでそれを防止できる
		cy.wait(1000);
	});

	it('display language is english', () => {
		cy.get('html').should('have.attr', 'lang', 'ja-JP');
		cy.contains("ようこそ");
	});
});


describe('Change the language to English', () => {
	beforeEach(() => {
		cy.resetState();

		cy.visit("/", {
			onBeforeLoad(window) {
				Object.defineProperty(window.navigator, 'language', { value: 'en-US' })
				Object.defineProperty(window.navigator, 'languages', { value: ['en'] })
				Object.defineProperty(window.navigator, 'accept_languages', { value: ['en'] })
			},
			headers: {
				'Accept-Language': 'en'
			}
		})
		// インスタンス初期セットアップ
		cy.registerUser('admin', 'pass', true);

		// ユーザー作成
		cy.registerUser('alice', 'alice1234');

		cy.login('alice', 'alice1234');
	});

	afterEach(() => {

		// テスト終了直前にページ遷移するようなテストケース(例えばアカウント作成)だと、たぶんCypressのバグでブラウザの内容が次のテストケースに引き継がれてしまう(例えばアカウントが作成し終わった段階からテストが始まる)。
		// waitを入れることでそれを防止できる
		cy.wait(1000);
	});

	it('display language is english', () => {
		cy.get('html').should('have.attr', 'lang', 'en-US');
		cy.contains("Welcome!");

	});
});

describe('Change the language to Chinese', () => {
	beforeEach(() => {
		cy.resetState();

		cy.visit("/", {
			onBeforeLoad(window) {
				Object.defineProperty(window.navigator, 'language', { value: 'zh' })
				Object.defineProperty(window.navigator, 'languages', { value: ['zh'] })
				Object.defineProperty(window.navigator, 'accept_languages', { value: ['zh'] })
			},
			headers: {
				'Accept-Language': 'zh'
			}
		})
		// インスタンス初期セットアップ
		cy.registerUser('admin', 'pass', true);

		// ユーザー作成
		cy.registerUser('alice', 'alice1234');

		cy.login('alice', 'alice1234');
	});

	afterEach(() => {

		// テスト終了直前にページ遷移するようなテストケース(例えばアカウント作成)だと、たぶんCypressのバグでブラウザの内容が次のテストケースに引き継がれてしまう(例えばアカウントが作成し終わった段階からテストが始まる)。
		// waitを入れることでそれを防止できる
		cy.wait(1000);
	});

	it('display language is english', () => {
		cy.get('html').should('have.attr', 'lang', 'zh-CN');
		cy.contains("欢迎！");
	});
});
