# New Laravel + Vue Setup

This repository now includes a sample Laravel backend using MySQL and a Vue frontend for a basic dashboard.

## Backend (Laravel)

- Located in `laravel-app/`
- Configured to use MySQL via `.env`
- Provides an example API route `GET /api/stats`

### Running
```bash
cd laravel-app
composer install
php artisan serve
```

## Frontend (Vue)

- Located in `vue-client/`
- Uses Vue Router for basic navigation

### Running
```bash
cd vue-client
npm install
npm run dev
```

Both applications are independent but can be integrated behind a reverse proxy for smooth navigation.
