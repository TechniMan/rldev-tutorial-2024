import { BaseComponent } from './Base'
import { Actor, RenderOrder } from '../entity'
import { Colours } from '../colours'

export class Fighter implements BaseComponent {
  _hp: number
  entity: Actor | null

  constructor(
    public maxHp: number,
    public defense: number,
    public power: number
  ) {
    this._hp = maxHp
    this.entity = null
  }

  public get hp(): number {
    return this._hp
  }

  public set hp(value: number) {
    this._hp = Math.max(0, Math.min(value, this.maxHp))

    if (this._hp === 0 && this.entity?.isAlive) {
      this.die()
    }
  }

  die() {
    if (!this.entity) return

    let deathMessage: string
    let fg: Colours
    if (window.engine.player === this.entity) {
      deathMessage = 'You died!'
      fg = Colours.PlayerDie
    } else {
      deathMessage = `${this.entity.name} has died.`
      fg = Colours.EnemyDie
    }

    this.entity.char = '%'
    this.entity.fg = '#c00'
    this.entity.blocksMovement = false
    this.entity.ai = null
    this.entity.name = `Remains of ${this.entity.name}`
    this.entity.renderOrder = RenderOrder.Corpse

    window.engine.messageLog.addMessage(deathMessage, fg)
  }
}
