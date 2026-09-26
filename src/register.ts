

const registerForm = document.getElementById(
    "registerForm"
) as HTMLFormElement | null;

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
            document.getElementById("email") as HTMLInputElement
        ).value.trim();

        const password = (
            document.getElementById("password") as HTMLInputElement
        ).value;

        const faculty = (
            document.getElementById("faculty") as HTMLInputElement
        ).value.trim();

        const department = (
            document.getElementById("department") as HTMLInputElement
        ).value.trim();

        const level = (
            document.getElementById("level") as HTMLInputElement
        ).value.trim();

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/register",
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
                alert(data.message || "Erreur lors de l'inscription.");
                return;
            }

            alert("✅ Inscription réussie !");

            registerForm.reset();

            // Redirection éventuelle
            // window.location.href = "login.html";

        } catch (error) {
            console.error("Erreur :", error);

            alert(
                "❌ Impossible de contacter le serveur. Vérifie que le backend fonctionne sur le port 5000."
            );
        }
    });
}