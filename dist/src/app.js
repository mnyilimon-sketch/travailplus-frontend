"use strict";
const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");
const registerButton = document.getElementById("registerButton");
const API_URL = "http://localhost:5000/api/auth";
if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const firstName = document.getElementById("firstName").value.trim();
        const lastName = document.getElementById("lastName").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const faculty = document.getElementById("faculty").value;
        const department = document.getElementById("department").value.trim();
        const level = document.getElementById("level").value;
        const password = document.getElementById("registerPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const terms = document.getElementById("terms").checked;
        // ==============================
        // VALIDATION
        // ==============================
        if (!firstName ||
            !lastName ||
            !email ||
            !faculty ||
            !department ||
            !level ||
            !password ||
            !confirmPassword) {
            showMessage("Veuillez remplir tous les champs.", "error");
            return;
        }
        if (!terms) {
            showMessage("Tu dois accepter les conditions d'utilisation.", "error");
            return;
        }
        if (password.length < 8) {
            showMessage("Le mot de passe doit contenir au moins 8 caractères.", "error");
            return;
        }
        if (password !== confirmPassword) {
            showMessage("Les mots de passe ne correspondent pas.", "error");
            return;
        }
        // ==============================
        // BOUTON CHARGEMENT
        // ==============================
        if (registerButton) {
            registerButton.disabled = true;
            const span = registerButton.querySelector("span");
            if (span) {
                span.textContent = "Création...";
            }
        }
        showMessage("Création de ton compte...", "info");
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    faculty,
                    department,
                    level,
                    password
                })
            });
            const data = await response.json();
            if (!response.ok) {
                showMessage(data.message || "Impossible de créer le compte.", "error");
                return;
            }
            // ==============================
            // SUCCÈS
            // ==============================
            showMessage("Compte créé avec succès ! Redirection...", "success");
            registerForm.reset();
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);
        }
        catch (error) {
            console.error("Erreur :", error);
            showMessage("Impossible de contacter le serveur. Vérifie que le backend fonctionne sur le port 5000.", "error");
        }
        finally {
            if (registerButton) {
                registerButton.disabled = false;
                const span = registerButton.querySelector("span");
                if (span) {
                    span.textContent = "Créer mon compte";
                }
            }
        }
    });
}
// ==========================================
// AFFICHER UN MESSAGE
// ==========================================
function showMessage(text, type) {
    if (!registerMessage) {
        alert(text);
        return;
    }
    registerMessage.textContent = text;
    registerMessage.className = "login-message";
    if (type === "success") {
        registerMessage.classList.add("success");
    }
    if (type === "error") {
        registerMessage.classList.add("error");
    }
    if (type === "info") {
        registerMessage.classList.add("info");
    }
}
//# sourceMappingURL=app.js.map