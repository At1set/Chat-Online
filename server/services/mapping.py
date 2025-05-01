def mapRoom(room: dict):
  dto = {
    "id": room["id"],
    "name": room["name"],
    "author": room["author"],
    "users": room["users"],
    "private": True if room.get("password") else False
  }
  return dto

def mapMessage(message: dict):
  dto = {
    "date": message["date"],
    "author": message["author"],
    "content": message["content"]
  }
  return dto