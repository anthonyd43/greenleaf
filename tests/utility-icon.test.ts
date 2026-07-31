import { describe, expect, it } from 'vitest'
import { Car, Droplet, Flame, ReceiptText, Trash2, Wifi, Zap } from 'lucide-react'
import { utilityIconFor } from '@/components/ui/utility-icon'

describe('utilityIconFor', () => {
  it('maps known household utility names', () => {
    expect(utilityIconFor('Electricity')).toBe(Zap)
    expect(utilityIconFor('Gas')).toBe(Flame)
    expect(utilityIconFor('Water')).toBe(Droplet)
    expect(utilityIconFor('Internet')).toBe(Wifi)
    expect(utilityIconFor('Garbage')).toBe(Trash2)
    expect(utilityIconFor('EV Charging A')).toBe(Car)
    expect(utilityIconFor('EV Charging B')).toBe(Car)
  })
  it('is case-insensitive and falls back to a receipt', () => {
    expect(utilityIconFor('electric bill')).toBe(Zap)
    expect(utilityIconFor('Something Else')).toBe(ReceiptText)
  })
})
