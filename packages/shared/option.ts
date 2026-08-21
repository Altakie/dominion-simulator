export function some<T>(val: T): Option<T> {
  return new Option(val);
}

export function none<T>(): Option<T> {
  return new Option<T>(undefined);
}

export class Option<T> {
  val: T | undefined;

  constructor(val: T | undefined) {
    this.val = val;
  }

  transform(f: (val: T) => T): Option<T> {
    if (this.val === undefined) {
      return this;
    }

    return new Option(f(this.val));
  }

  edit(f: (val: T) => T): Option<T> {
    if (this.val !== undefined) {
      f(this.val);
    }

    return this;
  }

  map<R>(f: (val: T) => R): Option<R> {
    if (this.val === undefined) {
      return none();
    }
    return new Option(f(this.val));
  }

  is_some() {
    return !(this.val === undefined);
  }

  is_none() {
    return this.val === undefined;
  }

  unwrap(): T {
    if (this.val === undefined) {
      throw new Error("Unwrapped a none option");
    }

    return this.val;
  }

  unwrap_or(fallback: T): T {
    if (this.val === undefined) {
      return fallback;
    }

    return this.val;
  }
}
