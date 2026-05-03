<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Maatwebsite\Excel\Excel as ExcelExcel;
use PhpOffice\PhpWord\PhpWord;

class DocumentServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Excel Configuration
        $this->app->singleton(ExcelExcel::class, function ($app) {
            return new ExcelExcel(
                $app['files'],
                $app['config']->get('excel.export.', ExcelExcel::CSV),
                $app['config']->get('excel.importer', ExcelExcel::XLSX)
            );
        });

        // PHPWord Configuration
        $this->app->singleton(PhpWord::class, function ($app) {
            return new PhpWord;
        });
    }

    public function boot(): void
    {
        //
    }
}
