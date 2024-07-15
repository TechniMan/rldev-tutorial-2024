import * as ROT from 'rot-js'

import { handleInput } from './input'
import { Entity, spawnPlayer } from './entity'
import { GameMap } from './game-map'
import { generateRogueDungeon } from './procgen'

export class Engine {
  // constants
  public static readonly WIDTH = 80
  public static readonly HEIGHT = 50
  public static readonly MAP_WIDTH = 80
  public static readonly MAP_HEIGHT = 45
  public static readonly MIN_ROOM_SIZE = 5
  public static readonly MAX_ROOM_SIZE = 15
  public static readonly MAX_MONSTERS_PER_ROOM = 2

  // instance
  display: ROT.Display
  gameMap: GameMap

  // map
  player: Entity

  constructor() {
    // init
    this.display = new ROT.Display({
      width: Engine.WIDTH,
      height: Engine.HEIGHT,
      forceSquareRatio: true
    })
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

    // initial render
    this.gameMap.updateFov(this.player)
    this.render()
  }

  handleEnemyTurns() {
    this.gameMap.nonPlayerEntities.forEach((e) => {
      console.log(`The ${e.name} wonders when it will get to take a real turn.`)
    })
  }

  update(event: KeyboardEvent) {
    const action = handleInput(event)

    // perform player's turn
    if (action) {
      action.perform(this.player)
    }

    // perform enemy turns
    this.handleEnemyTurns()

    // update player vision
    this.gameMap.updateFov(this.player)

    // display new world state
    this.render()
  }

  render() {
    this.display.clear()
    // gameMap handles displaying the map and entities
    this.gameMap.render(this.display)
  }
}
