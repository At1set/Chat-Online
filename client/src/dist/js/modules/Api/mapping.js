import { PollingResponseAction, } from "./types.js";
export function mapRoomDTO(dto) {
    return {
        id: dto.id,
        name: dto.name,
        author: dto.author,
        private: dto.private,
    };
}
export function mapMessageDTO(dto) {
    return {
        date: new Date(dto.date).toLocaleString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
        }),
        content: dto.content,
        author: dto.author,
    };
}
export function mapRoomsPollingResponseDTO(dto) {
    switch (dto.action) {
        case PollingResponseAction.ADD:
            return {
                changed_field: dto.changed_field,
                action: dto.action,
                data: mapRoomDTO(dto.data),
            };
    }
}
export function mapRoomPollingResponseDTO(dto) {
    switch (dto.changed_field) {
        case "users":
            return {
                changed_field: dto.changed_field,
                action: dto.action,
                data: dto.data,
            };
        case "messages":
            return {
                changed_field: dto.changed_field,
                action: dto.action,
                data: mapMessageDTO(dto.data),
            };
    }
}
