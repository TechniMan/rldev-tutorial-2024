import { BaseComponent } from './Base'
import { Actor } from '../entity'

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

    let deathMessage = ''
    if (window.engine.player === this.entity) {
      deathMessage = 'You died!'
    } else {
      deathMessage = `${this.entity.name} has died.`
    }

    this.entity.char = '%'
    this.entity.fg = '#c00'
    this.entity.blocksMovement = false
    this.entity.ai = null
    this.entity.name = `Remains of ${this.entity.name}`

    console.log(deathMessage)
  }
}
