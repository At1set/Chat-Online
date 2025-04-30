import { MessageDTO, RoomDTO } from "./dto";
import { Message, Room } from "./types";

export function mapRoomDTO(dto: RoomDTO): Room {
  return {
    id: dto.id,
    name: dto.name,
    author: dto.author,
  }
}

export function mapMessageDTO(dto: MessageDTO): Message {
  return {
    date: dto.date,
    text: dto.text,
    author: dto.author,
  }
}