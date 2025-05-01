import { PollingResponseAction } from "./types"

export type RoomDTO = {
  id: string
  name: string
  author: string
  private: boolean
}

export type MessageDTO = {
  date: string
  author: string
  content: string
}

export type RoomsPollingResponseDTO = {
  changed_field: "room"
  action: PollingResponseAction.ADD
  data: RoomDTO
}

export type RoomPollingResponseDTO =
  | {
      changed_field: "messages"
      action: PollingResponseAction.ADD
      data: MessageDTO
    }
  | {
      changed_field: "users"
      action: PollingResponseAction.ADD
      data: string
    }
