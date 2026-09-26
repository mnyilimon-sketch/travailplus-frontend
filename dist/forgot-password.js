"use strict";

const API_URL =
    "https://travailplus-backend.onrender.com/api/auth";
    `${window.TravailPlusConfig?.apiBase || "http://localhost:5000/api"}/auth`;

const forgotPasswordForm =
    document.getElementById("forgotPasswordForm");
const forgotEmail =
    document.getElementById("forgotEmail");

const forgotMessage =
    document.getElementById("forgotMessage");

const forgotButton =
    document.getElementById("forgotButton");


/*
|--------------------------------------------------------------------------
| MOT DE PASSE OUBLIÉ
|--------------------------------------------------------------------------
*/

if (forgotPasswordForm) {

    forgotPasswordForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const email =
                forgotEmail.value.trim().toLowerCase();

            if (!email) {

                showMessage(
                    "Veuillez entrer votre adresse e-mail.",
                    "error"
                );

                return;
            }

            setLoading(true);

            showMessage(
                "Envoi du lien de récupération...",
                "info"
            );

            try {

                const response = await fetch(
                    `${API_URL}/forgot-password`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        },

                        body: JSON.stringify({
                            email: email
                        })
                    }
                );


                const data =
                    await response.json();


                console.log(
                    "Réponse serveur :",
                    data
                );


                if (!response.ok) {

                    showMessage(
                        data.message ||
                        "Impossible d'envoyer le lien.",
                        "error"
                    );

                    return;
                }


                showMessage(
                    data.message ||
                    "Si cette adresse existe, un lien de récupération a été envoyé.",
                    "success"
                );


                forgotEmail.value = "";


            } catch (error) {

                console.error(
                    "Erreur récupération mot de passe :",
                    error
                );

                showMessage(
                    "Impossible de contacter le serveur. Vérifie ta connexion Internet et réessaie.",
                    "error"
                );

            } finally {

                setLoading(false);

            }

        }
    );

}


/*
|--------------------------------------------------------------------------
| MESSAGE
|--------------------------------------------------------------------------
*/

function showMessage(message, type) {

    if (!forgotMessage) {

        alert(message);

        return;
    }

    forgotMessage.textContent = message;

    forgotMessage.className =
        "login-message " + type;
}


/*
|--------------------------------------------------------------------------
| BOUTON
|--------------------------------------------------------------------------
*/

function setLoading(isLoading) {

    if (!forgotButton) {
        return;
    }

    forgotButton.disabled = isLoading;

    const spans =
        forgotButton.querySelectorAll("span");

    if (spans.length > 0) {

        spans[0].textContent =
            isLoading
                ? "Envoi en cours..."
                : "Envoyer le lien";
    }

}