from fastapi import FastAPI, Request, HTTPException, Response
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

import asyncio
import uuid

app = FastAPI()

app.add_middleware(
  CORSMiddleware,
  allow_origins=["http:192.168.0.132:8000"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

rooms = []
pending_requests: list[asyncio.Future] = []


@app.get("/")
async def root():
  return FileResponse("../client/src/dist/pages/index.html")


@app.get("/login")
async def root():
  return FileResponse("../client/src/dist/pages/login.html")

@app.get("/rooms")
async def root():
  return FileResponse("../client/src/dist/pages/rooms.html")


@app.get("/chat")
@app.get("/chat/{chat_id}")
async def root():
  return FileResponse("../client/src/dist/pages/chat.html")


@app.get("/chat/{chat_id}/messages")
async def root(chat_id: str):
  print(chat_id)
  return None


@app.get("/api/rooms")
async def get_rooms():
  return rooms


@app.get("/api/update-rooms")
async def update_rooms():
  loop = asyncio.get_event_loop()
  future = loop.create_future()
  pending_requests.append(future)

  try:
    data = await asyncio.wait_for(future, timeout=15)
    return data
  except asyncio.TimeoutError:
    return Response(status_code=204)
  finally:
    if future in pending_requests:
      pending_requests.remove(future)


@app.post("/api/create-room")
async def create_room(request: Request):
  try:
    data = await request.json()
    name, author = tryGetObjectFields(data, ["name", "author"])
    
    unique_id = str(uuid.uuid4().int)

    new_room = {
      "id": unique_id,
      "name": name,
      "author": author
    }

    # Проверяем, существует ли уже комната с таким же именем
    if any(room['name'] == name and room["author"] == author for room in rooms):
      return JSONResponse({"error": "Комната уже существует"}, status_code=400)
    rooms.append(new_room)

    await notify_subscribers(new_room)
    return JSONResponse(new_room, status_code=201)
  except Exception as e:
    if (not isinstance(e, HTTPException)): raise HTTPException(status_code=500, detail=str(e))
    raise e


async def notify_subscribers(data):
  for future in pending_requests:
    if not future.done():
      future.set_result(data)
  pending_requests.clear()


def tryGetObjectFields(object: dict, fields_list : list):
  result = []
  fields = object.keys()
  for key in fields_list:
    if not key in fields: raise HTTPException(status_code=400, detail=f"Missing field {key}")
    else: result.append(object[key])
  return result


app.mount("/", StaticFiles(directory="../client/src/dist"), name="static")