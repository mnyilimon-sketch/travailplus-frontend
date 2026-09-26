"use strict";

/*
======================================================
   TRAVAIL+ — ADMINISTRATION BOUTIQUE
   Compatible avec :
   /api/shop/admin/items
   /api/shop/admin/items/:id
   /api/shop/admin/items/:id/status
======================================================
*/

/* ======================================================
   API
====================================================== */

const SHOP_API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000/api/shop"
        : "https://travailplus-backend.onrender.com/api/shop";
    `${window.TravailPlusConfig?.apiBase || "http://localhost:5000/api"}/shop`;

/* ======================================================
   VARIABLES
====================================================== */

let shopItems = [];

/* ======================================================
   DOM
====================================================== */

const form = document.getElementById("shopForm");

const itemIdInput = document.getElementById("itemId");
const nameInput = document.getElementById("name");
const descriptionInput = document.getElementById("description");
const priceXpInput = document.getElementById("priceXp");
const imageUrlInput = document.getElementById("imageUrl");
const stockInput = document.getElementById("stock");

const submitButton = document.getElementById("submitButton");
const cancelEditButton = document.getElementById("cancelEdit");
const formTitle = document.getElementById("formTitle");

const adminName = document.getElementById("adminName");
const adminMessage = document.getElementById("adminMessage");

const shopLoading = document.getElementById("shopLoading");
const shopEmpty = document.getElementById("shopEmpty");
const shopTableContainer =
    document.getElementById("shopTableContainer");
const shopTableBody =
    document.getElementById("shopTableBody");

const refreshButton =
    document.getElementById("refreshButton");

/* ======================================================
   INITIALISATION
====================================================== */

document.addEventListener(
    "DOMContentLoaded",
    initializeShopAdmin
);

async function initializeShopAdmin() {
    try {
        /*
        -----------------------------------------------
        Vérification administrateur
        -----------------------------------------------
        */

        if (
            typeof TravailPlusAuth === "undefined"
        ) {
            throw new Error(
                "Le système d'authentification est introuvable."
            );
        }

        const user =
            await TravailPlusAuth.requireAdmin();

        if (!user) {
            return;
        }

        /*
        -----------------------------------------------
        Nom administrateur
        -----------------------------------------------
        */

        if (adminName) {
            const firstName =
                user.firstName || "";

            const lastName =
                user.lastName || "";

            const fullName =
                `${firstName} ${lastName}`.trim();

            adminName.textContent =
                fullName || "Administrateur";
        }

        /*
        -----------------------------------------------
        Chargement boutique
        -----------------------------------------------
        */

        await loadShopItems();

    } catch (error) {
        console.error(
            "❌ Erreur initialisation boutique admin :",
            error
        );

        showMessage(
            error.message ||
            "Impossible d'initialiser la boutique.",
            "error"
        );
    }
}

/* ======================================================
   REQUÊTE API
====================================================== */

async function shopApiRequest(
    endpoint,
    options = {}
) {
    const token =
        TravailPlusAuth.getToken();

    if (!token) {
        window.location.href =
            "login.html";

        throw new Error(
            "Session administrateur absente."
        );
    }

    const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.body
            ? {
                "Content-Type":
                    "application/json"
            }
            : {}),
        ...(options.headers || {})
    };

    const response =
        await fetch(
            endpoint,
            {
                ...options,
                headers
            }
        );

    let data = {};

    try {
        data =
            await response.json();
    } catch (_) {
        data = {};
    }

    /*
    -----------------------------------------------
    SESSION EXPIRÉE
    -----------------------------------------------
    */

    if (response.status === 401) {
        if (
            typeof TravailPlusAuth.logout ===
            "function"
        ) {
            TravailPlusAuth.logout(true);
        }

        throw new Error(
            "Votre session a expiré."
        );
    }

    /*
    -----------------------------------------------
    ACCÈS REFUSÉ
    -----------------------------------------------
    */

    if (response.status === 403) {
        throw new Error(
            "Accès administrateur refusé."
        );
    }

    return {
        response,
        data
    };
}

/* ======================================================
   CHARGER LES ARTICLES
====================================================== */

