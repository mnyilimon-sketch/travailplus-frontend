

"use strict";

// ======================================================
// CONFIGURATION API
// ======================================================

const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000/api/notifications"
        : "https://travailplus-backend.onrender.com/api/notifications";


// ======================================================
// ÉLÉMENTS DOM
// ======================================================

const notificationsLoading =
    document.getElementById("notificationsLoading");

const notificationsError =
    document.getElementById("notificationsError");

const notificationsEmpty =
    document.getElementById("notificationsEmpty");

const notificationsList =
    document.getElementById("notificationsList");

const markAllButton =
    document.getElementById("markAllButton");

const backButton =
    document.getElementById("backButton");


// ======================================================
// TOKEN
// ======================================================

function getToken() {

    return (
        localStorage.getItem("travailplus_token") ||
        localStorage.getItem("token")
    );
}


// ======================================================
// AFFICHER UNE ERREUR
// ======================================================

function showError(message) {

    notificationsError.textContent = message;

    notificationsError.classList.remove("hidden");
}


// ======================================================
// CACHER L'ERREUR
// ======================================================

function hideError() {

    notificationsError.textContent = "";

    notificationsError.classList.add("hidden");
}


// ======================================================
// FORMATAGE DE LA DATE
// ======================================================

function formatDate(dateString) {

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return new Intl.DateTimeFormat(
        "fr-FR",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    ).format(date);
}


// ======================================================
// TYPE DE NOTIFICATION
// ======================================================

function getNotificationIcon(type) {

    switch (type) {

        case "success":
            return "✓";

        case "warning":
            return "⚠";

        case "error":
            return "✕";

        case "xp":
            return "★";

        default:
            return "🔔";
    }
}


// ======================================================
// CHARGEMENT DES NOTIFICATIONS
// ======================================================

async function loadNotifications() {

    const token = getToken();

    if (!token) {

        window.location.href = "login.html";

        return;
    }

    notificationsLoading.classList.remove("hidden");

    notificationsEmpty.classList.add("hidden");

    notificationsList.innerHTML = "";

    hideError();

    try {

        const response = await fetch(
            API_URL,
            {
                method: "GET",

                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        if (response.status === 401) {

            localStorage.removeItem(
                "travailplus_token"
            );

            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "travailplus_user"
            );

            window.location.href = "login.html";

            return;
        }


        const data = await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Impossible de récupérer les notifications."
            );
        }


        const notifications =
            Array.isArray(data.notifications)
                ? data.notifications
                : [];


        renderNotifications(notifications);


    } catch (error) {

        console.error(
            "Erreur chargement notifications :",
            error
        );

        showError(
            error.message ||
            "Impossible de charger les notifications."
        );

    } finally {

        notificationsLoading.classList.add("hidden");
    }
}


// ======================================================
// AFFICHER LES NOTIFICATIONS
// ======================================================

function renderNotifications(notifications) {

    notificationsList.innerHTML = "";


    if (notifications.length === 0) {

        notificationsEmpty.classList.remove("hidden");

        return;
    }


    notificationsEmpty.classList.add("hidden");


    notifications.forEach(notification => {

        const element =
            createNotificationElement(notification);

        notificationsList.appendChild(element);

    });
}


// ======================================================
// CRÉER UNE NOTIFICATION
// ======================================================

