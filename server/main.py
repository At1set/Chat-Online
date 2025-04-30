from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
from urllib.parse import parse_qs, urlparse

PORT = 8000

mimeTypes = {
  'html': 'text/html; charset=utf-8',
  'css': 'text/css',
  'js': 'text/javascript',
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'gif': 'image/gif',
  'svg': 'image/svg+xml',
  'ico': 'image/x-icon',
  'json': 'application/json',
  'mp3': 'audio/mpeg',
  'mp4': 'video/mp4',
  'txt': 'text/plain; charset=utf-8',
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'woff': 'application/font-woff',
  'woff2': 'application/font-woff2',
  'ttf': 'application/font-ttf',
  'eot': 'application/vnd.ms-fontobject',
  'otf': 'application/font-otf',
  'swf': 'application/x-shockwave-flash',
  'wasm': 'application/wasm',
}

rooms_subscribers = []
rooms = []
messages = {}

class MyRequestHandler(BaseHTTPRequestHandler):
  cached = {
    "files": {}
  }

  def do_GET(self):
    parsed_url = urlparse(self.path)  # Разбираем путь
    URL = parsed_url.path
    query_params = parse_qs(parsed_url.query)
    print(URL)

    match URL:
      case "/":
        return self.send_file("../client/src/dist/index.html")
      case "/get-rooms":
        return self.response_json(rooms)
      case "/update-rooms":
        rooms_subscribers.append(self)
      case _:
        file_extension = os.path.splitext(URL)[1].lower().replace(".", "", 1)
        if (file_extension in mimeTypes.keys()): self.send_file(URL)
        else:
          print("error")
          self.send_error(404, "Not Found")

  def do_POST(self):
    parsed_url = urlparse(self.path)  # Разбираем путь
    URL = parsed_url.path
    query_params = parse_qs(parsed_url.query)
    print(URL)

    match URL:
      case "/create-room":
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)

        try:
          data = json.loads(body.decode('utf-8'))
          if not data.get("name"):
            return self.error_json(400, "Missing room name")

          new_room = {"name": data["name"]}
          rooms.append(new_room)
          self.response_json(new_room, 201)
          return self.emit_subscribers(rooms_subscribers, new_room)

        except json.JSONDecodeError:
          self.error_json(400, "Invalid JSON")
        except:
          self.error_json(500, "Internal error")
  
  def emit_subscribers(self, subscribers: list, data):
    for subscriber in subscribers:
      try:
        subscriber.response_json(data)
      except Exception as e:
        print("Ошибка при отправке уведомления:", e)
    return subscribers.clear()

  def response_json(self, data, status=200):
    try:
      self.send_response(status)
      self.send_header('Content-type', mimeTypes["json"])
      self.end_headers()

      # Отправляем содержимое файла
      return self.wfile.write(json.dumps(data).encode())
    except:
      return self.error_json(500, "An error occurred while data sending")
  
  def error_json(self, status_code: int, message: str):
    self.send_response(status_code)
    self.send_header("Content-Type", "application/json")
    self.end_headers()

    error_payload = {
      "error": message
    }
    self.wfile.write(json.dumps(error_payload).encode())


  def send_file(self, url: str):
    file = os.path.basename(url).split(".")
    file_name, file_extension = [file[0], file[1].lower()]
    file = f"{file_name}.{file_extension}"
    try:
      def find_file(start_directory, target_filename):
        for root, _, files in os.walk(start_directory):  # Обходим все каталоги и файлы
          if target_filename in files:  # Если файл найден в текущей директории
            return os.path.join(root, target_filename)  # Возвращаем полный путь к файлу
        return None  # Если файл не найден
      
      file_path = find_file("../client/src/dist/", file)
      if (not file_path):
        return self.send_error(404, "Not Found")
      content = None
      with open(file_path, "rb") as file:
        content = file.read()

      # Отправляем ответ
      self.send_response(200)
      self.send_header('Content-type', mimeTypes[file_extension])
      self.end_headers()

      # Отправляем содержимое файла
      return self.wfile.write(content)

    except Exception as error:
      print(error)
      self.send_error(404, "Not Found")

# Настройка сервера
def run(server_class=HTTPServer, handler_class=MyRequestHandler, host='localhost', PORT=8000):
  server_address = (host, PORT)
  httpd = server_class(server_address, handler_class)
  print(f"Сервер запущен на http://localhost:{PORT}")
  httpd.serve_forever()

if __name__ == "__main__":
  run()