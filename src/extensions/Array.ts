declare global {
  interface Array<T> {
    any(predicate: (value: T, index: number, array: T[]) => unknown): boolean
  }
}

Array.prototype.any = function <T>(this: T[], predicate: (value: T, index: number, array: T[]) => unknown) {
  return this.some(predicate)
}

export { }
