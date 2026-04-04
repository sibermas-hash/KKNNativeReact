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
                'students' => PesertaKkn::where('status', 'verifikasi_pusat')->count(),
                'groups' => KelompokKkn::count(),
                'locations' => Lokasi::count(),
            ],
            'announcements' => Announcement::active()->orderBy('published_at', 'desc')->take(5)->get(),
            'downloads' => Download::active()->orderBy('created_at', 'desc')->get(),
            'aboutContent' => [
                'about' => SystemSetting::get('site_about', 'Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM) UIN Profesor Kiai Haji Saifuddin Zuhri Purwokerto.'),
                'visi' => SystemSetting::get('site_visi', 'Menjadi pusat unggulan penelitian dan pengabdian masyarakat.'),
                'misi' => SystemSetting::get('site_misi', 'Mengembangkan riset aplikatif.'),
            ],
            'canLogin' => true,
            'canRegister' => true,
        ]);
    }
    public function about()
    {
        return Inertia::render('Public/About', [
            'aboutContent' => [
                'about' => SystemSetting::get('site_about', 'Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM) UIN Profesor Kiai Haji Saifuddin Zuhri Purwokerto.'),
                'visi' => SystemSetting::get('site_visi', 'Menjadi pusat unggulan penelitian dan pengabdian masyarakat.'),
                'misi' => SystemSetting::get('site_misi', 'Mengembangkan riset aplikatif.'),
            ]
        ]);
    }

    public function schemes()
    {
        return Inertia::render('Public/Schemes');
    }

    public function announcements()
    {
        return Inertia::render('Public/Announcements', [
            'announcements' => Announcement::active()->orderBy('published_at', 'desc')->paginate(10)
        ]);
    }

    public function downloads()
    {
        return Inertia::render('Public/Downloads', [
            'downloads' => Download::active()->orderBy('created_at', 'desc')->get()
        ]);
    }
}
