import * as ROT from 'rot-js'

import { Action, MeleeAction, MovementAction, WaitAction } from '../input'
import type { Entity } from '../entity'
import { Point } from '../types/Point'

export abstract class BaseAI implements Action {
  path: Point[]

  constructor() {
    this.path = []
  }

  perform(_entity: Entity) { }

  calculatePathTo(destX: number, destY: number, entity: Entity) {
    const isPassable = (x: number, y: number) => window.engine.gameMap.tiles[y][x].walkable
    const dijkstra = new ROT.Path.Dijkstra(destX, destY, isPassable, {
      topology: 4
    })

    this.path.clear()

    dijkstra.compute(entity.x, entity.y, (x: number, y: number) => {
      this.path.push(new Point(x, y))
    })
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
    const dx = target.x - self.x
    const dy = target.y - self.y
    const distance = Math.max(Math.abs(dx), Math.abs(dy))

    // initiate action if we are visible to the player
    if (window.engine.gameMap.tiles[self.y][self.x].visible) {
      // if we are adjacent - attack!
      if (distance <= 1) {
        return new MeleeAction(dx, dy).perform(self)
      }
      // otherwise, find a path from us to them
      this.calculatePathTo(target.x, target.y, self)
    }

    // if there is a valid path, try to move towards them
    // because the path isn't cleared unless it is recalculated,
    //  we will continue moving towards their last known location
    if (this.path.length > 0) {
      const dest = this.path[0]
      this.path.shift()
      return new MovementAction(dest.x - self.x, dest.y - self.y).perform(self)
    }

    // finally, nothing to do but wait
    return new WaitAction().perform(self)
  }
}
