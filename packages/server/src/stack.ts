export class Stack<T> {
  list: Array<T>;


  constructor() {
    this.list = new Array()
  }

  push(...items: T[]) {
    this.list.push(...items)
  }

  pop(): T | undefined {
    return this.list.pop()
  }

  peek(): T | undefined {
    return this.list[this.list.length - 1]
  }

  length(): number {
    return this.list.length
  }

  bottom(): T | undefined {
    return this.list[0]
  }

  isEmpty(): boolean {
    return this.list.length === 0
  }
}
