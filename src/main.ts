import './extensions/Array'

import { Engine } from './engine'

declare global {
  interface Window {
    engine: Engine
  }
}

window.addEventListener('DOMContentLoaded', () => {
  // style the page nicely to avoid blinding the player
  document.body.style.backgroundColor = 'black'

  window.engine = new Engine()

  // initial render
  window.engine.render()
})
