import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

@Entity('mahjong_game')
export class MiMahjongGame {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone', {
		nullable: true,
	})
	public startedAt: Date | null;

	@Column('timestamp with time zone', {
		nullable: true,
	})
	public endedAt: Date | null;

	@Column({
		...id(),
		nullable: true,
	})
	public user1Id: MiUser['id'] | null;

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user1: MiUser | null;

	@Column({
		...id(),
		nullable: true,
	})
	public user2Id: MiUser['id'] | null;

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user2: MiUser | null;

	@Column({
		...id(),
		nullable: true,
	})
	public user3Id: MiUser['id'] | null;

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user3: MiUser | null;

	@Column({
		...id(),
		nullable: true,
	})
	public user4Id: MiUser['id'] | null;

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user4: MiUser | null;

	@Column('boolean', {
		default: false,
	})
	public isEnded: boolean;

	@Column({
		...id(),
		nullable: true,
	})
	public winnerId: MiUser['id'] | null;

	// in sec
	@Column('smallint', {
		default: 90,
	})
	public timeLimitForEachTurn: number;

	@Column('jsonb', {
		default: [],
	})
	public logs: number[][];
}
