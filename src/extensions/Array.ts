declare global {
  interface Array<T> {
    any(predicate: (value: T, index: number, array: T[]) => unknown): boolean
    clear(): void
  }
}

Array.prototype.any = function <T>(this: T[], predicate: (value: T, index: number, array: T[]) => unknown): boolean {
  return this.some(predicate)
}

Array.prototype.clear = function <T>(this: T[]) {
  this.length = 0
}

export { }
