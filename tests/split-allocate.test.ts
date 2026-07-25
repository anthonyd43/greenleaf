import { expect, test } from 'vitest'
import { allocate } from '@/lib/split/engine'

test('even 4-way with remainder cent goes to earliest index', () => {
  // $585.93 / 4 = $146.4825 → one person pays the extra cent
  expect(allocate(58593, [1, 1, 1, 1])).toEqual([14649, 14648, 14648, 14648])
})
test('weighted allocation matches sheet gas cycle 3 (person-days 10/16/31/31)', () => {
  expect(allocate(1519, [10, 16, 31, 31])).toEqual([173, 276, 535, 535])
})
test('weighted allocation matches sheet electricity cycle 4 (22/22/28/28)', () => {
  expect(allocate(29522, [22, 22, 28, 28])).toEqual([6495, 6495, 8266, 8266])
})
test('always sums to total', () => {
  for (const [amt, w] of [[100, [3, 3, 3]], [1, [1, 1, 1, 1]], [65593, [7, 11, 13, 2]]] as const) {
    const parts = allocate(amt, [...w])
    expect(parts.reduce((a, b) => a + b, 0)).toBe(amt)
  }
})
test('zero total weight allocates nothing', () => {
  expect(allocate(5000, [0, 0])).toEqual([0, 0])
})
