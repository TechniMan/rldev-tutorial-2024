import type { Action } from './actions'
import {
  BumpAction,
  DropItemAction,
  LogAction,
  PickupAction,
  WaitAction
} from './actions'
import { Colours } from './colours'
import { Engine } from './engine'
import { Point } from './types/Point'

interface LogMap {
  [key: string]: number
}

const LOG_KEYS: LogMap = {
  ArrowUp: -1,
  ArrowDown: 1,
  PageUp: -10,
  PageDown: 10
}

interface DirectionMap {
  [key: string]: Point
}

const MOVE_KEYS: DirectionMap = {
  // numpad
  1: new Point(-1, 1),
  2: new Point(0, 1),
  3: new Point(1, 1),
  4: new Point(-1, 0),
  6: new Point(1, 0),
  7: new Point(-1, -1),
  8: new Point(0, -1),
  9: new Point(1, -1)
}

export enum InputState {
  Game,
  Dead,
  Log,
  UseInventory,
  DropInventory,
  Target
}

export abstract class BaseInputHandler {
  nextHandler: BaseInputHandler

  protected constructor(public inputState: InputState = InputState.Game) {
    this.nextHandler = this
  }

  abstract handleKeyboardInput(event: KeyboardEvent): Action | null
}

export class GameInputHandler extends BaseInputHandler {
  constructor() {
    super(InputState.Game)
  }

  handleKeyboardInput(event: KeyboardEvent): Action | null {
    // isAlive
    if (window.engine.player.fighter.hp > 0) {
      if (event.key in MOVE_KEYS) {
        const { x, y } = MOVE_KEYS[event.key]
        return new BumpAction(x, y)
      }

      switch (event.key) {
        case '5':
          return new WaitAction()
        case 'p':
          return new PickupAction()

        case 'm':
          this.nextHandler = new LogInputHandler()
          window.engine.logCursorPosition =
            window.engine.messageLog.messages.length - 1
          break
        case 'u':
          this.nextHandler = new InventoryInputHandler(InputState.UseInventory)
          break
        case 'd':
          this.nextHandler = new InventoryInputHandler(InputState.DropInventory)
          break
        case 'l':
          this.nextHandler = new LookHandler()
          break
        case 'h':
          window.engine.printHelpMessages()
          break

        default:
          break
      }
    }

    return null
  }
}

export class LogInputHandler extends BaseInputHandler {
  constructor() {
    super(InputState.Log)
  }

  handleKeyboardInput(event: KeyboardEvent): Action | null {
    // scroll to beginning
    if (event.key === 'Home') {
      return new LogAction(() => (window.engine.logCursorPosition = 0))
    }
    // scroll to end
    if (event.key === 'End') {
      return new LogAction(
        () =>
          (window.engine.logCursorPosition =
            window.engine.messageLog.messages.length - 1)
      )
    }

    // scroll an amount or close
    const scrollAmount = LOG_KEYS[event.key]
    if (!scrollAmount) {
      this.nextHandler = new GameInputHandler()
      return null
    }

    return new LogAction(() => {
      if (scrollAmount < 0 && window.engine.logCursorPosition === 0) {
        // wrap around to top
        window.engine.logCursorPosition =
          window.engine.messageLog.messages.length - 1
      } else if (
        scrollAmount > 0 &&
        window.engine.logCursorPosition ===
          window.engine.messageLog.messages.length - 1
      ) {
        // wrap around to bottom
        window.engine.logCursorPosition = 0
      } else {
        // move the desired amount in the direction, clamped to the top/bottom message
        window.engine.logCursorPosition = Math.max(
          0,
          Math.min(
            window.engine.logCursorPosition + scrollAmount,
            window.engine.messageLog.messages.length - 1
          )
        )
      }
    })
  }
}

export class InventoryInputHandler extends BaseInputHandler {
  constructor(inputState: InputState) {
    super(inputState)
  }

  handleKeyboardInput(event: KeyboardEvent): Action | null {
    // ensure key pressed was a single character
    // e.g. so we don't use the 'e' from 'Escape'
    if (event.key.length === 1) {
      const ordinal = event.key.charCodeAt(0)
      const index = ordinal - 'a'.charCodeAt(0)

      if (index >= 0 && index < 26) {
        const item = window.engine.player.inventory.items[index]
        if (item) {
          this.nextHandler = new GameInputHandler()

          if (this.inputState === InputState.UseInventory) {
            // consume the item
            return item.consumable.getAction()
          } else if (this.inputState === InputState.DropInventory) {
            // drop the item
            return new DropItemAction(item)
          }
        } else {
          window.engine.messageLog.addMessage(
            `You do not have an item at (${event.key}).`,
            Colours.Impossible
          )
          return null
        }
      }
    }

    this.nextHandler = new GameInputHandler()
    return null
  }
}

export abstract class SelectIndexHandler extends BaseInputHandler {
  protected constructor() {
    super(InputState.Target)
    // start the mouse position at the player
    window.engine.mousePosition = Point.add(
      window.engine.player.position,
      new Point(Engine.MAP_X, Engine.MAP_Y)
    )
  }

  handleKeyboardInput(event: KeyboardEvent): Action | null {
    if (event.key in MOVE_KEYS) {
      const moveAmount = MOVE_KEYS[event.key]
      let modifier = 1
      if (event.shiftKey) modifier = 5
      // else if (event.ctrlKey) modifier = 10
      // else if (event.altKey) modifier = 20

      let { x, y } = window.engine.mousePosition
      const { x: dx, y: dy } = moveAmount
      x += dx * modifier
      y += dy * modifier
      x = Math.max(
        Engine.MAP_X,
        Math.min(x, Engine.MAP_X + Engine.MAP_WIDTH - 1)
      )
      y = Math.max(
        Engine.MAP_Y,
        Math.min(y, Engine.MAP_Y + Engine.MAP_HEIGHT - 1)
      )

      window.engine.mousePosition = new Point(x, y)
      return null
    } else if (event.key === 'Enter') {
      return this.onIndexSelected(window.engine.mousePosition)
    }

    this.nextHandler = new GameInputHandler()
    return null
  }

  abstract onIndexSelected(position: Point): Action | null
}

export class LookHandler extends SelectIndexHandler {
  constructor() {
    super()
  }

  onIndexSelected(_position: Point): Action | null {
    this.nextHandler = new GameInputHandler()
    return null
  }
}

type ActionCallback = (position: Point) => Action | null

export class SingleRangedAttackHandler extends SelectIndexHandler {
  constructor(public callback: ActionCallback) {
    super()
  }

  onIndexSelected(position: Point): Action | null {
    this.nextHandler = new GameInputHandler()
    return this.callback(position)
  }
}
