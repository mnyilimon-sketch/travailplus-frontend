
"use strict";

 console.log("Formulaire de connexion trouvé");

    const API_URL =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
            ? "http://localhost:5000/api/auth"
            : "https://travailplus-backend.onrender.com/api/auth";
        `${window.TravailPlusConfig?.apiBase || "http://localhost:5000/api"}/auth`;

    console.log("API :", API_URL);


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
            showMessage("Veuillez saisir votre adresse email.");
            emailInput.focus();
            return;
        }

        if (!password) {
            showMessage("Veuillez saisir votre mot de passe.");
            passwordInput.focus();
            return;
        }

        loginButton.disabled = true;

        const originalText = loginButton.innerHTML;

        loginButton.innerHTML = "Connexion...";

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

            console.log("HTTP :", response.status);

            let data = {};

            try {
                data = await response.json();
            } catch (parseError) {

                console.error(
                    "Réponse JSON invalide :",
                    parseError
                );

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

            if (
                !data.token ||
                typeof data.token !== "string"
            ) {

                console.error(
                    "Token absent ou invalide dans la réponse.",
                    data
                );

                showMessage(
                    "Connexion impossible : token absent ou invalide."
                );

                return;
            }

            /*
            ==================================================
            NETTOYAGE DES ANCIENS TOKENS
            ==================================================
            */

            localStorage.removeItem("token");

            localStorage.removeItem("user");

            /*
            ==================================================
            STOCKAGE DU NOUVEAU JWT
            ==================================================
            */

            localStorage.setItem(
                "travailplus_token",
                data.token.trim()
            );

            if (data.user) {

                localStorage.setItem(
                    "travailplus_user",
                    JSON.stringify(data.user)
                );
            }

            /*
            ==================================================
            VÉRIFICATION LOCALE DU FORMAT JWT
            ==================================================
            */

            const savedToken =
                localStorage.getItem(
                    "travailplus_token"
                );

            const tokenParts =
                savedToken
                    ? savedToken.split(".")
                    : [];

            console.log(
                "JWT enregistré :",
                savedToken ? "OUI" : "NON"
            );

            console.log(
                "Nombre de parties JWT :",
                tokenParts.length
            );

            if (tokenParts.length !== 3) {

                console.error(
                    "JWT reçu avec un format invalide."
                );

                localStorage.removeItem(
                    "travailplus_token"
                );

                localStorage.removeItem(
                    "travailplus_user"
                );

                showMessage(
                    "Connexion impossible : le serveur a renvoyé un token JWT invalide."
                );

                return;
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

