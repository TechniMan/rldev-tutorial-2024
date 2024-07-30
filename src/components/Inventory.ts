import { BaseComponent } from './Base'
import type { Actor, Item } from '../entity'

export class Inventory extends BaseComponent {
  parent: Actor | null
  items: Item[]

  constructor(public capacity: number) {
    super()
    this.parent = null
    this.items = []
  }

  drop(item: Item) {
    const index = this.items.indexOf(item)
    if (index >= 0) {
      if (this.parent) {
        // remove the one item from the list
        this.items.splice(index, 1)
        item.place(
          this.parent.position.x,
          this.parent.position.y,
          window.engine.gameMap
        )
        window.engine.messageLog.addMessage(
          `${this.parent.name} dropped the ${item.name}.`
        )
      }
    }
  }
}
