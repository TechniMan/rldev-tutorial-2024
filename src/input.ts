import { Engine } from './engine'
import { Entity } from './entity'

// actions
export interface Action {
  perform: (engine: Engine, entity: Entity) => void
}

export class MovementAction implements Action {
  constructor(public dx: number, public dy: number) {
  }

  perform(engine: Engine, entity: Entity) {
    const destX = entity.x + this.dx
    const destY = entity.y + this.dy

    // ensure movement is valid
    if (!engine.gameMap.isInBounds(destX, destY)) return
    if (!engine.gameMap.tiles[destY][destX].walkable) return

    entity.move(this.dx, this.dy)
  }
}

// movement key maps
interface MovementMap {
  [key: string]: Action
}

const MOVE_KEYS: MovementMap = {
  ArrowUp: new MovementAction(0, -1),
  ArrowDown: new MovementAction(0, 1),
  ArrowLeft: new MovementAction(-1, 0),
  ArrowRight: new MovementAction(1, 0)
}

// input handlers
export function handleInput(event: KeyboardEvent): Action {
  return MOVE_KEYS[event.key]
}
