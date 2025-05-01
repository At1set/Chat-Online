import { Api } from "./modules/Api/index.js";
import { mapMessageDTO, mapRoomPollingResponseDTO, } from "./modules/Api/mapping.js";
import { message } from "./modules/templates.js";
window.onload = () => {
    const search_params = new URLSearchParams(window.location.search);
    const room_id = window.location.pathname.split("/").pop();
    if (!room_id || Number.isNaN(room_id))
        window.location.href = "/rooms";
    const login = search_params.get("user_name");
    if (!login)
        window.location.href = `/login?redirect=${window.location.pathname}`;
    const password = search_params.get("password");
    const messagesContainer = document.querySelector(".chat-messages");
    const sending_form = document.querySelector(".chat__input form");
    const back_button = document.querySelector(".chat__back button");
    function appendMessage(messageData) {
        const newMessage = message(messageData);
        messagesContainer.insertAdjacentHTML("beforeend", newMessage);
    }
    Api.getMessages(room_id, login, password).then((res) => {
        if (!res.data || res.error)
            return;
        res.data.map((messageData) => appendMessage(mapMessageDTO(messageData)));
        console.log(res.data);
    });
    const pollerObject = Api.startRoomPolling(login, room_id, password, (data) => {
        const response = mapRoomPollingResponseDTO(data);
        switch (response.changed_field) {
            case "messages":
                const message = response.data;
                appendMessage(message);
                if (message.author === login)
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
            case "users":
                console.log(response);
                break;
        }
    });
    sending_form.addEventListener("submit", (e) => {
        e.preventDefault();
        const formData = new FormData(sending_form);
        const message_content = formData.get("message")?.trim();
        if (!message_content)
            return;
        const sendingData = {
            author: login,
            content: message_content,
        };
        sending_form.reset();
        Api.createMessage(sendingData, room_id, login, password);
    });
    sending_form.querySelector("textarea")?.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sending_form.querySelector("button")?.click();
        }
    });
    back_button.addEventListener("click", (e) => {
        search_params.delete("password");
        window.location.href = `/rooms?${search_params}`;
    });
};
