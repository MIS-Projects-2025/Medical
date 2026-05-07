<?php

namespace App\Http\Controllers;

use App\Services\IssuanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class IssuanceController extends Controller
{
    public function __construct(
        private readonly IssuanceService $service
    ) {}

    // ── Pages ─────────────────────────────────────────────────────────────────

    public function index(): InertiaResponse
    {
        return Inertia::render('Issuance/Issuance');
    }

    public function records(): InertiaResponse
    {
        return Inertia::render('Issuance/IssuanceRecords');
    }

    // ── API ───────────────────────────────────────────────────────────────────

    /** GET /issuance/employees — employee combobox search via HRIS (paginated) */
    public function searchEmployees(Request $request): \Illuminate\Http\JsonResponse
    {
        $search = (string) $request->input('search', '');
        $page   = max(1, (int) $request->input('page', 1));

        return response()->json($this->service->searchEmployees($search, $page));
    }

    /** GET /issuance/items — paginated in-stock inventory items for the issuance form */
    public function items(Request $request): JsonResponse
    {
        $items = $this->service->availableItems(
            $request->only('med_type', 'search', 'page', 'per_page')
        );
        return response()->json($items);
    }

    /** GET /issuance/records/data — paginated issuance history (scoped by dept) */
    public function recordsData(Request $request): JsonResponse
    {
        $filters = $request->only('search', 'date_from', 'date_to', 'page', 'per_page');
        return response()->json(
            $this->service->listRecords($filters, session('emp_data', []))
        );
    }

    /** POST /issuance — record a new issuance and decrement inventory */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'emp_id'               => ['required', 'string'],
            'emp_name'             => ['required', 'string'],
            'issue_date'           => ['required', 'date'],
            'notes'                => ['nullable', 'string', 'max:1000'],
            'items'                => ['required', 'array', 'min:1'],
            'items.*.inventory_id' => ['required', 'integer', 'exists:mdcl_invent,id'],
            'items.*.qty_issued'   => ['required', 'integer', 'min:1'],
        ]);

        try {
            $issuance = $this->service->issue($data, session('emp_data', []));
            return response()->json([
                'message' => 'Issuance recorded successfully.',
                'id'      => $issuance->id,
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
