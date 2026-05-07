<?php

namespace App\Repositories;

use App\Models\Issuance;
use App\Models\MdclInvent;
use Illuminate\Support\Facades\DB;

class IssuanceRepository
{
    /**
     * Return a paginated list of in-stock inventory items.
     */
    public function availableItems(array $filters, int $perPage = 15, int $page = 1): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $q = MdclInvent::query()->where('qty', '>', 0);

        if (!empty($filters['med_type'])) {
            $q->where('med_type', (int) $filters['med_type']);
        }

        if (!empty($filters['search'])) {
            $s = '%' . $filters['search'] . '%';
            $q->where(fn($q) => $q->where('item_name', 'like', $s)->orWhere('brand', 'like', $s));
        }

        return $q->orderBy('item_name')->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * Paginated list of issuance records.
     * Pass $viewAll = true (dept 39) to see all; otherwise scoped to $viewerEmpId.
     */
    public function listIssuances(
        array   $filters,
        bool    $viewAll,
        ?string $viewerEmpId,
        int     $perPage = 15,
        int     $page    = 1
    ): \Illuminate\Contracts\Pagination\LengthAwarePaginator {
        $q = Issuance::query()->with('items');

        if (!$viewAll && $viewerEmpId !== null) {
            $q->where('emp_id', $viewerEmpId);
        }

        if (!empty($filters['search'])) {
            $s = '%' . $filters['search'] . '%';
            $q->where(fn($q) => $q
                ->where('emp_id',          'like', $s)
                ->orWhere('emp_name',       'like', $s)
                ->orWhere('issued_by_name', 'like', $s)
            );
        }

        if (!empty($filters['date_from'])) {
            $q->whereDate('issue_date', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $q->whereDate('issue_date', '<=', $filters['date_to']);
        }

        return $q->orderByDesc('issue_date')
                 ->orderByDesc('id')
                 ->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * Persist a new issuance and its line items inside a transaction.
     * Decrements inventory qty atomically; throws on insufficient stock.
     */
    public function createIssuance(array $data): Issuance
    {
        return DB::transaction(function () use ($data) {
            $issuance = Issuance::create([
                'emp_id'           => $data['emp_id'],
                'emp_name'         => $data['emp_name'],
                'issued_by_emp_id' => $data['issued_by_emp_id'],
                'issued_by_name'   => $data['issued_by_name'],
                'issue_date'       => $data['issue_date'],
                'notes'            => $data['notes'] ?? null,
                'status'           => 1,
            ]);

            foreach ($data['items'] as $item) {
                $inv = MdclInvent::lockForUpdate()->findOrFail($item['inventory_id']);

                if ($inv->qty < $item['qty_issued']) {
                    throw new \Exception("Insufficient stock for \"{$inv->item_name}\". Available: {$inv->qty}.");
                }

                $inv->decrement('qty', $item['qty_issued']);

                $issuance->items()->create([
                    'inventory_id' => $inv->id,
                    'item_name'    => $inv->item_name,
                    'brand'        => $inv->brand,
                    'uom'          => $inv->uom,
                    'med_type'     => $inv->med_type,
                    'qty_issued'   => $item['qty_issued'],
                ]);
            }

            return $issuance->load('items');
        });
    }
}
