<?php

namespace App\Repositories;

use App\Models\MdclInvent;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class InventoryRepository
{
    private const ALLOWED_SORTS = [
        'id', 'item_name', 'brand', 'uom', 'qty',
        'med_type', 'expiration', 'date_inserted',
    ];

    // ── Queries ──────────────────────────────────────────────────────────────

    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = MdclInvent::query();

        // Full-text search across key columns
        if (!empty($filters['search'])) {
            $term = $filters['search'];
            $query->where(function ($q) use ($term) {
                $q->where('item_name', 'like', "%{$term}%")
                  ->orWhere('brand',     'like', "%{$term}%")
                  ->orWhere('uom',       'like', "%{$term}%");
            });
        }

        // Type filter (1=Medicine, 2=Supply, 3=Equipment)
        if (!empty($filters['med_type'])) {
            $query->where('med_type', (int) $filters['med_type']);
        }

        // Stock status filter
        if (!empty($filters['stock_status'])) {
            match ($filters['stock_status']) {
                'out'  => $query->where('qty', '=', 0),
                'low'  => $query->where('qty', '>', 0)->where('qty', '<=', 10),
                'ok'   => $query->where('qty', '>', 10),
                default => null,
            };
        }

        // Expiry filter
        if (!empty($filters['expiry'])) {
            match ($filters['expiry']) {
                'expired'     => $query->whereNotNull('expiration')
                                       ->where('expiration', '<=', now()),
                'not_expired' => $query->notExpired(),
                'expiring'    => $query->whereNotNull('expiration')
                                       ->whereBetween('expiration', [now(), now()->addDays(30)]),
                default => null,
            };
        }

        // Sorting — whitelist guarded
        $sortBy  = in_array($filters['sort_by']  ?? '', self::ALLOWED_SORTS, true)
                   ? $filters['sort_by']
                   : 'id';
        $sortDir = ($filters['sort_dir'] ?? 'desc') === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortDir);

        $perPage = min(max((int) ($filters['per_page'] ?? 15), 5), 100);

        return $query->paginate($perPage)->withQueryString();
    }

    public function findOrFail(int $id): MdclInvent
    {
        return MdclInvent::findOrFail($id);
    }

    // ── Writes ───────────────────────────────────────────────────────────────

    public function create(array $data): MdclInvent
    {
        return MdclInvent::create($data);
    }

    public function update(int $id, array $data): MdclInvent
    {
        $item = $this->findOrFail($id);
        $item->update($data);
        return $item->fresh();
    }

    public function delete(int $id): void
    {
        MdclInvent::destroy($id);
    }

    public function bulkDelete(array $ids): int
    {
        return MdclInvent::whereIn('id', $ids)->delete();
    }

    /**
     * Upsert a batch of rows from CSV import.
     * Rows with an existing `id` are updated; all others are created.
     */
    public function upsertBatch(array $rows): array
    {
        $created = 0;
        $updated = 0;
        $errors  = [];

        foreach ($rows as $index => $row) {
            try {
                if (!empty($row['id']) && is_numeric($row['id'])) {
                    $item = MdclInvent::find((int) $row['id']);
                    if ($item) {
                        unset($row['id']);
                        $item->update($row);
                        $updated++;
                        continue;
                    }
                }
                unset($row['id']);
                MdclInvent::create($row);
                $created++;
            } catch (\Throwable $e) {
                $errors[] = "Row " . ($index + 2) . ": " . $e->getMessage();
            }
        }

        return compact('created', 'updated', 'errors');
    }

    // ── Aggregates ───────────────────────────────────────────────────────────

    public function stats(): array
    {
        return [
            'total'     => MdclInvent::count(),
            'medicine'  => MdclInvent::medicines()->count(),
            'supply'    => MdclInvent::supplies()->count(),
            'equipment' => MdclInvent::equipment()->count(),
            'low_stock' => MdclInvent::where('qty', '>', 0)->where('qty', '<=', 10)->count(),
            'out_stock' => MdclInvent::where('qty', '=', 0)->count(),
            'expiring'  => MdclInvent::whereNotNull('expiration')
                                     ->whereBetween('expiration', [now(), now()->addDays(30)])
                                     ->count(),
        ];
    }
}
