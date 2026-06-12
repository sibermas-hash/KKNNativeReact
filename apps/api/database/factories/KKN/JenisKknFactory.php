<?php

namespace Database\Factories\KKN;

use App\Models\KKN\JenisKkn;
use App\Models\KKN\Periode;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<JenisKkn>
 */
class JenisKknFactory extends Factory
{
    protected $model = JenisKkn::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = $this->faker->words(3, true);

        return [
            'code' => strtoupper(substr($name, 0, 3)).$this->faker->numberBetween(10, 99),
            'name' => $name,
            'description' => $this->faker->sentence(),
            'registration_mode' => Periode::REGISTRATION_MODE_OPEN,
            'placement_mode' => Periode::PLACEMENT_MODE_AUTOMATIC_AFTER_APPROVAL,
            'requirements_config' => [
                'min_sks' => 100,
                'min_gpa' => 2.0,
            ],
            'color' => $this->faker->hexColor(),
            'is_active' => true,
            'sort_order' => 0,
        ];
    }
}
