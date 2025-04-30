import { ApiPoller } from "./ApiPoller/ApiPoller.js";
const apiPoller = new ApiPoller();
// export const BASE_URL = "http://localhost:8000/api"
export const BASE_URL = "http://192.168.0.132:8000/api";
export const Api = {
    async _request(requst) {
        const result = {
            data: null,
            error: null,
        };
        try {
            const response = await requst();
            result.data = await response.json();
            if (response.status >= 400 && response.status <= 500) {
                result.error = result.data;
                return result;
            }
        }
        catch (error) {
            if (error instanceof Error)
                result.error = error;
        }
        return result;
    },
    async getRooms() {
        const request = () => fetch(`${BASE_URL}/rooms`);
        return await this._request(request);
    },
    async createRoom(data) {
        const sendingData = JSON.stringify(data);
        const request = () => fetch(`${BASE_URL}/create-room`, {
            method: "POST",
            body: sendingData,
            headers: {
                "Content-type": "application/json",
            },
        });
        return await this._request(request);
    },
    startRoomsPolling(onData, params) {
        return apiPoller.startPolling((signal) => fetch(`${BASE_URL}/update-rooms`, { signal }), onData, params);
    },
    startMessagePolling(room_id, onData, params) {
        return apiPoller.startPolling((signal) => fetch(`${BASE_URL}/${room_id}/update-messages`, { signal }), onData, params);
    },
};
