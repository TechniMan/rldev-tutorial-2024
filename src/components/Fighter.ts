import { BaseComponent } from './Base'

export class Fighter extends BaseComponent {
  _hp: number

  constructor(
    public maxHp: number,
    public defense: number,
    public power: number
  ) {
    super()
    this._hp = maxHp
  }

  public get hp(): number {
    return this._hp
  }

  public set hp(value: number) {
    this._hp = Math.max(0, Math.min(value, this.maxHp))
  }
}
