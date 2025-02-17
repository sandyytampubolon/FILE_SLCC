from django.urls import path
from . import views
from .views import main, login, register, dashboard, new_meet, join_meet, meeting_page, personal_info
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', views.main, name='main'),
    path('login/', views.login, name='login'),
    path('register/', views.register, name='register'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('new_meet/', views.new_meet, name='new_meet'),
    path('join_meet/', views.join_meet, name='join_meet'),
    path('meeting/<str:room_name>/', views.meeting_page, name='meeting_page'),
    path('personal_info/', views.personal_info, name='personal_info'),
]
if settings.DEBUG:  # Only for debug mode
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)