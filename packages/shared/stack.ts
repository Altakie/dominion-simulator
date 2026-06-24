export class Deque<T> {
  head?: Node<T>;
  tail?: Node<T>;
  len: number;


  constructor() {
    this.len = 0
  }

  push_front(item: T) {
    this.len += 1
    if (this.head === undefined) {
      this.head = new Node(item)
      this.tail = this.head
      return
    }

    this.head.prev = new Node(item)
    this.head.prev.next = this.head
    this.head = this.head.prev
  }

  pop_front(): T | undefined {
    const res = this.head?.value
    if (this.head === undefined) {
      return res
    }

    this.head = this.head.next
    this.len -= 1
    if (this.head !== undefined) {
      this.head.prev = undefined
    } else {
      this.tail = undefined
    }

    return res
  }

  peek_front(): T | undefined {
    return this.head?.value
  }

  peek_back(): T | undefined {
    return this.tail?.value
  }

  push_back(item: T) {
    this.len += 1
    if (this.head === undefined) {
      this.head = new Node(item)
      this.tail = this.head
      return
    }

    this.tail!.next = new Node(item)
    this.tail!.next.prev = this.tail
    this.tail = this.tail!.next
  }

  pop_back(): T | undefined {
    const res = this.tail?.value
    if (this.tail === undefined) {
      return res
    }

    this.tail = this.tail.prev
    this.len -= 1
    if (this.tail !== undefined) {
      this.tail.next = undefined
    } else {
      this.head = undefined
    }

    return res
  }

  length(): number {
    return this.len
  }

  isEmpty(): boolean {
    return this.length() === 0
  }
}

class Node<T> {
  value: T;
  prev?: Node<T>;
  next?: Node<T>;

  constructor(value: T) {
    this.value = value
  }
}
