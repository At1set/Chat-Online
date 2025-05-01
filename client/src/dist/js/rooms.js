import { Api } from "./modules/Api/index.js";
import { mapRoomDTO, mapRoomsPollingResponseDTO, } from "./modules/Api/mapping.js";
import { PollingResponseAction } from "./modules/Api/types.js";
import { room } from "./modules/templates.js";
window.onload = () => {
    const login = new URLSearchParams(window.location.search).get("user_name");
    if (!login)
        window.location.href = "/login";
    const roomsNode = document.querySelector(".rooms-list");
    const profile_name = document.querySelector(".user__name");
    profile_name.innerHTML = login;
    const logout_button = document.querySelector(".profile__button button");
    const createRoomFromElement = document.querySelector(".create-room");
    const privateCheckBox = document.querySelector("#private");
    const passwordBlock = document.querySelector(".create-room__option.hidden");
    const modal_window = document.querySelector(".modal");
    const rooms = [];
    let selectedRoom = null;
    function appendRoom(roomData) {
        rooms.push(roomData);
        const newRoom = room(roomData);
        roomsNode.insertAdjacentHTML("beforeend", newRoom);
    }
    Api.getRooms().then((res) => {
        if (!res.data || res.error)
            return;
        res.data.map((roomData) => appendRoom(mapRoomDTO(roomData)));
    });
    const pollerObject = Api.startRoomsPolling((data) => {
        const response = mapRoomsPollingResponseDTO(data);
        console.log(response);
        switch (response.action) {
            case PollingResponseAction.ADD:
                const roomData = response.data;
                return appendRoom(roomData);
        }
    });
    // Создание комнаты
    createRoomFromElement.addEventListener("submit", (e) => {
        e.preventDefault();
        const formData = new FormData(createRoomFromElement);
        const name = formData.get("name");
        const password = formData.get("password");
        if (!name || (privateCheckBox.checked && !password))
            return;
        const sendingData = {
            name,
            author: login,
            password,
        };
        createRoomFromElement.reset();
        Api.createRoom(sendingData).then((res) => {
            if (res.error)
                alert(JSON.stringify(res.error));
            else {
                if (!res.data)
                    return;
                const room = mapRoomDTO(res.data);
                const newUrlSearch = new URLSearchParams(window.location.search);
                if (password)
                    newUrlSearch.append("password", password);
                return (window.location.href = `/rooms/${room.id}?${newUrlSearch}`);
            }
        });
    });
    roomsNode.addEventListener("click", (e) => {
        const target = e.target;
        if (target.tagName !== "BUTTON")
            return;
        const clicked_card = target.closest(".room");
        const room_id = clicked_card.dataset.id;
        if (!room_id)
            return;
        const room = rooms.find((room) => room.id === room_id);
        if (!room)
            return;
        if (room.private) {
            selectedRoom = room;
            modal_window.classList.add("_active");
        }
        else {
            Api.connectToRoom(room.id, login).then((res) => {
                if (res.error)
                    return;
                window.location.href = `/rooms/${room_id}${window.location.search}`;
            });
        }
    });
    privateCheckBox.addEventListener("change", (e) => {
        const passwordInput = passwordBlock.querySelector("#password");
        passwordBlock.classList.toggle("hidden");
        passwordInput.toggleAttribute("required");
    });
    logout_button.addEventListener("click", (e) => {
        window.location.href = "/login";
    });
    modal_window.addEventListener("click", (e) => {
        if (!selectedRoom)
            return modal_window.classList.remove("_active");
        const target = e.target;
        if (target.closest(".modal__body"))
            return;
        else
            modal_window.classList.remove("_active");
    });
    modal_window.querySelector("form").addEventListener("submit", (e) => {
        e.preventDefault();
        if (!selectedRoom)
            return;
        const room_id = selectedRoom.id;
        const form = e.currentTarget;
        const formData = new FormData(form);
        const password = formData.get("room-password");
        if (!password)
            return;
        Api.connectToRoom(selectedRoom.id, login, password).then((res) => {
            if (res.error) {
                const submit_button = form.querySelector("button");
                form.classList.add("_error");
                submit_button.disabled = true;
                return setTimeout(() => {
                    form.classList.remove("_error");
                    submit_button.disabled = false;
                }, 2000);
            }
            else {
                const newUrlSearch = new URLSearchParams(window.location.search);
                newUrlSearch.append("password", password);
                return (window.location.href = `/rooms/${room_id}?${newUrlSearch}`);
            }
        });
    });
};