function createNotificationElement(notification) {

    const article =
        document.createElement("article");

    article.className =
        "notification-item";


    if (!notification.is_read) {

        article.classList.add("unread");
    }


    article.dataset.id =
        notification.id;


    const icon =
        document.createElement("div");

    icon.className =
        `notification-icon type-${notification.type || "info"}`;

    icon.textContent =
        getNotificationIcon(notification.type);


    const content =
        document.createElement("div");

    content.className =
        "notification-content";


    const title =
        document.createElement("h3");

    title.textContent =
        notification.title;


    const message =
        document.createElement("p");

    message.textContent =
        notification.message;


    const date =
        document.createElement("time");

    date.className =
        "notification-date";

    date.textContent =
        formatDate(notification.created_at);


    content.appendChild(title);

    content.appendChild(message);

    content.appendChild(date);


    const actions =
        document.createElement("div");

    actions.className =
        "notification-actions";


    if (!notification.is_read) {

        const readButton =
            document.createElement("button");

        readButton.type =
            "button";

        readButton.className =
            "read-button";

        readButton.textContent =
            "Marquer comme lu";


        readButton.addEventListener(
            "click",
            () => markNotificationAsRead(
                notification.id
            )
        );


        actions.appendChild(readButton);
    }


    const deleteButton =
        document.createElement("button");

    deleteButton.type =
        "button";

    deleteButton.className =
        "delete-button";

    deleteButton.textContent =
        "Supprimer";


    deleteButton.addEventListener(
        "click",
        () => deleteNotification(
            notification.id
        )
    );


    actions.appendChild(deleteButton);


    article.appendChild(icon);

    article.appendChild(content);

    article.appendChild(actions);


    return article;
}


// ======================================================
// MARQUER UNE NOTIFICATION COMME LUE
// ======================================================

async function markNotificationAsRead(
    notificationId
) {

    const token = getToken();

    if (!token) {

        window.location.href = "login.html";

        return;
    }


    try {

        const response = await fetch(
            `${API_URL}/${notificationId}/read`,
            {
                method: "PATCH",

                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        const data =
            await response.json();


        if (response.status === 401) {

            window.location.href =
                "login.html";

            return;
        }


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Impossible de marquer la notification comme lue."
            );
        }


        await loadNotifications();


    } catch (error) {

        console.error(
            "Erreur notification lue :",
            error
        );

        showError(
            error.message ||
            "Impossible de modifier la notification."
        );
    }
}


// ======================================================
// MARQUER TOUTES LES NOTIFICATIONS COMME LUES
// ======================================================

async function markAllAsRead() {

    const token = getToken();

    if (!token) {

        window.location.href =
            "login.html";

        return;
    }


    markAllButton.disabled = true;

    markAllButton.textContent =
        "Traitement...";


    try {

        const response = await fetch(
            `${API_URL}/read-all`,
            {
                method: "PATCH",

                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        const data =
            await response.json();


        if (response.status === 401) {

            window.location.href =
                "login.html";

            return;
        }


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Impossible de marquer les notifications comme lues."
            );
        }


        await loadNotifications();


    } catch (error) {

        console.error(
            "Erreur lecture notifications :",
            error
        );

        showError(
            error.message ||
            "Impossible de modifier les notifications."
        );

    } finally {

        markAllButton.disabled = false;

        markAllButton.textContent =
            "✓ Tout marquer comme lu";
    }
}


// ======================================================
// SUPPRIMER UNE NOTIFICATION
// ======================================================

async function deleteNotification(
    notificationId
) {

    const token = getToken();

    if (!token) {

        window.location.href =
            "login.html";

        return;
    }


    try {

        const response = await fetch(
            `${API_URL}/${notificationId}`,
            {
                method: "DELETE",

                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        const data =
            await response.json();


        if (response.status === 401) {

            window.location.href =
                "login.html";

            return;
        }


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Impossible de supprimer la notification."
            );
        }


        await loadNotifications();


    } catch (error) {

        console.error(
            "Erreur suppression notification :",
            error
        );

        showError(
            error.message ||
            "Impossible de supprimer la notification."
        );
    }
}


// ======================================================
// RETOUR DASHBOARD
// ======================================================

backButton.addEventListener(
    "click",
    () => {
        window.location.href =
            "dashboard.html";
    }
);


// ======================================================
// BOUTON TOUT MARQUER COMME LU
// ======================================================

markAllButton.addEventListener(
    "click",
    markAllAsRead
);


// ======================================================
// INITIALISATION
// ======================================================

loadNotifications();