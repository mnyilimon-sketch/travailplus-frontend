

"use strict";

/*
|---------------------------------------------------------------------------
| CONFIGURATION API
|---------------------------------------------------------------------------
*/

const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000/api/messages"
        : "https://travailplus-backend.onrender.com/api/messages";


/*
|---------------------------------------------------------------------------
| ÉLÉMENTS HTML
|---------------------------------------------------------------------------
*/

const messagesLoading =
    document.getElementById("messagesLoading");

const messagesError =
    document.getElementById("messagesError");

const messagesList =
    document.getElementById("messagesList");

const messageForm =
    document.getElementById("messageForm");

const messageInput =
    document.getElementById("messageInput");

const sendMessageButton =
    document.getElementById("sendMessageButton");

const backButton =
    document.getElementById("backButton");

const channelButtons =
    document.querySelectorAll(".channel-button");


/*
|---------------------------------------------------------------------------
| VARIABLES
|---------------------------------------------------------------------------
*/

let currentChannel = "general";


/*
|---------------------------------------------------------------------------
| TOKEN
|---------------------------------------------------------------------------
*/

function getToken() {

    return localStorage.getItem(
        "travailplus_token"
    );

}


/*
|---------------------------------------------------------------------------
| ERREUR
|---------------------------------------------------------------------------
*/

function showError(message) {

    messagesLoading.classList.add(
        "hidden"
    );

    messagesError.textContent =
        message;

    messagesError.classList.remove(
        "hidden"
    );

}


/*
|---------------------------------------------------------------------------
| CHARGER LES MESSAGES
|---------------------------------------------------------------------------
*/

async function loadMessages() {

    const token =
        getToken();

    if (!token) {

        window.location.href =
            "login.html";

        return;
    }


    messagesLoading.classList.remove(
        "hidden"
    );

    messagesError.classList.add(
        "hidden"
    );


    try {

        const response =
            await fetch(
                `${API_URL}?channel=${encodeURIComponent(currentChannel)}`,
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        if (response.status === 401) {

            localStorage.removeItem(
                "travailplus_token"
            );

            localStorage.removeItem(
                "travailplus_user"
            );

            window.location.href =
                "login.html";

            return;
        }


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            showError(
                data.message ||
                "Impossible de récupérer les messages."
            );

            return;
        }


        displayMessages(
            data.messages || []
        );


    } catch (error) {

        console.error(
            "Erreur chargement messages :",
            error
        );

        showError(
            "Impossible de contacter le serveur."
        );

    } finally {

        messagesLoading.classList.add(
            "hidden"
        );

    }

}


/*
|---------------------------------------------------------------------------
| AFFICHER LES MESSAGES
|---------------------------------------------------------------------------
*/

function displayMessages(messages) {

    messagesList.innerHTML = "";


    if (messages.length === 0) {

        messagesList.innerHTML = `
            <div class="empty-message">
                Aucun message pour le moment.
                Sois le premier à écrire !
            </div>
        `;

        return;
    }


    messages.forEach(
        (message) => {

            const messageElement =
                document.createElement("article");

            messageElement.className =
                "message";


            const author =
                document.createElement("div");

            author.className =
                "message-author";

            author.textContent =
                `${message.first_name || ""} ${message.last_name || ""}`.trim() ||
                "Utilisateur";


            const content =
                document.createElement("div");

            content.className =
                "message-content";

            content.textContent =
                message.content;


            const date =
                document.createElement("time");

            date.className =
                "message-date";

            date.textContent =
                formatDate(
                    message.created_at
                );


            messageElement.appendChild(
                author
            );

            messageElement.appendChild(
                content
            );

            messageElement.appendChild(
                date
            );


            messagesList.appendChild(
                messageElement
            );

        }
    );


    messagesList.scrollTop =
        messagesList.scrollHeight;

}


/*
|---------------------------------------------------------------------------
| FORMATER LA DATE
|---------------------------------------------------------------------------
*/

function formatDate(dateValue) {

    const date =
        new Date(dateValue);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleString(
        "fr-FR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


/*
|---------------------------------------------------------------------------
| ENVOYER UN MESSAGE
|---------------------------------------------------------------------------
*/

async function sendMessage() {

    const token =
        getToken();

    if (!token) {

        window.location.href =
            "login.html";

        return;
    }


    const content =
        messageInput.value.trim();


    if (!content) {

        return;
    }


    sendMessageButton.disabled =
        true;

    sendMessageButton.textContent =
        "Envoi...";


    try {

        const response =
            await fetch(
                API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        channel:
                            currentChannel,

                        content
                    })
                }
            );


        if (response.status === 401) {

            localStorage.removeItem(
                "travailplus_token"
            );

            localStorage.removeItem(
                "travailplus_user"
            );

            window.location.href =
                "login.html";

            return;
        }


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            alert(
                data.message ||
                "Impossible d'envoyer le message."
            );

            return;
        }


        messageInput.value = "";


        await loadMessages();

        messageInput.focus();


    } catch (error) {

        console.error(
            "Erreur envoi message :",
            error
        );

        alert(
            "Impossible de contacter le serveur."
        );

    } finally {

        sendMessageButton.disabled =
            false;

        sendMessageButton.textContent =
            "Envoyer";

    }

}


/*
|---------------------------------------------------------------------------
| CHANGEMENT DE CANAL
|---------------------------------------------------------------------------
*/

channelButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                channelButtons.forEach(
                    (item) => {
                        item.classList.remove(
                            "active"
                        );
                    }
                );


                button.classList.add(
                    "active"
                );


                currentChannel =
                    button.dataset.channel;


                loadMessages();

            }
        );

    }
);


/*
|---------------------------------------------------------------------------
| FORMULAIRE
|---------------------------------------------------------------------------
*/

messageForm.addEventListener(
    "submit",
    (event) => {

        event.preventDefault();

        sendMessage();

    }
);


/*
|---------------------------------------------------------------------------
| RETOUR DASHBOARD
|---------------------------------------------------------------------------
*/

if (backButton) {

    backButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "dashboard.html";

        }
    );

}


/*
|---------------------------------------------------------------------------
| INITIALISATION
|---------------------------------------------------------------------------
*/

loadMessages();