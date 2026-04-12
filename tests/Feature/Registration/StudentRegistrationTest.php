<?php

namespace Tests\Feature\Registration;

use App\Models\Periode;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentRegistrationTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function students_can_access_registration_page(): void
    {
        $user = User::factory()->create();
        $periode = Periode::factory()->create(['is_active' => true]);

        $response = $this->actingAs($user)->get('/student/register');

        $response->assertSuccessful();
    }

    /** @test */
    public function students_cannot_register_without_authentication(): void
    {
        $response = $this->get('/student/register');

        $response->assertRedirect('/login');
    }

    /** @test */
    public function registration_requires_valid_data(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/student/register', [
            'periode_id' => 999, // Non-existent
        ]);

        $response->assertStatus(422);
    }
}
