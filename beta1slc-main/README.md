install redis server,
aktifkan redis di poweshell >> redis-server
biarkan berjalan

di terminal vsc:
1. venv\Scripts\activate.bat
2. cd slc
3. pip install -r requirements.txt
4. python manage.py runserver atau daphne -b 0.0.0.0 -p 8000 slc.asgi:application
