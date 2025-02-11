from django.urls import re_path
# from channels.routing import ProtocolTypeRouter, URLRouter
# from channels.auth import AuthMiddlewareStack
from meet.consumers import MeetingConsumer

from . import consumers

websocket_urlpatterns = [
    re_path(r"^ws/meeting/(?P<room_name>[\w-]+)/$", MeetingConsumer.as_asgi()),
]

# application = ProtocolTypeRouter({
#     "websocket": AuthMiddlewareStack(
#         URLRouter(websocket_urlpatterns)
#     ),
# })
# websocket_urlpatterns = [
#     re_path(r'', consumers.ChatConsumer.as_asgi()),
# ]
