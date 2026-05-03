<?php

/*
|--------------------------------------------------------------------------
| DPL Routes — DEPRECATED
|--------------------------------------------------------------------------
|
| Semua rute DPL telah dipindahkan ke routes/dosen.php
| dengan prefix /dosen. File ini dikosongkan untuk backward compatibility.
|
| Redirect /dpl → /dosen agar URL lama tetap berfungsi.
|
*/

use Illuminate\Support\Facades\Route;

Route::get('dpl/{any?}', function () {
    return redirect('/dosen');
})->where('any', '.*');
