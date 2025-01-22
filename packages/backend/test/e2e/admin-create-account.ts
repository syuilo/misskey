/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';

import type * as misskey from 'misskey-js';
import { api, role, signup } from '../utils.js';

describe('Admin Create User', () => {
    let admin: misskey.entities.SignupResponse;
    let user: misskey.entities.SignupResponse;
    let formerAdmin: misskey.entities.SignupResponse;
    let adminRole : misskey.entities.Role;
    let formerAdminRole : misskey.entities.Role;

    beforeAll(async () => {
        admin = await signup({ username: 'admin' });
        formerAdmin = await signup({ username: 'former_admin' });
        user = await signup({ username: 'user' });
        adminRole = await role(admin, {
            name: 'admin',
            isAdministrator: true
        });
        formerAdminRole = await role(admin, {
            name: 'former_admin',
            isAdministrator: true
        });
        const addAdminRole = await api('admin/roles/assign', {
            userId: admin.id,
            roleId: adminRole.id
        }, admin);
        assert.strictEqual(addAdminRole.status, 204);

        const addFormerAdminRole = await api('admin/roles/assign', {
            userId: formerAdmin.id,
            roleId: formerAdminRole.id
        }, admin);
        assert.strictEqual(addFormerAdminRole.status, 204);
    }, 1000 * 60 * 2);

    test('Create User', async () => {
        const newUser1 = await api('admin/accounts/create', {
            username: 'new_user1',
            password: 'password',
        }, admin);
        assert.strictEqual(newUser1.status, 200);

        const newUser2 = await api('admin/accounts/create', {
            username: 'new_user2',
            password: 'password',
        }, formerAdmin);
        assert.strictEqual(newUser2.status, 200);

        const newUser3 = await api('admin/accounts/create', {
            username: 'new_user3',
            password: 'password',
        }, user);
        assert.strictEqual(newUser3.status, 403);
    });

    test('Revoking Admin Role', async () => {
        const res = await api('admin/roles/delete', {roleId: formerAdminRole.id}, admin);
        assert.strictEqual(res.status, 204);

        const res2 = await api('admin/roles/delete', {roleId: adminRole.id}, formerAdmin);
        assert.strictEqual(res2.status, 403);
    });

    test('Revoked User Should Not Create User', async () => {
        const newUser4 = await api('admin/accounts/create', {
            username: 'new_user4',
            password: 'password',
        }, formerAdmin);

        assert.strictEqual(newUser4.status, 403);

        const newUser5 = await api('admin/accounts/create', {
            username: 'new_user5',
            password: 'password',
        }, admin);

        assert.strictEqual(newUser5.status, 200);
    });
})