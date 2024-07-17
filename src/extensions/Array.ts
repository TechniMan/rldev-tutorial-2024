declare global {
  interface Array<T> {
    /**
     * Alias for `some`
     * @param predicate Function run against each element to determine if any elements match the criteria
     */
    any(predicate: (value: T, index: number, array: T[]) => unknown): boolean
    /**
     * Empties the array in-place
     */
    clear(): void
    /**
     * Returns the first element, or undefined if the array is empty
     */
    first(): T | undefined
    /**
     * Returns the last element, or undefined if the array is empty
     */
    last(): T | undefined
  }
}

Array.prototype.any = function <T>(this: T[], predicate: (value: T, index: number, array: T[]) => unknown): boolean {
  return this.some(predicate)
}

Array.prototype.clear = function <T>(this: T[]) {
  this.length = 0
}

Array.prototype.first = function <T>(this: T[]): T | undefined {
  return this.length > 0 ? this[0] : undefined
}

Array.prototype.last = function <T>(this: T[]): T | undefined {
  return this.length > 0 ? this[this.length - 1] : undefined
}

export { }
