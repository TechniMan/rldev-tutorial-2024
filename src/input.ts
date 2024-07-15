import type { Actor, Entity } from './entity'

// actions
export interface Action {
  /**
   * Perform the action
   * @param performer Entity performing the action
   */
  perform: (performer: Entity) => void
}

export class WaitAction implements Action {
  perform(_performer: Entity) { }
}

export abstract class ActionWithDirection implements Action {
  constructor(
    public dx: number,
    public dy: number
  ) { }

  perform(_performer: Entity) { }
}

export class MovementAction extends ActionWithDirection {
  perform(performer: Entity) {
    const destX = performer.x + this.dx
    const destY = performer.y + this.dy

    // ensure movement is valid
    if (!window.engine.gameMap.isInBounds(destX, destY)) return
    if (!window.engine.gameMap.tiles[destY][destX].walkable) return
    if (window.engine.gameMap.getBlockingEntityAtLocation(destX, destY)) return

    performer.move(this.dx, this.dy)
  }
}

export class MeleeAction extends ActionWithDirection {
  perform(performer: Actor) {
    const destX = performer.x + this.dx
    const destY = performer.y + this.dy

    const target = window.engine.gameMap.getActorAtLocation(destX, destY)
    if (!target) throw new Error(`Failed to find actor to attack at ${destX}, ${destY}.`)

    const damage = performer.fighter.power - target.fighter.defense
    const attackDescription = `${performer.name.toUpperCase()} attacks ${target.name}`

    if (damage > 0) {
      console.log(`${attackDescription} for ${damage} hit points.`)
      target.fighter.hp -= damage
    } else {
      console.log(`${attackDescription} but does no damage.`)
    }
  }
}

export class BumpAction extends ActionWithDirection {
  perform(performer: Entity) {
    const destX = performer.x + this.dx
    const destY = performer.y + this.dy

    if (window.engine.gameMap.getActorAtLocation(destX, destY)) {
      return new MeleeAction(this.dx, this.dy).perform(performer as Actor)
    } else {
      return new MovementAction(this.dx, this.dy).perform(performer)
    }
  }
}

// movement key maps
interface MovementMap {
  [key: string]: Action
}

const MOVE_KEYS: MovementMap = {
  // Numpad keys
  1: new BumpAction(-1, 1),
  2: new BumpAction(0, 1),
  3: new BumpAction(1, 1),
  4: new BumpAction(-1, 0),
  5: new WaitAction(),
  6: new BumpAction(1, 0),
  7: new BumpAction(-1, -1),
  8: new BumpAction(0, -1),
  9: new BumpAction(1, -1)
}

// input handlers
export function handleInput(event: KeyboardEvent): Action {
  return MOVE_KEYS[event.key]
}
