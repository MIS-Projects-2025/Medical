import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Head, Link, usePage } from "@inertiajs/react";
import { Plus, RefreshCw, Search, X, ArrowRight } from "lucide-react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Button }     from "@/Components/ui/button";
import { Input }      from "@/Components/ui/input";
import { Label }      from "@/Components/ui/label";
import { DatePicker } from "@/Components/ui/date-picker";
import { Pagination } from "@/Components/Pagination";

import IssuanceTable        from "./records/IssuanceTable";
import IssuanceDetailDialog from "./records/IssuanceDetailDialog";
import { useIssuanceRecords } from "./hooks/useIssuanceRecords";
import { useDebounce }        from "./hooks/useDebounce";

const DEFAULT_FILTERS = {
    search:    "",
    date_from: "",
    date_to:   "",
    per_page:  "15",
    page:      1,
};

// Helpers — keep filters as "yyyy-MM-dd" strings; convert to/from Date for the picker
const toDate   = (s) => (s ? parseISO(s) : undefined);
const toString = (d) => (d ? format(d, "yyyy-MM-dd") : "");

export default function IssuanceRecords() {
    const { emp_data } = usePage().props;
    const isStation39  = Number(emp_data?.emp_station_id) === 39;

    const [rawSearch, setRawSearch] = useState("");
    const [filters,   setFilters]   = useState(DEFAULT_FILTERS);
    const [detail,    setDetail]    = useState(null);

    const debouncedSearch  = useDebounce(rawSearch, 400);
    const effectiveFilters = { ...filters, search: debouncedSearch };

    const { rows, meta, loading, error, canViewAll, refetch } =
        useIssuanceRecords(effectiveFilters);

    const handleSearch   = (v) => { setRawSearch(v); setFilters((f) => ({ ...f, page: 1 })); };
    const handleDateFrom = (d) => setFilters((f) => ({ ...f, date_from: toString(d), page: 1 }));
    const handleDateTo   = (d) => setFilters((f) => ({ ...f, date_to:   toString(d), page: 1 }));
    const handleReset    = () => { setRawSearch(""); setFilters(DEFAULT_FILTERS); };

    const hasActiveFilters = rawSearch || filters.date_from || filters.date_to;

    return (
        <AuthenticatedLayout>
            <Head title="Issuance Records" />

            <div className="space-y-5">

                {/* ── Page header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Issuance Records</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {canViewAll ? "Viewing all issuance records" : "Your personal issuance history"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={refetch} className="gap-1.5">
                            <RefreshCw className="h-3.5 w-3.5" />
                            Refresh
                        </Button>
                        {isStation39 && (
                            <Button size="sm" asChild className="gap-1.5">
                                <Link href={route("issuance.index")}>
                                    <Plus className="h-4 w-4" />
                                    New Issuance
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                {/* ── Filters ── */}
                <div className="flex flex-wrap items-end gap-3">

                    {/* Search */}
                    <div className="flex flex-col gap-1.5 flex-1 min-w-52">
                        <Label className="text-xs text-muted-foreground">Search</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder={canViewAll ? "Employee name, ID, or issued by…" : "Search…"}
                                value={rawSearch}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="h-9 pl-8 pr-8"
                            />
                            {rawSearch && (
                                <button
                                    onClick={() => handleSearch("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Date range */}
                    <div className="flex items-end gap-2">
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs text-muted-foreground">From</Label>
                            <DatePicker
                                value={toDate(filters.date_from)}
                                onChange={handleDateFrom}
                                placeholder="Start date"
                                disabled={filters.date_to ? { after: parseISO(filters.date_to) } : undefined}
                                className="w-40"
                            />
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground mb-2 shrink-0" />
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs text-muted-foreground">To</Label>
                            <DatePicker
                                value={toDate(filters.date_to)}
                                onChange={handleDateTo}
                                placeholder="End date"
                                disabled={filters.date_from ? { before: parseISO(filters.date_from) } : undefined}
                                className="w-40"
                            />
                        </div>
                    </div>

                    {/* Reset */}
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            className="h-9 gap-1.5 text-muted-foreground self-end"
                        >
                            <X className="h-3.5 w-3.5" />
                            Clear
                        </Button>
                    )}
                </div>

                {/* ── Error ── */}
                {error && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                {/* ── Table ── */}
                <IssuanceTable
                    rows={rows}
                    loading={loading}
                    canViewAll={canViewAll}
                    onView={setDetail}
                />

                {/* ── Pagination ── */}
                {meta && meta.total > 0 && (
                    <Pagination
                        meta={meta}
                        onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
                        perPage={String(filters.per_page)}
                        onPerPageChange={(v) => setFilters((f) => ({ ...f, per_page: v, page: 1 }))}
                    />
                )}

            </div>

            {/* ── Detail dialog ── */}
            <IssuanceDetailDialog record={detail} onClose={() => setDetail(null)} />

        </AuthenticatedLayout>
    );
}
