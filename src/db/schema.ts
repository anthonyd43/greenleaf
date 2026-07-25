import { pgTable, serial, text, integer, boolean, pgEnum } from 'drizzle-orm/pg-core'

export const splitMethodEnum = pgEnum('split_method', ['even', 'person_day'])
export const cycleStatusEnum = pgEnum('cycle_status', ['open', 'finalized', 'requested', 'settled'])
export const billSourceEnum = pgEnum('bill_source', ['manual', 'email_draft', 'imported'])
export const billStatusEnum = pgEnum('bill_status', ['draft', 'confirmed'])

export const housemates = pgTable('housemates', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  venmoUsername: text('venmo_username'),
  isActive: boolean('is_active').notNull().default(true),
})

export const utilities = pgTable('utilities', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  splitMethod: splitMethodEnum('split_method').notNull(),
  ownerId: integer('owner_id').references(() => housemates.id),
  deductFromUtilityId: integer('deduct_from_utility_id'),
  portalUrl: text('portal_url'),
  notes: text('notes'),
})

export const billCycles = pgTable('bill_cycles', {
  id: serial('id').primaryKey(),
  cycleNumber: integer('cycle_number').notNull().unique(),
  label: text('label').notNull(),
  status: cycleStatusEnum('status').notNull().default('open'),
})

export const bills = pgTable('bills', {
  id: serial('id').primaryKey(),
  utilityId: integer('utility_id').notNull().references(() => utilities.id),
  cycleId: integer('cycle_id').notNull().references(() => billCycles.id),
  amountCents: integer('amount_cents').notNull(),
  paymentDate: text('payment_date'),
  usageStart: text('usage_start'),
  usageEnd: text('usage_end'),
  usagePeriodText: text('usage_period_text'),
  notes: text('notes'),
  source: billSourceEnum('source').notNull().default('manual'),
  status: billStatusEnum('status').notNull().default('confirmed'),
  splitOverride: splitMethodEnum('split_override'),
})

export const absences = pgTable('absences', {
  id: serial('id').primaryKey(),
  housemateId: integer('housemate_id').notNull().references(() => housemates.id),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  note: text('note'),
})

export const splits = pgTable('splits', {
  id: serial('id').primaryKey(),
  billId: integer('bill_id').notNull().references(() => bills.id, { onDelete: 'cascade' }),
  housemateId: integer('housemate_id').notNull().references(() => housemates.id),
  daysPresent: integer('days_present'),
  amountCents: integer('amount_cents').notNull(),
})

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  cycleId: integer('cycle_id').notNull().references(() => billCycles.id, { onDelete: 'cascade' }),
  housemateId: integer('housemate_id').notNull().references(() => housemates.id),
  amountDueCents: integer('amount_due_cents').notNull(),
  venmoRequested: boolean('venmo_requested').notNull().default(false),
  paid: boolean('paid').notNull().default(false),
})
