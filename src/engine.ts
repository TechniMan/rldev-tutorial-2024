import * as ROT from 'rot-js'

import { handleInput, MovementAction } from './input'
import { Entity } from './entity'

export class Engine {
  // constants
  public static readonly WIDTH = 80
  public static readonly HEIGHT = 50

  // instance
  display: ROT.Display

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

    if (action instanceof MovementAction) {
      this.player.move(action.dx, action.dy)
    }

    this.render()
  }

  render() {
    this.display.clear()

    this.entities.forEach((ent) => {
      this.display.draw(ent.x, ent.y, ent.char, ent.fg, ent.bg)
    })
  }
}
