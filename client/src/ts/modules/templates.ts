import { Room } from "./Api/types"

export const room = (room: Room) => `
  <div class="room" data-id=${room.id}>
      <div class="room__body">
        <h4 class="room__title">${room.name}</h4>
        <span class="room__author">Автор: ${room.author}</span>
      </div>
      <button class="room__button">Войти</button>
    </div>
  </div>
`
