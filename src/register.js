"use strict";

const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");
const registerButton = document.getElementById("registerButton");

const firstNameInput = document.getElementById("firstName");
const lastNameInput = document.getElementById("lastName");
const emailInput = document.getElementById("registerEmail");
const passwordInput = document.getElementById("registerPassword");
const facultyInput = document.getElementById("faculty");
const departmentInput = document.getElementById("department");
const levelInput = document.getElementById("level");
const confirmPasswordInput = document.getElementById("confirmPassword");
const termsInput = document.getElementById("terms");

const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000/api/auth"
        : "https://TON-BACKEND.onrender.com/api/auth";


if (!registerForm) {
    console.error("Formulaire d'inscription introuvable.");
} else {

    registerForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const firstName = firstNameInput?.value.trim() || "";
        const lastName = lastNameInput?.value.trim() || "";
        const email = emailInput?.value.trim().toLowerCase() || "";
        const password = passwordInput?.value || "";
        const confirmPassword = confirmPasswordInput?.value || "";
        const faculty = facultyInput?.value.trim() || "";
        const department = departmentInput?.value.trim() || "";
        const level = levelInput?.value.trim() || "";

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
                "Veuillez remplir tous les champs obligatoires.",
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

        if (password !== confirmPassword) {
            showMessage(
                "Les mots de passe ne correspondent pas.",
                "error"
            );
            return;
        }

        if (termsInput && !termsInput.checked) {
            showMessage(
                "Vous devez accepter les conditions.",
                "error"
            );
            return;
        }

        setLoading(true);

        showMessage(
            "Création de votre compte...",
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
                    data.message || "Impossible de créer le compte.",
                    "error"
                );
                return;
            }

            showMessage(
                "Compte créé avec succès ! Redirection vers la connexion...",
                "success"
            );

            registerForm.reset();

            setTimeout(function () {
                window.location.href = "login.html";
            }, 1200);

        } catch (error) {

            console.error(
                "Erreur inscription :",
                error
            );

            showMessage(
                "Impossible de contacter le serveur. Vérifiez que le backend fonctionne.",
                "error"
            );

        } finally {

            setLoading(false);
        }
    });
}


/*
|--------------------------------------------------------------------------
| MESSAGE
|--------------------------------------------------------------------------
*/

function showMessage(message, type) {

    if (!registerMessage) {
        alert(message);
        return;
    }

    registerMessage.textContent = message;

    registerMessage.className =
        "register-message " + type;
}


/*
|--------------------------------------------------------------------------
| LOADING
|--------------------------------------------------------------------------
*/

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
                ? "Création..."
                : "Créer mon compte";
    }
}