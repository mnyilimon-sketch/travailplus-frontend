"use strict";

// URL de l'API selon l'environnement
const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000/api/documents"
        : "https://travailplus-backend.onrender.com/api/documents";
    `${window.TravailPlusConfig?.apiBase || "http://localhost:5000/api"}/documents`;

// Récupération des éléments HTML
const documentsContainer =
    document.getElementById("documentsContainer");
// Récupération des éléments HTML
const documentsContainer =
    document.getElementById("documentsContainer");

const loading =
    document.getElementById("loading");

const emptyState =
    document.getElementById("emptyState");

const message =
    document.getElementById("message");

const facultyFilter =
    document.getElementById("facultyFilter");

const departmentFilter =
    document.getElementById("departmentFilter");

const levelFilter =
    document.getElementById("levelFilter");

const typeFilter =
    document.getElementById("typeFilter");

const filterButton =
    document.getElementById("filterButton");

const backButton =
    document.getElementById("backButton");


// Récupération du token JWT enregistré après connexion
function getToken() {
    return localStorage.getItem("token");
}


// Affichage d'un message à l'utilisateur
function showMessage(text, type = "error") {
    if (!message) return;

    message.textContent = text;
    message.className = `message ${type}`;
    message.hidden = false;
}


// Masquage du message
function hideMessage() {
    if (!message) return;

    message.textContent = "";
    message.hidden = true;
    message.className = "message";
}


// Chargement des documents depuis le backend
async function loadDocuments() {

    const token = getToken();

    // Vérification de la connexion
    if (!token) {

        if (loading) {
            loading.style.display = "none";
        }

        if (documentsContainer) {
            documentsContainer.innerHTML = "";
        }

        showMessage(
            "Votre session a expiré. Veuillez vous reconnecter.",
            "error"
        );

        return;
    }

    // Affichage du chargement
    if (loading) {
        loading.style.display = "block";
    }

    if (documentsContainer) {
        documentsContainer.innerHTML = "";
    }

    if (emptyState) {
        emptyState.hidden = true;
    }

    hideMessage();

    try {

        // Création des paramètres de recherche
        const params = new URLSearchParams();

        const faculty =
            facultyFilter?.value.trim() || "";

        const department =
            departmentFilter?.value.trim() || "";

        const level =
            levelFilter?.value.trim() || "";

        const documentType =
            typeFilter?.value.trim() || "";


        // Ajout des filtres lorsqu'ils sont renseignés
        if (faculty) {
            params.set("faculty", faculty);
        }

        if (department) {
            params.set("department", department);
        }

        if (level) {
            params.set("level", level);
        }

        if (documentType) {
            params.set("documentType", documentType);
        }


        // Construction de l'URL finale
        const queryString = params.toString();

        const url = queryString
            ? `${API_URL}?${queryString}`
            : API_URL;


        // Requête vers le backend
        const response = await fetch(url, {

            method: "GET",

            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json"
            }

        });


        // Lecture de la réponse JSON
        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error(
                "Le serveur a retourné une réponse invalide."
            );
        }


        // Gestion des erreurs HTTP
        if (!response.ok) {

            if (response.status === 401) {

                localStorage.removeItem("token");

                throw new Error(
                    "Votre session a expiré. Veuillez vous reconnecter."
                );
            }

            if (response.status === 403) {

                throw new Error(
                    "Vous n'avez pas accès à ces documents."
                );
            }

            throw new Error(
                data?.message ||
                "Impossible de récupérer les documents."
            );
        }


        // Vérification de la structure de la réponse
        if (
            !data ||
            data.success !== true ||
            !Array.isArray(data.documents)
        ) {
            throw new Error(
                "La réponse du serveur est incorrecte."
            );
        }


        // Affichage des documents
        displayDocuments(data.documents);

    } catch (error) {

        console.error(
            "Erreur chargement documents :",
            error
        );

        if (documentsContainer) {
            documentsContainer.innerHTML = "";
        }

        if (emptyState) {
            emptyState.hidden = true;
        }

        showMessage(
            error.message ||
            "Impossible de charger les documents.",
            "error"
        );

    } finally {

        // Arrêt de l'indicateur de chargement
        if (loading) {
            loading.style.display = "none";
        }
    }
}


