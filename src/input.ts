import { Colours } from './colours'
import { EngineState } from './engine'
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
  perform(_performer: Entity) {}
}

export class LogAction implements Action {
  perform(_performer: Entity) {
    window.engine.state = EngineState.Log
  }
}

export abstract class ActionWithDirection implements Action {
  constructor(public dx: number, public dy: number) {}

  perform(_performer: Entity) {}
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
    if (!target)
      throw new Error(`Failed to find actor to attack at ${destX}, ${destY}.`)

    const damage = performer.fighter.power - target.fighter.defense
    const attackDescription = `${performer.name.toUpperCase()} attacks ${
      target.name
    }`

    const fg =
      performer.name === 'Player' ? Colours.PlayerAttack : Colours.EnemyAttack
    if (damage > 0) {
      window.engine.messageLog.addMessage(
        `${attackDescription} for ${damage} hit points.`,
        fg
      )
      target.fighter.hp -= damage
    } else {
      window.engine.messageLog.addMessage(
        `${attackDescription} but does no damage.`,
        fg
      )
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
  // Movement keys
  1: new BumpAction(-1, 1),
  2: new BumpAction(0, 1),
  3: new BumpAction(1, 1),
  4: new BumpAction(-1, 0),
  5: new WaitAction(),
  6: new BumpAction(1, 0),
  7: new BumpAction(-1, -1),
  8: new BumpAction(0, -1),
  9: new BumpAction(1, -1),
  // UI keys
  l: new LogAction()
}

interface LogMap {
  [key: string]: number
}

const LOG_KEYS: LogMap = {
  ArrowUp: -1,
  ArrowDown: 1,
  PageUp: -10,
  PageDown: 10
}

// input handlers
export function handleGameInput(event: KeyboardEvent): Action {
  return MOVE_KEYS[event.key]
}

export function handleLogInput(event: KeyboardEvent): number {
  // scroll to beginning
  if (event.key === 'Home') {
    window.engine.logCursorPosition = 0
    return 0
  }
  // scroll to end
  if (event.key === 'End') {
    window.engine.logCursorPosition =
      window.engine.messageLog.messages.length - 1
    return 0
  }
  // scroll an amount or close
  const scrollAmount = LOG_KEYS[event.key]
  if (!scrollAmount) {
    window.engine.state = EngineState.Game
    return 0
  }
  return scrollAmount
}
