import { Display } from 'rot-js'
import { GameMap } from '../gameMap'
import {
  BaseInputHandler,
  GameInputHandler,
  InputState
} from '../inputHandlers'
import { BaseScreen } from './BaseScreen'
import { Actor } from '../entity'
import { generateRogueDungeon } from '../procgen'
import { ImpossibleException } from '../types/Exceptions'
import { Colours } from '../colours'
import { Action } from '../actions'
import {
  renderFrameWithTitle,
  renderHealthBar,
  renderNamesAtLocation
} from '../renderFunctions'
import { MessageLog } from '../messageLog'
import { Point } from '../types/Point'

export class GameScreen extends BaseScreen {
  public static readonly WIDTH = 80
  public static readonly HEIGHT = 50
  public static readonly UI_X = 0
  public static readonly UI_Y = 0
  public static readonly UI_WIDTH = 30
  public static readonly UI_HEIGHT = 50
  public static readonly MAP_X = 31
  public static readonly MAP_Y = 1
  public static readonly MAP_WIDTH = 48
  public static readonly MAP_HEIGHT = 48
  public static readonly MIN_ROOM_SIZE = 5
  public static readonly MAX_ROOM_SIZE = 15
  public static readonly MAX_MONSTERS_PER_ROOM = 2
  public static readonly MAX_ITEMS_PER_ROOM = 2

  gameMap: GameMap
  inputHandler: BaseInputHandler

  constructor(display: Display, player: Actor) {
    super(display, player)

    this.gameMap = generateRogueDungeon(
      GameScreen.MAP_WIDTH,
      GameScreen.MAP_HEIGHT,
      GameScreen.MIN_ROOM_SIZE,
      GameScreen.MAX_ROOM_SIZE,
      GameScreen.MAX_MONSTERS_PER_ROOM,
      GameScreen.MAX_ITEMS_PER_ROOM,
      this.player
    )

    this.inputHandler = new GameInputHandler()
    this.gameMap.updateFov(this.player)
  }

  handleEnemyTurns() {
    this.gameMap.livingActors.forEach((a) => {
      if (a.isAlive) {
        try {
          a.ai?.perform(a, this.gameMap)
        } catch {}
      }
    })
  }

  update(event: KeyboardEvent): BaseScreen {
    // do the appropriate logic for the keyboard input
    const action = this.inputHandler.handleKeyboardInput(event)
    if (action instanceof Action) {
      try {
        action.perform(this.player, this.gameMap)
        this.handleEnemyTurns()
        this.gameMap.updateFov(this.player)
      } catch (e) {
        if (e instanceof ImpossibleException) {
          window.messageLog.addMessage(e.message, Colours.Impossible)
        }
      }
    }
    // progress to the next input handler (which could be the same handler)
    this.inputHandler = this.inputHandler.nextHandler
    // update the screen
    this.render()

    return this
  }

  renderInventory(x: number, y: number, height: number) {
    const itemCount = this.player.inventory.items.length
    // don't show the keys if the view is too small
    const showKey = height === 26

    if (itemCount > 0) {
      this.player.inventory.items.forEach((i, index) => {
        // don't draw too many
        if (index >= height) {
          return
        } else if (index === height - 1 && itemCount > height) {
          // draw the last one as an ellipsis, if there are more to show
          this.display.drawText(x, y + index, '...')
          return
        }
        // otherwise, draw a normal entry
        if (showKey) {
          const key = String.fromCharCode('a'.charCodeAt(0) + index)
          this.display.drawText(x, y + index, `(${key}) ${i.name}`)
        } else {
          this.display.drawText(x, y + index, `${i.name}`)
        }
      })
    } else {
      this.display.drawText(x, y, '(Empty)')
    }
  }

  render() {
    this.display.clear()

    // ui
    // y:0-3 PlayerInfo Frame
    renderFrameWithTitle(
      GameScreen.UI_X,
      GameScreen.UI_Y,
      GameScreen.UI_WIDTH,
      3,
      'Player Info'
    )
    // y:1 HealthBar
    renderHealthBar(
      this.display,
      this.player.fighter.hp,
      this.player.fighter.maxHp,
      GameScreen.UI_X + 1,
      GameScreen.UI_Y + 1,
      GameScreen.UI_WIDTH - 2
    )

    if (this.inputHandler.inputState === InputState.UseInventory) {
      renderFrameWithTitle(
        GameScreen.UI_X,
        GameScreen.UI_Y + 3,
        GameScreen.UI_WIDTH,
        28,
        'Select an item to use'
      )
      this.renderInventory(GameScreen.UI_X + 1, GameScreen.UI_Y + 4, 26)
    } else if (this.inputHandler.inputState === InputState.DropInventory) {
      renderFrameWithTitle(
        GameScreen.UI_X,
        GameScreen.UI_Y + 3,
        GameScreen.UI_WIDTH,
        28,
        'Select an item to drop'
      )
      this.renderInventory(GameScreen.UI_X + 1, GameScreen.UI_Y + 4, 26)
    } else if (this.inputHandler.inputState === InputState.Log) {
      renderFrameWithTitle(
        GameScreen.UI_X,
        GameScreen.UI_Y + 3,
        GameScreen.UI_WIDTH,
        GameScreen.UI_HEIGHT - 3,
        'Message History'
      )
      MessageLog.renderMessages(
        this.display,
        GameScreen.UI_X + 1,
        GameScreen.UI_Y + 4,
        GameScreen.UI_WIDTH - 2,
        GameScreen.UI_HEIGHT - 5,
        window.messageLog.messages.slice(
          0,
          this.inputHandler.logCursorPosition + 1
        )
      )
    } /* UI to render in the normal state */ else {
      // y:4-10 Inventory Frame
      renderFrameWithTitle(
        GameScreen.UI_X,
        GameScreen.UI_Y + 3,
        GameScreen.UI_WIDTH,
        7,
        'Inventory'
      )
      this.renderInventory(GameScreen.UI_X + 1, GameScreen.UI_Y + 4, 5)
    }

    if (this.inputHandler.inputState !== InputState.Log) {
      // y:33-50 MessageLog Frame
      renderFrameWithTitle(
        0,
        GameScreen.UI_HEIGHT - 17,
        GameScreen.UI_WIDTH,
        17,
        'Messages'
      )
      window.messageLog.render(
        this.display,
        1,
        GameScreen.UI_HEIGHT - 16,
        GameScreen.UI_WIDTH - 2,
        15
      )
    }

    // gameMap handles displaying the map and entities
    renderFrameWithTitle(
      GameScreen.MAP_X - 1,
      GameScreen.MAP_Y - 1,
      GameScreen.MAP_WIDTH + 2,
      GameScreen.MAP_HEIGHT + 2,
      'Map'
    )
    this.gameMap.render(this.display, GameScreen.MAP_X, GameScreen.MAP_Y)
    renderNamesAtLocation(
      GameScreen.MAP_X,
      GameScreen.MAP_HEIGHT,
      this.inputHandler.mousePosition,
      new Point(GameScreen.MAP_X, GameScreen.MAP_Y),
      this.gameMap
    )

    if (this.inputHandler.inputState === InputState.Target) {
      const { x, y } = this.inputHandler.mousePosition
      this.display.drawOver(x, y, null, '#000', '#fff')
    }
    this.inputHandler.onRender(this.display)
  }
}
