describe('After user signed in', () => {
	beforeEach(() => {
		cy.window(win => {
			win.indexedDB.deleteDatabase('keyval-store');
		});
		cy.viewport('macbook-16');
		cy.request('POST', '/api/reset-db').as('reset');
		cy.get('@reset').its('status').should('equal', 204);
		cy.reload(true);

		// インスタンス初期セットアップ
		cy.request('POST', '/api/admin/accounts/create', {
			username: 'admin',
			password: 'pass',
		}).its('body').as('admin');

		// ユーザー作成
		cy.request('POST', '/api/signup', {
			username: 'alice',
			password: 'alice1234',
		}).its('body').as('alice');

		cy.visit('/');

		cy.intercept('POST', '/api/signin').as('signin');

		cy.get('[data-cy-signin]').click();
		cy.get('[data-cy-signin-username] input').type('alice');
		cy.get('[data-cy-signin-password] input').type('alice1234{enter}');

		cy.wait('@signin').as('signedIn');
	});

	afterEach(() => {
		// テスト終了直前にページ遷移するようなテストケース(例えばアカウント作成)だと、たぶんCypressのバグでブラウザの内容が次のテストケースに引き継がれてしまう(例えばアカウントが作成し終わった段階からテストが始まる)。
		// waitを入れることでそれを防止できる
		cy.wait(1000);
	});

  it('widget edit toggle is visible', () => {
		cy.visit('/');
		cy.get('.msky-widget-edit').should('be.visible');
  });

	it('widget select should be visible in edit mode', () => {
		cy.get('.msky-widget-edit').click();
		cy.get('.msky-widget-select').should('be.visible');
  });

	it('memo widget should get added', () => {
		cy.get('.msky-widget-edit').click();
		cy.get('.msky-widget-select select').select('memo', { force: true });
		cy.get('.msky-widget-add').click({ force: true });
		cy.get('.mkw-memo').should('be.visible');
  });
});
