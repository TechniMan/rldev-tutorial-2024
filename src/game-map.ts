import type { Tile } from './tile-types'
import { WALL_TILE } from './tile-types'
import { Display } from 'rot-js'

export class GameMap {
  width: number
  height: number
  display: Display

  tiles: Tile[][]

  constructor(width: number, height: number, display: Display) {
    this.width = width
    this.height = height
    this.display = display

    this.tiles = new Array(this.height)
    for (let y = 0; y < this.height; ++y) {
      const row = new Array(this.width)

      for (let x = 0; x < this.width; ++x) {
        row[x] = { ...WALL_TILE }
      }

      this.tiles[y] = row
    }
  }

  isInBounds(x: number, y: number): boolean {
    return 0 <= x && x < this.width && 0 <= y && y < this.height
  }

  addRoom(atX: number, atY: number, roomTiles: Tile[][]) {
    for (let y = atY; y < atY + roomTiles.length; ++y) {
      const mapRow = this.tiles[y]
      const roomRow = roomTiles[y - atY];
      for (let x = atX; x < atX + roomRow.length; ++x) {
        // set the map tiles from the room tiles
        mapRow[x] = roomRow[x - atX]
      }
    }
  }

  //TODO could pass display in here instead of saving it as a member
  render() {
    for (let y = 0; y < this.tiles.length; ++y) {
      const row = this.tiles[y]
      for (let x = 0; x < row.length; ++x) {
        const tile = row[x]
        this.display.draw(x, y, tile.dark.char, tile.dark.fg, tile.dark.bg)
      }
    }
  }
}
