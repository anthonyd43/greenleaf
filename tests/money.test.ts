import { expect, test } from 'vitest'
import { parseAmountToCents, formatCents } from '@/lib/money'

test('parses dollar strings to cents', () => {
  expect(parseAmountToCents('42.06')).toBe(4206)
  expect(parseAmountToCents('$336.80')).toBe(33680)
  expect(parseAmountToCents('0')).toBe(0)
  expect(parseAmountToCents('7')).toBe(700)
})
test('rejects garbage', () => {
  expect(() => parseAmountToCents('abc')).toThrow()
  expect(() => parseAmountToCents('1.2.3')).toThrow()
})
test('formats cents', () => {
  expect(formatCents(4206)).toBe('$42.06')
  expect(formatCents(0)).toBe('$0.00')
  expect(formatCents(14649)).toBe('$146.49')
})
