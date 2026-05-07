<?php

namespace App\Services;

use App\Models\Issuance;
use App\Models\MdclInvent;
use App\Repositories\IssuanceRepository;

class IssuanceService
{
    public function __construct(
        private readonly IssuanceRepository $repo,
        private readonly HrisApiService $hris,
    ) {}

    // ── Read ──────────────────────────────────────────────────────────────────

    /**
     * Search active employees via HRIS and return paginated combobox-ready options.
     * Returns { data: [...], hasMore: bool }
     */
    public function searchEmployees(string $search, int $page): array
    {
        $result = $this->hris->fetchActiveEmployees($search, $page, 20);

        $data = collect($result['data'])
            ->map(function ($e) {
                // Cover common HRIS field-name variations across endpoints
                $id   = $e['employid']  ?? $e['emp_id']    ?? $e['emp_no'] ?? $e['id']        ?? null;
                $name = $e['emp_name']  ?? $e['full_name'] ?? $e['name']   ?? null;

                return [
                    'value'    => (string) ($id ?? ''),
                    'label'    => ($id ?? '') . ' - ' . ($name ?? ''),
                    'emp_name' => (string) ($name ?? ''),
                ];
            })
            ->filter(fn($e) => $e['value'] !== '')
            ->values()
            ->all();

        return [
            'data'    => $data,
            'hasMore' => $result['hasMore'],
        ];
    }

    /**
     * Return a paginated list of in-stock items formatted for the issuance form.
     * Returns { data: [...], meta: { current_page, last_page, from, to, total, per_page } }
     */
    public function availableItems(array $filters): array
    {
        $perPage   = max(1, min(50, (int) ($filters['per_page'] ?? 15)));
        $page      = max(1, (int) ($filters['page'] ?? 1));
        $paginator = $this->repo->availableItems($filters, $perPage, $page);

        $medTypeLabels = [1 => 'Medicine', 2 => 'Supply', 3 => 'Equipment'];

        return [
            'data' => collect($paginator->items())->map(fn($item) => [
                'id'             => $item->id,
                'item_name'      => $item->item_name,
                'brand'          => $item->brand,
                'uom'            => $item->uom,
                'med_type'       => $item->med_type,
                'med_type_label' => $medTypeLabels[$item->med_type] ?? '—',
                'qty'            => $item->qty,
            ])->values()->all(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'from'         => $paginator->firstItem() ?? 0,
                'to'           => $paginator->lastItem()  ?? 0,
                'total'        => $paginator->total(),
                'per_page'     => $paginator->perPage(),
            ],
        ];
    }

    /**
     * Paginated issuance records, scoped by dept (dept 39 = view all).
     * Returns { data, meta, can_view_all }
     */
    public function listRecords(array $filters, array $empData): array
    {
        $perPage = max(1, min(50, (int) ($filters['per_page'] ?? 15)));
        $page    = max(1, (int) ($filters['page'] ?? 1));

        $viewAll     = (int) ($empData['emp_station_id'] ?? 0) === 39;
        $viewerEmpId = (string) ($empData['emp_id'] ?? '');

        $paginator = $this->repo->listIssuances($filters, $viewAll, $viewerEmpId, $perPage, $page);

        $medTypeLabels = [1 => 'Medicine', 2 => 'Supply', 3 => 'Equipment'];

        return [
            'data' => collect($paginator->items())->map(fn($rec) => [
                'id'               => $rec->id,
                'emp_id'           => $rec->emp_id,
                'emp_name'         => $rec->emp_name,
                'issued_by_emp_id' => $rec->issued_by_emp_id,
                'issued_by_name'   => $rec->issued_by_name,
                'issue_date'       => $rec->issue_date?->toDateString(),
                'notes'            => $rec->notes,
                'status'           => $rec->status,
                'items_count'      => $rec->items->count(),
                'items'            => $rec->items->map(fn($item) => [
                    'id'             => $item->id,
                    'item_name'      => $item->item_name,
                    'brand'          => $item->brand,
                    'uom'            => $item->uom,
                    'med_type'       => $item->med_type,
                    'med_type_label' => $medTypeLabels[$item->med_type] ?? '—',
                    'qty_issued'     => $item->qty_issued,
                ])->values()->all(),
            ])->values()->all(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'from'         => $paginator->firstItem() ?? 0,
                'to'           => $paginator->lastItem()  ?? 0,
                'total'        => $paginator->total(),
                'per_page'     => $paginator->perPage(),
            ],
            'can_view_all' => $viewAll,
        ];
    }

    // ── Write ─────────────────────────────────────────────────────────────────

    /**
     * Record an issuance, stamping the issuing employee from session data.
     */
    public function issue(array $data, array $empData): Issuance
    {
        return $this->repo->createIssuance([
            ...$data,
            'issued_by_emp_id' => (string) ($empData['emp_id'] ?? ''),
            'issued_by_name'   => $empData['emp_name'] ?? '',
        ]);
    }
}
