from fastapi import FastAPI, Query, Request, HTTPException, Response
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

import asyncio
import uuid

from services.mapping import mapMessage, mapRoom
from datetime import datetime

app = FastAPI()

app.add_middleware(
  CORSMiddleware,
  allow_origins=["http:192.168.0.132:8000", "http://localhost:8000"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

rooms = []
messages = {}

rooms_subscribers: list[asyncio.Future] = []
room_subscribers: dict[str, list[asyncio.Future]] = {}


@app.get("/")
async def rootPage():
  return FileResponse("../client/src/dist/pages/index.html")


@app.get("/login")
async def get_loginPage():
  return FileResponse("../client/src/dist/pages/login.html")


@app.get("/rooms")
async def get_roomsPage():
  return FileResponse("../client/src/dist/pages/rooms.html")


@app.get("/rooms")
@app.get("/rooms/{room_id}")
async def get_chatPage():
  return FileResponse("../client/src/dist/pages/chat.html")


@app.get("/api/rooms/{room_id}/connect")
async def get_messages(room_id: str, password: str = Query(None, min_length=3, description="Пароль от комнаты, если она приватная"), user_name: str = Query(None, description="Логин")):
  if (not user_name): return JSONResponse({"error": "query param user_name missing"}, status_code=400)

  room = next((room for room in rooms if room["id"] == room_id), None)
  if not room:
    return JSONResponse({"error": "The room with this id does not exist"}, status_code=404)
  
  if room.get("password"):
    if (not password): return JSONResponse({"error": "query param password missing"}, status_code=400)
    if room["password"] != password: return JSONResponse({"error": "Invalid password"}, status_code=403)
  
  if (user_name not in room["users"]):
    room["users"].append(user_name)
    await notify_room_subscribers(room_id, JSONResponse({
      "changed_field": "users",
      "action": "add",
      "data": user_name
    }, status_code=200))

  return Response(status_code=200)


@app.get("/api/rooms/{room_id}/messages")
async def get_messages(room_id: str, password: str = Query(None, min_length=3, description="Пароль от комнаты, если она приватная"), user_name: str = Query(None, description="Логин")):
  if (not user_name): return JSONResponse({"error": "query param user_name missing"}, status_code=400)

  room = next((room for room in rooms if room["id"] == room_id), None)
  if not room:
    return JSONResponse({"error": "The room with this id does not exist"}, status_code=404)
  
  if room.get("password"):
    if (not password): return JSONResponse({"error": "query param password missing"}, status_code=400)
    if room["password"] != password: return JSONResponse({"error": "Invalid password"}, status_code=403)
  
  if (not user_name in room["users"]):
    return JSONResponse({"error": "You are not a member of this room"}, status_code=401)
  
  return messages.get(room_id, [])


@app.post("/api/rooms/{room_id}/messages")
async def post_messages(request: Request, room_id: str, password: str = Query(None, min_length=3, description="Пароль от комнаты, если она приватная"), user_name: str = Query(None, description="Логин")):
  if (not user_name): return JSONResponse({"error": "query param user_name missing"}, status_code=400)

  room = next((room for room in rooms if room["id"] == room_id), None)
  if not room:
    return JSONResponse({"error": "The room with this id does not exist"}, status_code=404)
  
  if room.get("password"):
    if (not password): return JSONResponse({"error": "query param password missing"}, status_code=400)
    if room["password"] != password: return JSONResponse({"error": "Invalid password"}, status_code=403)
  
  if (not user_name in room["users"]):
    return JSONResponse({"error": "You are not a member of this room"}, status_code=401)
  
  try:
    try:
      data = await request.json()
    except:
      return JSONResponse({"error": "Invalid JSON format"}, status_code=400)
    author, content = tryGetRequestFields(data, ["author", "content"])

    newMessage = {
      "author": author,
      "content": content,
      "date": datetime.now().isoformat()
    }

    messages[room_id].append(newMessage)

    await notify_room_subscribers(room_id, JSONResponse({
      "changed_field": "messages",
      "action": "add",
      "data": mapMessage(newMessage)
    }, status_code=200))
    return JSONResponse(newMessage, status_code=201)
  except Exception as e:
    print(e)
    if (not isinstance(e, HTTPException)): raise HTTPException(status_code=500, detail=str(e))
    raise e


@app.get("/api/rooms/{room_id}/update")
async def update_messages(room_id: str, password: str = Query(None, min_length=3, description="Пароль от комнаты, если она приватная"), user_name: str = Query(None, description="Логин")):
  if (not user_name): return JSONResponse({"error": "query param user_name missing"}, status_code=400)

  room = next((room for room in rooms if room["id"] == room_id), None)
  if not room:
    return JSONResponse({"error": "The room with this id does not exist"}, status_code=404)

  if room.get("password"):
    if (not password): return JSONResponse({"error": "query param password missing"}, status_code=400)
    if room["password"] != password: return JSONResponse({"error": "Invalid password"}, status_code=403)

  if (not user_name in room["users"]):
    return JSONResponse({"error": "You are not a member of this room"}, status_code=401)

  loop = asyncio.get_event_loop()
  future = loop.create_future()

  if room_id not in room_subscribers:
    room_subscribers[room_id] = []

  room_subscribers[room_id].append(future)

  try:
    data = await asyncio.wait_for(future, timeout=15)
    return data
  except asyncio.TimeoutError:
    return Response(status_code=204)
  finally:
    if future in room_subscribers[room_id]:
      room_subscribers[room_id].remove(future)


@app.get("/api/rooms")
async def get_rooms():
  sendingData = list(map(mapRoom, rooms))
  return sendingData


@app.get("/api/update-rooms")
async def update_rooms():
  loop = asyncio.get_event_loop()
  future = loop.create_future()
  rooms_subscribers.append(future)

  try:
    data = await asyncio.wait_for(future, timeout=15)
    return data
  except asyncio.TimeoutError:
    return Response(status_code=204)
  finally:
    if future in rooms_subscribers:
      rooms_subscribers.remove(future)


@app.post("/api/create-room")
async def create_room(request: Request):
  try:
    try:
      data = await request.json()
    except:
      return JSONResponse({"error": "Invalid JSON format"}, status_code=400)
    name, author, password = tryGetRequestFields(data, ["name", "author", "password?"])
    
    unique_id = str(uuid.uuid4().int)

    new_room = {
      "id": unique_id,
      "name": name,
      "author": author,
      "users": [author]
    }
    messages[unique_id] = []
    if (password): new_room["password"] = password

    # Проверяем, существует ли уже комната с таким же именем
    if any(room['name'] == name and room["author"] == author for room in rooms):
      return JSONResponse({"error": "Комната уже существует"}, status_code=400)
    rooms.append(new_room)

    await notify_rooms_subscribers(JSONResponse({
      "changed_field": "rooms",
      "action": "add",
      "data": mapRoom(new_room)
    }, status_code=200))
    return JSONResponse(new_room, status_code=201)
  except Exception as e:
    if (not isinstance(e, HTTPException)): raise HTTPException(status_code=500, detail=str(e))
    raise e


async def notify_rooms_subscribers(data):
  for future in rooms_subscribers:
    if not future.done():
      future.set_result(data)
  rooms_subscribers.clear()

async def notify_room_subscribers(room_id: str, data):
    subscribers = room_subscribers.get(room_id, [])
    for future in subscribers:
      if not future.done():
        future.set_result(data)
    room_subscribers[room_id] = []

def tryGetRequestFields(object: dict, fields_list : list[str]):
  result = []
  fields = object.keys()
  for key in fields_list:
    isOptionalField = False

    if key[-1] == "?": 
      key = key[:-1]
      isOptionalField = True
    
    if not isOptionalField and not key in fields:
      raise HTTPException(status_code=400, detail=f"Missing field {key}")
    result.append(object.get(key))
  return result


app.mount("/", StaticFiles(directory="../client/src/dist"), name="static")