

"use strict";
const form = document.getElementById("resetPasswordForm");
const passwordInput = document.getElementById("resetPassword");
const confirmationInput = document.getElementById(
    "resetPasswordConfirmation"
);
const message = document.getElementById("resetMessage");
const button = document.getElementById("resetButton");
const token = new URLSearchParams(window.location.search).get("token");
const apiUrl =
    `${window.TravailPlusConfig?.apiBase || "http://localhost:5000/api"}/auth`;
function showMessage(text, type) {
    message.textContent = text;
    message.classList.remove("success", "error");
    message.classList.add(type);
}
if (!token) {
    showMessage("Ce lien de réinitialisation est invalide.", "error");
    button.disabled = true;
}
form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = passwordInput.value;
    const confirmation = confirmationInput.value;
    if (password.length < 6) {
        showMessage(
            "Le mot de passe doit contenir au moins 6 caractères.",
            "error"
        );
        return;
    }
    if (password !== confirmation) {
        showMessage(
            "Les deux mots de passe ne correspondent pas.",
            "error"
        );
        return;
    }
    button.disabled = true;
    try {
        const response = await fetch(`${apiUrl}/reset-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ token, password })
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Impossible de modifier le mot de passe."
            );
        }
        showMessage(
            "Mot de passe modifié. Tu peux maintenant te connecter.",
            "success"
        );
        form.reset();
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1200);
    } catch (error) {
        showMessage(
            error.message || "Une erreur est survenue.",
            "error"
        );
        button.disabled = false;
    }
});