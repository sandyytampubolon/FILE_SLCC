from django.urls import path
from .views import main_view, login, register,dashboard, new_meet, join_meet, meeting_page, personal_info
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', main_view, name='main_view'),
    path('login/', login, name='login'),
    path('register/', register, name='register'),
    path('dashboard/', dashboard, name='dashboard'),
    path('new_meet/', new_meet, name='new_meet'),
    path('join_meet/', join_meet, name='join_meet'),
    path('meeting/<str:room_name>/', meeting_page, name='meeting_page'),
    path('personal_info/', personal_info, name='personal_info'),

]

if settings.DEBUG:  # Only for debug mode
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
