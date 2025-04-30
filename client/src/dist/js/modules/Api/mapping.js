export function mapRoomDTO(dto) {
    return {
        id: dto.id,
        name: dto.name,
        author: dto.author,
    };
}
export function mapMessageDTO(dto) {
    return {
        date: dto.date,
        text: dto.text,
        author: dto.author,
    };
}
