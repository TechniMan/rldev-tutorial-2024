import { Actor } from '../entity'
import { BaseComponent } from './Base'

export class Level extends BaseComponent {
  constructor(
    public levelUpBase: number = 0,
    public levelUpFactor: number = 200,
    public xpGiven: number = 0,
    public currentLevel: number = 1,
    public currentXp: number = 0
  ) {
    super()
  }

  static GivesXp(xpGiven: number): Level {
    return new Level(0, 0, xpGiven, 0, 0)
  }

  public get experienceToNextLevel(): number {
    return this.levelUpBase + this.currentLevel * this.levelUpFactor
  }

  public get requiresLevelUp(): boolean {
    return this.currentXp > this.experienceToNextLevel
  }

  addXp(xp: number): void {
    if (xp === 0 || this.levelUpBase === 0) return

    this.currentXp += xp
    window.messageLog.addMessage(`You gain ${xp} exp.`)

    if (this.requiresLevelUp) {
      window.messageLog.addMessage(
        `You advanced to level ${this.currentLevel + 1}!`
      )
    }
  }

  private increaseLevel() {
    this.currentXp -= this.experienceToNextLevel
    this.currentLevel++
  }

  increaseMaxHp(amount: number) {
    const actor = this.parent as Actor
    if (!actor) return

    actor.fighter.maxHp += amount
    actor.fighter.hp += amount
    window.messageLog.addMessage('Your health improves!')
    this.increaseLevel()
  }

  increasePower(amount: number) {
    const actor = this.parent as Actor
    if (!actor) return

    actor.fighter.power += amount
    window.messageLog.addMessage('You feel stronger!')
    this.increaseLevel()
  }

  increaseDefense(amount: number) {
    const actor = this.parent as Actor
    if (!actor) return

    actor.fighter.defense += amount
    window.messageLog.addMessage('Your movements are swifter!')
    this.increaseLevel()
  }
}
