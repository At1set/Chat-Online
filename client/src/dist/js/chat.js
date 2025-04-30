"use strict";
window.onload = () => {
    const chat_id = window.location.href.split("/").pop();
    if (!chat_id || Number.isNaN(chat_id))
        window.location.href = "/rooms";
    const login = new URLSearchParams(window.location.search).get("user_name");
    if (!login)
        window.location.href = `/login?redirect=${window.location.pathname}`;
};
