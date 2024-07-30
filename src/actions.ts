import type { Actor, Entity, Item } from './entity'
import { Colours } from './colours'

export abstract class Action {
  /**
   * Perform the action
   * @param performer Entity performing the action
   */
  perform: (performer: Entity) => void = function () {}
}

export class WaitAction extends Action {
  perform = (_performer: Entity) => {}
}

export class LogAction extends Action {
  constructor(public moveLog: () => void) {
    super()
  }

  perform = (_performer: Entity) => {
    this.moveLog()
  }
}

export class ItemAction extends Action {
  constructor(public item: Item) {
    super()
  }

  perform = (performer: Entity) => {
    this.item.consumable.activate(performer)
  }
}

export class PickupAction extends Action {
  perform = (entity: Entity) => {
    const performer = entity as Actor
    if (!performer) return

    const { position, inventory } = performer
    for (const item of window.engine.gameMap.items) {
      if (position.x === item.position.x && position.y === item.position.y) {
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
  perform = (performer: Entity) => {
    const dropper = performer as Actor
    if (!dropper) return
    dropper.inventory.drop(this.item)
    // love wife
  }
}

export abstract class ActionWithDirection extends Action {
  constructor(public dx: number, public dy: number) {
    super()
  }

  perform = (_performer: Entity) => {}
}

function theWayIsBlocked() {
  window.engine.messageLog.addMessage(
    'That way is blocked.',
    Colours.Impossible
  )
  throw new Error('That way is blocked.')
}

export class MovementAction extends ActionWithDirection {
  perform = (performer: Entity) => {
    const destX = performer.position.x + this.dx
    const destY = performer.position.y + this.dy

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
  perform = (entity: Entity) => {
    const performer = entity as Actor
    if (!performer) return

    const destX = performer.position.x + this.dx
    const destY = performer.position.y + this.dy

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
  perform = (performer: Entity) => {
    const destX = performer.position.x + this.dx
    const destY = performer.position.y + this.dy

    if (window.engine.gameMap.getActorAtLocation(destX, destY)) {
      return new MeleeAction(this.dx, this.dy).perform(performer as Actor)
    } else {
      return new MovementAction(this.dx, this.dy).perform(performer)
    }
  }
}
