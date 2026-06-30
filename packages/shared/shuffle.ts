export function shuffle<T>(array: T[]): T[] {
  // Fisher-Yates shuffle algorithm
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = array[i]!;
    const b = array[j]!;
    array[i] = b;
    array[j] = a;
  }
  return array;
}
