import { FLOOR_TILE, WALL_TILE, Tile } from './tileTypes'
import { GameMap } from './gameMap'
import { Map } from 'rot-js'
import {
  Entity,
  spawnOrc,
  spawnTroll,
  spawnHealthPotion,
  spawnLightningScroll,
  spawnConfusionScroll
} from './entity'
import type { Room as RogueRoom } from 'rot-js/lib/map/rogue'
import { Point } from './types/Point'

interface Bounds {
  x1: number
  y1: number
  x2: number
  y2: number
}

/** Generate an integer from min to max, inclusive */
export function rand_range(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

class RectangularRoom {
  tiles: Tile[][]

  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number
  ) {
    this.tiles = new Array(this.height)
    this.buildRoom()
  }

  static fromRogueRoom(rogueRoom: RogueRoom): RectangularRoom {
    return new RectangularRoom(
      rogueRoom.x,
      rogueRoom.y,
      rogueRoom.width,
      rogueRoom.height
    )
  }

  public get centre(): Point {
    const centreX = this.x + Math.floor(this.width / 2)
    const centreY = this.y + Math.floor(this.height / 2)
    return new Point(centreX, centreY)
  }

  public get topLeft(): Point {
    return new Point(this.x, this.y)
  }

  public get right(): number {
    return this.x + this.width - 1
  }

  public get bottom(): number {
    return this.y + this.height - 1
  }

  public get bottomRight(): Point {
    return new Point(this.right, this.bottom)
  }

  public get bounds(): Bounds {
    return {
      x1: this.x,
      y1: this.y,
      x2: this.bottomRight.x,
      y2: this.bottomRight.y
    }
  }

  buildRoom() {
    for (let y = 0; y < this.height; ++y) {
      const row = new Array(this.width)
      for (let x = 0; x < this.width; ++x) {
        const isWall =
          x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1
        row[x] = isWall ? { ...WALL_TILE } : { ...FLOOR_TILE }
      }
      this.tiles[y] = row
    }
  }

  intersects(other: RectangularRoom): boolean {
    return (
      this.x <= other.right &&
      this.right >= other.x &&
      this.y <= other.bottom &&
      this.bottom >= other.y
    )
  }
}

function* connectRooms(
  a: RectangularRoom,
  b: RectangularRoom
): Generator<Point, void, void> {
  let current = a.centre
  const target = b.centre
  // 50% chance of going horizontal first
  let horizontal = Math.random() < 0.5
  let axisIndex: keyof Point = horizontal ? 'x' : 'y'

  // keep going until we reach the target
  while (current.x !== target.x || current.y !== target.y) {
    const direction = Math.sign(target[axisIndex] - current[axisIndex])
    if (direction !== 0) {
      current[axisIndex] += direction
      yield current
    } else {
      // flip the axis of travel
      horizontal = !horizontal
      axisIndex = axisIndex === 'x' ? 'y' : 'x'
      yield current
    }
  }
}

function placeEntities(
  room: RectangularRoom,
  dungeon: GameMap,
  maxMonsters: number,
  maxItems: number
) {
  const numberOfMonstersToAdd = rand_range(0, maxMonsters)
  const bounds = room.bounds
  // add monsters
  for (let m = 0; m < numberOfMonstersToAdd; ++m) {
    const x = rand_range(bounds.x1 + 1, bounds.x2 - 1)
    const y = rand_range(bounds.y1 + 1, bounds.y2 - 1)
    if (
      !dungeon.entities.any((e) => e.position.x === x && e.position.y === y)
    ) {
      if (Math.random() < 0.8) {
        spawnOrc(dungeon, x, y)
      } else {
        spawnTroll(dungeon, x, y)
      }
    }
  }
  // add items
  const numberOfItemsToAdd = rand_range(0, maxItems)
  for (let i = 0; i < numberOfItemsToAdd; ++i) {
    const x = rand_range(bounds.x1 + 1, bounds.x2 - 1)
    const y = rand_range(bounds.y1 + 1, bounds.y2 - 1)
    if (
      !dungeon.entities.any((e) => e.position.x === x && e.position.y === y)
    ) {
      const itemChance = Math.random()
      if (itemChance < 0.7) {
        spawnHealthPotion(dungeon, x, y)
      } else if (itemChance < 0.9) {
        spawnConfusionScroll(dungeon, x, y)
      } else {
        spawnLightningScroll(dungeon, x, y)
      }
    }
  }
}

export function generateSimpleDungeon(
  mapWidth: number,
  mapHeight: number,
  roomAttempts: number,
  minRoomSize: number,
  maxRoomSize: number,
  player: Entity
): GameMap {
  const dungeon = new GameMap(mapWidth, mapHeight, [player])

  // generate rooms for the dungeon
  const rooms: RectangularRoom[] = []
  for (let count = 0; count < roomAttempts; count++) {
    const width = rand_range(minRoomSize, maxRoomSize)
    const height = rand_range(minRoomSize, maxRoomSize)

    const x = rand_range(0, mapWidth - width - 1)
    const y = rand_range(0, mapHeight - height - 1)

    const newRoom = new RectangularRoom(x, y, width, height)
    // if this new room intersects any existing rooms ...
    if (rooms.any((r) => r.intersects(newRoom))) {
      // ... discard it and try again
      continue
    }

    dungeon.addRoom(x, y, newRoom.tiles)
    rooms.push(newRoom)
  }

  // connect rooms with corridors
  for (let r = 0; r < rooms.length - 1; ++r) {
    const room1 = rooms[r]
    const room2 = rooms[r + 1]

    for (const tilePos of connectRooms(room1, room2)) {
      dungeon.tiles[tilePos.y][tilePos.x] = { ...FLOOR_TILE }
    }
  }
  // carve the final tunnel, connecting the first room with the last
  {
    const room1 = rooms[rooms.length - 1]
    const room2 = rooms[0]
    for (const tilePos of connectRooms(room1, room2)) {
      dungeon.tiles[tilePos.y][tilePos.x] = { ...FLOOR_TILE }
    }
  }

  // player start position
  const startPoint = rooms[0].centre
  player.position.x = startPoint.x
  player.position.y = startPoint.y

  return dungeon
}

export function generateRogueDungeon(
  mapWidth: number,
  mapHeight: number,
  minRoomSize: number,
  maxRoomSize: number,
  maxMonstersPerRoom: number,
  maxItemsPerRoom: number,
  player: Entity
): GameMap {
  const dungeon = new GameMap(mapWidth, mapHeight, [player])
  const map = new Map.Rogue(mapWidth, mapHeight, {
    roomWidth: [minRoomSize, maxRoomSize],
    roomHeight: [minRoomSize, maxRoomSize],
    cellWidth: 3,
    cellHeight: 3
  })

  // create the dungeon map
  map.create((x, y, val) => {
    dungeon.tiles[y][x] = val ? { ...WALL_TILE } : { ...FLOOR_TILE }
  })

  // fill in the rooms
  // @ts-ignore `rooms` is private
  const rooms: RectangularRoom[] = map.rooms
    .reduce((acc: RogueRoom[], cur: RogueRoom) => acc.concat(cur), [])
    .map((rr: RogueRoom) => RectangularRoom.fromRogueRoom(rr))
  // place the player
  const startRoomIdx = rand_range(0, rooms.length - 1)
  player.position.x = rooms[startRoomIdx].centre.x
  player.position.y = rooms[startRoomIdx].centre.y
  player.parent = dungeon
  // place some entities in each room
  rooms.forEach((r: RectangularRoom) => {
    placeEntities(r, dungeon, maxMonstersPerRoom, maxItemsPerRoom)
  })

  return dungeon
}
