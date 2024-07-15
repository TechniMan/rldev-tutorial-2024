import { Entity } from '../entity'

export abstract class BaseComponent {
  /** Ref to parent entity */
  entity: Entity | null = null
}
