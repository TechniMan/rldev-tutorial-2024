import * as ROT from 'rot-js'

import { handleGameInput, handleInventoryInput, handleLogInput } from './input'
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

export enum EngineState {
  Game,
  Dead,
  Log,
  UseInventory,
  DropInventory
}

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
  _state: EngineState
  logCursorPosition: number

  // map
  player: Actor
  mousePosition: Point

  constructor() {
    // init
    this._state = EngineState.Game
    this.logCursorPosition = 0
    this.display = new ROT.Display({
      width: Engine.WIDTH,
      height: Engine.HEIGHT,
      forceSquareRatio: true
    })
    this.mousePosition = new Point(0, 0)
    this.messageLog = new MessageLog()
    this.messageLog.addMessage(
      // 'ダンジョンにようこそ、ぼうけんしゃさん！', // boukensha:冒険者
      'Welcome to the dungeon, adventurer!',
      Colours.WelcomeText
    )
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

  public get state() {
    return this._state
  }

  public set state(value) {
    this._state = value
    // reset log cursor position on state change
    this.logCursorPosition = this.messageLog.messages.length - 1
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

  processGameLoop(event: KeyboardEvent) {
    // if (this.player.isAlive) {
    if (this.player.fighter.hp > 0) {
      const action = handleGameInput(event)

      // perform player's turn
      if (action) {
        // catch an error thrown up in the player's action, and skip the enemy turns if one turns up
        try {
          action.perform(this.player)

          if (this.state === EngineState.Game) {
            // perform enemy turns
            this.handleEnemyTurns()
          }
        } catch {}
      }
    }

    // update player vision
    this.gameMap.updateFov(this.player)
  }

  processLogLoop(event: KeyboardEvent) {
    const scrollAmount = handleLogInput(event)
    const wrapping = false
    if (wrapping && scrollAmount < 0 && this.logCursorPosition === 0) {
      // wrap around to the end
      this.logCursorPosition = this.messageLog.messages.length - 1
    } else if (
      wrapping &&
      scrollAmount > 0 &&
      this.logCursorPosition === this.messageLog.messages.length - 1
    ) {
      // wrap around to the start
      this.logCursorPosition = 0
    } else {
      // clamp the position moving to within the bounds of the log length
      this.logCursorPosition = Math.max(
        0,
        Math.min(
          this.logCursorPosition + scrollAmount,
          this.messageLog.messages.length - 1
        )
      )
    }
  }

  processInventoryLoop(event: KeyboardEvent) {
    const action = handleInventoryInput(event)
    // if a valid action was incurred, let the player perform it
    if (action) {
      action.perform(this.player)
    }
  }

  update(event: KeyboardEvent) {
    if (this.state === EngineState.Game) {
      this.processGameLoop(event)
    } else if (this.state === EngineState.Log) {
      this.processLogLoop(event)
    } else if (
      [EngineState.UseInventory, EngineState.DropInventory].contains(this.state)
    ) {
      this.processInventoryLoop(event)
    }

    // display new world state
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

    if (this.state === EngineState.UseInventory) {
      // calculate height based on item count
      // const height = itemCount + 2 <= 3 ? 3 : itemCount + 2
      // const width = title.length + 4
      // const x = this.player.x <= 30 ? 40 : 0
      // const y = 0
      renderFrameWithTitle(
        Engine.UI_X,
        Engine.UI_Y + 3,
        Engine.UI_WIDTH,
        28,
        'Select an item to use'
      )
      this.renderInventory(Engine.UI_X + 1, Engine.UI_Y + 4, 26)
    } else if (this.state === EngineState.DropInventory) {
      renderFrameWithTitle(
        Engine.UI_X,
        Engine.UI_Y + 3,
        Engine.UI_WIDTH,
        28,
        'Select an item to drop'
      )
      this.renderInventory(Engine.UI_X + 1, Engine.UI_Y + 4, 26)
    } else if (this.state === EngineState.Log) {
      renderFrameWithTitle(
        Engine.UI_X,
        Engine.UI_Y + 3,
        Engine.UI_WIDTH,
        Engine.UI_HEIGHT,
        'Message History'
      )
      MessageLog.renderMessages(
        this.display,
        1,
        1,
        Engine.UI_WIDTH - 2,
        Engine.UI_HEIGHT - 2,
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
  }
}
