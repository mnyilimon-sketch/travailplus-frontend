"use strict";

/*
======================================================
TRAVAIL+ — BOUTIQUE ÉTUDIANT
======================================================
*/

/* ======================================================
   CONFIGURATION API
====================================================== */

const SHOP_API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000/api/shop"
        : "https://travailplus-backend.onrender.com/api/shop";

/* ======================================================
   DOM — BOUTIQUE
====================================================== */

const shopGrid =
    document.getElementById("shopGrid");

const shopLoading =
    document.getElementById("shopLoading");

const shopEmpty =
    document.getElementById("shopEmpty");

const shopMessage =
    document.getElementById("shopMessage");

const userXpElement =
    document.getElementById("userXp");

/* ======================================================
   DOM — MODALE ACHAT
====================================================== */

const purchaseModal =
    document.getElementById("purchaseModal");

const closeModal =
    document.getElementById("closeModal");

const modalIcon =
    document.getElementById("modalIcon");

const modalTitle =
    document.getElementById("modalTitle");

const modalDescription =
    document.getElementById("modalDescription");

const modalPrice =
    document.getElementById("modalPrice");

const modalStock =
    document.getElementById("modalStock");

const cancelPurchase =
    document.getElementById("cancelPurchase");

const confirmPurchase =
    document.getElementById("confirmPurchase");

/* ======================================================
   ÉTAT
====================================================== */

let currentUser = null;

let shopItems = [];

let selectedItem = null;

let purchaseInProgress = false;

/* ======================================================
   INITIALISATION
====================================================== */

document.addEventListener(
    "DOMContentLoaded",
    initializeShop
);

async function initializeShop() {
    try {

        /*
        --------------------------------------------------
        AUTHENTIFICATION
        --------------------------------------------------
        */

        currentUser =
            await TravailPlusAuth.requireAuth();

        if (!currentUser) {
            return;
        }

        /*
        --------------------------------------------------
        CHARGEMENT BOUTIQUE
        --------------------------------------------------
        */

        await loadShop();

        /*
        --------------------------------------------------
        ÉVÉNEMENTS MODALE
        --------------------------------------------------
        */

        initializePurchaseModal();

    } catch (error) {

        console.error(
            "Erreur initialisation boutique :",
            error
        );

        showMessage(
            error.message ||
            "Impossible de charger la boutique.",
            "error"
        );
    }
}

/* ======================================================
   INITIALISER LA MODALE
====================================================== */

function initializePurchaseModal() {

    /*
    --------------------------------------------------
    FERMER AVEC LE BOUTON X
    --------------------------------------------------
    */

    if (closeModal) {
        closeModal.addEventListener(
            "click",
            closePurchaseModal
        );
    }

    /*
    --------------------------------------------------
    ANNULER
    --------------------------------------------------
    */

    if (cancelPurchase) {
        cancelPurchase.addEventListener(
            "click",
            closePurchaseModal
        );
    }

    /*
    --------------------------------------------------
    CONFIRMER ACHAT
    --------------------------------------------------
    */

    if (confirmPurchase) {
        confirmPurchase.addEventListener(
            "click",
            confirmItemPurchase
        );
    }

    /*
    --------------------------------------------------
    FERMER EN CLIQUANT EN DEHORS
    --------------------------------------------------
    */

    if (purchaseModal) {

        purchaseModal.addEventListener(
            "click",
            (event) => {

                if (
                    event.target ===
                    purchaseModal
                ) {
                    closePurchaseModal();
                }
            }
        );
    }

    /*
    --------------------------------------------------
    TOUCHE ESC
    --------------------------------------------------
    */

    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Escape" &&
                purchaseModal &&
                !purchaseModal.hidden
            ) {
                closePurchaseModal();
            }
        }
    );
}

/* ======================================================
   REQUÊTES API
====================================================== */

async function shopRequest(
    url,
    options = {}
) {

    const token =
        TravailPlusAuth.getToken();

    /*
    --------------------------------------------------
    TOKEN ABSENT
    --------------------------------------------------
    */

    if (!token) {

        window.location.href =
            "login.html";

        throw new Error(
            "Session expirée."
        );
    }

    /*
    --------------------------------------------------
    HEADERS
    --------------------------------------------------
    */

    const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
    };

    if (options.body) {
        headers["Content-Type"] =
            "application/json";
    }

    /*
    --------------------------------------------------
    REQUÊTE
    --------------------------------------------------
    */

    const response =
        await fetch(
            url,
            {
                ...options,
                headers
            }
        );

    /*
    --------------------------------------------------
    JSON
    --------------------------------------------------
    */

    let data = {};

    try {

        data =
            await response.json();

    } catch (_) {

        data = {};
    }

    /*
    --------------------------------------------------
    SESSION EXPIRÉE
    --------------------------------------------------
    */

    if (response.status === 401) {

        TravailPlusAuth.logout(true);

        throw new Error(
            "Session expirée."
        );
    }

    return {
        response,
        data
    };
}

