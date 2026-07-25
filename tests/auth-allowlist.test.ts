import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const whereMock = vi.fn()
const fromMock = vi.fn(() => ({ where: whereMock }))
const selectMock = vi.fn(() => ({ from: fromMock }))

vi.mock('@/db', () => ({
  db: { select: selectMock },
}))

// Wrap drizzle-orm's `eq` so we can assert what value the allowlist lookup
// actually queried with (e.g. that it lowercased the email) without
// depending on drizzle's internal SQL representation.
vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>()
  return {
    ...actual,
    eq: vi.fn((col: unknown, val: unknown) => ({ __col: col, __val: val })),
  }
})

const { isAllowedEmail } = await import('@/lib/allowlist')

beforeEach(() => {
  selectMock.mockClear()
  fromMock.mockClear()
  whereMock.mockReset()
})

describe('isAllowedEmail', () => {
  test('matching active housemate -> true', async () => {
    whereMock.mockResolvedValue([{ email: 'a@b.com', isActive: true }])
    await expect(isAllowedEmail('a@b.com')).resolves.toBe(true)
  })

  test('matching but inactive housemate -> false', async () => {
    whereMock.mockResolvedValue([{ email: 'a@b.com', isActive: false }])
    await expect(isAllowedEmail('a@b.com')).resolves.toBe(false)
  })

  test('no matching row -> false', async () => {
    whereMock.mockResolvedValue([])
    await expect(isAllowedEmail('nobody@example.com')).resolves.toBe(false)
  })

  test('null/undefined/empty email -> false without querying the db', async () => {
    await expect(isAllowedEmail(null)).resolves.toBe(false)
    await expect(isAllowedEmail(undefined)).resolves.toBe(false)
    await expect(isAllowedEmail('')).resolves.toBe(false)
    expect(selectMock).not.toHaveBeenCalled()
  })

  test('lookup is case-insensitive (email normalized to lowercase)', async () => {
    whereMock.mockResolvedValue([{ email: 'foo@bar.com', isActive: true }])
    await expect(isAllowedEmail('Foo@Bar.COM')).resolves.toBe(true)
    const queriedValue = whereMock.mock.calls[0][0].__val
    expect(queriedValue).toBe('foo@bar.com')
  })
})

describe('requireUser', () => {
  afterEach(() => {
    vi.resetModules()
  })

  test('returns lowercased email when a session exists', async () => {
    vi.doMock('@/auth', () => ({
      auth: vi.fn().mockResolvedValue({ user: { email: 'Foo@Bar.com' } }),
    }))
    const { requireUser } = await import('@/lib/actions/guard')
    await expect(requireUser()).resolves.toEqual({ email: 'foo@bar.com' })
  })

  test('throws "unauthorized" when there is no session', async () => {
    vi.doMock('@/auth', () => ({
      auth: vi.fn().mockResolvedValue(null),
    }))
    const { requireUser } = await import('@/lib/actions/guard')
    await expect(requireUser()).rejects.toThrow('unauthorized')
  })
})
