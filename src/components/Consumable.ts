import type { Actor, Entity, Item } from '../entity'
import { Inventory } from './Inventory'
import { Action, ItemAction } from '../actions'
import { Colours } from '../colours'
import { ImpossibleException } from '../types/Exceptions'
import { SingleRangedAttackHandler } from '../inputHandlers'
import { ConfusedEnemy } from './AI'

export abstract class Consumable {
  protected constructor(public parent: Item | null) {}

  getAction(): Action | null {
    if (this.parent) {
      return new ItemAction(this.parent)
    }
    return null
  }

  abstract activate(action: ItemAction, consumer: Entity): void

  consume() {
    const item = this.parent
    if (item) {
      const inventory = item.parent
      if (inventory instanceof Inventory) {
        const idx = inventory.items.indexOf(item)
        if (idx >= 0) {
          inventory.items.splice(idx, 1)
        }
      }
    }
  }
}

export class HealingConsumable extends Consumable {
  constructor(public amount: number, parent: Item | null = null) {
    super(parent)
  }

  activate(_action: ItemAction, entity: Entity) {
    const consumer = entity as Actor
    if (!consumer) return

    const amountRecovered = consumer.fighter.heal(this.amount)

    if (amountRecovered > 0) {
      window.engine.messageLog.addMessage(
        `You consume the ${this.parent?.name} and recover ${amountRecovered} HP.`,
        Colours.HealthRecovered
      )
      this.consume()
    } else {
      throw new ImpossibleException('Your health is already full.')
    }
  }
}

export class LightningConsumable extends Consumable {
  constructor(
    public damage: number,
    public maxRange: number,
    parent: Item | null = null
  ) {
    super(parent)
  }

  activate(_action: ItemAction, entity: Entity) {
    let target: Actor | null = null
    // +1 to ensure we capture everything that should be in range
    let closestDistance = this.maxRange + 1.0

    // find the closest valid target
    for (const actor of window.engine.gameMap.livingActors) {
      if (
        !Object.is(actor, entity) &&
        window.engine.gameMap.tiles[actor.position.y][actor.position.x].visible
      ) {
        const distance = entity.position.distanceTo(actor.position)
        if (distance < closestDistance) {
          target = actor
          closestDistance = distance
        }
      }
    }

    // if a target was found, zap 'em!
    if (target) {
      window.engine.messageLog.addMessage(
        `A lightning bolt strikes the ${target.name} with a loud thunder, for ${this.damage} damage!`
      )
      target.fighter.takeDamage(this.damage)
      this.consume()
    } else {
      throw new ImpossibleException('No enemy is close enough to strike.')
    }
  }
}

export class ConfusionConsumable extends Consumable {
  constructor(public numberOfTurns: number, parent: Item | null = null) {
    super(parent)
  }

  getAction(): Action | null {
    window.engine.messageLog.addMessage(
      'Select a target location.',
      Colours.NeedsTarget
    )
    window.engine.inputHandler = new SingleRangedAttackHandler(
      (p) => new ItemAction(this.parent, p)
    )
    return null
  }

  activate(action: ItemAction, consumer: Entity): void {
    const target = action.targetActor

    if (!target) {
      throw new ImpossibleException('You must select an enemy to target.')
    }
    if (
      !window.engine.gameMap.tiles[target.position.y][target.position.x].visible
    ) {
      throw new ImpossibleException('You cannot target an area you cannot see.')
    }
    if (Object.is(target, consumer)) {
      throw new ImpossibleException('You cannot confuse yourself!')
    }

    window.engine.messageLog.addMessage(
      `The eyes of the ${target.name} look vacant, as it starts to stumble around!`,
      Colours.StatusEffectApplied
    )
    target.ai = new ConfusedEnemy(target.ai, this.numberOfTurns)
    this.consume()
  }
}
