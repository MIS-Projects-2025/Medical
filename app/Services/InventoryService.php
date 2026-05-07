<?php

namespace App\Services;

use App\Repositories\InventoryRepository;
use Illuminate\Http\UploadedFile;

class InventoryService
{
    public function __construct(
        private readonly InventoryRepository $repository
    ) {}

    // ── Read ──────────────────────────────────────────────────────────────────

    public function list(array $filters): array
    {
        $paginator = $this->repository->paginate($filters);

        return [
            'data' => collect($paginator->items())->map(fn($item) => $this->format($item)),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'from'         => $paginator->firstItem(),
                'to'           => $paginator->lastItem(),
            ],
        ];
    }

    public function stats(): array
    {
        return $this->repository->stats();
    }

    // ── Write ─────────────────────────────────────────────────────────────────

    public function create(array $data): array
    {
        $item = $this->repository->create($this->sanitize($data));
        return $this->format($item);
    }

    public function update(int $id, array $data): array
    {
        $item = $this->repository->update($id, $this->sanitize($data));
        return $this->format($item);
    }

    public function delete(int $id): void
    {
        $this->repository->delete($id);
    }

    public function bulkDelete(array $ids): int
    {
        return $this->repository->bulkDelete(
            array_map('intval', $ids)
        );
    }

    // ── Import ────────────────────────────────────────────────────────────────

    /**
     * Parse a CSV file and upsert rows into inventory.
     * Expected columns: id (optional), med_type, item_name, brand, uom, qty, expiration
     */
    public function importCsv(UploadedFile $file): array
    {
        $handle = fopen($file->getRealPath(), 'r');

        if ($handle === false) {
            throw new \RuntimeException('Could not open uploaded file.');
        }

        $headers = null;
        $rows    = [];

        while (($line = fgetcsv($handle)) !== false) {
            if ($headers === null) {
                $headers = array_map(fn($h) => strtolower(trim($h)), $line);
                continue;
            }

            if (count($line) !== count($headers)) {
                continue; // skip malformed rows
            }

            $row = array_combine($headers, $line);
            $mapped = $this->mapImportRow($row);

            if (empty($mapped['item_name'])) {
                continue; // skip rows without a name
            }

            $rows[] = $mapped;
        }

        fclose($handle);

        if (empty($rows)) {
            throw new \RuntimeException('No valid rows found in the file. Check column headers and data.');
        }

        return $this->repository->upsertBatch($rows);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function format($item): array
    {
        return [
            'id'            => $item->id,
            'med_type'      => $item->med_type,
            'med_type_label'=> $item->med_type_label,
            'item_name'     => $item->item_name,
            'brand'         => $item->brand,
            'uom'           => $item->uom,
            'qty'           => $item->qty,
            'expiration'    => $item->expiration?->format('Y-m-d'),
            'date_inserted' => $item->date_inserted?->format('Y-m-d'),
            'created_at'    => $item->created_at?->toIso8601String(),
            'updated_at'    => $item->updated_at?->toIso8601String(),
        ];
    }

    /** Strip to only fillable, safe fields */
    private function sanitize(array $data): array
    {
        return array_intersect_key($data, array_flip([
            'med_type', 'uom', 'brand', 'item_name', 'qty', 'expiration', 'date_inserted',
        ]));
    }

    private function mapImportRow(array $row): array
    {
        static $typeMap = ['medicine' => 1, 'supply' => 2, 'equipment' => 3];

        $medTypeRaw = strtolower(trim($row['med_type'] ?? ''));
        $medType    = $typeMap[$medTypeRaw] ?? (is_numeric($medTypeRaw) ? (int) $medTypeRaw : 1);

        return array_filter([
            'id'            => isset($row['id']) && is_numeric($row['id']) ? (int) $row['id'] : null,
            'med_type'      => in_array($medType, [1, 2, 3], true) ? $medType : 1,
            'item_name'     => trim($row['item_name'] ?? ''),
            'brand'         => trim($row['brand']     ?? '') ?: null,
            'uom'           => trim($row['uom']        ?? '') ?: null,
            'qty'           => max(0, (int) ($row['qty'] ?? 0)),
            'expiration'    => !empty($row['expiration']) ? trim($row['expiration']) : null,
            'date_inserted' => !empty($row['date_inserted'])
                                ? trim($row['date_inserted'])
                                : now()->toDateString(),
        ], fn($v) => $v !== null && $v !== '');
    }
}
