import * as ROT from 'rot-js'

import type { BaseInputHandler } from './inputHandlers'
import { GameInputHandler } from './inputHandlers'
import { Actor, spawnPlayer } from './entity'
import { Colours } from './colours'
import { Point } from './types/Point'
import { BaseScreen } from './screens/BaseScreen'
import { MainMenuScreen } from './screens/MainMenuScreen'

export class Engine {
  // constants
  public static readonly WIDTH = 80
  public static readonly HEIGHT = 50
  public static readonly MAP_WIDTH = 48
  public static readonly MAP_HEIGHT = 48

  // instance
  display: ROT.Display
  inputHandler: BaseInputHandler
  screen: BaseScreen
  player: Actor

  constructor() {
    // init
    this.inputHandler = new GameInputHandler()
    this.display = new ROT.Display({
      width: Engine.WIDTH,
      height: Engine.HEIGHT,
      forceSquareRatio: false
    })
    window.messageLog.addMessage(
      // 'ダンジョンにようこそ、ぼうけんしゃさん！',
      'Welcome to the dungeon, adventurer!',
      Colours.WelcomeText
    )
    this.printHelpMessages()
    this.player = spawnPlayer(0, 0) // spawn at 0,0 since the generator will place the player

    // add to the page DOM
    const container = this.display.getContainer()!
    document.body.appendChild(container)

    // add keydown listener
    window.addEventListener('keydown', (ev) => {
      this.update(ev)
    })

    window.addEventListener('mousemove', (ev) => {
      this.inputHandler.handleMouseMovement(
        Point.fromArray(this.display.eventToPosition(ev))
      )
      this.screen.render()
    })

    // initial render
    // this.gameMap.updateFov(this.player)
    this.screen = new MainMenuScreen(this.display, this.player)
  }

  printHelpMessages() {
    // 28 chars per line
    window.messageLog.addMessage(
      'Use the numpad keys to move.',
      Colours.WelcomeText
    )
    window.messageLog.addMessage('[5] wait one turn', Colours.WelcomeText)
    window.messageLog.addMessage(
      '[m] expand the Message log',
      Colours.WelcomeText
    )
    window.messageLog.addMessage(
      '[p] Pick up item from ground',
      Colours.WelcomeText
    )
    window.messageLog.addMessage(
      '[u] Use item from inventory',
      Colours.WelcomeText
    )
    window.messageLog.addMessage(
      '[d] Drop item from inventory',
      Colours.WelcomeText
    )
    window.messageLog.addMessage('[l] Look around the map', Colours.WelcomeText)
    window.messageLog.addMessage('[c] Character info', Colours.WelcomeText)
    window.messageLog.addMessage('[s] Save the game', Colours.WelcomeText)
    window.messageLog.addMessage(
      '[h] for Help. Good luck!',
      Colours.WelcomeText
    )
  }

  update(event: KeyboardEvent) {
    const screen = this.screen.update(event)
    if (!Object.is(screen, this.screen)) {
      this.screen = screen
      this.screen.render()
    }
  }
}
