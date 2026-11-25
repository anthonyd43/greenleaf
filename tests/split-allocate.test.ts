import { expect, test } from 'vitest'
import { allocate } from '@/lib/split/engine'

test('even 4-way with an odd cent: everyone pays the same, rounded up', () => {
  // $585.93 / 4 = $146.4825 → $146.49 each
  expect(allocate(58593, [1, 1, 1, 1])).toEqual([14649, 14649, 14649, 14649])
})
test('an amount that divides exactly is split exactly', () => {
  expect(allocate(10000, [1, 1, 1, 1])).toEqual([2500, 2500, 2500, 2500])
  expect(allocate(27680, [1, 1, 1, 1])).toEqual([6920, 6920, 6920, 6920])
})
test('weighted allocation rounds each share up (gas, person-days 10/16/31/31)', () => {
  // exact shares 172.61 / 276.18 / 535.10 / 535.10
  expect(allocate(1519, [10, 16, 31, 31])).toEqual([173, 277, 536, 536])
})
test('weighted allocation rounds each share up (electricity, 22/22/28/28)', () => {
  // exact shares 6494.84 / 6494.84 / 8266.16 / 8266.16
  expect(allocate(29522, [22, 22, 28, 28])).toEqual([6495, 6495, 8267, 8267])
})
test('equal weights always get equal shares', () => {
  for (const [amt, w] of [[36734, [1, 1, 1, 1]], [101, [3, 3, 5]], [65593, [7, 7, 7, 2]], [1, [1, 1, 1, 1]]] as const) {
    const parts = allocate(amt, [...w])
    w.forEach((wi, i) => w.forEach((wj, j) => {
      if (wi === wj) expect(parts[i]).toBe(parts[j])
    }))
  }
})
test('never collects less than the total, and goes over by less than a cent per person', () => {
  for (const [amt, w] of [[100, [3, 3, 3]], [1, [1, 1, 1, 1]], [65593, [7, 11, 13, 2]], [36734, [1, 1, 1, 1]]] as const) {
    const over = allocate(amt, [...w]).reduce((a, b) => a + b, 0) - amt
    expect(over).toBeGreaterThanOrEqual(0)
    expect(over).toBeLessThan(w.length)
  }
})
test('a zero amount stays zero', () => {
  expect(allocate(0, [1, 1, 1, 1])).toEqual([0, 0, 0, 0])
})
test('zero total weight allocates nothing', () => {
  expect(allocate(5000, [0, 0])).toEqual([0, 0])
})
