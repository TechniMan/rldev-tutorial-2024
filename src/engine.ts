import * as ROT from 'rot-js'

import type { BaseInputHandler } from './inputHandlers'
import { GameInputHandler, InputState } from './inputHandlers'
import { Actor, spawnPlayer } from './entity'
import { GameMap } from './gameMap'
import { generateRogueDungeon } from './procgen'
import {
  renderFrameWithTitle,
  renderHealthBar,
  renderNamesAtLocation
} from './renderFunctions'
import { MessageLog } from './messageLog'
import { Colours } from './colours'
import { Point } from './types/Point'
import { Action } from './actions'
import { ImpossibleException } from './types/Exceptions'

export class Engine {
  // constants
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

  // instance
  display: ROT.Display
  gameMap: GameMap
  messageLog: MessageLog
  inputHandler: BaseInputHandler
  logCursorPosition: number

  // map
  player: Actor
  mousePosition: Point

  constructor() {
    // init
    this.inputHandler = new GameInputHandler()
    this.logCursorPosition = 0
    this.display = new ROT.Display({
      width: Engine.WIDTH,
      height: Engine.HEIGHT,
      forceSquareRatio: false
    })
    this.mousePosition = new Point(0, 0)
    this.messageLog = new MessageLog()
    this.messageLog.addMessage(
      // 'ダンジョンにようこそ、ぼうけんしゃさん！', // boukensha:冒険者
      'Welcome to the dungeon, adventurer!',
      Colours.WelcomeText
    )
    this.printHelpMessages()
    this.player = spawnPlayer(0, 0) // spawn at 0,0 since the generator will place the player
    this.gameMap = generateRogueDungeon(
      Engine.MAP_WIDTH,
      Engine.MAP_HEIGHT,
      Engine.MIN_ROOM_SIZE,
      Engine.MAX_ROOM_SIZE,
      Engine.MAX_MONSTERS_PER_ROOM,
      Engine.MAX_ITEMS_PER_ROOM,
      this.player
    )

    // add to the page DOM
    const container = this.display.getContainer()!
    document.body.appendChild(container)

    // add keydown listener
    window.addEventListener('keydown', (ev) => {
      this.update(ev)
    })

    window.addEventListener('mousemove', (ev) => {
      this.mousePosition = Point.fromArray(this.display.eventToPosition(ev))
      this.render()
    })

    // initial render
    this.gameMap.updateFov(this.player)
  }

  printHelpMessages() {
    this.messageLog.addMessage(
      'Use the numpad keys to move.',
      Colours.WelcomeText
    )
    this.messageLog.addMessage(
      '[5] waits a turn without moving.',
      Colours.WelcomeText
    )
    this.messageLog.addMessage(
      '[m] to expand the "Message log".',
      Colours.WelcomeText
    )
    this.messageLog.addMessage(
      '[u] to open the "Use item" menu.',
      Colours.WelcomeText
    )
    this.messageLog.addMessage(
      '[d] to open the "Drop item" menu.',
      Colours.WelcomeText
    )
    this.messageLog.addMessage(
      '[l] to use the "Look" utility.',
      Colours.WelcomeText
    )
    this.messageLog.addMessage(
      '[h] for "Help". Good luck!',
      Colours.WelcomeText
    )
  }

  handleEnemyTurns() {
    this.gameMap.livingActors.forEach((a) => {
      if (a.isAlive) {
        try {
          a.ai?.perform(a)
        } catch {}
      }
    })
  }

  update(event: KeyboardEvent) {
    // do the appropriate logic for the keyboard input
    const action = this.inputHandler.handleKeyboardInput(event)
    if (action instanceof Action) {
      try {
        action.perform(this.player)
        this.handleEnemyTurns()
        this.gameMap.updateFov(this.player)
      } catch (e) {
        if (e instanceof ImpossibleException) {
          this.messageLog.addMessage(e.message, Colours.Impossible)
        }
      }
    }
    // progress to the next input handler (which could be the same handler)
    this.inputHandler = this.inputHandler.nextHandler
    // update the screen
    this.render()
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
      Engine.UI_X,
      Engine.UI_Y,
      Engine.UI_WIDTH,
      3,
      'Player Info'
    )
    // y:1 HealthBar
    renderHealthBar(
      this.display,
      this.player.fighter.hp,
      this.player.fighter.maxHp,
      Engine.UI_X + 1,
      Engine.UI_Y + 1,
      Engine.UI_WIDTH - 2
    )

    if (this.inputHandler.inputState === InputState.UseInventory) {
      renderFrameWithTitle(
        Engine.UI_X,
        Engine.UI_Y + 3,
        Engine.UI_WIDTH,
        28,
        'Select an item to use'
      )
      this.renderInventory(Engine.UI_X + 1, Engine.UI_Y + 4, 26)
    } else if (this.inputHandler.inputState === InputState.DropInventory) {
      renderFrameWithTitle(
        Engine.UI_X,
        Engine.UI_Y + 3,
        Engine.UI_WIDTH,
        28,
        'Select an item to drop'
      )
      this.renderInventory(Engine.UI_X + 1, Engine.UI_Y + 4, 26)
    } else if (this.inputHandler.inputState === InputState.Log) {
      renderFrameWithTitle(
        Engine.UI_X,
        Engine.UI_Y + 3,
        Engine.UI_WIDTH,
        Engine.UI_HEIGHT - 3,
        'Message History'
      )
      MessageLog.renderMessages(
        this.display,
        Engine.UI_X + 1,
        Engine.UI_Y + 4,
        Engine.UI_WIDTH - 2,
        Engine.UI_HEIGHT - 5,
        this.messageLog.messages.slice(0, this.logCursorPosition + 1)
      )
    } /* UI to render in the normal state */ else {
      // y:4-10 Inventory Frame
      renderFrameWithTitle(
        Engine.UI_X,
        Engine.UI_Y + 3,
        Engine.UI_WIDTH,
        7,
        'Inventory'
      )
      this.renderInventory(Engine.UI_X + 1, Engine.UI_Y + 4, 5)
    }

    if (this.inputHandler.inputState !== InputState.Log) {
      // y:33-50 MessageLog Frame
      renderFrameWithTitle(
        0,
        Engine.UI_HEIGHT - 17,
        Engine.UI_WIDTH,
        17,
        'Messages'
      )
      this.messageLog.render(
        this.display,
        1,
        Engine.UI_HEIGHT - 16,
        Engine.UI_WIDTH - 2,
        15
      )
    }

    // gameMap handles displaying the map and entities
    renderFrameWithTitle(
      Engine.MAP_X - 1,
      Engine.MAP_Y - 1,
      Engine.MAP_WIDTH + 2,
      Engine.MAP_HEIGHT + 2,
      'Map'
    )
    this.gameMap.render(this.display, Engine.MAP_X, Engine.MAP_Y)
    renderNamesAtLocation(
      Engine.MAP_X,
      Engine.MAP_HEIGHT,
      new Point(Engine.MAP_X, Engine.MAP_Y)
    )

    if (this.inputHandler.inputState === InputState.Target) {
      const { x, y } = this.mousePosition
      const data = this.display._data[`${x},${y}`]
      const char = data ? data[2] || ' ' : ' '
      this.display.drawOver(x, y, char[0], '#000', '#fff')
    }
  }
}
