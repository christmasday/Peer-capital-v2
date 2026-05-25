"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export type ProfileMetrics = {
  loansTaken: number
  loansGiven: number
  paybackRating: number
  creditLevel: number
  fundingTier: number
}

type LoanRequestRow = {
  amount: number | null
  status: string | null
}

type RepaymentRow = {
  status: string | null
  due_date: string | null
  updated_at: string | null
}

const ACTIVE_LOAN_STATUSES = new Set(["approved", "completed", "repaid", "active", "defaulted"])

function normalizeStatus(status: string | null | undefined) {
  return String(status || "").trim().toLowerCase()
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getCalendarDateKey(value: string | null | undefined) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) {
    return null
  }

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`
}

function calculatePaybackRating(onTimePaidCount: number, latePaidCount: number, defaultedCount: number) {
  const total = onTimePaidCount + latePaidCount + defaultedCount

  if (total <= 0) {
    return 3
  }

  const weightedScore = (onTimePaidCount * 1) + (latePaidCount * 0.5)
  const ratio = weightedScore / total
  if (ratio >= 0.95) return 5
  if (ratio >= 0.75) return 4
  if (ratio >= 0.55) return 3
  if (ratio >= 0.35) return 2
  return 1
}

function calculateCreditLevel(onTimePaidCount: number) {
  if (onTimePaidCount <= 0) {
    return 1
  }

  return clamp(1 + onTimePaidCount, 1, 11)
}

function calculateFundingTier(totalGiven: number) {
  if (totalGiven >= 1_000_000) return 3
  if (totalGiven >= 500_000) return 2
  return 1
}

export async function getProfileMetrics(userId: string): Promise<ProfileMetrics> {
  const adminClient = createAdminClient()

  const [takenResult, givenResult, repaymentsResult] = await Promise.all([
    adminClient.from("loan_requests").select("amount, status").eq("user_id", userId),
    adminClient.from("loan_requests").select("amount, status").eq("helper_id", userId),
    adminClient.from("loan_repayments").select("status, due_date, updated_at").eq("borrower_id", userId),
  ])

  const takenLoans = (takenResult.data || []) as LoanRequestRow[]
  const givenLoans = (givenResult.data || []) as LoanRequestRow[]
  const repayments = (repaymentsResult.data || []) as RepaymentRow[]

  const loansTaken = takenLoans.filter((loan) => ACTIVE_LOAN_STATUSES.has(normalizeStatus(loan.status))).length
  const loansGiven = givenLoans.filter((loan) => ACTIVE_LOAN_STATUSES.has(normalizeStatus(loan.status))).length

  const totalBorrowed = takenLoans.reduce((sum, loan) => {
    if (!ACTIVE_LOAN_STATUSES.has(normalizeStatus(loan.status))) {
      return sum
    }

    return sum + Number(loan.amount || 0)
  }, 0)

  const totalGiven = givenLoans.reduce((sum, loan) => {
    if (!ACTIVE_LOAN_STATUSES.has(normalizeStatus(loan.status))) {
      return sum
    }

    return sum + Number(loan.amount || 0)
  }, 0)

  const onTimePaidCount = repayments.filter((repayment) => {
    if (normalizeStatus(repayment.status) !== "paid") {
      return false
    }

    const dueDateKey = getCalendarDateKey(repayment.due_date)
    const paidDateKey = getCalendarDateKey(repayment.updated_at)

    if (!dueDateKey || !paidDateKey) {
      return false
    }

    return paidDateKey <= dueDateKey
  }).length

  const latePaidCount = repayments.filter((repayment) => {
    if (normalizeStatus(repayment.status) !== "paid") {
      return false
    }

    const dueDateKey = getCalendarDateKey(repayment.due_date)
    const paidDateKey = getCalendarDateKey(repayment.updated_at)

    if (!dueDateKey || !paidDateKey) {
      return false
    }

    return paidDateKey > dueDateKey
  }).length

  const defaultedCount = repayments.filter((repayment) => normalizeStatus(repayment.status) === "defaulted").length

  const paybackRating = calculatePaybackRating(onTimePaidCount, latePaidCount, defaultedCount)
  const creditLevel = calculateCreditLevel(onTimePaidCount)
  const fundingTier = calculateFundingTier(totalGiven)

  return {
    loansTaken,
    loansGiven,
    paybackRating,
    creditLevel,
    fundingTier,
  }
}
