"use strict";
window.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
    if (!form)
        return;
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const login = formData.get("user_name")?.toString().trim();
        if (!login)
            return;
        const redirectParam = new URLSearchParams(window.location.search).get("redirect");
        const queryParams = new URLSearchParams({ user_name: login });
        const targetUrl = redirectParam || "/rooms";
        window.location.href = `${targetUrl}?${queryParams.toString()}`;
    });
});
