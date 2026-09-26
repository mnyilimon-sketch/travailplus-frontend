"use strict";

/* ======================================================
   CONFIGURATION API BOUTIQUE
====================================================== */

const SHOP_API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000/api/shop"
        : "https://travailplus-backend.onrender.com/api/shop";
    `${window.TravailPlusConfig?.apiBase || "http://localhost:5000/api"}/shop`;


/* ======================================================
   ÉLÉMENTS HTML
====================================================== */

const historyLoading =
    document.getElementById("historyLoading");

const historyEmpty =
    document.getElementById("historyEmpty");

const historyList =
    document.getElementById("historyList");

const historyMessage =
    document.getElementById("historyMessage");


/* ======================================================
   ÉCHAPPER LE HTML
====================================================== */

function escapeHtml(value) {

    const element =
        document.createElement("div");

    element.textContent =
        value === null ||
        value === undefined
            ? ""
            : String(value);

    return element.innerHTML;
}


/* ======================================================
   FORMATER LA DATE
====================================================== */

function formatDate(dateValue) {

    const date =
        new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Date inconnue";
    }

    return new Intl.DateTimeFormat(
        "fr-FR",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    ).format(date);
}


/* ======================================================
   AFFICHER UN MESSAGE
====================================================== */

function showMessage(message) {

    historyMessage.textContent =
        message;

    historyMessage.hidden = false;
}


/* ======================================================
   CACHER LE MESSAGE
====================================================== */

function hideMessage() {

    historyMessage.hidden = true;
}


/* ======================================================
   AFFICHER L'HISTORIQUE
====================================================== */

function renderHistory(purchases) {

    historyList.innerHTML = "";

    purchases.forEach((purchase) => {

        const card =
            document.createElement("article");

        card.className =
            "purchase-card";

        card.innerHTML = `
            <div class="purchase-icon">
                🛍️
            </div>

            <div class="purchase-details">

                <h2>
                    ${escapeHtml(
                        purchase.item_name
                    )}
                </h2>

                <p>
                    Achat effectué le
                    ${formatDate(
                        purchase.purchased_at
                    )}
                </p>

            </div>

            <div class="purchase-price">

                <strong>
                    ${Number(
                        purchase.price_xp
                    ).toLocaleString("fr-FR")}
                </strong>

                <span>
                    XP
                </span>

            </div>
        `;

        historyList.appendChild(card);
    });
}


/* ======================================================
   CHARGER L'HISTORIQUE
====================================================== */

async function loadPurchaseHistory() {

    historyLoading.hidden = false;

    historyEmpty.hidden = true;

    historyList.hidden = true;

    hideMessage();


    const token =
        TravailPlusAuth.getToken();


    if (!token) {

        window.location.href =
            "login.html";

        return;
    }


    try {

        console.log(
            "Chargement de l'historique..."
        );


        const response =
            await fetch(
                `${SHOP_API_URL}/history`,
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


        console.log(
            "Réponse historique :",
            response.status
        );


        const data =
            await response.json();


        console.log(
            "Données historique :",
            data
        );


        /* ==============================================
           SESSION EXPIRÉE
        ============================================== */

        if (response.status === 401) {

            TravailPlusAuth.logout();

            return;
        }


        /* ==============================================
           ERREUR SERVEUR
        ============================================== */

        if (!response.ok) {

            throw new Error(
                data.message ||
                `Erreur serveur (${response.status}).`
            );
        }


        /* ==============================================
           RÉPONSE INVALIDE
        ============================================== */

        if (!data.success) {

            throw new Error(
                data.message ||
                "Impossible de récupérer l'historique."
            );
        }


        /* ==============================================
           RÉCUPÉRER LES ACHATS
        ============================================== */

        const purchases =
            Array.isArray(data.purchases)
                ? data.purchases
                : [];


        historyLoading.hidden = true;


        /* ==============================================
           AUCUN ACHAT
        ============================================== */

        if (purchases.length === 0) {

            historyEmpty.hidden = false;

            return;
        }


        /* ==============================================
           AFFICHER LES ACHATS
        ============================================== */

        renderHistory(
            purchases
        );

        historyList.hidden = false;


    } catch (error) {

        console.error(
            "Erreur historique achats :",
            error
        );


        historyLoading.hidden = true;

        historyEmpty.hidden = true;

        historyList.hidden = true;


        showMessage(
            error.message ||
            "Impossible de charger votre historique."
        );
    }
}


/* ======================================================
   INITIALISATION
====================================================== */

async function init() {

    try {

        const user =
            await TravailPlusAuth.requireAuth();


        if (!user) {
            return;
        }


        await loadPurchaseHistory();


    } catch (error) {

        console.error(
            "Erreur initialisation historique :",
            error
        );


        historyLoading.hidden = true;

        showMessage(
            error.message ||
            "Impossible de charger votre historique."
        );
    }
}


/* ======================================================
   DÉMARRAGE
====================================================== */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

} else {

    init();
}