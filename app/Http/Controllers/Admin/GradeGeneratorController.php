<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class GradeGeneratorController extends Controller
{
    public function index(): Response
    {
        // Standalone tool; no database dependencies
        return Inertia::render('Admin/GradeGenerator/Index');
    }
}
