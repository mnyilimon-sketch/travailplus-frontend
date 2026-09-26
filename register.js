"use strict";

/* ======================================================
   TRAVAIL+ — INSCRIPTION
   Local : http://localhost:5000
   Production : Render
====================================================== */

const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000/api/auth"
        : "https://travailplus-backend.onrender.com/api/auth";

document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");

    if (!registerForm) {
        console.error("Formulaire d'inscription introuvable.");
        return;
    }

    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const submitButton =
            registerForm.querySelector('button[type="submit"]');

        const messageElement =
            document.getElementById("registerMessage") ||
            document.getElementById("message");

        const firstName =
            document.getElementById("firstName")?.value.trim() || "";

        const lastName =
            document.getElementById("lastName")?.value.trim() || "";

        const email =
            document.getElementById("email")?.value.trim() || "";

        const password =
            document.getElementById("password")?.value || "";

        const confirmPassword =
            document.getElementById("confirmPassword")?.value || "";

        const faculty =
            document.getElementById("faculty")?.value.trim() || "";

        const department =
            document.getElementById("department")?.value.trim() || "";

        const level =
            document.getElementById("level")?.value.trim() || "";

        const terms =
            document.getElementById("terms")?.checked ?? true;

        if (!firstName || !lastName || !email || !password) {
            showMessage(
                "Veuillez remplir tous les champs obligatoires.",
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

        if (!terms) {
            showMessage(
                "Vous devez accepter les conditions d'utilisation.",
                "error"
            );
            return;
        }

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.dataset.originalText =
                submitButton.textContent;

            submitButton.textContent = "Création du compte...";
        }

        try {
            console.log("Inscription via :", `${API_URL}/register`);

            const response = await fetch(`${API_URL}/register`, {
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
            });

            let data = {};

            try {
                data = await response.json();
            } catch {
                data = {};
            }

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    data.error ||
                    `Erreur serveur (${response.status})`
                );
            }

            console.log("Inscription réussie :", data);

            if (data.token) {
                localStorage.setItem(
                    "travailplus_token",
                    data.token
                );
            }

            if (data.user) {
                localStorage.setItem(
                    "travailplus_user",
                    JSON.stringify(data.user)
                );
            }

            showMessage(
                data.message ||
                "Compte créé avec succès. Redirection...",
                "success"
            );

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1000);

        } catch (error) {
            console.error(
                "Erreur inscription :",
                error
            );

            showMessage(
                error.message ||
                "Impossible de contacter le serveur. Vérifiez que le backend fonctionne.",
                "error"
            );

        } finally {
            if (submitButton) {
                submitButton.disabled = false;

                submitButton.textContent =
                    submitButton.dataset.originalText ||
                    "Créer mon compte";
            }
        }
    });

    function showMessage(message, type) {
        const element =
            document.getElementById("registerMessage") ||
            document.getElementById("message");

        if (!element) {
            alert(message);
            return;
        }

        element.textContent = message;
        element.className = `message ${type}`;
        element.style.display = "block";
    }
});