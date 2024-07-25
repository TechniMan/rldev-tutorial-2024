import { BaseComponent } from './Base'
import { Actor, RenderOrder } from '../entity'
import { Colours } from '../colours'

export class Fighter extends BaseComponent {
  _hp: number
  parent: Actor | null

  constructor(
    public maxHp: number,
    public defense: number,
    public power: number
  ) {
    super()
    this._hp = maxHp
    this.parent = null
  }

  public get hp(): number {
    return this._hp
  }

  public set hp(value: number) {
    this._hp = Math.max(0, Math.min(value, this.maxHp))

    if (this._hp === 0 && this.parent?.isAlive) {
      this.die()
    }
  }

  die() {
    // if we don't have a parent entity - panic!
    if (!this.parent) return

    let deathMessage: string
    let fg: Colours
    if (window.engine.player === this.parent) {
      deathMessage = 'You died!'
      fg = Colours.PlayerDie
    } else {
      deathMessage = `${this.parent.name} has died.`
      fg = Colours.EnemyDie
    }

    this.parent.char = '%'
    this.parent.fg = '#c00'
    this.parent.blocksMovement = false
    this.parent.ai = null
    this.parent.name = `Remains of ${this.parent.name}`
    this.parent.renderOrder = RenderOrder.Corpse

    window.engine.messageLog.addMessage(deathMessage, fg)
  }
}
