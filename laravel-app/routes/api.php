<?php
use Illuminate\Support\Facades\Route;

Route::get('/stats', function () {
    return response()->json([
        'contracts' => 10,
        'payments_due' => 2,
        'expenses' => 1000
    ]);
});
