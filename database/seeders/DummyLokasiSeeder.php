<?php

namespace Database\Seeders;

use App\Models\KKN\Lokasi;
use Illuminate\Database\Seeder;

class DummyLokasiSeeder extends Seeder
{
    public function run(): void
    {
        $locations = $this->getLocationsData();

        foreach ($locations as $location) {
            Lokasi::firstOrCreate(
                [
                    'village_code' => $location['village_code'],
                ],
                $location
            );
        }

        $this->command->info('Created '.count($locations).' locations');
    }

    private function getLocationsData(): array
    {
        return [
            // ============================================================
            // KABUPATEN BANJARNEGARA (5 Kecamatan × 5 Desa = 25 Lokasi)
            // ============================================================

            // Kecamatan Banjamegara
            ['village_code' => '3304010001', 'village_name' => 'Banjamegara', 'district_name' => 'Banjamegara', 'regency_name' => 'Banjamegara', 'province_id' => 33, 'regency_id' => 3304, 'district_id' => 330401, 'capacity' => 20],
            ['village_code' => '3304010002', 'village_name' => 'Sokanegara', 'district_name' => 'Banjamegara', 'regency_name' => 'Banjamegara', 'province_id' => 33, 'regency_id' => 3304, 'district_id' => 330401, 'capacity' => 20],
            ['village_code' => '3304010003', 'village_name' => 'Kutasari', 'district_name' => 'Banjamegara', 'regency_name' => 'Banjamegara', 'province_id' => 33, 'regency_id' => 3304, 'district_id' => 330401, 'capacity' => 20],
            ['village_code' => '3304010004', 'village_name' => 'Mędzy', 'district_name' => 'Banjamegara', 'regency_name' => 'Banjamegara', 'province_id' => 33, 'regency_id' => 3304, 'district_id' => 330401, 'capacity' => 20],
            ['village_code' => '3304010005', 'village_name' => 'Serang', 'district_name' => 'Banjamegara', 'regency_name' => 'Banjamegara', 'province_id' => 33, 'regency_id' => 3304, 'district_id' => 330401, 'capacity' => 20],

            // Kecamatan Purwanggan
            ['village_code' => '3304020001', 'village_name' => 'Purwanggan', 'district_name' => 'Purwanggan', 'regency_name' => 'Banjamegara', 'province_id' => 33, 'regency_id' => 3304, 'district_id' => 330402, 'capacity' => 20],
            ['village_code' => '3304020002', 'village_name' => 'Klapa', 'district_name' => 'Purwanggan', 'regency_name' => 'Banjamegara', 'province_id' => 33, 'regency_id' => 3304, 'district_id' => 330402, 'capacity' => 20],
            ['village_code' => '3304020003', 'village_name' => 'Mendolo', 'district_name' => 'Purwanggan', 'regency_name' => 'Banjamegara', 'province_id' => 33, 'regency_id' => 3304, 'district_id' => 330402, 'capacity' => 20],
            ['village_code' => '3304020004', 'village_name' => 'Kutablora', 'district_name' => 'Purwanggan', 'regency_name' => 'Banjamegara', 'province_id' => 33, 'regency_id' => 3304, 'district_id' => 330402, 'capacity' => 20],
            ['village_code' => '3304020005', 'village_name' => 'Susukan', 'district_name' => 'Purwanggan', 'regency_name' => 'Banjamegara', 'province_id' => 33, 'regency_id' => 3304, 'district_id' => 330402, 'capacity' => 20],

            // Kecamatan Mandiraja
            ['village_code' => '3304030001', 'village_name' => 'Mandiraja', 'district_name' => 'Mandiraja', 'regency_name' => 'Banjamegara', 'province_id' => 33, 'regency_id' => 3304, 'district_id' => 330403, 'capacity' => 25],
            ['village_code' => '3304030002', 'village_name' => ' Cimandava', 'district_name' => 'Mandiraja', 'regency_name' => 'Banjamegara', 'province_id' => 33, 'regency_id' => 3304, 'district_id' => 330403, 'capacity' => 25],
            ['village_code' => '3304030003', 'village_name' => 'Panusupan', 'district_name' => 'Mandiraja', 'regency_name' => 'Banjamegara', 'province_id' => 33, 'regency_id' => 3304, 'district_id' => 330403, 'capacity' => 25],
            ['village_code' => '3304030004', 'village_name' => 'Pagersa', 'district_name' => 'Mandiraja', 'regency_name' => 'Banjamegara', 'province_id' => 33, 'regency_id' => 3304, 'district_id' => 330403, 'capacity' => 25],
            ['village_code' => '3304030005', 'village_name' => 'Camping', 'district_name' => 'Mandiraja', 'regency_name' => 'Banjamegara', 'province_id' => 33, 'regency_id' => 3304, 'district_id' => 330403, 'capacity' => 25],

            // Kecamatan Pappallana
            ['village_code' => '3304040001', 'village_name' => 'Pappallana', 'district_name' => 'Pappallana', 'regency_name' => 'Banjamegara', 'province_id' => 33, 'regency_id' => 3304, 'district_id' => 330404, 'capacity' => 20],
            ['village_code' => '3304040002', 'village_name' => 'Sidasari', 'district_name' => 'Pappallana', 'regency_name' => 'Banjamegara', 'province_id' => 33, 'regency_id' => 3304, 'district_id' => 330404, 'capacity' => 20],
            ['village_code' => '3304040003', 'village_name' => 'Gunungmulva', 'district_name' => 'Pappallana', 'regency_name' => 'Banjamegara', 'province_id' => 33, 'regency_id' => 3304, 'district_id' => 330404, 'capacity' => 20],
            ['village_code' => '3304040004', 'village_name' => 'Pasar_Mangu', 'district_name' => 'Pappallana', 'regency_name' => 'Banjamegara', 'province_id' => 33, 'regency_id' => 3304, 'district_id' => 330404, 'capacity' => 20],
            ['village_code' => '3304040005', 'village_name' => 'Karangsari', 'district_name' => 'Pappallana', 'regency_name' => 'Banjamegara', 'province_id' => 33, 'regency_id' => 3304, 'district_id' => 330404, 'capacity' => 20],

            // Kecamatan Rakit
            ['village_code' => '3304050001', 'village_name' => 'Rakit', 'district_name' => 'Rakit', 'regency_name' => 'Banjamegara', 'province_id' => 33, 'regency_id' => 3304, 'district_id' => 330405, 'capacity' => 20],
            ['village_code' => '3304050002', 'village_name' => 'Sumbaga', 'district_name' => 'Rakit', 'regency_name' => 'Banjamegara', 'province_id' => 33, 'regency_id' => 3304, 'district_id' => 330405, 'capacity' => 20],
            ['village_code' => '3304050003', 'village_name' => 'Kutajaya', 'district_name' => 'Rakit', 'regency_name' => 'Banjamegara', 'province_id' => 33, 'regency_id' => 3304, 'district_id' => 330405, 'capacity' => 20],
            ['village_code' => '3304050004', 'village_name' => 'Gondangsari', 'district_name' => 'Rakit', 'regency_name' => 'Banjamegara', 'province_id' => 33, 'regency_id' => 3304, 'district_id' => 330405, 'capacity' => 20],
            ['village_code' => '3304050005', 'village_name' => 'Wanadadi', 'district_name' => 'Rakit', 'regency_name' => 'Banjamegara', 'province_id' => 33, 'regency_id' => 3304, 'district_id' => 330405, 'capacity' => 20],

            // ============================================================
            // KABUPATEN PURBALINGGA (5 Kecamatan × 5 Desa = 25 Lokasi)
            // ============================================================

            // Kecamatan Purbalingga
            ['village_code' => '3305010001', 'village_name' => 'Purbalingga', 'district_name' => 'Purbalingga', 'regency_name' => 'Purbalingga', 'province_id' => 33, 'regency_id' => 3305, 'district_id' => 330501, 'capacity' => 25],
            ['village_code' => '3305010002', 'village_name' => 'Kota_Baru', 'district_name' => 'Purbalingga', 'regency_name' => 'Purbalingga', 'province_id' => 33, 'regency_id' => 3305, 'district_id' => 330501, 'capacity' => 25],
            ['village_code' => '3305010003', 'village_name' => 'Pajom', 'district_name' => 'Purbalingga', 'regency_name' => 'Purbalingga', 'province_id' => 33, 'regency_id' => 3305, 'district_id' => 330501, 'capacity' => 25],
            ['village_code' => '3305010004', 'village_name' => 'Menden', 'district_name' => 'Purbalingga', 'regency_name' => 'Purbalingga', 'province_id' => 33, 'regency_id' => 3305, 'district_id' => 330501, 'capacity' => 25],
            ['village_code' => '3305010005', 'village_name' => 'Kalimanah', 'district_name' => 'Purbalingga', 'regency_name' => 'Purbalingga', 'province_id' => 33, 'regency_id' => 3305, 'district_id' => 330501, 'capacity' => 25],

            // Kecamatan Kemangkon
            ['village_code' => '3305020001', 'village_name' => 'Kemangkon', 'district_name' => 'Kemangkon', 'regency_name' => 'Purbalingga', 'province_id' => 33, 'regency_id' => 3305, 'district_id' => 330502, 'capacity' => 20],
            ['village_code' => '3305020002', 'village_name' => 'Bunar', 'district_name' => 'Kemangkon', 'regency_name' => 'Purbalingga', 'province_id' => 33, 'regency_id' => 3305, 'district_id' => 330502, 'capacity' => 20],
            ['village_code' => '3305020003', 'village_name' => 'Tluwah', 'district_name' => 'Kemangkon', 'regency_name' => 'Purbalingga', 'province_id' => 33, 'regency_id' => 3305, 'district_id' => 330502, 'capacity' => 20],
            ['village_code' => '3305020004', 'village_name' => 'Sringin', 'district_name' => 'Kemangkon', 'regency_name' => 'Purbalingga', 'province_id' => 33, 'regency_id' => 3305, 'district_id' => 330502, 'capacity' => 20],
            ['village_code' => '3305020005', 'village_name' => 'Kutagunung', 'district_name' => 'Kemangkon', 'regency_name' => 'Purbalingga', 'province_id' => 33, 'regency_id' => 3305, 'district_id' => 330502, 'capacity' => 20],

            // Kecamatan Bawang
            ['village_code' => '3305030001', 'village_name' => 'Bawang', 'district_name' => 'Bawang', 'regency_name' => 'Purbalingga', 'province_id' => 33, 'regency_id' => 3305, 'district_id' => 330503, 'capacity' => 20],
            ['village_code' => '3305030002', 'village_name' => 'Binuang', 'district_name' => 'Bawang', 'regency_name' => 'Purbalingga', 'province_id' => 33, 'regency_id' => 3305, 'district_id' => 330503, 'capacity' => 20],
            ['village_code' => '3305030003', 'village_name' => 'Melung', 'district_name' => 'Bawang', 'regency_name' => 'Purbalingga', 'province_id' => 33, 'regency_id' => 3305, 'district_id' => 330503, 'capacity' => 20],
            ['village_code' => '3305030004', 'village_name' => 'Rakitan', 'district_name' => 'Bawang', 'regency_name' => 'Purbalingga', 'province_id' => 33, 'regency_id' => 3305, 'district_id' => 330503, 'capacity' => 20],
            ['village_code' => '3305030005', 'village_name' => 'Karangpandan', 'district_name' => 'Bawang', 'regency_name' => 'Purbalingga', 'province_id' => 33, 'regency_id' => 3305, 'district_id' => 330503, 'capacity' => 20],

            // Kecamatan Bojongsali
            ['village_code' => '3305040001', 'village_name' => 'Bojongsali', 'district_name' => 'Bojongsali', 'regency_name' => 'Purbalingga', 'province_id' => 33, 'regency_id' => 3305, 'district_id' => 330504, 'capacity' => 20],
            ['village_code' => '3305040002', 'village_name' => 'Mudu', 'district_name' => 'Bojongsali', 'regency_name' => 'Purbalingga', 'province_id' => 33, 'regency_id' => 3305, 'district_id' => 330504, 'capacity' => 20],
            ['village_code' => '3305040003', 'village_name' => 'Karangsari', 'district_name' => 'Bojongsali', 'regency_name' => 'Purbalingga', 'province_id' => 33, 'regency_id' => 3305, 'district_id' => 330504, 'capacity' => 20],
            ['village_code' => '3305040004', 'village_name' => 'Bergas', 'district_name' => 'Bojongsali', 'regency_name' => 'Purbalingga', 'province_id' => 33, 'regency_id' => 3305, 'district_id' => 330504, 'capacity' => 20],
            ['village_code' => '3305040005', 'village_name' => 'Siwarso', 'district_name' => 'Bojongsali', 'regency_name' => 'Purbalingga', 'province_id' => 33, 'regency_id' => 3305, 'district_id' => 330504, 'capacity' => 20],

            // Kecamatan Karanglea
            ['village_code' => '3305050001', 'village_name' => 'Karanglea', 'district_name' => 'Karanglea', 'regency_name' => 'Purbalingga', 'province_id' => 33, 'regency_id' => 3305, 'district_id' => 330505, 'capacity' => 20],
            ['village_code' => '3305050002', 'village_name' => 'Karya', 'district_name' => 'Karanglea', 'regency_name' => 'Purbalingga', 'province_id' => 33, 'regency_id' => 3305, 'district_id' => 330505, 'capacity' => 20],
            ['village_code' => '3305050003', 'village_name' => 'Kutasari', 'district_name' => 'Karanglea', 'regency_name' => 'Purbalingga', 'province_id' => 33, 'regency_id' => 3305, 'district_id' => 330505, 'capacity' => 20],
            ['village_code' => '3305050004', 'village_name' => 'Tamiang', 'district_name' => 'Karanglea', 'regency_name' => 'Purbalingga', 'province_id' => 33, 'regency_id' => 3305, 'district_id' => 330505, 'capacity' => 20],
            ['village_code' => '3305050005', 'village_name' => 'Jati', 'district_name' => 'Karanglea', 'regency_name' => 'Purbalingga', 'province_id' => 33, 'regency_id' => 3305, 'district_id' => 330505, 'capacity' => 20],

            // ============================================================
            // KABUPATEN BANYUMAS (5 Kecamatan × 5 Desa = 25 Lokasi)
            // ============================================================

            // Kecamatan Banyumas
            ['village_code' => '3306010001', 'village_name' => 'Banyumas', 'district_name' => 'Banyumas', 'regency_name' => 'Banyumas', 'province_id' => 33, 'regency_id' => 3306, 'district_id' => 330601, 'capacity' => 25],
            ['village_code' => '3306010002', 'village_name' => 'Sumedang', 'district_name' => 'Banyumas', 'regency_name' => 'Banyumas', 'province_id' => 33, 'regency_id' => 3306, 'district_id' => 330601, 'capacity' => 25],
            ['village_code' => '3306010003', 'village_name' => 'Kedunggedang', 'district_name' => 'Banyumas', 'regency_name' => 'Banyumas', 'province_id' => 33, 'regency_id' => 3306, 'district_id' => 330601, 'capacity' => 25],
            ['village_code' => '3306010004', 'village_name' => 'Langsari', 'district_name' => 'Banyumas', 'regency_name' => 'Banyumas', 'province_id' => 33, 'regency_id' => 3306, 'district_id' => 330601, 'capacity' => 25],
            ['village_code' => '3306010005', 'village_name' => 'Sikatinggiri', 'district_name' => 'Banyumas', 'regency_name' => 'Banyumas', 'province_id' => 33, 'regency_id' => 3306, 'district_id' => 330601, 'capacity' => 25],

            // Kecamatan Cilacap
            ['village_code' => '3306020001', 'village_name' => 'Cilacap', 'district_name' => 'Cilacap', 'regency_name' => 'Banyumas', 'province_id' => 33, 'regency_id' => 3306, 'district_id' => 330602, 'capacity' => 20],
            ['village_code' => '3306020002', 'village_name' => 'Ganesha', 'district_name' => 'Cilacap', 'regency_name' => 'Banyumas', 'province_id' => 33, 'regency_id' => 3306, 'district_id' => 330602, 'capacity' => 20],
            ['village_code' => '3306020003', 'village_name' => 'Mertasinga', 'district_name' => 'Cilacap', 'regency_name' => 'Banyumas', 'province_id' => 33, 'regency_id' => 3306, 'district_id' => 330602, 'capacity' => 20],
            ['village_code' => '3306020004', 'village_name' => 'Sumbawa', 'district_name' => 'Cilacap', 'regency_name' => 'Banyumas', 'province_id' => 33, 'regency_id' => 3306, 'district_id' => 330602, 'capacity' => 20],
            ['village_code' => '3306020005', 'village_name' => 'Tambak', 'district_name' => 'Cilacap', 'regency_name' => 'Banyumas', 'province_id' => 33, 'regency_id' => 3306, 'district_id' => 330602, 'capacity' => 20],

            // Kecamatan Patikraja
            ['village_code' => '3306030001', 'village_name' => 'Patikraja', 'district_name' => 'Patikraja', 'regency_name' => 'Banyumas', 'province_id' => 33, 'regency_id' => 3306, 'district_id' => 330603, 'capacity' => 20],
            ['village_code' => '3306030002', 'village_name' => 'Notoreja', 'district_name' => 'Patikraja', 'regency_name' => 'Banyumas', 'province_id' => 33, 'regency_id' => 3306, 'district_id' => 330603, 'capacity' => 20],
            ['village_code' => '3306030003', 'village_name' => 'Karangendah', 'district_name' => 'Patikraja', 'regency_name' => 'Banyumas', 'province_id' => 33, 'regency_id' => 3306, 'district_id' => 330603, 'capacity' => 20],
            ['village_code' => '3306030004', 'village_name' => 'Kedumulyo', 'district_name' => 'Patikraja', 'regency_name' => 'Banyumas', 'province_id' => 33, 'regency_id' => 3306, 'district_id' => 330603, 'capacity' => 20],
            ['village_code' => '3306030005', 'village_name' => 'Kalibagor', 'district_name' => 'Patikraja', 'regency_name' => 'Banyumas', 'province_id' => 33, 'regency_id' => 3306, 'district_id' => 330603, 'capacity' => 20],

            // Kecamatan Sokaraja
            ['village_code' => '3306040001', 'village_name' => 'Sokaraja', 'district_name' => 'Sokaraja', 'regency_name' => 'Banyumas', 'province_id' => 33, 'regency_id' => 3306, 'district_id' => 330604, 'capacity' => 20],
            ['village_code' => '3306040002', 'village_name' => 'Karangnangka', 'district_name' => 'Sokaraja', 'regency_name' => 'Banyumas', 'province_id' => 33, 'regency_id' => 3306, 'district_id' => 330604, 'capacity' => 20],
            ['village_code' => '3306040003', 'village_name' => 'Pativasa', 'district_name' => 'Sokaraja', 'regency_name' => 'Banyumas', 'province_id' => 33, 'regency_id' => 3306, 'district_id' => 330604, 'capacity' => 20],
            ['village_code' => '3306040004', 'village_name' => 'Somakati', 'district_name' => 'Sokaraja', 'regency_name' => 'Banyumas', 'province_id' => 33, 'regency_id' => 3306, 'district_id' => 330604, 'capacity' => 20],
            ['village_code' => '3306040005', 'village_name' => 'Kalikesur', 'district_name' => 'Sokaraja', 'regency_name' => 'Banyumas', 'province_id' => 33, 'regency_id' => 3306, 'district_id' => 330604, 'capacity' => 20],

            // Kecamatan Ajibarang
            ['village_code' => '3306050001', 'village_name' => 'Ajibarang', 'district_name' => 'Ajibarang', 'regency_name' => 'Banyumas', 'province_id' => 33, 'regency_id' => 3306, 'district_id' => 330605, 'capacity' => 25],
            ['village_code' => '3306050002', 'village_name' => 'Cibuncong', 'district_name' => 'Ajibarang', 'regency_name' => 'Banyumas', 'province_id' => 33, 'regency_id' => 3306, 'district_id' => 330605, 'capacity' => 25],
            ['village_code' => '3306050003', 'village_name' => 'Gumelar', 'district_name' => 'Ajibarang', 'regency_name' => 'Banyumas', 'province_id' => 33, 'regency_id' => 3306, 'district_id' => 330605, 'capacity' => 25],
            ['village_code' => '3306050004', 'village_name' => 'Candisari', 'district_name' => 'Ajibarang', 'regency_name' => 'Banyumas', 'province_id' => 33, 'regency_id' => 3306, 'district_id' => 330605, 'capacity' => 25],
            ['village_code' => '3306050005', 'village_name' => 'Taman', 'district_name' => 'Ajibarang', 'regency_name' => 'Banyumas', 'province_id' => 33, 'regency_id' => 3306, 'district_id' => 330605, 'capacity' => 25],

            // ============================================================
            // KABUPATEN CILACAP (5 Kecamatan × 5 Desa = 25 Lokasi)
            // ============================================================

            // Kecamatan Cilacap Utara
            ['village_code' => '3307010001', 'village_name' => 'Cilacap', 'district_name' => 'Cilacap Utara', 'regency_name' => 'Cilacap', 'province_id' => 33, 'regency_id' => 3307, 'district_id' => 330701, 'capacity' => 25],
            ['village_code' => '3307010002', 'village_name' => 'Tambak', 'district_name' => 'Cilacap Utara', 'regency_name' => 'Cilacap', 'province_id' => 33, 'regency_id' => 3307, 'district_id' => 330701, 'capacity' => 25],
            ['village_code' => '3307010003', 'village_name' => 'Gumarang', 'district_name' => 'Cilacap Utara', 'regency_name' => 'Cilacap', 'province_id' => 33, 'regency_id' => 3307, 'district_id' => 330701, 'capacity' => 25],
            ['village_code' => '3307010004', 'village_name' => 'Sidakaton', 'district_name' => 'Cilacap Utara', 'regency_name' => 'Cilacap', 'province_id' => 33, 'regency_id' => 3307, 'district_id' => 330701, 'capacity' => 25],
            ['village_code' => '3307010005', 'village_name' => 'Trisonop', 'district_name' => 'Cilacap Utara', 'regency_name' => 'Cilacap', 'province_id' => 33, 'regency_id' => 3307, 'district_id' => 330701, 'capacity' => 25],

            // Kecamatan Cilacap Selatan
            ['village_code' => '3307020001', 'village_name' => 'Cilacap', 'district_name' => 'Cilacap Selatan', 'regency_name' => 'Cilacap', 'province_id' => 33, 'regency_id' => 3307, 'district_id' => 330702, 'capacity' => 20],
            ['village_code' => '3307020002', 'village_name' => 'Ren', 'district_name' => 'Cilacap Selatan', 'regency_name' => 'Cilacap', 'province_id' => 33, 'regency_id' => 3307, 'district_id' => 330702, 'capacity' => 20],
            ['village_code' => '3307020003', 'village_name' => 'P揭瑰', 'district_name' => 'Cilacap Selatan', 'regency_name' => 'Cilacap', 'province_id' => 33, 'regency_id' => 3307, 'district_id' => 330702, 'capacity' => 20],
            ['village_code' => '3307020004', 'village_name' => 'Bulu', 'district_name' => 'Cilacap Selatan', 'regency_name' => 'Cilacap', 'province_id' => 33, 'regency_id' => 3307, 'district_id' => 330702, 'capacity' => 20],
            ['village_code' => '3307020005', 'village_name' => 'Sidanu', 'district_name' => 'Cilacap Selatan', 'regency_name' => 'Cilacap', 'province_id' => 33, 'regency_id' => 3307, 'district_id' => 330702, 'capacity' => 20],

            // Kecamatan Maos
            ['village_code' => '3307030001', 'village_name' => 'Maos', 'district_name' => 'Maos', 'regency_name' => 'Cilacap', 'province_id' => 33, 'regency_id' => 3307, 'district_id' => 330703, 'capacity' => 20],
            ['village_code' => '3307030002', 'village_name' => 'Gosari', 'district_name' => 'Maos', 'regency_name' => 'Cilacap', 'province_id' => 33, 'regency_id' => 3307, 'district_id' => 330703, 'capacity' => 20],
            ['village_code' => '3307030003', 'village_name' => 'Kamudiningrat', 'district_name' => 'Maos', 'regency_name' => 'Cilacap', 'province_id' => 33, 'regency_id' => 3307, 'district_id' => 330703, 'capacity' => 20],
            ['village_code' => '3307030004', 'village_name' => 'Javantaka', 'district_name' => 'Maos', 'regency_name' => 'Cilacap', 'province_id' => 33, 'regency_id' => 3307, 'district_id' => 330703, 'capacity' => 20],
            ['village_code' => '3307030005', 'village_name' => 'Pepas', 'district_name' => 'Maos', 'regency_name' => 'Cilacap', 'province_id' => 33, 'regency_id' => 3307, 'district_id' => 330703, 'capacity' => 20],

            // Kecamatan Kroya
            ['village_code' => '3307040001', 'village_name' => 'Kroya', 'district_name' => 'Kroya', 'regency_name' => 'Cilacap', 'province_id' => 33, 'regency_id' => 3307, 'district_id' => 330704, 'capacity' => 20],
            ['village_code' => '3307040002', 'village_name' => 'Kretek', 'district_name' => 'Kroya', 'regency_name' => 'Cilacap', 'province_id' => 33, 'regency_id' => 3307, 'district_id' => 330704, 'capacity' => 20],
            ['village_code' => '3307040003', 'village_name' => 'Mutih', 'district_name' => 'Kroya', 'regency_name' => 'Cilacap', 'province_id' => 33, 'regency_id' => 3307, 'district_id' => 330704, 'capacity' => 20],
            ['village_code' => '3307040004', 'village_name' => 'Jati', 'district_name' => 'Kroya', 'regency_name' => 'Cilacap', 'province_id' => 33, 'regency_id' => 3307, 'district_id' => 330704, 'capacity' => 20],
            ['village_code' => '3307040005', 'village_name' => 'Wlahar', 'district_name' => 'Kroya', 'regency_name' => 'Cilacap', 'province_id' => 33, 'regency_id' => 3307, 'district_id' => 330704, 'capacity' => 20],

            // Kecamatan Sidareja
            ['village_code' => '3307050001', 'village_name' => 'Sidareja', 'district_name' => 'Sidareja', 'regency_name' => 'Cilacap', 'province_id' => 33, 'regency_id' => 3307, 'district_id' => 330705, 'capacity' => 20],
            ['village_code' => '3307050002', 'village_name' => 'Cipikasa', 'district_name' => 'Sidareja', 'regency_name' => 'Cilacap', 'province_id' => 33, 'regency_id' => 3307, 'district_id' => 330705, 'capacity' => 20],
            ['village_code' => '3307050003', 'village_name' => 'Panibulat', 'district_name' => 'Sidareja', 'regency_name' => 'Cilacap', 'province_id' => 33, 'regency_id' => 3307, 'district_id' => 330705, 'capacity' => 20],
            ['village_code' => '3307050004', 'village_name' => 'Pangadegan', 'district_name' => 'Sidareja', 'regency_name' => 'Cilacap', 'province_id' => 33, 'regency_id' => 3307, 'district_id' => 330705, 'capacity' => 20],
            ['village_code' => '3307050005', 'village_name' => 'Girimaya', 'district_name' => 'Sidareja', 'regency_name' => 'Cilacap', 'province_id' => 33, 'regency_id' => 3307, 'district_id' => 330705, 'capacity' => 20],

            // ============================================================
            // KABUPATEN KEBUMEN (5 Kecamatan × 5 Desa = 25 Lokasi)
            // ============================================================

            // Kecamatan Kebumen
            ['village_code' => '3308010001', 'village_name' => 'Kebumen', 'district_name' => 'Kebumen', 'regency_name' => 'Kebumen', 'province_id' => 33, 'regency_id' => 3308, 'district_id' => 330801, 'capacity' => 25],
            ['village_code' => '3308010002', 'village_name' => 'Mujan', 'district_name' => 'Kebumen', 'regency_name' => 'Kebumen', 'province_id' => 33, 'regency_id' => 3308, 'district_id' => 330801, 'capacity' => 25],
            ['village_code' => '3308010003', 'village_name' => 'Selotumpeng', 'district_name' => 'Kebumen', 'regency_name' => 'Kebumen', 'province_id' => 33, 'regency_id' => 3308, 'district_id' => 330801, 'capacity' => 25],
            ['village_code' => '3308010004', 'village_name' => 'Jatian', 'district_name' => 'Kebumen', 'regency_name' => 'Kebumen', 'province_id' => 33, 'regency_id' => 3308, 'district_id' => 330801, 'capacity' => 25],
            ['village_code' => '3308010005', 'village_name' => 'Bongkop', 'district_name' => 'Kebumen', 'regency_name' => 'Kebumen', 'province_id' => 33, 'regency_id' => 3308, 'district_id' => 330801, 'capacity' => 25],

            // Kecamatan Gombong
            ['village_code' => '3308020001', 'village_name' => 'Gombong', 'district_name' => 'Gombong', 'regency_name' => 'Kebumen', 'province_id' => 33, 'regency_id' => 3308, 'district_id' => 330802, 'capacity' => 20],
            ['village_code' => '3308020002', 'village_name' => 'Wonokriyo', 'district_name' => 'Gombong', 'regency_name' => 'Kebumen', 'province_id' => 33, 'regency_id' => 3308, 'district_id' => 330802, 'capacity' => 20],
            ['village_code' => '3308020003', 'village_name' => 'Jatiharjo', 'district_name' => 'Gombong', 'regency_name' => 'Kebumen', 'province_id' => 33, 'regency_id' => 3308, 'district_id' => 330802, 'capacity' => 20],
            ['village_code' => '3308020004', 'village_name' => 'Kalanglindu', 'district_name' => 'Gombong', 'regency_name' => 'Kebumen', 'province_id' => 33, 'regency_id' => 3308, 'district_id' => 330802, 'capacity' => 20],
            ['village_code' => '3308020005', 'village_name' => 'Sitirejo', 'district_name' => 'Gombong', 'regency_name' => 'Kebumen', 'province_id' => 33, 'regency_id' => 3308, 'district_id' => 330802, 'capacity' => 20],

            // Kecamatan Ayah
            ['village_code' => '3308030001', 'village_name' => 'Ayah', 'district_name' => 'Ayah', 'regency_name' => 'Kebumen', 'province_id' => 33, 'regency_id' => 3308, 'district_id' => 330803, 'capacity' => 20],
            ['village_code' => '3308030002', 'village_name' => 'Klumpr', 'district_name' => 'Ayah', 'regency_name' => 'Kebumen', 'province_id' => 33, 'regency_id' => 3308, 'district_id' => 330803, 'capacity' => 20],
            ['village_code' => '3308030003', 'village_name' => 'Wanil', 'district_name' => 'Ayah', 'regency_name' => 'Kebumen', 'province_id' => 33, 'regency_id' => 3308, 'district_id' => 330803, 'capacity' => 20],
            ['village_code' => '3308030004', 'village_name' => 'Kedungmoro', 'district_name' => 'Ayah', 'regency_name' => 'Kebumen', 'province_id' => 33, 'regency_id' => 3308, 'district_id' => 330803, 'capacity' => 20],
            ['village_code' => '3308030005', 'village_name' => 'Sempor', 'district_name' => 'Ayah', 'regency_name' => 'Kebumen', 'province_id' => 33, 'regency_id' => 3308, 'district_id' => 330803, 'capacity' => 20],

            // Kecamatan Sempor
            ['village_code' => '3308040001', 'village_name' => 'Semang', 'district_name' => 'Sempor', 'regency_name' => 'Kebumen', 'province_id' => 33, 'regency_id' => 3308, 'district_id' => 330804, 'capacity' => 20],
            ['village_code' => '3308040002', 'village_name' => 'Gema', 'district_name' => 'Sempor', 'regency_name' => 'Kebumen', 'province_id' => 33, 'regency_id' => 3308, 'district_id' => 330804, 'capacity' => 20],
            ['village_code' => '3308040003', 'village_name' => 'Taman_Wisnu', 'district_name' => 'Sempor', 'regency_name' => 'Kebumen', 'province_id' => 33, 'regency_id' => 3308, 'district_id' => 330804, 'capacity' => 20],
            ['village_code' => '3308040004', 'village_name' => 'Kalibaru', 'district_name' => 'Sempor', 'regency_name' => 'Kebumen', 'province_id' => 33, 'regency_id' => 3308, 'district_id' => 330804, 'capacity' => 20],
            ['village_code' => '3308040005', 'village_name' => 'Purwasari', 'district_name' => 'Sempor', 'regency_name' => 'Kebumen', 'province_id' => 33, 'regency_id' => 3308, 'district_id' => 330804, 'capacity' => 20],

            // Kecamatan Buluspesantr
            ['village_code' => '3308050001', 'village_name' => 'Buluspesantr', 'district_name' => 'Buluspesantr', 'regency_name' => 'Kebumen', 'province_id' => 33, 'regency_id' => 3308, 'district_id' => 330805, 'capacity' => 20],
            ['village_code' => '3308050002', 'village_name' => 'Wonutama', 'district_name' => 'Buluspesantr', 'regency_name' => 'Kebumen', 'province_id' => 33, 'regency_id' => 3308, 'district_id' => 330805, 'capacity' => 20],
            ['village_code' => '3308050003', 'village_name' => 'Harjowinangun', 'district_name' => 'Buluspesantr', 'regency_name' => 'Kebumen', 'province_id' => 33, 'regency_id' => 3308, 'district_id' => 330805, 'capacity' => 20],
            ['village_code' => '3308050004', 'village_name' => 'Tanjung', 'district_name' => 'Buluspesantr', 'regency_name' => 'Kebumen', 'province_id' => 33, 'regency_id' => 3308, 'district_id' => 330805, 'capacity' => 20],
            ['village_code' => '3308050005', 'village_name' => 'Lubang', 'district_name' => 'Buluspesantr', 'regency_name' => 'Kebumen', 'province_id' => 33, 'regency_id' => 3308, 'district_id' => 330805, 'capacity' => 20],
        ];
    }
}
