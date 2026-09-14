import { merchantById } from "@/data/merchants"
import { Payment } from "@/data/types"
import { formatMoney } from "./money"

/**
 * CSV export for the payments table.
 *
 * Ops chooses the columns. EXPORT_COLUMNS is the allowlist every requested
 * name is checked against; DEFAULT_EXPORT_COLUMNS is what ships when nothing
 * is chosen, and it leaves the card last four out — these files go to
 * merchants.
 */

export const EXPORT_COLUMNS = [
  "id",
  "created_at",
  "merchant",
  "description",
  "status",
  "method",
  "card_brand",
  "last4",
  "amount",
  "currency",
] as const

export type ExportColumn = (typeof EXPORT_COLUMNS)[number]

/** What ships when ops has not chosen: everything except the card last four. */
export const DEFAULT_EXPORT_COLUMNS: readonly ExportColumn[] =
  EXPORT_COLUMNS.filter((column) => column !== "last4")

/**
 * Resolves the `columns` query parameter against the allowlist. Unknown names
 * are dropped rather than trusted — they reach a header row and a filename.
 * An absent parameter means the default set; an empty one means ops cleared
 * every column, which the caller rejects rather than serializing.
 */
export function parseExportColumns(param: string | null): ExportColumn[] {
  if (param === null) return [...DEFAULT_EXPORT_COLUMNS]

  const allowed = new Set<string>(EXPORT_COLUMNS)
  const columns: ExportColumn[] = []

  for (const name of param.split(",")) {
    const trimmed = name.trim()
    if (!allowed.has(trimmed)) continue
    if (columns.includes(trimmed as ExportColumn)) continue
    columns.push(trimmed as ExportColumn)
  }

  return columns
}

function escapeCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function cell(payment: Payment, column: ExportColumn): string {
  switch (column) {
    case "id":
      return payment.id
    case "created_at":
      return payment.createdAt
    case "merchant":
      return merchantById(payment.merchantId)?.name ?? payment.merchantId
    case "description":
      return payment.description
    case "status":
      return payment.status
    case "method":
      return payment.method
    case "card_brand":
      return payment.cardBrand ?? ""
    case "last4":
      return payment.last4 ?? ""
    case "amount":
      return formatMoney(payment.amount, payment.currency)
    case "currency":
      return payment.currency
  }
}

export function toCsv(
  payments: Payment[],
  columns: readonly ExportColumn[] = EXPORT_COLUMNS,
): string {
  const header = columns.join(",")
  const rows = payments.map((payment) =>
    columns.map((column) => escapeCell(cell(payment, column))).join(","),
  )
  return [header, ...rows].join("\n")
}

export function exportFilename(date = new Date(), scopeLabel?: string): string {
  const stamp = date.toISOString().slice(0, 10)
  return scopeLabel
    ? `payments-${scopeLabel}-${stamp}.csv`
    : `payments-${stamp}.csv`
}
