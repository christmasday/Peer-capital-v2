import test from 'node:test'
import assert from 'node:assert/strict'
import { durationToDays } from '../lib/loan-limits.ts'
import { getBorrowerPolicyForAmount, getLenderTierForAmount } from '../lib/loan-policies.server.ts'

test('converts durations to days correctly', () => {
  assert.equal(durationToDays(1, 'days'), 1)
  assert.equal(durationToDays(2, 'weeks'), 14)
  assert.equal(durationToDays(1, 'months'), 30)
  assert.equal(durationToDays(3, 'months'), 90)
})

test('returns borrower policy fallback for small amounts', async () => {
  const p = await getBorrowerPolicyForAmount(15000)
  assert.ok(p)
  assert.ok(p.min <= 15000)
  assert.ok(p.max >= 15000)
})

test('returns lender tier fallback for amount', async () => {
  const t = await getLenderTierForAmount(2000000)
  assert.ok(t)
  assert.ok(t.min <= 2000000)
  assert.ok(t.max >= 2000000)
})