async function loadShopItems() {
    setLoading(true);

    try {
        const result =
            await shopApiRequest(
                `${SHOP_API_URL}/admin/items`,
                {
                    method: "GET"
                }
            );

        if (
            !result.response.ok ||
            !result.data.success
        ) {
            throw new Error(
                result.data.message ||
                "Impossible de récupérer les articles."
            );
        }

        shopItems =
            Array.isArray(result.data.items)
                ? result.data.items
                : [];

        renderShopItems();

    } catch (error) {
        console.error(
            "❌ Erreur chargement articles :",
            error
        );

        shopItems = [];

        if (shopTableBody) {
            shopTableBody.innerHTML = "";
        }

        if (shopTableContainer) {
            shopTableContainer.hidden = true;
        }

        if (shopEmpty) {
            shopEmpty.hidden = true;
        }

        showMessage(
            error.message ||
            "Erreur lors du chargement des articles.",
            "error"
        );

    } finally {
        setLoading(false);
    }
}

/* ======================================================
   AFFICHER LES ARTICLES
====================================================== */

function renderShopItems() {
    if (!shopTableBody) {
        return;
    }

    shopTableBody.innerHTML = "";

    /*
    -----------------------------------------------
    Aucun article
    -----------------------------------------------
    */

    if (shopItems.length === 0) {
        if (shopEmpty) {
            shopEmpty.hidden = false;
        }

        if (shopTableContainer) {
            shopTableContainer.hidden = true;
        }

        return;
    }

    /*
    -----------------------------------------------
    Articles présents
    -----------------------------------------------
    */

    if (shopEmpty) {
        shopEmpty.hidden = true;
    }

    if (shopTableContainer) {
        shopTableContainer.hidden = false;
    }

    shopItems.forEach(
        (item) => {
            const row =
                document.createElement("tr");

            /*
            ==========================================
               ARTICLE
            ==========================================
            */

            const itemCell =
                document.createElement("td");

            const itemWrapper =
                document.createElement("div");

            itemWrapper.style.display =
                "flex";

            itemWrapper.style.alignItems =
                "center";

            itemWrapper.style.gap =
                "12px";

            /*
            ------------------------------------------
               IMAGE
            ------------------------------------------
            */

            if (item.image_url) {
                const image =
                    document.createElement("img");

                image.src =
                    item.image_url;

                image.alt =
                    item.name ||
                    "Article";

                image.width = 55;
                image.height = 55;

                image.style.width =
                    "55px";

                image.style.height =
                    "55px";

                image.style.objectFit =
                    "cover";

                image.style.borderRadius =
                    "10px";

                image.onerror = () => {
                    image.style.display =
                        "none";
                };

                itemWrapper.appendChild(
                    image
                );
            }

            /*
            ------------------------------------------
               INFORMATIONS
            ------------------------------------------
            */

            const info =
                document.createElement("div");

            const name =
                document.createElement("strong");

            name.textContent =
                item.name ||
                "Article sans nom";

            const description =
                document.createElement("small");

            description.textContent =
                item.description ||
                "Aucune description.";

            description.style.display =
                "block";

            description.style.opacity =
                "0.7";

            description.style.marginTop =
                "4px";

            info.appendChild(name);
            info.appendChild(description);

            itemWrapper.appendChild(info);

            itemCell.appendChild(
                itemWrapper
            );

            /*
            ==========================================
               PRIX
            ==========================================
            */

            const priceCell =
                document.createElement("td");

            const price =
                Number(item.price_xp);

            priceCell.textContent =
                `${Number.isFinite(price)
                    ? price.toLocaleString("fr-FR")
                    : "0"} XP`;

            /*
            ==========================================
               STOCK
            ==========================================
            */

            const stockCell =
                document.createElement("td");

            if (
                item.stock === null ||
                item.stock === undefined
            ) {
                stockCell.textContent =
                    "Illimité";
            } else {
                const stock =
                    Number(item.stock);

                stockCell.textContent =
                    Number.isFinite(stock)
                        ? stock.toLocaleString("fr-FR")
                        : "0";
            }

            /*
            ==========================================
               STATUT
            ==========================================
            */

            const statusCell =
                document.createElement("td");

            const statusBadge =
                document.createElement("span");

            statusBadge.textContent =
                item.is_active
                    ? "Actif"
                    : "Inactif";

            statusBadge.style.fontWeight =
                "600";

            statusCell.appendChild(
                statusBadge
            );

            /*
            ==========================================
               ACTIONS
            ==========================================
            */

            const actionsCell =
                document.createElement("td");

            const actionsWrapper =
                document.createElement("div");

            actionsWrapper.style.display =
                "flex";

            actionsWrapper.style.flexWrap =
                "wrap";

            actionsWrapper.style.gap =
                "8px";

            /*
            ------------------------------------------
               MODIFIER
            ------------------------------------------
            */

            const editButton =
                createActionButton(
                    "Modifier",
                    "btn-secondary",
                    () => {
                        startEdit(item.id);
                    }
                );

            /*
            ------------------------------------------
               ACTIVER / DÉSACTIVER
            ------------------------------------------
            */

            const statusButton =
                createActionButton(
                    item.is_active
                        ? "Désactiver"
                        : "Activer",
                    "btn-secondary",
                    () => {
                        toggleItemStatus(
                            item.id
                        );
                    }
                );

            /*
            ------------------------------------------
               SUPPRIMER
            ------------------------------------------
            */

            const deleteButton =
                createActionButton(
                    "Supprimer",
                    "btn-danger",
                    () => {
                        deleteShopItem(
                            item.id
                        );
                    }
                );

            actionsWrapper.appendChild(
                editButton
            );

            actionsWrapper.appendChild(
                statusButton
            );

            actionsWrapper.appendChild(
                deleteButton
            );

            actionsCell.appendChild(
                actionsWrapper
            );

            /*
            ==========================================
               AJOUT LIGNE
            ==========================================
            */

            row.appendChild(itemCell);
            row.appendChild(priceCell);
            row.appendChild(stockCell);
            row.appendChild(statusCell);
            row.appendChild(actionsCell);

            shopTableBody.appendChild(row);
        }
    );
}