/* ======================================================
   CHARGER LA BOUTIQUE
====================================================== */

async function loadShop() {

    setLoading(true);

    try {

        const result =
            await shopRequest(
                SHOP_API_URL,
                {
                    method: "GET"
                }
            );

        /*
        --------------------------------------------------
        VÉRIFICATION RÉPONSE
        --------------------------------------------------
        */

        if (
            !result.response.ok ||
            !result.data.success
        ) {

            throw new Error(
                result.data.message ||
                "Impossible de charger la boutique."
            );
        }

        /*
        --------------------------------------------------
        ARTICLES
        --------------------------------------------------
        */

        shopItems =
            Array.isArray(
                result.data.items
            )
                ? result.data.items
                : [];

        /*
        --------------------------------------------------
        XP
        --------------------------------------------------
        */

        updateXP(
            result.data.xp
        );

        /*
        --------------------------------------------------
        AFFICHAGE
        --------------------------------------------------
        */

        renderShop(
            shopItems
        );

    } catch (error) {

        console.error(
            "Erreur chargement boutique :",
            error
        );

        showMessage(
            error.message ||
            "Impossible de charger la boutique.",
            "error"
        );

    } finally {

        setLoading(false);
    }
}

/* ======================================================
   AFFICHAGE XP
====================================================== */

function updateXP(xp) {

    const value =
        Number(xp) || 0;

    /*
    --------------------------------------------------
    AFFICHER XP
    --------------------------------------------------
    */

    if (userXpElement) {

        userXpElement.textContent =
            `${value.toLocaleString("fr-FR")} XP`;
    }

    /*
    --------------------------------------------------
    METTRE À JOUR L'UTILISATEUR LOCAL
    --------------------------------------------------
    */

    if (currentUser) {

        currentUser.xp =
            value;

        try {

            localStorage.setItem(
                "travailplus_user",
                JSON.stringify(
                    currentUser
                )
            );

        } catch (_) {

            // Rien à faire
        }
    }
}

/* ======================================================
   AFFICHAGE DES ARTICLES
====================================================== */

function renderShop(items) {

    if (!shopGrid) {
        return;
    }

    shopGrid.innerHTML = "";

    /*
    --------------------------------------------------
    AUCUN ARTICLE
    --------------------------------------------------
    */

    if (!items.length) {

        if (shopEmpty) {
            shopEmpty.hidden = false;
        }

        return;
    }

    if (shopEmpty) {
        shopEmpty.hidden = true;
    }

    /*
    --------------------------------------------------
    CRÉER LES CARTES
    --------------------------------------------------
    */

    items.forEach(
        (item) => {

            const card =
                createItemCard(item);

            shopGrid.appendChild(
                card
            );
        }
    );
}

/* ======================================================
   CARTE ARTICLE
====================================================== */

