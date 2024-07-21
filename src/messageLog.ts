import { Display } from 'rot-js'

import { Colours } from './colours'

export class Message {
  count: number

  constructor(public plainText: string, public fg: Colours) {
    this.count = 1
  }

  get fullText(): string {
    // only show the count for more than one
    if (this.count > 1) {
      return `${this.plainText} (x${this.count})`
    }
    return this.plainText
  }
}

export class MessageLog {
  messages: Message[]
  _maxMessages: number = 100

  constructor() {
    this.messages = []
  }

  addMessage(text: string, fg: Colours = Colours.White, stack: boolean = true) {
    if (stack && this.messages.last()?.plainText === text) {
      this.messages.last()!.count++
    } else {
      this.messages.push(new Message(text, fg))
    }
  }

  renderMessages(
    display: Display,
    x: number,
    y: number,
    width: number,
    height: number,
    messages: Message[]
  ) {
    // reverse a copy of messages
    const reversed = messages.slice().reverse()
    let yOffset = height - 1

    for (const msg of reversed) {
      // if necessary, split the message into multiple lines
      let lines = [msg.fullText]
      if (msg.fullText.length > width) {
        //TODO also split hyphenated words?
        const words = msg.fullText.split(' ')
        let currentLine = ''
        // remove the full text from lines
        lines = []

        // loop through the words
        while (words.length > 0) {
          // if adding to current line makes it too long, start a new line
          if (`${currentLine} ${words[0]}`.length > width) {
            lines.push(currentLine.trim())
            currentLine = ''
          } else {
            // pop the first word out of the array and onto the end of the line
            currentLine += ' ' + words.shift()
          }
        }

        // add the current line to the lines
        lines.push(currentLine.trim())
        // reverse the lines for some reason?
        lines.reverse()
      }

      // draw all lines of the message
      for (const line of lines) {
        const text = `%c{${msg.fg}}${line}`
        display.drawText(x, y + yOffset, text, width)
        yOffset -= 1
        if (yOffset < 0) {
          return
        }
      }
    }
  }

  render(
    display: Display,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    this.renderMessages(display, x, y, width, height, this.messages)
  }
}
