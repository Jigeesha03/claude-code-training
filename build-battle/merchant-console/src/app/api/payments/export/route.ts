import { filterPayments, parseFilters, sortPayments } from "@/data/queries"
import { exportFilename, parseExportColumns, toCsv } from "@/lib/csv"
import { NextRequest, NextResponse } from "next/server"

/**
 * Exports the payments table as CSV.
 *
 * Columns and scope arrive from the client, so both are resolved against an
 * allowlist here. The dialog disables Download when nothing is selected; that
 * is convenience, and this is the enforcement.
 */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const filters = parseFilters(params)
  const scope = params.get("scope") === "all" ? "all" : "filtered"
  const columns = parseExportColumns(params.get("columns"))

  if (columns.length === 0) {
    return NextResponse.json(
      { message: "Select at least one column to export." },
      { status: 400 },
    )
  }

  // Scope picks the arguments, never a second filter path.
  const rows = sortPayments(
    filterPayments(scope === "all" ? {} : filters),
    filters.sort,
    filters.direction,
  )

  const scopeLabel =
    scope === "all"
      ? "all"
      : filters.status !== "all"
        ? filters.status
        : undefined

  return new Response(toCsv(rows, columns), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${exportFilename(new Date(), scopeLabel)}"`,
    },
  })
}
