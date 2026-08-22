import { none, type Option, some } from "./option";

export class Deque<T> {
  head: Option<Node<T>>;
  tail: Option<Node<T>>;
  len: number;

  constructor() {
    this.len = 0;
    this.head = none();
    this.tail = none();
  }

  push_front(item: T) {
    this.len += 1;
    const new_node_inner = new Node(item);
    const new_node = some(new_node_inner);

    this.head.match({
      Some: (head) => {
        head.prev = new_node;
        new_node_inner.next = this.head;
        this.head = new_node;
      },
      None: () => {
        this.head = new_node;
        this.tail = new_node;
      },
    });
  }

  pop_front(): Option<T> {
    return this.head.match({
      Some: (head) => {
        head.next.match({
          Some: (next) => {
            next.prev = none();
          },
          None: () => {
            this.tail = head.next;
          },
        });

        this.head = head.next;
        this.len -= 1;

        return some(head.value);
      },
      None: () => {
        return none();
      },
    });
  }

  peek_front(): Option<T> {
    return this.head.map((head) => head.value);
  }

  peek_back(): Option<T> {
    return this.tail.map((tail) => tail.value);
  }

  push_back(item: T) {
    this.len += 1;
    const new_node_inner = new Node(item);
    const new_node = some(new_node_inner);

    this.tail.match({
      Some: (tail) => {
        tail.next = new_node;
        new_node_inner.prev = this.tail;
        this.tail = new_node;
      },
      None: () => {
        this.head = new_node;
        this.tail = new_node;
      },
    });
  }

  pop_back(): Option<T> {
    return this.tail.match({
      Some: (tail) => {
        tail.prev.match({
          Some: (prev) => {
            prev.next = none();
          },
          None: () => {
            this.head = tail.prev;
          },
        });

        this.tail = tail.prev;
        this.len -= 1;

        return some(tail.value);
      },

      None: () => {
        return none();
      },
    });
  }

  length(): number {
    return this.len;
  }

  isEmpty(): boolean {
    return this.length() === 0;
  }
}

class Node<T> {
  value: T;
  prev: Option<Node<T>>;
  next: Option<Node<T>>;

  constructor(value: T) {
    this.value = value;
    this.prev = none();
    this.next = none();
  }
}
