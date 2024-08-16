export const TILE_TYPES = [
	'bamboo1',
	'bamboo2',
	'bamboo3',
	'bamboo4',
	'bamboo5',
	'bamboo6',
	'bamboo7',
	'bamboo8',
	'bamboo9',
	'character1',
	'character2',
	'character3',
	'character4',
	'character5',
	'character6',
	'character7',
	'character8',
	'character9',
	'circle1',
	'circle2',
	'circle3',
	'circle4',
	'circle5',
	'circle6',
	'circle7',
	'circle8',
	'circle9',
	'wind-east',
	'wind-south',
	'wind-west',
	'wind-north',
	'dragon-red',
	'dragon-green',
	'dragon-white',
];

type Player = 'east' | 'south' | 'west' | 'north';

export class MahjongGameForBackend {
	public tiles: (typeof TILE_TYPES[number])[] = [];
	public 場: (typeof TILE_TYPES[number])[] = [];
	public playerEastTiles: (typeof TILE_TYPES[number])[] = [];
	public playerSouthTiles: (typeof TILE_TYPES[number])[] = [];
	public playerWestTiles: (typeof TILE_TYPES[number])[] = [];
	public playerNorthTiles: (typeof TILE_TYPES[number])[] = [];
	public turn: Player = 'east';

	constructor() {
		this.tiles = TILE_TYPES.slice();
		this.shuffleTiles();
	}

	public shuffleTiles() {
		this.tiles.sort(() => Math.random() - 0.5);
	}

	public drawTile(): typeof TILE_TYPES[number] {
		return this.tiles.pop()!;
	}

	public operation_drop(player: Player, tile: typeof TILE_TYPES[number]) {
		if (this.turn !== player) {
			throw new Error('Not your turn');
		}

		switch (player) {
			case 'east':
				this.playerEastTiles.splice(this.playerEastTiles.indexOf(tile), 1);
				break;
			case 'south':
				this.playerSouthTiles.splice(this.playerSouthTiles.indexOf(tile), 1);
				break;
			case 'west':
				this.playerWestTiles.splice(this.playerWestTiles.indexOf(tile), 1);
				break;
			case 'north':
				this.playerNorthTiles.splice(this.playerNorthTiles.indexOf(tile), 1);
				break;
		}
		this.場.push(tile);
	}
}
