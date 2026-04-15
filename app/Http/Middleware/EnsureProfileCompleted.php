<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureProfileCompleted
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Hanya berlaku untuk role student
        if (! $user || ! $user->hasRole('student')) {
            return $next($request);
        }

        $mahasiswa = $user->mahasiswa;

        // Jika data mahasiswa belum ada (sinkron gagal) atau data minimal kosong
        // Minimal: Nama, Jenis Kelamin, Telepon, dan Berkas Persyaratan (SOP KKN 56)
        $isComplete = $mahasiswa
            && ! empty($mahasiswa->nama)
            && ! empty($mahasiswa->gender)
            && ! empty($user->phone)
            && ! empty($mahasiswa->health_certificate_path)
            && ! empty($mahasiswa->parent_permission_path);

        $routeName = $request->route()?->getName();
        $allowedRoutes = [
            'profile.show',
            'profile.update',
            'profile.password',
            'logout',
            'student.dashboard', // Dashboard harus bisa diakses untuk menampilkan "Warning"
        ];

        if ($isComplete || in_array($routeName, $allowedRoutes)) {
            return $next($request);
        }

        return redirect()
            ->route('profile.show')
            ->with('warning', 'Mohon lengkapi profil dan unggah berkas persyaratan (Surat Sehat & Izin Orang Tua) sebelum dapat mengakses fitur KKN.');
    }
}
