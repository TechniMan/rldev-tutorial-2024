import { Display, FOV } from 'rot-js'
import type { Tile, TileGraphic } from './tileTypes'
import { INVISIBLE, WALL_TILE } from './tileTypes'
import { Actor, Item, type Entity } from './entity'
import { Point } from './types/Point'

export class GameMap {
  tiles: Tile[][]
  downstairsPosition: Point

  constructor(
    public width: number,
    public height: number,
    public entities: Entity[]
  ) {
    this.tiles = new Array(this.height)
    for (let y = 0; y < this.height; ++y) {
      const row = new Array(this.width)

      for (let x = 0; x < this.width; ++x) {
        row[x] = { ...WALL_TILE }
      }

      this.tiles[y] = row
    }
    this.downstairsPosition = new Point()
  }

  public get gameMap(): GameMap {
    return this
  }

  public get nonPlayerEntities(): Entity[] {
    return this.entities.filter((e) => e.name !== 'Player')
  }

  public get livingActors(): Actor[] {
    return this.entities
      .filter((e) => e instanceof Actor)
      .map((e) => e as Actor)
      .filter((a) => a.isAlive)
  }

  public get items(): Item[] {
    return this.entities.filter((e) => e instanceof Item).map((e) => e as Item)
  }

  removeEntity(entity: Entity) {
    const index = this.entities.indexOf(entity)
    if (index >= 0) {
      this.entities.splice(index, 1)
    }
  }

  isInBounds(x: number, y: number): boolean {
    return 0 <= x && x < this.width && 0 <= y && y < this.height
  }

  getBlockingEntityAtLocation(x: number, y: number): Entity | undefined {
    return this.entities.find((e) => {
      return e.position.x === x && e.position.y === y && e.blocksMovement
    })
  }

  getActorAtLocation(x: number, y: number): Actor | undefined {
    return this.livingActors.find(
      (a) => a.position.x === x && a.position.y === y
    )
  }

  addRoom(atX: number, atY: number, roomTiles: Tile[][]) {
    for (let y = atY; y < atY + roomTiles.length; ++y) {
      const mapRow = this.tiles[y]
      const roomRow = roomTiles[y - atY]
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
    fov.compute(player.position.x, player.position.y, 8, (x, y, _r, v) => {
      if (v) {
        this.tiles[y][x].visible = true
        this.tiles[y][x].seen = true
      }
    })
  }

  drawTile(display: Display, x: number, y: number, tile: TileGraphic) {
    display.draw(x, y, tile.char, tile.fg, tile.bg)
  }

  render(display: Display, offsetX: number, offsetY: number) {
    // first, render the map
    for (let y = 0; y < this.tiles.length; ++y) {
      const row = this.tiles[y]
      for (let x = 0; x < row.length; ++x) {
        const tile = row[x]
        const graphic = tile.visible
          ? tile.light
          : tile.seen
          ? tile.dark
          : INVISIBLE
        this.drawTile(display, offsetX + x, offsetY + y, graphic)
      }
    }
    // then, render the entities in render order
    for (const e of this.entities
      .slice()
      .sort((a, b) => a.renderOrder - b.renderOrder)) {
      if (this.tiles[e.position.y][e.position.x].visible) {
        display.draw(
          offsetX + e.position.x,
          offsetY + e.position.y,
          e.char,
          e.fg,
          e.bg
        )
      }
    }
  }
}