// Affichage de la liste des documents
function displayDocuments(documents) {

    if (!documentsContainer) return;

    documentsContainer.innerHTML = "";


    // Aucun document trouvé
    if (!documents.length) {

        if (emptyState) {
            emptyState.hidden = false;
        }

        return;
    }


    // Masquage du message "aucun document"
    if (emptyState) {
        emptyState.hidden = true;
    }


    // Création d'une carte pour chaque document
    documents.forEach(documentData => {

        const card =
            createDocumentCard(documentData);

        documentsContainer.appendChild(card);

    });
}


// Création d'une carte de document
function createDocumentCard(documentData) {

    const card =
        document.createElement("article");

    card.className = "document-card";


    // Récupération des informations du document
    const documentType =
        documentData.documentType || "Autre";

    const typeLabel =
        formatDocumentType(documentType);

    const title =
        documentData.title ||
        "Document sans titre";

    const description =
        documentData.description ||
        "Aucune description disponible.";

    const faculty =
        documentData.faculty ||
        "Non précisée";

    const department =
        documentData.department ||
        "Non précisé";

    const level =
        documentData.level ||
        "Non précisé";


    // Construction du contenu de la carte
    card.innerHTML = `
        <div class="document-icon">
            📄
        </div>

        <div class="document-content">

            <span class="document-type">
                ${escapeHtml(typeLabel)}
            </span>

            <h3 class="document-title">
                ${escapeHtml(title)}
            </h3>

            <p class="document-description">
                ${escapeHtml(description)}
            </p>

            <div class="document-info">

                <span>
                    🎓 ${escapeHtml(faculty)}
                </span>

                <span>
                    📚 ${escapeHtml(department)}
                </span>

                <span>
                    🎯 ${escapeHtml(level)}
                </span>

            </div>

            <div class="document-actions">

                <button
                    type="button"
                    class="open-document"
                >
                    📖 Ouvrir le document
                </button>

                ${
                    documentData.correctionUrl
                        ? `
                            <a
                                href="${escapeAttribute(
                                    documentData.correctionUrl
                                )}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="correction-link"
                            >
                                ✅ Corrigé
                            </a>
                        `
                        : ""
                }

            </div>

        </div>
    `;


    // Bouton permettant d'ouvrir le PDF
    const openButton =
        card.querySelector(".open-document");

    if (openButton) {

        openButton.addEventListener(
            "click",
            () => {
                openDocument(
                    documentData.fileUrl
                );
            }
        );

    }


    return card;
}


// Ouverture du PDF
function openDocument(fileUrl) {

    if (!fileUrl) {

        showMessage(
            "Le fichier PDF de ce document est introuvable.",
            "error"
        );

        return;
    }


    try {

        const url =
            new URL(fileUrl);


        // Vérification du protocole de l'URL
        if (
            url.protocol !== "https:" &&
            url.protocol !== "http:"
        ) {
            throw new Error(
                "URL invalide."
            );
        }


        // Ouverture du PDF dans un nouvel onglet
        window.open(
            url.href,
            "_blank",
            "noopener,noreferrer"
        );

    } catch (error) {

        console.error(
            "Erreur ouverture PDF :",
            error
        );

        showMessage(
            "Impossible d'ouvrir le document.",
            "error"
        );
    }
}


// Conversion du type technique en texte lisible
function formatDocumentType(type) {

    const normalized =
        String(type)
            .toLowerCase()
            .trim();

    const types = {

        cours: "Cours",

        exercice: "Exercice",

        examen: "Examen",

        corrige: "Corrigé",

        "corrigé": "Corrigé",

        autre: "Autre"

    };

    return types[normalized] || type;
}


// Protection contre l'injection HTML
function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;
}


// Protection des URLs utilisées dans les attributs HTML
function escapeAttribute(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}


// Recherche avec le bouton
if (filterButton) {

    filterButton.addEventListener(
        "click",
        loadDocuments
    );

}


// Recherche avec la touche Entrée
[
    facultyFilter,
    departmentFilter,
    levelFilter
]
    .filter(Boolean)
    .forEach(input => {

        input.addEventListener(
            "keydown",
            event => {

                if (event.key === "Enter") {
                    loadDocuments();
                }

            }
        );

    });


// Recherche automatique lors du changement de type
if (typeFilter) {

    typeFilter.addEventListener(
        "change",
        loadDocuments
    );

}


// Retour vers le dashboard
if (backButton) {

    backButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "dashboard.html";

        }
    );

}


// Chargement automatique au démarrage
document.addEventListener(
    "DOMContentLoaded",
    loadDocuments
);