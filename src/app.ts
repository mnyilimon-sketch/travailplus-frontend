const registerForm = document.getElementById("registerForm") as HTMLFormElement | null;
const registerMessage = document.getElementById("registerMessage") as HTMLElement | null;
const registerButton = document.getElementById("registerButton") as HTMLButtonElement | null;

const API_URL = "http://localhost:5000/api/auth";

if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const firstName = (
            document.getElementById("firstName") as HTMLInputElement
        ).value.trim();

        const lastName = (
            document.getElementById("lastName") as HTMLInputElement
        ).value.trim();

        const email = (
            document.getElementById("registerEmail") as HTMLInputElement
        ).value.trim();

        const faculty = (
            document.getElementById("faculty") as HTMLSelectElement
        ).value;

        const department = (
            document.getElementById("department") as HTMLInputElement
        ).value.trim();

        const level = (
            document.getElementById("level") as HTMLSelectElement
        ).value;

        const password = (
            document.getElementById("registerPassword") as HTMLInputElement
        ).value;

        const confirmPassword = (
            document.getElementById("confirmPassword") as HTMLInputElement
        ).value;

        const terms = (
            document.getElementById("terms") as HTMLInputElement
        ).checked;


        // ==============================
        // VALIDATION
        // ==============================

        if (
            !firstName ||
            !lastName ||
            !email ||
            !faculty ||
            !department ||
            !level ||
            !password ||
            !confirmPassword
        ) {
            showMessage("Veuillez remplir tous les champs.", "error");
            return;
        }

        if (!terms) {
            showMessage(
                "Tu dois accepter les conditions d'utilisation.",
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

                showMessage(
                    data.message || "Impossible de créer le compte.",
                    "error"
                );

                return;
            }


            // ==============================
            // SUCCÈS
            // ==============================

            showMessage(
                "Compte créé avec succès ! Redirection...",
                "success"
            );

            registerForm.reset();


            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);


        } catch (error) {

            console.error("Erreur :", error);

            showMessage(
                "Impossible de contacter le serveur. Vérifie que le backend fonctionne sur le port 5000.",
                "error"
            );

        } finally {

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

function showMessage(
    text: string,
    type: "success" | "error" | "info"
): void {

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