/* ======================================================
   CRÉER UN BOUTON D'ACTION
====================================================== */

function createActionButton(
    text,
    className,
    callback
) {
    const button =
        document.createElement("button");

    button.type = "button";

    button.textContent = text;

    button.className =
        className || "";

    button.addEventListener(
        "click",
        callback
    );

    return button;
}

/* ======================================================
   FORMULAIRE AJOUT / MODIFICATION
====================================================== */

if (form) {
    form.addEventListener(
        "submit",
        handleShopFormSubmit
    );
}

async function handleShopFormSubmit(event) {
    event.preventDefault();

    const itemId =
        itemIdInput?.value.trim() || "";

    const name =
        nameInput?.value.trim() || "";

    const description =
        descriptionInput?.value.trim() || "";

    const imageUrl =
        imageUrlInput?.value.trim() || "";

    const priceXp =
        Number(
            priceXpInput?.value
        );

    const stockValue =
        stockInput?.value.trim() || "";

    const stock =
        stockValue === ""
            ? null
            : Number(stockValue);

    /*
    -----------------------------------------------
    VALIDATION NOM
    -----------------------------------------------
    */

    if (!name) {
        showMessage(
            "Le nom de l'article est obligatoire.",
            "error"
        );

        nameInput?.focus();

        return;
    }

    /*
    -----------------------------------------------
    VALIDATION PRIX
    -----------------------------------------------
    */

    if (
        !Number.isInteger(priceXp) ||
        priceXp < 0
    ) {
        showMessage(
            "Le prix XP doit être un nombre entier positif ou égal à zéro.",
            "error"
        );

        priceXpInput?.focus();

        return;
    }

    /*
    -----------------------------------------------
    VALIDATION STOCK
    -----------------------------------------------
    */

    if (
        stock !== null &&
        (
            !Number.isInteger(stock) ||
            stock < 0
        )
    ) {
        showMessage(
            "Le stock doit être un nombre entier positif ou égal à zéro.",
            "error"
        );

        stockInput?.focus();

        return;
    }

    /*
    -----------------------------------------------
    PAYLOAD
    -----------------------------------------------
    */

    const payload = {
        name,
        description,
        priceXp,
        imageUrl,
        stock
    };

    const isEditing =
        Boolean(itemId);

    setFormBusy(true);

    try {
        const endpoint =
            isEditing
                ? `${SHOP_API_URL}/admin/items/${itemId}`
                : `${SHOP_API_URL}/admin/items`;

        const result =
            await shopApiRequest(
                endpoint,
                {
                    method:
                        isEditing
                            ? "PUT"
                            : "POST",

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );

        if (
            !result.response.ok ||
            !result.data.success
        ) {
            throw new Error(
                result.data.message ||
                (
                    isEditing
                        ? "Impossible de modifier l'article."
                        : "Impossible de créer l'article."
                )
            );
        }

        showMessage(
            result.data.message ||
            (
                isEditing
                    ? "Article modifié avec succès."
                    : "Article ajouté avec succès."
            ),
            "success"
        );

        resetShopForm();

        await loadShopItems();

    } catch (error) {
        console.error(
            "❌ Erreur formulaire boutique :",
            error
        );

        showMessage(
            error.message ||
            "Une erreur est survenue.",
            "error"
        );

    } finally {
        setFormBusy(false);
    }
}

/* ======================================================
   COMMENCER UNE MODIFICATION
====================================================== */

function startEdit(itemId) {
    const item =
        shopItems.find(
            (currentItem) =>
                Number(currentItem.id) ===
                Number(itemId)
        );

    if (!item) {
        showMessage(
            "Article introuvable.",
            "error"
        );

        return;
    }

    /*
    -----------------------------------------------
    Remplissage formulaire
    -----------------------------------------------
    */

    if (itemIdInput) {
        itemIdInput.value =
            item.id;
    }

    if (nameInput) {
        nameInput.value =
            item.name || "";
    }

    if (descriptionInput) {
        descriptionInput.value =
            item.description || "";
    }

    if (priceXpInput) {
        priceXpInput.value =
            Number(item.price_xp) || 0;
    }

    if (imageUrlInput) {
        imageUrlInput.value =
            item.image_url || "";
    }

    if (stockInput) {
        stockInput.value =
            item.stock === null ||
            item.stock === undefined
                ? ""
                : Number(item.stock);
    }

    /*
    -----------------------------------------------
    Interface modification
    -----------------------------------------------
    */

    if (formTitle) {
        formTitle.textContent =
            "Modifier l'article";
    }

    if (submitButton) {
        submitButton.textContent =
            "Enregistrer les modifications";
    }

    if (cancelEditButton) {
        cancelEditButton.hidden =
            false;
    }

    /*
    -----------------------------------------------
    Remonter au formulaire
    -----------------------------------------------
    */

    if (form) {
        form.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

/* ======================================================
   ANNULER LA MODIFICATION
====================================================== */

if (cancelEditButton) {
    cancelEditButton.addEventListener(
        "click",
        resetShopForm
    );
}

function resetShopForm() {
    if (form) {
        form.reset();
    }

    if (itemIdInput) {
        itemIdInput.value = "";
    }

    if (formTitle) {
        formTitle.textContent =
            "Ajouter un article";
    }

    if (submitButton) {
        submitButton.textContent =
            "Ajouter l'article";
    }

    if (cancelEditButton) {
        cancelEditButton.hidden =
            true;
    }
}

/* ======================================================
   ACTIVER / DÉSACTIVER
====================================================== */

async function toggleItemStatus(itemId) {
    const item =
        shopItems.find(
            (currentItem) =>
                Number(currentItem.id) ===
                Number(itemId)
        );

    if (!item) {
        showMessage(
            "Article introuvable.",
            "error"
        );

        return;
    }

    const action =
        item.is_active
            ? "désactiver"
            : "activer";

    const confirmed =
        window.confirm(
            `Voulez-vous vraiment ${action} "${item.name}" ?`
        );

    if (!confirmed) {
        return;
    }

    try {
        const result =
            await shopApiRequest(
                `${SHOP_API_URL}/admin/items/${itemId}/status`,
                {
                    method: "PATCH"
                }
            );

        if (
            !result.response.ok ||
            !result.data.success
        ) {
            throw new Error(
                result.data.message ||
                "Impossible de modifier le statut."
            );
        }

        showMessage(
            result.data.message ||
            "Statut modifié avec succès.",
            "success"
        );

        await loadShopItems();

    } catch (error) {
        console.error(
            "❌ Erreur changement statut :",
            error
        );

        showMessage(
            error.message ||
            "Impossible de modifier le statut.",
            "error"
        );
    }
}

/* ======================================================
   SUPPRIMER
====================================================== */

async function deleteShopItem(itemId) {
    const item =
        shopItems.find(
            (currentItem) =>
                Number(currentItem.id) ===
                Number(itemId)
        );

    if (!item) {
        showMessage(
            "Article introuvable.",
            "error"
        );

        return;
    }

    const confirmed =
        window.confirm(
            `Voulez-vous vraiment supprimer "${item.name}" ?\n\n` +
            "Les anciens achats resteront conservés."
        );

    if (!confirmed) {
        return;
    }

    try {
        const result =
            await shopApiRequest(
                `${SHOP_API_URL}/admin/items/${itemId}`,
                {
                    method: "DELETE"
                }
            );

        if (
            !result.response.ok ||
            !result.data.success
        ) {
            throw new Error(
                result.data.message ||
                "Impossible de supprimer l'article."
            );
        }

        /*
        -----------------------------------------------
        Si l'article supprimé était en modification
        -----------------------------------------------
        */

        if (
            Number(itemIdInput?.value) ===
            Number(itemId)
        ) {
            resetShopForm();
        }

        showMessage(
            result.data.message ||
            "Article supprimé avec succès.",
            "success"
        );

        await loadShopItems();

    } catch (error) {
        console.error(
            "❌ Erreur suppression article :",
            error
        );

        showMessage(
            error.message ||
            "Impossible de supprimer l'article.",
            "error"
        );
    }
}

/* ======================================================
   ACTUALISER
====================================================== */

if (refreshButton) {
    refreshButton.addEventListener(
        "click",
        async () => {
            await loadShopItems();
        }
    );
}

/* ======================================================
   MESSAGE ADMIN
====================================================== */

function showMessage(
    message,
    type = "info"
) {
    if (!adminMessage) {
        return;
    }

    adminMessage.textContent =
        message || "";

    adminMessage.className =
        `admin-message ${type}`;

    adminMessage.hidden =
        false;

    clearTimeout(
        showMessage.timer
    );

    showMessage.timer =
        setTimeout(() => {
            adminMessage.hidden =
                true;
        }, 5000);
}

/* ======================================================
   CHARGEMENT
====================================================== */

function setLoading(value) {
    if (shopLoading) {
        shopLoading.hidden =
            !value;
    }

    if (value) {
        if (shopEmpty) {
            shopEmpty.hidden =
                true;
        }

        if (shopTableContainer) {
            shopTableContainer.hidden =
                true;
        }

        return;
    }

    /*
    -----------------------------------------------
    Après chargement
    -----------------------------------------------
    */

    if (shopItems.length === 0) {
        if (shopEmpty) {
            shopEmpty.hidden =
                false;
        }

        if (shopTableContainer) {
            shopTableContainer.hidden =
                true;
        }
    } else {
        if (shopEmpty) {
            shopEmpty.hidden =
                true;
        }

        if (shopTableContainer) {
            shopTableContainer.hidden =
                false;
        }
    }
}

/* ======================================================
   FORMULAIRE EN COURS
====================================================== */

function setFormBusy(value) {
    if (!submitButton) {
        return;
    }

    submitButton.disabled =
        value;

    if (value) {
        submitButton.textContent =
            "Enregistrement...";

        return;
    }

    const editing =
        Boolean(
            itemIdInput?.value
        );

    submitButton.textContent =
        editing
            ? "Enregistrer les modifications"
            : "Ajouter l'article";
}