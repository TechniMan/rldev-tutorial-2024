import { FLOOR_TILE, WALL_TILE, Tile } from './tile-types'
import { GameMap } from './game-map'
import type { Display } from 'rot-js'
import { Entity } from './entity'

class Point2D {
  constructor(
    public x: number,
    public y: number
  ) { }
}

function rand_range(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min)
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

  public get centre(): Point2D {
    const centreX = this.x + Math.floor(this.width / 2)
    const centreY = this.y + Math.floor(this.height / 2)
    return new Point2D(centreX, centreY)
  }

  buildRoom() {
    for (let y = 0; y < this.height; ++y) {
      const row = new Array(this.width)
      for (let x = 0; x < this.width; ++x) {
        const isWall = x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1
        row[x] = isWall ? { ...WALL_TILE } : { ...FLOOR_TILE }
      }
      this.tiles[y] = row
    }
  }

  intersects(other: RectangularRoom): boolean {
    return (
      this.x <= other.x + other.width &&
      this.x + this.width >= other.x &&
      this.y <= other.y + other.height &&
      this.y + this.height >= other.y
    )
  }
}

function* connectRooms(
  a: RectangularRoom,
  b: RectangularRoom
): Generator<Point2D, void, void> {
  let current = a.centre
  const target = b.centre
  // 50% chance of going horizontal first
  let horizontal = Math.random() < 0.5
  let axisIndex: keyof Point2D = horizontal ? 'x' : 'y'

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

export function generateSimpleDungeon(
  mapWidth: number,
  mapHeight: number,
  roomAttempts: number,
  minRoomSize: number,
  maxRoomSize: number,
  player: Entity,
  display: Display
): GameMap {
  const dungeon = new GameMap(mapWidth, mapHeight, display)

  // generate rooms for the dungeon
  const rooms: RectangularRoom[] = []
  for (let count = 0; count < roomAttempts; count++) {
    const width = rand_range(minRoomSize, maxRoomSize)
    const height = rand_range(minRoomSize, maxRoomSize)

    const x = rand_range(0, mapWidth - width - 1)
    const y = rand_range(0, mapHeight - height - 1)

    const newRoom = new RectangularRoom(x, y, width, height)
    // if this new room intersects any existing rooms ...
    if (rooms.some(r => r.intersects(newRoom))) {
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
  player.x = startPoint.x
  player.y = startPoint.y

  return dungeon
}
