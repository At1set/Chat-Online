import { ApiPoller } from "./ApiPoller/ApiPoller.js"
import { StartPollingParams } from "./ApiPoller/types.js"
import {
  MessageDTO,
  RoomDTO,
  RoomPollingResponseDTO,
  RoomsPollingResponseDTO,
} from "./dto.js"
import { ApiResponse } from "./types.js"
const apiPoller = new ApiPoller()

// export const BASE_URL = "http://localhost:8000/api"
export const BASE_URL = "http://192.168.0.132:8000/api"

export const Api = {
  async _request<T>(requst: () => Promise<Response>) {
    const result: ApiResponse<T> = {
      status: 0,
      data: null,
      error: null,
    }

    try {
      const response = await requst()
      result.status = response.status
      let response_json = null
      try {
        response_json = await response.json()
      } catch {}
      if (response.status >= 400 && response.status <= 500) {
        result.error = response_json || response.statusText
        return result
      }
      if (response_json) result.data = response_json
    } catch (error) {
      if (error instanceof Error) result.error = error
    }

    return result
  },

  async getRooms() {
    const request = () => fetch(`${BASE_URL}/rooms`)
    return await this._request<RoomDTO[]>(request)
  },

  async connectToRoom(room_id: string, login: string, password?: string) {
    const params = new URLSearchParams({ user_name: login })
    if (password) params.append("password", password)
    const request = () =>
      fetch(`${BASE_URL}/rooms/${room_id}/connect?${params}`)
    return await this._request<never>(request)
  },

  async getMessages(
    room_id: string,
    login: string,
    password: string | null = null
  ) {
    const params = new URLSearchParams({ user_name: login })
    if (password) params.append("password", password)
    const request = () =>
      fetch(`${BASE_URL}/rooms/${room_id}/messages?${params}`)
    return await this._request<MessageDTO[]>(request)
  },

  async createMessage(
    data: any,
    room_id: string,
    login: string,
    password: string | null = null
  ) {
    const sendingData = JSON.stringify(data)
    const params = new URLSearchParams({ user_name: login })
    if (password) params.append("password", password)
    const request = () =>
      fetch(`${BASE_URL}/rooms/${room_id}/messages?${params}`, {
        method: "POST",
        body: sendingData,
        headers: {
          "Content-type": "application/json",
        },
      })
    return await this._request<MessageDTO>(request)
  },

  async createRoom(data: any) {
    const sendingData = JSON.stringify(data)
    const request = () =>
      fetch(`${BASE_URL}/create-room`, {
        method: "POST",
        body: sendingData,
        headers: {
          "Content-type": "application/json",
        },
      })
    return await this._request<RoomDTO>(request)
  },

  startRoomsPolling(
    onData: (data: RoomsPollingResponseDTO) => void,
    pollingParams?: StartPollingParams
  ) {
    return apiPoller.startPolling(
      (signal) => fetch(`${BASE_URL}/update-rooms`, { signal }),
      onData,
      pollingParams
    )
  },

  startRoomPolling(
    login: string,
    room_id: string,
    room_password: string | null = null,
    onData: (data: RoomPollingResponseDTO) => void,
    pollingParams?: StartPollingParams
  ) {
    const params = new URLSearchParams({ user_name: login })
    if (room_password) params.append("password", room_password)
    return apiPoller.startPolling(
      (signal) =>
        fetch(`${BASE_URL}/rooms/${room_id}/update?${params}`, {
          signal,
        }),
      onData,
      pollingParams
    )
  },
}
