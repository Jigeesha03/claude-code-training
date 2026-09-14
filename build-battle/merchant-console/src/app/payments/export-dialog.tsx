"use client"

import { Button } from "@/components/Button"
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/Drawer"
import {
  DEFAULT_EXPORT_COLUMNS,
  EXPORT_COLUMNS,
  type ExportColumn,
} from "@/lib/csv"
import { cx, focusRing } from "@/lib/utils"
import { Download } from "lucide-react"
import { useState } from "react"

const COLUMN_LABELS: Record<ExportColumn, string> = {
  id: "Payment ID",
  created_at: "Created (UTC)",
  merchant: "Merchant",
  description: "Description",
  status: "Status",
  method: "Method",
  card_brand: "Card brand",
  last4: "Card last four",
  amount: "Amount",
  currency: "Currency",
}

const SCOPES = [
  { value: "filtered", label: "Current filter" },
  { value: "all", label: "All payments" },
] as const

type Scope = (typeof SCOPES)[number]["value"]

const control = [
  "size-4 shrink-0 accent-blue-500",
  "border-gray-300 dark:border-gray-800",
]

export function ExportDialog({
  query,
  filteredCount,
  allCount,
}: {
  query: string
  filteredCount: number
  allCount: number
}) {
  const [scope, setScope] = useState<Scope>("filtered")
  const [selected, setSelected] = useState<ExportColumn[]>([
    ...DEFAULT_EXPORT_COLUMNS,
  ])

  const toggle = (column: ExportColumn) =>
    setSelected((current) =>
      current.includes(column)
        ? current.filter((name) => name !== column)
        : [...current, column],
    )

  const countFor = (value: Scope) =>
    value === "all" ? allCount : filteredCount

  const download = () => {
    const params = new URLSearchParams(query)
    // Canonical order, so the file reads the same whatever order they clicked.
    params.set("columns", EXPORT_COLUMNS.filter(isSelected).join(","))
    if (scope === "all") params.set("scope", "all")
    window.location.href = `/api/payments/export?${params.toString()}`
  }

  function isSelected(column: ExportColumn) {
    return selected.includes(column)
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="secondary" className="w-full gap-2 py-1.5 sm:w-fit">
          <Download
            className="-ml-0.5 size-4 shrink-0 text-gray-400 dark:text-gray-600"
            aria-hidden="true"
          />
          Export
        </Button>
      </DrawerTrigger>

      <DrawerContent className="sm:max-w-md">
        <DrawerHeader>
          <DrawerTitle>Export payments</DrawerTitle>
          <DrawerDescription className="text-sm">
            Card last four is left out unless you add it.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="flex flex-col gap-8">
          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium text-gray-900 dark:text-gray-50">
              Scope
            </legend>
            {SCOPES.map(({ value, label }) => (
              <div key={value} className="flex items-center gap-2.5">
                <input
                  type="radio"
                  id={`export-scope-${value}`}
                  name="export-scope"
                  value={value}
                  checked={scope === value}
                  onChange={() => setScope(value)}
                  className={cx(control, focusRing)}
                />
                <label
                  htmlFor={`export-scope-${value}`}
                  className="text-sm text-gray-900 dark:text-gray-50"
                >
                  {label}
                  <span className="text-gray-500 dark:text-gray-500">
                    {" · "}
                    {countFor(value).toLocaleString()} payments
                  </span>
                </label>
              </div>
            ))}
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium text-gray-900 dark:text-gray-50">
              Columns
            </legend>
            {EXPORT_COLUMNS.map((column) => (
              <div key={column} className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id={`export-column-${column}`}
                  name="export-columns"
                  value={column}
                  checked={isSelected(column)}
                  onChange={() => toggle(column)}
                  className={cx(control, "rounded", focusRing)}
                />
                <label
                  htmlFor={`export-column-${column}`}
                  className="text-sm text-gray-900 dark:text-gray-50"
                >
                  {COLUMN_LABELS[column]}
                </label>
              </div>
            ))}
          </fieldset>
        </DrawerBody>

        <DrawerFooter>
          <p
            className="text-sm text-gray-500 sm:mr-auto sm:self-center dark:text-gray-500"
            role="status"
          >
            {selected.length === 0
              ? "Select at least one column"
              : `${selected.length} columns · ${countFor(scope).toLocaleString()} rows`}
          </p>
          <Button disabled={selected.length === 0} onClick={download}>
            Download CSV
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
