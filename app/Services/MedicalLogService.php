<?php

namespace App\Services;

use App\Models\MdclInvent;
use App\Repositories\MedicalLogRepository;

class MedicalLogService
{
    public function __construct(
        private readonly MedicalLogRepository $repo
    ) {}

    public function getForInventoryItem(int $id, array $filters): array
    {
        $perPage   = max(1, min(50, (int) ($filters['per_page'] ?? 10)));
        $page      = max(1, (int) ($filters['page'] ?? 1));
        $paginator = $this->repo->getForModel(MdclInvent::class, $id, $filters, $perPage, $page);

        return [
            'data' => collect($paginator->items())->map(fn ($log) => [
                'id'           => $log->id,
                'action_type'  => $log->action_type,
                'action_by'    => $log->action_by,
                'action_at'    => $log->action_at?->toIso8601String(),
                'old_values'   => $log->old_values,
                'new_values'   => $log->new_values,
                'remarks'      => $log->remarks,
                'metadata'     => $log->metadata,
                'related_type' => $log->related_type ? class_basename($log->related_type) : null,
                'related_id'   => $log->related_id,
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
}
