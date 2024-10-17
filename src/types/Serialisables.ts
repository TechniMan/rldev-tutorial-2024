import { Tile } from '../tileTypes'
import { Point } from './Point'

type SerialisedFighter = {
  maxHp: number
  hp: number
  defense: number
  power: number
}

type SerialisedItem = {
  itemType: string
}

type SerialisedEntity = {
  position: Point
  char: string
  fg: string
  bg: string
  name: string
  fighter: SerialisedFighter | null
  aiType: string | null
  confusedTurnsRemaining: number
  inventory: SerialisedItem[] | null
}

export type SerialisedGameMap = {
  width: number
  height: number
  tiles: Tile[][]
  entities: SerialisedEntity[]
}
