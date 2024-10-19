import type { Actor, Entity, Item } from './entity'
import { Colours } from './colours'
import { ImpossibleException } from './types/Exceptions'
import { Point } from './types/Point'
import { GameMap } from './gameMap'
import { GameScreen } from './screens/GameScreen'

export abstract class Action {
  /**
   * Perform the action
   * @param performer Entity performing the action
   */
  perform: (performer: Entity, gameMap: GameMap) => void = function () {}
}

export class WaitAction extends Action {
  perform = (_performer: Entity, _gameMap: GameMap) => {}
}

export class LogAction extends Action {
  constructor(public moveLog: () => void) {
    super()
  }

  perform = (_performer: Entity, _gameMap: GameMap) => {
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

  targetActor(gameMap: GameMap): Actor | undefined {
    if (!this.targetPosition) return undefined

    const { x, y } = this.targetPosition
    return gameMap.getActorAtLocation(x, y)
  }

  perform = (performer: Entity, gameMap: GameMap) => {
    this.item?.consumable.activate(this, performer, gameMap)
  }
}

export class PickupAction extends Action {
  perform = (entity: Entity, gameMap: GameMap) => {
    const performer = entity as Actor
    if (!performer) return

    const { position, inventory } = performer
    for (const item of gameMap.items) {
      if (position.x === item.position.x && position.y === item.position.y) {
        if (inventory.items.length >= inventory.capacity) {
          throw new ImpossibleException('Your inventory is full.')
        }

        gameMap.removeEntity(item)
        item.parent = inventory
        inventory.items.push(item)

        window.messageLog.addMessage(`You picked up the ${item.name}!`)
        return
      }
    }

    throw new ImpossibleException('There is nothing here to pick up.')
  }
}

export class DropItemAction extends ItemAction {
  perform = (performer: Entity, gameMap: GameMap) => {
    const dropper = performer as Actor
    if (!dropper || !this.item) return
    dropper.inventory.drop(this.item, gameMap)
  }
}

export abstract class ActionWithDirection extends Action {
  constructor(public dx: number, public dy: number) {
    super()
  }

  perform = (_performer: Entity, _gameMap: GameMap) => {}
}

function theWayIsBlocked() {
  throw new ImpossibleException('That way is blocked.')
}

export class MovementAction extends ActionWithDirection {
  perform = (performer: Entity, gameMap: GameMap) => {
    const destX = performer.position.x + this.dx
    const destY = performer.position.y + this.dy

    // ensure movement is valid
    if (!gameMap.isInBounds(destX, destY)) {
      theWayIsBlocked()
    }
    if (!gameMap.tiles[destY][destX].walkable) {
      theWayIsBlocked()
    }
    if (gameMap.getBlockingEntityAtLocation(destX, destY)) {
      theWayIsBlocked()
    }

    performer.move(this.dx, this.dy)
  }
}

export class MeleeAction extends ActionWithDirection {
  perform = (entity: Entity, gameMap: GameMap) => {
    const performer = entity as Actor
    if (!performer) return

    const destX = performer.position.x + this.dx
    const destY = performer.position.y + this.dy

    const target = gameMap.getActorAtLocation(destX, destY)
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
      window.messageLog.addMessage(
        `${attackDescription} for ${damage} hit points.`,
        fg
      )
      target.fighter.hp -= damage
    } else {
      window.messageLog.addMessage(
        `${attackDescription} but does no damage.`,
        fg
      )
    }
  }
}

export class BumpAction extends ActionWithDirection {
  perform = (performer: Entity, gameMap: GameMap) => {
    const destX = performer.position.x + this.dx
    const destY = performer.position.y + this.dy

    if (gameMap.getActorAtLocation(destX, destY)) {
      return new MeleeAction(this.dx, this.dy).perform(
        performer as Actor,
        gameMap
      )
    } else {
      return new MovementAction(this.dx, this.dy).perform(performer, gameMap)
    }
  }
}

export class TakeStairsAction extends Action {
  perform = (performer: Entity, gameMap: GameMap) => {
    if (performer.position.equals(gameMap.downstairsPosition)) {
      window.messageLog.addMessage(
        'You descend the staircase to a new floor.',
        Colours.Descend
      )
      ;(window.engine.screen as GameScreen).generateFloor()
    } else {
      throw new ImpossibleException('There are no stairs here.')
    }
  }
}
