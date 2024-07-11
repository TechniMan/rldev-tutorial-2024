import * as ROT from 'rot-js'

import { handleInput } from './input'
import { Entity } from './entity'
import { GameMap } from './game-map'
import { generateRogueDungeon } from './procgen'

export class Engine {
  // constants
  public static readonly WIDTH = 80
  public static readonly HEIGHT = 50
  public static readonly MAP_WIDTH = 80
  public static readonly MAP_HEIGHT = 45

  // instance
  display: ROT.Display
  gameMap: GameMap

  // map
  player: Entity
  /** includes player */
  entities: Entity[]

  constructor() {
    // init
    this.display = new ROT.Display({
      width: Engine.WIDTH,
      height: Engine.HEIGHT,
      forceSquareRatio: true
    })
    this.player = new Entity(Engine.WIDTH / 2, Engine.HEIGHT / 2, '@')
    const npc = new Entity(Engine.WIDTH / 2, Engine.HEIGHT / 2, 'n')
    this.entities = [this.player, npc]
    // this.gameMap = generateSimpleDungeon(Engine.MAP_WIDTH, Engine.MAP_HEIGHT, 20, 5, 15, this.player, this.display)
    this.gameMap = generateRogueDungeon(Engine.MAP_WIDTH, Engine.MAP_HEIGHT, 5, 15, this.player, this.display)

    // add to DOM
    const container = this.display.getContainer()!
    document.body.appendChild(container)

    // add keydown listener
    window.addEventListener('keydown', (ev) => {
      this.update(ev)
    })

    // initial render
    this.render()
  }

  update(event: KeyboardEvent) {
    const action = handleInput(event)

    if (action) {
      action.perform(this, this.player)
    }

    this.render()
  }

  render() {
    this.display.clear()

    this.gameMap.render()

    this.entities.forEach((ent) => {
      this.display.draw(ent.x, ent.y, ent.char, ent.fg, ent.bg)
    })
  }
}
