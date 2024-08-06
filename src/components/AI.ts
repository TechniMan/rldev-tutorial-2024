import * as ROT from 'rot-js'

import {
  Action,
  BumpAction,
  MeleeAction,
  MovementAction,
  WaitAction
} from '../actions'
import { rand_range } from '../procgen'
import type { Actor, Entity } from '../entity'
import { Point } from '../types/Point'

export abstract class BaseAI implements Action {
  path: Point[]

  protected constructor() {
    this.path = []
  }

  abstract perform(_performer: Entity): void

  calculatePathTo(destX: number, destY: number, entity: Entity) {
    const isPassable = (x: number, y: number) =>
      window.engine.gameMap.tiles[y][x].walkable
    const dijkstra = new ROT.Path.Dijkstra(destX, destY, isPassable, {
      topology: 8 // 4/6/8 directions of movement
    })

    this.path.clear()

    dijkstra.compute(
      entity.position.x,
      entity.position.y,
      (x: number, y: number) => {
        this.path.push(new Point(x, y))
      }
    )
    // the first point in the path is the entity's current position, so discard it
    this.path.shift()
  }
}

export class HostileEnemy extends BaseAI {
  constructor() {
    super()
  }

  perform(self: Entity) {
    const target = window.engine.player
    const dx = target.position.x - self.position.x
    const dy = target.position.y - self.position.y
    const distance = Math.max(Math.abs(dx), Math.abs(dy))

    // initiate action if we are visible to the player
    if (window.engine.gameMap.tiles[self.position.y][self.position.x].visible) {
      // if we are adjacent - attack!
      if (distance <= 1) {
        return new MeleeAction(dx, dy).perform(self as Actor)
      }
      // otherwise, find a path from us to them
      this.calculatePathTo(target.position.x, target.position.y, self)
    }

    // if there is a valid path, try to move towards them
    // because the path isn't cleared unless it is recalculated,
    //  we will continue moving towards their last known location
    if (this.path.length > 0) {
      const dest = this.path[0]
      this.path.shift()
      return new MovementAction(
        dest.x - self.position.x,
        dest.y - self.position.y
      ).perform(self)
    }

    // finally, nothing to do but wait
    return new WaitAction().perform(self)
  }
}

const directions: Point[] = [
  new Point(-1, -1), // NW
  new Point(0, -1), // N
  new Point(1, -1), // NE
  new Point(-1, 0), // W
  new Point(1, 0), // E
  new Point(-1, 1), // SW
  new Point(0, 1), // S
  new Point(1, 1) // SE
]

export class ConfusedEnemy extends BaseAI {
  constructor(public previousAi: BaseAI | null, public turnsRemaining: number) {
    super()
  }

  perform(self: Entity) {
    const actor = self as Actor
    if (!actor) return

    if (this.turnsRemaining <= 0) {
      window.engine.messageLog.addMessage(
        `The ${actor.name} is no longer confused.`
      )
      actor.ai = this.previousAi
    } else {
      const { x, y } = directions[rand_range(0, directions.length)]
      this.turnsRemaining -= 1
      const action = new BumpAction(x, y)
      action.perform(actor)
    }
  }
}
