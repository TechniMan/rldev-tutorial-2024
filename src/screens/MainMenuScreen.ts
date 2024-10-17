import { Display } from 'rot-js'
import { BaseInputHandler, GameInputHandler } from '../inputHandlers'
import { BaseScreen } from './BaseScreen'
import { Actor } from '../entity'
import { GameScreen } from './GameScreen'
import { Engine } from '../engine'

const OPTIONS = ['[n] Play a new game']

const MENU_WIDTH = 24

export class MainMenuScreen extends BaseScreen {
  inputHandler: BaseInputHandler

  constructor(display: Display, player: Actor) {
    super(display, player)

    this.inputHandler = new GameInputHandler()
  }

  update(event: KeyboardEvent): BaseScreen {
    if (event.key === 'n') {
      return new GameScreen(this.display, this.player)
    }

    this.render()
    return this
  }

  render() {
    this.display.clear()

    OPTIONS.forEach((option, idx) => {
      const x = Math.floor(Engine.WIDTH / 2)
      const y = Math.floor(Engine.HEIGHT / 2 - 1 + idx)
      this.display.draw(x, y, option.padEnd(MENU_WIDTH, ' '), '#fff', '#000')
    })
  }
}
