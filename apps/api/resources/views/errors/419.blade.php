@extends('errors.layout')

@section('title', 'Sesi Berakhir')

@section('icon')
<svg class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
@endsection

@section('heading', 'Sesi Berakhir')

@section('message', 'Sesi Anda telah berakhir karena terlalu lama tidak ada aktivitas. Silakan muat ulang halaman atau login kembali.')
