/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, OneToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

@Entity('user_publickey')
export class MiUserPublickey {
	@PrimaryColumn('varchar', {
		length: 256,
	})
	public keyId: string;

	@Index()
	@Column(id())
	public userId: MiUser['id'];

	@OneToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Column('varchar', {
		length: 4096,
	})
	public keyPem: string;

	constructor(data: Partial<MiUserPublickey>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}
