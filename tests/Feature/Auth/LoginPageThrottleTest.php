<?php

use Illuminate\Support\Facades\Config;

it('does not aggressively throttle repeated access to the login page from the same ip', function () {
    Config::set('app.env', 'production');
    Config::set('app.debug', false);

    foreach (range(1, 15) as $attempt) {
        $response = $this
            ->withServerVariables(['REMOTE_ADDR' => '10.10.10.10'])
            ->get(route('login'));

        $response->assertOk();
    }
});
