import { Display } from 'rot-js'
import { BaseInputHandler, GameInputHandler } from '../inputHandlers'
import { BaseScreen } from './BaseScreen'
import { Actor } from '../entity'
import { GameScreen } from './GameScreen'
import { Engine } from '../engine'
import { renderFrameWithTitle } from '../renderFunctions'

const OPTIONS = ['[n] Play a new game']
if (localStorage.getItem('roguesave')) {
  OPTIONS.push('[c] Continue saved game')
}

const MENU_WIDTH = 24

export class MainMenuScreen extends BaseScreen {
  inputHandler: BaseInputHandler
  showDialog: boolean

  constructor(display: Display, player: Actor) {
    super(display, player)

    this.inputHandler = new GameInputHandler()
    this.showDialog = false
  }

  update(event: KeyboardEvent): BaseScreen {
    if (this.showDialog) {
      // close the dialog on keypress
      this.showDialog = false
    } else {
      if (event.key === 'n') {
        return new GameScreen(this.display, this.player)
      } else if (event.key === 'c') {
        try {
          const saveGame = localStorage.getItem('roguesave')
          return new GameScreen(this.display, this.player, saveGame)
        } catch {
          this.showDialog = true
        }
      }
    }

    this.render()
    return this
  }

  render() {
    this.display.clear()

    let x = Math.floor((Engine.WIDTH - MENU_WIDTH) / 2 - 1)
    let y = Math.floor(Engine.HEIGHT / 2 - 2)
    renderFrameWithTitle(x, y, MENU_WIDTH + 1, OPTIONS.length + 2, 'MENU')
    OPTIONS.forEach((option, idx) => {
      x = Math.floor(Engine.WIDTH / 2 - 1)
      y = Math.floor(Engine.HEIGHT / 2 - 1 + idx)
      this.display.draw(x, y, option.padEnd(MENU_WIDTH, '.'), '#fff', '#000')
    })

    if (this.showDialog) {
      const text = 'Failed to load save :('
      const options = this.display.getOptions()
      const width = text.length + 4
      const height = 7
      const x = options.width / 2 - Math.floor(width / 2)
      const y = options.height / 2 - Math.floor(height / 2)
      renderFrameWithTitle(x, y, width, height, 'Error')
      this.display.drawText(x + 1, y + 3, text)
    }
  }
}
