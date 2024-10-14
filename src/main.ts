import './extensions/Array'

import { Engine } from './engine'
import { MessageLog } from './messageLog'

declare global {
  interface Window {
    engine: Engine
    messageLog: MessageLog
  }
}

window.addEventListener('DOMContentLoaded', () => {
  // style the page nicely to avoid blinding the player
  document.body.style.backgroundColor = 'black'

  window.messageLog = new MessageLog()
  window.engine = new Engine()

  // initial render
  window.engine.screen.render()
})
