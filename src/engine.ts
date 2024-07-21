import * as ROT from 'rot-js'

import { handleInput } from './input'
import { Actor, spawnPlayer } from './entity'
import { GameMap } from './game-map'
import { generateRogueDungeon } from './procgen'
import { renderHealthBar, renderNamesAtLocation } from './renderFunctions'
import { MessageLog } from './messageLog'
import { Colours } from './colours'
import { Point } from './types/Point'

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

  // map
  player: Actor
  mousePosition: Point

  constructor() {
    // init
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

  handleEnemyTurns() {
    this.gameMap.livingActors.forEach((a) => {
      if (a.isAlive) {
        a.ai?.perform(a)
      }
    })
  }

  update(event: KeyboardEvent) {
    // if (this.player.isAlive) {
    if (this.player.fighter.hp > 0) {
      const action = handleInput(event)

      // perform player's turn
      if (action) {
        action.perform(this.player)

        // perform enemy turns
        this.handleEnemyTurns()
      }
    }

    // update player vision
    this.gameMap.updateFov(this.player)

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
  }
}
