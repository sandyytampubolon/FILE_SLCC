import json
from channels.generic.websocket import AsyncWebsocketConsumer

class MeetingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'meeting_{self.room_name}'

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        print(f"WebSocket connected to room: {self.room_name}")

    async def disconnect(self, close_code):
        # Leave room group
        print(f"WebSocket disconnected from room: {self.room_name}")
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """ Menerima pesan dari WebSocket dan meneruskannya ke channel layer """
        data = json.loads(text_data)
        message_type = data.get("type")

        if message_type == "offer":
            await self.channel_layer.group_send(
                self.room_group_name, 
                {"type": "webrtc.offer", "offer": data["offer"], "from": self.channel_name}
            )

        elif message_type == "answer":
            await self.channel_layer.group_send(
                self.room_group_name, 
                {"type": "webrtc.answer", "answer": data["answer"], "from": self.channel_name}
            )

        elif message_type == "ice-candidate":
            await self.channel_layer.group_send(
                self.room_group_name, 
                {"type": "webrtc.ice_candidate", "candidate": data["candidate"], "from": self.channel_name}
            )

        elif message_type == "chat_message":
            await self.channel_layer.group_send(
                self.room_group_name, 
                {"type": "chat.message", "message": data["message"]}
            )

    async def webrtc_offer(self, event):
        """ Mengirimkan offer ke peer """
        await self.send(text_data=json.dumps({
            "type": "offer",
            "offer": event["offer"],
            "from": event["from"]
        }))

    async def webrtc_answer(self, event):
        """ Mengirimkan answer ke peer """
        await self.send(text_data=json.dumps({
            "type": "answer",
            "answer": event["answer"],
            "from": event["from"]
        }))

    async def webrtc_ice_candidate(self, event):
        """ Mengirimkan ICE Candidate ke peer """
        await self.send(text_data=json.dumps({
            "type": "ice-candidate",
            "candidate": event["candidate"],
            "from": event["from"]
        }))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "chat_message",
            "message": event["message"]
        }))
