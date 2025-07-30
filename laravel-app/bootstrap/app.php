<?php
use Illuminate\Foundation\Application;

return Application::configure()
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        health: '/up'
    )
    ->create();
