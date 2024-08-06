import type { Actor, Entity, Item } from './entity'
import { Colours } from './colours'
import { ImpossibleException } from './types/Exceptions'
import { Point } from './types/Point'

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
  constructor(
    public item: Item | null,
    public targetPosition: Point | null = null
  ) {
    super()
  }

  public get targetActor(): Actor | undefined {
    if (!this.targetPosition) return

    const { x, y } = this.targetPosition
    return window.engine.gameMap.getActorAtLocation(x, y)
  }

  perform = (performer: Entity) => {
    this.item?.consumable.activate(this, performer)
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
          throw new ImpossibleException('Your inventory is full.')
        }

        window.engine.gameMap.removeEntity(item)
        item.parent = inventory
        inventory.items.push(item)

        window.engine.messageLog.addMessage(`You picked up the ${item.name}!`)
        return
      }
    }

    throw new ImpossibleException('There is nothing here to pick up.')
  }
}

export class DropItemAction extends ItemAction {
  perform = (performer: Entity) => {
    const dropper = performer as Actor
    if (!dropper || !this.item) return
    dropper.inventory.drop(this.item)
  }
}

export abstract class ActionWithDirection extends Action {
  constructor(public dx: number, public dy: number) {
    super()
  }

  perform = (_performer: Entity) => {}
}

function theWayIsBlocked() {
  throw new ImpossibleException('That way is blocked.')
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
      throw new ImpossibleException('Nothing to attack.')
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