function createItemCard(item) {

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "shop-card";

    /*
    --------------------------------------------------
    IDENTIFIANT ARTICLE
    --------------------------------------------------
    */

    card.dataset.itemId =
        String(item.id);

    /* ==================================================
       IMAGE
    ================================================== */

    const imageContainer =
        document.createElement(
            "div"
        );

    imageContainer.className =
        "shop-card-image";

    if (item.image_url) {

        const image =
            document.createElement(
                "img"
            );

        image.src =
            item.image_url;

        image.alt =
            item.name ||
            "Article";

        image.loading =
            "lazy";

        image.onerror = () => {

            image.remove();

            imageContainer.textContent =
                "🛍️";
        };

        imageContainer.appendChild(
            image
        );

    } else {

        imageContainer.textContent =
            "🛍️";
    }

    /* ==================================================
       CONTENU
    ================================================== */

    const content =
        document.createElement(
            "div"
        );

    content.className =
        "shop-card-content";

    /* ==================================================
       NOM
    ================================================== */

    const title =
        document.createElement(
            "h3"
        );

    title.textContent =
        item.name ||
        "Article";

    /* ==================================================
       DESCRIPTION
    ================================================== */

    const description =
        document.createElement(
            "p"
        );

    description.textContent =
        item.description ||
        "Récompense Travail+.";

    /* ==================================================
       PRIX
    ================================================== */

    const price =
        document.createElement(
            "div"
        );

    price.className =
        "shop-card-price";

    const priceXP =
        Number(item.price_xp) || 0;

    price.textContent =
        `${priceXP.toLocaleString("fr-FR")} XP`;

    /* ==================================================
       STOCK
    ================================================== */

    const stock =
        document.createElement(
            "div"
        );

    stock.className =
        "shop-card-stock";

    const stockInfo =
        getStockInfo(item);

    stock.textContent =
        stockInfo.text;

    if (!stockInfo.available) {

        stock.classList.add(
            "out-of-stock"
        );
    }

    /* ==================================================
       BOUTON ACHAT
    ================================================== */

    const button =
        document.createElement(
            "button"
        );

    button.type =
        "button";

    button.className =
        "shop-buy-button";

    const userXP =
        Number(
            currentUser?.xp
        ) || 0;

    /*
    --------------------------------------------------
    ARTICLE INDISPONIBLE
    --------------------------------------------------
    */

    if (!stockInfo.available) {

        button.textContent =
            "Rupture de stock";

        button.disabled =
            true;

    /*
    --------------------------------------------------
    XP INSUFFISANT
    --------------------------------------------------
    */

    } else if (
        userXP < priceXP
    ) {

        button.textContent =
            "XP insuffisant";

        button.disabled =
            true;

    /*
    --------------------------------------------------
    ACHAT POSSIBLE
    --------------------------------------------------
    */

    } else {

        button.textContent =
            "Acheter";

        button.disabled =
            false;

        button.addEventListener(
            "click",
            () => openPurchaseModal(item)
        );
    }

    /* ==================================================
       ASSEMBLAGE
    ================================================== */

    content.appendChild(
        title
    );

    content.appendChild(
        description
    );

    content.appendChild(
        price
    );

    content.appendChild(
        stock
    );

    content.appendChild(
        button
    );

    card.appendChild(
        imageContainer
    );

    card.appendChild(
        content
    );

    return card;
}

/* ======================================================
   STOCK
====================================================== */

function getStockInfo(item) {

    /*
    --------------------------------------------------
    STOCK ILLIMITÉ
    --------------------------------------------------
    */

    if (
        item.stock === null ||
        item.stock === undefined
    ) {

        return {
            available: true,
            text: "Disponible"
        };
    }

    const stock =
        Number(item.stock);

    /*
    --------------------------------------------------
    STOCK ÉPUISÉ
    --------------------------------------------------
    */

    if (
        !Number.isFinite(stock) ||
        stock <= 0
    ) {

        return {
            available: false,
            text: "Rupture de stock"
        };
    }

    /*
    --------------------------------------------------
    STOCK DISPONIBLE
    --------------------------------------------------
    */

    return {
        available: true,
        text:
            `${stock.toLocaleString("fr-FR")} disponible(s)`
    };
}

/* ======================================================
   OUVRIR MODALE ACHAT
====================================================== */

function openPurchaseModal(item) {

    if (!purchaseModal) {
        return;
    }

    /*
    --------------------------------------------------
    VÉRIFICATION ARTICLE
    --------------------------------------------------
    */

    if (!item) {
        return;
    }

    /*
    --------------------------------------------------
    VÉRIFICATION STOCK
    --------------------------------------------------
    */

    const stockInfo =
        getStockInfo(item);

    if (!stockInfo.available) {

        showMessage(
            "Cet article est en rupture de stock.",
            "error"
        );

        return;
    }

    /*
    --------------------------------------------------
    VÉRIFICATION XP
    --------------------------------------------------
    */

    const priceXP =
        Number(item.price_xp) || 0;

    const userXP =
        Number(currentUser?.xp) || 0;

    if (userXP < priceXP) {

        showMessage(
            "Vous n'avez pas assez d'XP.",
            "error"
        );

        return;
    }

    /*
    --------------------------------------------------
    ARTICLE SÉLECTIONNÉ
    --------------------------------------------------
    */

    selectedItem =
        item;

    /*
    --------------------------------------------------
    ICÔNE
    --------------------------------------------------
    */

    if (modalIcon) {

        modalIcon.textContent =
            "🛍️";
    }

    /*
    --------------------------------------------------
    TITRE
    --------------------------------------------------
    */

    if (modalTitle) {

        modalTitle.textContent =
            `Acheter "${item.name}" ?`;
    }

    /*
    --------------------------------------------------
    DESCRIPTION
    --------------------------------------------------
    */

    if (modalDescription) {

        modalDescription.textContent =
            item.description ||
            "Récompense Travail+.";
    }

    /*
    --------------------------------------------------
    PRIX
    --------------------------------------------------
    */

    if (modalPrice) {

        modalPrice.textContent =
            `${priceXP.toLocaleString("fr-FR")} XP`;
    }

    /*
    --------------------------------------------------
    STOCK
    --------------------------------------------------
    */

    if (modalStock) {

        modalStock.textContent =
            stockInfo.text;
    }

    /*
    --------------------------------------------------
    ÉTAT BOUTON
    --------------------------------------------------
    */

    purchaseInProgress =
        false;

    if (confirmPurchase) {

        confirmPurchase.disabled =
            false;

        confirmPurchase.textContent =
            "Acheter";
    }

    /*
    --------------------------------------------------
    AFFICHER MODALE
    --------------------------------------------------
    */

    purchaseModal.hidden =
        false;
}

