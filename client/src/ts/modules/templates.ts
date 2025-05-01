import { Message, Room } from "./Api/types"

export const room = (room: Room) => `
  <div class="room" data-id=${room.id}>
    <div class="room__body">
      <h4 class="room__title">${room.name}</h4>
      <span class="room__author">Автор: ${room.author}</span>
    </div>
    <div class="room__button">
      ${
        room.private
          ? `
          <img src='../icons/lock.svg' />
          <button>Войти</button>`
          : "<button>Войти</button>"
      }
      
    </div>
  </div>
`

export const message = (message: Message) => `
  <div class="message">
    <div class="message__author">${message.author}</div>
    <pre class="message__content">${message.content}</pre>
    <div class="message__date">${message.date}</div>
  </div>
`
