import type { Action } from './actions'
import {
  BumpAction,
  DropItemAction,
  LogAction,
  PickupAction,
  WaitAction
} from './actions'
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
  DropInventory
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

        case 'l':
          this.nextHandler = new LogInputHandler()
          break
        case 'i':
          this.nextHandler = new InventoryInputHandler(InputState.UseInventory)
          break
        case 'd':
          this.nextHandler = new InventoryInputHandler(InputState.DropInventory)
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
            `You do not have an item at (${event.key}).`
          )
          return null
        }
      }
    }

    this.nextHandler = new GameInputHandler()
    return null
  }
}
