import { Display } from 'rot-js'

import { Colours } from './colours'
import { Point } from './types/Point'
import { GameMap } from './gameMap'

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
  x: number,
  y: number,
  width: number
) {
  const barWidth = Math.floor((currentValue / maxValue) * width)

  drawColouredBar(display, x, y, width, Colours.BarBg)
  drawColouredBar(display, x, y, barWidth, Colours.BarFg)

  const healthText = `HP: ${currentValue}/${maxValue}`

  for (let i = 0; i < healthText.length; ++i) {
    display.drawOver(x + i, y, healthText[i], Colours.White, null)
  }
}

export function renderNamesAtLocation(
  x: number,
  y: number,
  mousePosition: Point,
  mapOffset: Point,
  gameMap: GameMap
) {
  const { x: mouseX, y: mouseY } = mousePosition.minus(mapOffset)
  if (
    gameMap.isInBounds(mouseX, mouseY) &&
    gameMap.tiles[mouseY][mouseX].visible
  ) {
    // get a list of names, separated by commas if there are multiple in the same spot
    const names = gameMap.entities
      .filter((e) => e.position.x === mouseX && e.position.y === mouseY)
      .map((e) => e.name[0].toUpperCase() + e.name.substring(1))
      .join(', ')
    window.engine.display.drawText(x, y, names)
  }
}

export function renderFrameWithTitle(
  x: number,
  y: number,
  width: number,
  height: number,
  title: string
) {
  // characters for the frame
  const topLeft = '┌'
  const topRight = '┐'
  const bottomLeft = '└'
  const bottomRight = '┘'
  const vertical = '│'
  const horizontal = '─'
  const leftTitle = '┤'
  const rightTitle = '├'
  const empty = ' '
  // sizings
  const innerWidth = width - 2
  const innerHeight = height - 2
  const remainingAfterTitle = innerWidth - (title.length + 2) // add two for the borders either side of the title
  const left = Math.floor(remainingAfterTitle / 2)
  // strings that represent each row
  const topRow =
    topLeft +
    horizontal.repeat(left) +
    leftTitle +
    title +
    rightTitle +
    horizontal.repeat(remainingAfterTitle - left) +
    topRight
  const middleRow = vertical + empty.repeat(innerWidth) + vertical
  const bottomRow = bottomLeft + horizontal.repeat(innerWidth) + bottomRight
  // actually draw the box
  window.engine.display.drawText(x, y, topRow)
  for (let r = 1; r <= innerHeight; ++r) {
    window.engine.display.drawText(x, y + r, middleRow)
  }
  window.engine.display.drawText(x, y + height - 1, bottomRow)
}
