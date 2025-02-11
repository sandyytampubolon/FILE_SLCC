import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator
import meet.routing  # Import routing dari meet

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'slc.settings')

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(meet.routing.websocket_urlpatterns)  # Gunakan routing yang sudah didefinisikan di meet.routing
        ),
    ),
})
