import type { Entity } from '../entity'
import type { GameMap } from '../gameMap'

export abstract class BaseComponent {
  /** Ref to parent entity */
  parent: Entity | null = null

  protected constructor() {
    this.parent = null
  }

  public get gameMap(): GameMap | null {
    return this.parent?.gameMap || null // avoid undefined
  }
}
