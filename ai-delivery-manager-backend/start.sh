#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo ">>> Running migrations..."
python manage.py migrate --noinput

echo ">>> Seeding demo data..."
python manage.py seed_workboard
python manage.py augment_workboard

echo ">>> Starting server..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2
