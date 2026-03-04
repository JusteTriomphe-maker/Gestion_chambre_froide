<?php

use Laravel\Sanctum\Sanctum;

return [

    /*
    |--------------------------------------------------------------------------
    | Stateful Domains
    |--------------------------------------------------------------------------
    |
    | This option will configure which domain(s) the SPA can make API calls to.
    | For security purposes, you should configure these as an array of domain
    | names that you would like to allow requests to originate from.
    |
    */

    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
        '%s%s',
        'localhost,localhost:3000,localhost:5173,127.0.0.1,127.0.0.1:8000,127.0.0.1:3000,127.0.0.1:5173,::1',
        env('APP_URL') ? ',' . parse_url(env('APP_URL'), PHP_URL_HOST) : ''
    ))),

    /*
    |--------------------------------------------------------------------------
    | Sanctum Guards
    |--------------------------------------------------------------------------
    |
    | This option controls the guards that will be used to authenticate users of
    | the application. The "personal" guard is the default for Sanctum.
    |
    */

    'guard' => ['web'],

    /*
    |--------------------------------------------------------------------------
    | Expiration Minutes
    |--------------------------------------------------------------------------
    |
    | This option controls the number of minutes until an issued token will be
    | considered expired. If this value is null, personal access tokens do
    | not expire. This should not be changed unless you're sure about it.
    |
    */

    'expiration' => null,

    /*
    |--------------------------------------------------------------------------
    | Token Prefix
    |--------------------------------------------------------------------------
    |
    | Sanctum can prefix new tokens in order to take advantage of numerous
    | security scanning services that scan APIs for leaked token prefixes.
    |
    */

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    /*
    |--------------------------------------------------------------------------
    | Middleware
    |--------------------------------------------------------------------------
    |
    | This option will add the middleware to the api routes in your application.
    |
    */

    'middleware' => \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,

];
