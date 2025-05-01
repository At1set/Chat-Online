export type Room = {
  id: string
  name: string
  author: string
  private: boolean
}

export type Message = {
  date: string
  author: string
  content: string
}

export type RoomsPollingResponse = {
  changed_field: "room"
  action: PollingResponseAction.ADD
  data: Room
}

export type RoomPollingResponse =
  | {
      changed_field: "messages"
      action: PollingResponseAction.ADD
      data: Message
    }
  | {
      changed_field: "users"
      action: PollingResponseAction.ADD
      data: string
    }

export type ApiResponse<T> = {
  status: number
  data: null | T
  error: null | any
}

export enum PollingResponseAction {
  ADD = "add",
  DELETE = "delete",
  UPDATE = "update",
}
