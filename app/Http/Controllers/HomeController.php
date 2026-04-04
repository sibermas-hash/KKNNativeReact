<?php

namespace App\Http\Controllers;

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\Announcement;
use App\Models\KKN\Download;
use App\Models\KKN\SystemSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index()
    {
        return Inertia::render('Home', [
            'stats' => [
                'students' => PesertaKkn::count(),
                'groups' => KelompokKkn::count(),
                'locations' => Lokasi::count(),
            ],
            'announcements' => Announcement::active()->take(5)->get(),
            'aboutContent' => [
                'about' => SystemSetting::get('site_about', 'Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM) UIN Profesor Kiai Haji Saifuddin Zuhri Purwokerto.'),
                'visi' => SystemSetting::get('site_visi', 'Menjadi pusat unggulan penelitian dan pengabdian masyarakat.'),
                'misi' => SystemSetting::get('site_misi', 'Mengembangkan riset aplikatif.'),
            ],
            'canLogin' => true,
            'canRegister' => true,
        ]);
    }
}
