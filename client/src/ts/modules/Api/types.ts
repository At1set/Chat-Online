export type Room = {
  id: string
  name: string
  author: string
}

export type Message = {
  date: string
  author: string
  text: string
}

export type ApiResponse<T> = {
  data: null | T
  error: null | any
}
