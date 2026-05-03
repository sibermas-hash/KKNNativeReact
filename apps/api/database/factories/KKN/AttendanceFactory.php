<?php

namespace Database\Factories\KKN;

use App\Models\KKN\Attendance;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AttendanceFactory extends Factory
{
    protected $model = Attendance::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'peserta_kkn_id' => PesertaKkn::factory(),
            'kelompok_id' => KelompokKkn::factory(),
            'periode_id' => Periode::factory(),
            'latitude' => $this->faker->latitude(-8, -6),
            'longitude' => $this->faker->longitude(106, 115),
            'accuracy_meters' => 20,
            'timestamp_client' => now(),
            'timestamp_server' => now(),
            'activity_type' => 'absen_masuk',
            'status' => 'pending_verification',
        ];
    }
}
