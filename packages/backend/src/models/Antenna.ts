/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';
import { MiUserList } from './UserList.js';

@Entity('antenna')
export class MiAntenna {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone')
	public lastUsedAt: Date;

	@Index()
	@Column({
		...id(),
		comment: 'The owner ID.',
	})
	public userId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Column('varchar', {
		length: 128,
		comment: 'The name of the Antenna.',
	})
	public name: string;

	@Column('enum', { enum: ['home', 'all', 'users', 'list', 'users_blacklist'] })
	public src: 'home' | 'all' | 'users' | 'list' | 'users_blacklist';

	@Column({
		...id(),
		nullable: true,
	})
	public userListId: MiUserList['id'] | null;

	@ManyToOne(type => MiUserList, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public userList: MiUserList | null;

	@Column('varchar', {
		length: 1024, array: true,
		default: '{}',
	})
	public users: string[];

	@Column('jsonb', {
		default: [],
	})
	public keywords: string[][];

	@Column('jsonb', {
		default: [],
	})
	public excludeKeywords: string[][];

	@Column('boolean', {
		default: false,
	})
	public caseSensitive: boolean;

	@Column('boolean', {
		default: false,
	})
	public excludeBots: boolean;

	@Column('boolean', {
		default: false,
	})
	public withReplies: boolean;

	@Column('boolean')
	public withFile: boolean;

	@Column('varchar', {
		length: 2048, nullable: true,
	})
	public expression: string | null;

	@Index()
	@Column('boolean', {
		default: true,
	})
	public isActive: boolean;

	@Column('boolean', {
		default: false,
	})
	public localOnly: boolean;

	@Column('boolean', {
		default: false,
	})
	public hideNotesInSensitiveChannel: boolean;
}
