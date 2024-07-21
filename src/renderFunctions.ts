import { Display } from 'rot-js'

import { Colours } from './colours'

function drawColouredBar(
  display: Display,
  x: number,
  y: number,
  width: number,
  colour: Colours
) {
  for (let pos = x; pos < x + width; ++pos) {
    display.draw(pos, y, ' ', colour, colour)
  }
}

// renderProgressBar
export function renderHealthBar(
  display: Display,
  currentValue: number,
  maxValue: number,
  width: number
) {
  const barWidth = Math.floor((currentValue / maxValue) * width)

  drawColouredBar(display, 0, 45, width, Colours.BarEmpty)
  drawColouredBar(display, 0, 45, barWidth, Colours.BarFilled)

  const healthText = `HP: ${currentValue}/${maxValue}`

  for (let i = 0; i < healthText.length; ++i) {
    display.drawOver(1 + i, 45, healthText[i], Colours.White, null)
  }
}

export function renderNamesAtLocation(x: number, y: number) {
  const { x: mouseX, y: mouseY } = window.engine.mousePosition
  if (
    window.engine.gameMap.isInBounds(mouseX, mouseY) &&
    window.engine.gameMap.tiles[mouseY][mouseX].visible
  ) {
    // get a list of names, separated by commas if there are multiple in the same spot
    const names = window.engine.gameMap.entities
      .filter((e) => e.x === mouseX && e.y === mouseY)
      .map((e) => e.name.charAt(0).toUpperCase() + e.name.substring(1))
      .join(', ')
    window.engine.display.drawText(x, y, names)
  }
}
