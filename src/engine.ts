import * as ROT from 'rot-js'

import { handleGameInput, handleLogInput } from './input'
import { Actor, spawnPlayer } from './entity'
import { GameMap } from './game-map'
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
  Log
}

export class Engine {
  // constants
  public static readonly WIDTH = 80
  public static readonly HEIGHT = 50
  public static readonly MAP_WIDTH = 80
  public static readonly MAP_HEIGHT = 43
  public static readonly MIN_ROOM_SIZE = 5
  public static readonly MAX_ROOM_SIZE = 15
  public static readonly MAX_MONSTERS_PER_ROOM = 2

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
      'ダンジョンにようこそ、ぼうけんしゃさん！', // boukensha:冒険者
      Colours.WelcomeText
    )
    this.player = spawnPlayer(0, 0) // spawn at 0,0 since the generator will place the player
    this.gameMap = generateRogueDungeon(
      Engine.MAP_WIDTH,
      Engine.MAP_HEIGHT,
      Engine.MIN_ROOM_SIZE,
      Engine.MAX_ROOM_SIZE,
      Engine.MAX_MONSTERS_PER_ROOM,
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
        a.ai?.perform(a)
      }
    })
  }

  processGameLoop(event: KeyboardEvent) {
    // if (this.player.isAlive) {
    if (this.player.fighter.hp > 0) {
      const action = handleGameInput(event)

      // perform player's turn
      if (action) {
        action.perform(this.player)

        if (this.state === EngineState.Game) {
          // perform enemy turns
          this.handleEnemyTurns()
        }
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

  update(event: KeyboardEvent) {
    if (this.state === EngineState.Game) {
      this.processGameLoop(event)
    } else if (this.state === EngineState.Log) {
      this.processLogLoop(event)
    }

    // display new world state
    this.render()
  }

  render() {
    this.display.clear()
    // ui
    this.messageLog.render(this.display, 21, 45, 40, 5)
    renderHealthBar(
      this.display,
      this.player.fighter.hp,
      this.player.fighter.maxHp,
      20
    )
    renderNamesAtLocation(21, 44)
    // gameMap handles displaying the map and entities
    this.gameMap.render(this.display)

    if (this.state === EngineState.Log) {
      renderFrameWithTitle(4, 4, 72, 37, 'Message History')
      MessageLog.renderMessages(
        this.display,
        5,
        5,
        70,
        35,
        this.messageLog.messages.slice(0, this.logCursorPosition + 1)
      )
    }
  }
}