/* ======================================================
   FERMER MODALE
====================================================== */

function closePurchaseModal() {

    if (!purchaseModal) {
        return;
    }

    if (purchaseInProgress) {
        return;
    }

    purchaseModal.hidden =
        true;

    selectedItem =
        null;
}

/* ======================================================
   CONFIRMER ACHAT
====================================================== */

async function confirmItemPurchase() {

    if (
        purchaseInProgress ||
        !selectedItem
    ) {
        return;
    }

    const item =
        selectedItem;

    /*
    --------------------------------------------------
    PRIX
    --------------------------------------------------
    */

    const priceXP =
        Number(item.price_xp) || 0;

    /*
    --------------------------------------------------
    XP ACTUEL
    --------------------------------------------------
    */

    const currentXP =
        Number(currentUser?.xp) || 0;

    if (currentXP < priceXP) {

        showMessage(
            "Vous n'avez pas assez d'XP.",
            "error"
        );

        closePurchaseModal();

        return;
    }

    /*
    --------------------------------------------------
    STOCK ACTUEL
    --------------------------------------------------
    */

    const stockInfo =
        getStockInfo(item);

    if (!stockInfo.available) {

        showMessage(
            "Cet article est en rupture de stock.",
            "error"
        );

        closePurchaseModal();

        await loadShop();

        return;
    }

    /*
    --------------------------------------------------
    DÉBUT ACHAT
    --------------------------------------------------
    */

    purchaseInProgress =
        true;

    if (confirmPurchase) {

        confirmPurchase.disabled =
            true;

        confirmPurchase.textContent =
            "Achat...";
    }

    try {

        /*
        --------------------------------------------------
        APPEL API RÉEL
        --------------------------------------------------
        */

        const result =
            await shopRequest(
                `${SHOP_API_URL}/buy`,
                {
                    method: "POST",

                    body:
                        JSON.stringify({
                            itemId:
                                Number(item.id)
                        })
                }
            );

        /*
        --------------------------------------------------
        ERREUR API
        --------------------------------------------------
        */

        if (
            !result.response.ok ||
            !result.data.success
        ) {

            throw new Error(
                result.data.message ||
                "Achat impossible."
            );
        }

        /*
        --------------------------------------------------
        NOUVEAU SOLDE XP
        --------------------------------------------------
        */

        updateXP(
            result.data.xp
        );

        /*
        --------------------------------------------------
        FERMER MODALE
        --------------------------------------------------
        */

        purchaseModal.hidden =
            true;

        selectedItem =
            null;

        purchaseInProgress =
            false;

        /*
        --------------------------------------------------
        MESSAGE SUCCÈS
        --------------------------------------------------
        */

        showMessage(
            result.data.message ||
            "Achat effectué avec succès.",
            "success"
        );

        /*
        --------------------------------------------------
        RECHARGER DONNÉES RÉELLES
        --------------------------------------------------
        */

        await loadShop();

    } catch (error) {

        console.error(
            "Erreur achat :",
            error
        );

        purchaseInProgress =
            false;

        if (confirmPurchase) {

            confirmPurchase.disabled =
                false;

            confirmPurchase.textContent =
                "Acheter";
        }

        showMessage(
            error.message ||
            "Achat impossible.",
            "error"
        );

        /*
        --------------------------------------------------
        RECHARGER L'ÉTAT RÉEL
        --------------------------------------------------
        */

        await loadShop();
    }
}

/* ======================================================
   MESSAGE
====================================================== */

function showMessage(
    message,
    type = "info"
) {

    if (!shopMessage) {

        window.alert(
            message
        );

        return;
    }

    shopMessage.textContent =
        message;

    shopMessage.className =
        `shop-message ${type}`;

    shopMessage.hidden =
        false;

    clearTimeout(
        showMessage.timer
    );

    showMessage.timer =
        setTimeout(
            () => {

                shopMessage.hidden =
                    true;

            },
            5000
        );
}

/* ======================================================
   LOADING
====================================================== */

function setLoading(value) {

    if (shopLoading) {

        shopLoading.hidden =
            !value;
    }

    if (
        value &&
        shopEmpty
    ) {

        shopEmpty.hidden =
            true;
    }
}     