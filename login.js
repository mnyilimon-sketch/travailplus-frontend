"use strict";

console.log("login.js chargé");

document.addEventListener("DOMContentLoaded", function () {

    console.log("DOM chargé");

    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const loginButton = document.getElementById("loginButton");
    const loginMessage = document.getElementById("loginMessage");
    const passwordToggle = document.getElementById("passwordToggle");

    if (!loginForm) {
        console.error("loginForm introuvable");
        return;
    }

    if (!emailInput) {
        console.error("email introuvable");
        return;
    }

    if (!passwordInput) {
        console.error("password introuvable");
        return;
    }

    if (!loginButton) {
        console.error("loginButton introuvable");
        return;
    }

    console.log("Formulaire de connexion trouvé");

    const API_URL =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
            ? "http://localhost:5000/api/auth"
            : "https://travailplus-backend.onrender.com/api/auth";

    console.log("API :", API_URL);

    function showMessage(message, type = "error") {

        if (!loginMessage) {
            console.log(message);
            return;
        }

        loginMessage.textContent = message;
        loginMessage.style.display = "block";

        loginMessage.className =
            type === "success"
                ? "login-message success"
                : "login-message error";
    }

    if (passwordToggle) {

        passwordToggle.addEventListener("click", function () {

            passwordInput.type =
                passwordInput.type === "password"
                    ? "text"
                    : "password";

        });
    }

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        console.log("Submit du formulaire détecté");

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email) {

            showMessage(
                "Veuillez saisir votre adresse email."
            );

            emailInput.focus();
            return;
        }

        if (!password) {

            showMessage(
                "Veuillez saisir votre mot de passe."
            );

            passwordInput.focus();
            return;
        }

        loginButton.disabled = true;

        const originalText =
            loginButton.innerHTML;

        loginButton.innerHTML =
            "Connexion...";

        try {

            console.log(
                "POST :",
                `${API_URL}/login`
            );

            const response = await fetch(
                `${API_URL}/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },

                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );

            console.log(
                "HTTP :",
                response.status
            );

            let data = {};

            try {
                data = await response.json();
            } catch (parseError) {
                data = {
                    message:
                        response.ok
                            ? "Réponse serveur invalide."
                            : "Email ou mot de passe incorrect."
                };
            }

            console.log(
                "Réponse login :",
                data
            );

            if (!response.ok || !data.success) {

                showMessage(
                    data.message ||
                    "Email ou mot de passe incorrect."
                );

                return;
            }

            if (!data.token) {

                console.error(
                    "Token absent dans la réponse.",
                    data
                );

                showMessage(
                    "Connexion impossible : token absent."
                );

                return;
            }

            localStorage.setItem(
                "travailplus_token",
                data.token
            );

            localStorage.setItem(
                "token",
                data.token
            );

            if (data.user) {

                const userJson =
                    JSON.stringify(data.user);

                localStorage.setItem(
                    "travailplus_user",
                    userJson
                );

                localStorage.setItem(
                    "user",
                    userJson
                );
            }

            console.log(
                "Connexion réussie."
            );

            showMessage(
                "Connexion réussie.",
                "success"
            );

            window.location.href =
                "./dashboard.html";

        } catch (error) {

            console.error(
                "Erreur connexion :",
                error
            );

            showMessage(
                "Impossible de contacter le serveur."
            );

        } finally {

            loginButton.disabled = false;

            loginButton.innerHTML =
                originalText;
        }

    });

});