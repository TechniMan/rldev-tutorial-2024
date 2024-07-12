import { Display, FOV } from 'rot-js'
import type { Tile, TileGraphic } from './tile-types'
import { INVISIBLE, WALL_TILE } from './tile-types'
import type { Entity } from './entity'

export class GameMap {
  tiles: Tile[][]

  constructor(
    public width: number,
    public height: number,
    public display: Display
  ) {
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

  lightPasses(x: number, y: number): boolean {
    // if the coords are within the map boundary
    // (FOV gives us coords in an area around the player)
    return this.isInBounds(x, y) ? this.tiles[y][x].transparent : false
  }

  updateFov(player: Entity) {
    // reset visibility of tiles
    for (let y = 0; y < this.height; ++y) {
      for (let x = 0; x < this.width; ++x) {
        this.tiles[y][x].visible = false
      }
    }

    // then calculate currently visible tiles
    const fov = new FOV.PreciseShadowcasting(this.lightPasses.bind(this))
    // r is the distance of the point from the player, v is a value between [0, 1]
    fov.compute(player.x, player.y, 8, (x, y, _r, v) => {
      if (v) {
        this.tiles[y][x].visible = true
        this.tiles[y][x].seen = true
      }
    })
  }

  //TODO could pass display here directly, instead of saving it as a property
  drawTile(x: number, y: number, tile: TileGraphic) {
    this.display.draw(x, y, tile.char, tile.fg, tile.bg)
  }
  render() {
    for (let y = 0; y < this.tiles.length; ++y) {
      const row = this.tiles[y]
      for (let x = 0; x < row.length; ++x) {
        const tile = row[x]
        const graphic = tile.visible ? tile.light : tile.seen ? tile.dark : INVISIBLE
        this.drawTile(x, y, graphic)
      }
    }
  }
}
