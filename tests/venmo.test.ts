import { expect, test } from 'vitest'
import { venmoRequestLink } from '@/lib/venmo'

test('builds a prefilled charge link', () => {
  const url = venmoRequestLink('sample-user', 20948, 'Greenleaf utilities — June 2026 (cycle 13)')
  expect(url).toBe(
    'https://venmo.com/sample-user?txn=charge&amount=209.48&note=Greenleaf+utilities+%E2%80%94+June+2026+%28cycle+13%29',
  )
})
test('encodes usernames', () => {
  expect(venmoRequestLink('a b', 100, 'x')).toContain('venmo.com/a%20b?')
})
