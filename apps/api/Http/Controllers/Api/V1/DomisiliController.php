<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DomisiliController extends Controller
{
    /**
     * Check domisili status (e.g., for KKN Mandiri)
     * Example: POST /v1/domisili
     */
    public function check(Request $request)
    {
        // Validation example
        $validated = $request->validate([
            'data' => 'required|string',
        ]);
        // Dummy response (replace with actual logic)
        return response()->json([
            'status' => 'ok',
            'data' => $validated['data'],
        ]);
    }

    /**
     * Show domisili detail by ID.
     * Example: GET /v1/domisili/{id}
     */
    public function show($id)
    {
        // Dummy content; replace with model lookup
        return response()->json([
            'id' => $id,
            'information' => 'Domisili detail placeholder',
        ]);
    }
}
