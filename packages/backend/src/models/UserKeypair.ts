/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

@Entity('user_keypair')
export class MiUserKeypair {
	@PrimaryColumn(id())
	public userId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	/**
	 * RSA public key
	 */
	@Column('varchar', {
		length: 4096,
	})
	public publicKey: string;

	/**
	 * RSA private key
	 */
	@Column('varchar', {
		length: 4096,
	})
	public privateKey: string;

	@Column('varchar', {
		length: 128,
		nullable: true,
		default: null,
	})
	public ed25519PublicKey: string | null;

	@Column('varchar', {
		length: 128,
		nullable: true,
		default: null,
	})
	public ed25519PrivateKey: string | null;

	constructor(data: Partial<MiUserKeypair>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}
