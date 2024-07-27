import { Colours } from './colours'
import { EngineState } from './engine'
import type { Actor, Entity, Item } from './entity'

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

export class InventoryAction implements Action {
  constructor(public isUsing: boolean) {}

  perform(_performer: Entity) {
    window.engine.state = this.isUsing
      ? EngineState.UseInventory
      : EngineState.DropInventory
  }
}

export class ItemAction implements Action {
  constructor(public item: Item) {}

  perform(performer: Entity) {
    this.item.consumable.activate(this, performer)
  }
}

export class PickupAction implements Action {
  perform(entity: Entity) {
    const performer = entity as Actor
    if (!performer) return

    const { x, y, inventory } = performer
    for (const item of window.engine.gameMap.items) {
      if (x === item.x && y === item.y) {
        if (inventory.items.length >= inventory.capacity) {
          window.engine.messageLog.addMessage(
            'Your inventory is full.',
            Colours.Impossible
          )
          throw new Error('Your inventory is full.')
        }

        window.engine.gameMap.removeEntity(item)
        item.parent = inventory
        inventory.items.push(item)

        window.engine.messageLog.addMessage(`You picked up the ${item.name}!`)
        return
      }
    }

    window.engine.messageLog.addMessage(
      'There is nothing here to pick up.',
      Colours.Impossible
    )
    throw new Error('There is nothing here to pick up.')
  }
}

export class DropItemAction extends ItemAction {
  perform(performer: Entity) {
    const dropper = performer as Actor
    if (!dropper) return
    dropper.inventory.drop(this.item)
    // love wife
  }
}

export abstract class ActionWithDirection implements Action {
  constructor(public dx: number, public dy: number) {}

  perform(_performer: Entity) {}
}

function theWayIsBlocked() {
  window.engine.messageLog.addMessage(
    'That way is blocked.',
    Colours.Impossible
  )
  throw new Error('That way is blocked.')
}

export class MovementAction extends ActionWithDirection {
  perform(performer: Entity) {
    const destX = performer.x + this.dx
    const destY = performer.y + this.dy

    // ensure movement is valid
    if (!window.engine.gameMap.isInBounds(destX, destY)) {
      theWayIsBlocked()
    }
    if (!window.engine.gameMap.tiles[destY][destX].walkable) {
      theWayIsBlocked()
    }
    if (window.engine.gameMap.getBlockingEntityAtLocation(destX, destY)) {
      theWayIsBlocked()
    }

    performer.move(this.dx, this.dy)
  }
}

export class MeleeAction extends ActionWithDirection {
  perform(performer: Actor) {
    const destX = performer.x + this.dx
    const destY = performer.y + this.dy

    const target = window.engine.gameMap.getActorAtLocation(destX, destY)
    if (!target) {
      window.engine.messageLog.addMessage(
        'Nothing to attack.',
        Colours.Impossible
      )
      throw new Error('Nothing to attack.')
    }

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
  d: new InventoryAction(false), // [d]rop
  i: new InventoryAction(true), // open [i]nventory
  l: new LogAction(), // open message [l]og history
  p: new PickupAction() // [p]ick up item
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

export function handleInventoryInput(event: KeyboardEvent): Action | null {
  let action: Action | null = null
  // ensure key pressed was a single character
  // e.g. don't use the first char of 'Tab'
  if (event.key.length === 1) {
    const ordinal = event.key.charCodeAt(0)
    const index = ordinal - 'a'.charCodeAt(0)

    if (index >= 0 && index < 26) {
      const item = window.engine.player.inventory.items[index]
      if (item) {
        if (window.engine.state === EngineState.UseInventory) {
          // consume the item
          action = item.consumable.getAction()
        } else if (window.engine.state === EngineState.DropInventory) {
          // drop the item
          action = new DropItemAction(item)
        }
      } else {
        window.engine.messageLog.addMessage(
          `You do not have an item at ${event.key}.`
        )
        return null
      }
    }
  }

  // reset the state (close the inventory view) and return the appropriate action
  window.engine.state = EngineState.Game
  return action
}
