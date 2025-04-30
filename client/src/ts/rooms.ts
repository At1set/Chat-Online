import { Api } from "./modules/Api/index.js"
import { mapRoomDTO } from "./modules/Api/mapping.js"
import { Room } from "./modules/Api/types.js"
import { room } from "./modules/templates.js"

window.onload = () => {
  const login = new URLSearchParams(window.location.search).get("user_name")
  if (!login) window.location.href = "/login"

  const roomsNode = document.querySelector(".rooms-list")!
  const createRoomFromElement: HTMLFormElement =
    document.querySelector(".create-room")!

  function appendRoom(roomData: Room) {
    const newRoom = room(roomData)
    roomsNode.insertAdjacentHTML("beforeend", newRoom)
  }

  Api.getRooms().then((res) => {
    if (!res.data || res.error) return
    res.data.map((roomData) => appendRoom(mapRoomDTO(roomData)))
  })
  const pollerObject = Api.startRoomsPolling((data) => {
    const roomData = mapRoomDTO(data)
    return appendRoom(roomData)
  })

  createRoomFromElement.addEventListener("submit", (e) => {
    e.preventDefault()
    const formData = new FormData(createRoomFromElement)
    const name = formData.get("name")
    if (!name) return
    const sendingData = {
      name,
      author: login,
    }
    Api.createRoom(sendingData).then((res) => {
      if (res.error) alert(JSON.stringify(res.error))
    })
  })

  roomsNode.addEventListener("click", (e) => {
    const target = e.target as HTMLElement
    if (target.tagName !== "BUTTON") return
    const clicked_card = target.closest(".room") as HTMLElement
    const room_id = clicked_card.dataset.id
    if (!room_id) return
    window.location.href = `/chat/${room_id}${window.location.search}`
  })
}
