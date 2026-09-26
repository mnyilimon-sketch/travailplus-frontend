"use strict";
const confirmPasswordInput = document.getElementById("confirmPassword");
const termsInput = document.getElementById("terms");

const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000/api/auth"
        : "https://TON-BACKEND.onrender.com/api/auth";
    `${window.TravailPlusConfig?.apiBase || "http://localhost:5000/api"}/auth`;


if (!registerForm) {
    console.error("Formulaire d'inscription introuvable.");
const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");
const registerButton = document.getElementById("registerButton");
}
if (!registerForm) {
    console.error("Formulaire d'inscription introuvable.");
} else {

    registerForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const firstName =
            document.getElementById("firstName")?.value.trim();

        const lastName =
            document.getElementById("lastName")?.value.trim();

        const email =
            document.getElementById("email")?.value.trim().toLowerCase();

        const password =
            document.getElementById("password")?.value;

        const faculty =
            document.getElementById("faculty")?.value.trim();

        const department =
            document.getElementById("department")?.value.trim();

        const level =
            document.getElementById("level")?.value.trim();

        if (
            !firstName ||
            !lastName ||
            !email ||
            !password ||
            !faculty ||
            !department ||
            !level
        ) {
            showMessage(
                "Tous les champs sont obligatoires.",
                "error"
            );
            return;
        }

        if (password.length < 8) {
            showMessage(
                "Le mot de passe doit contenir au moins 8 caractères.",
                "error"
            );
            return;
        }

        setLoading(true);

        showMessage(
            "Création du compte...",
            "info"
        );

        try {

            const response = await fetch(
                `${API_URL}/register`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        firstName,
                        lastName,
                        email,
                        password,
                        faculty,
                        department,
                        level
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                showMessage(
                    data.message ||
                    "Impossible de créer le compte.",
                    "error"
                );

                return;
            }

            showMessage(
                "Compte créé avec succès ! Redirection vers la connexion...",
                "success"
            );

            setTimeout(function () {

                window.location.href = "login.html";

            }, 1200);

        } catch (error) {

            console.error(
                "Erreur inscription :",
                error
            );

            showMessage(
                "Impossible de contacter le serveur.",
                "error"
            );

        } finally {

            setLoading(false);
        }
    });
}


function showMessage(message, type) {

    if (!registerMessage) {
        alert(message);
        return;
    }

    registerMessage.textContent = message;

    registerMessage.className =
        "register-message " + type;
}


function setLoading(isLoading) {

    if (!registerButton) {
        return;
    }

    registerButton.disabled = isLoading;

    const span =
        registerButton.querySelector("span");

    if (span) {

        span.textContent =
            isLoading
                ? "Création du compte..."
                : "Créer mon compte";
    }
}