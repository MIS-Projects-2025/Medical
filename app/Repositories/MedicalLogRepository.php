<?php

namespace App\Repositories;

use App\Models\MedicalLogs;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class MedicalLogRepository
{
    /**
     * Paginated logs for a specific model instance.
     */
    public function getForModel(
        string $modelClass,
        int|string $id,
        array $filters = [],
        int $perPage = 10,
        int $page = 1
    ): LengthAwarePaginator {
        $q = MedicalLogs::query()
            ->where('loggable_type', $modelClass)
            ->where('loggable_id',   $id)
            ->orderByDesc('action_at')
            ->orderByDesc('id');

        if (!empty($filters['action_type'])) {
            $q->where('action_type', strtoupper($filters['action_type']));
        }

        if (!empty($filters['search'])) {
            $s = '%' . $filters['search'] . '%';
            $q->where(fn ($q) => $q
                ->where('action_type', 'like', $s)
                ->orWhere('action_by',  'like', $s)
                ->orWhere('remarks',    'like', $s)
            );
        }

        return $q->paginate($perPage, ['*'], 'page', $page);
    }
}
