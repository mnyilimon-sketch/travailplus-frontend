"use strict";

/* =========================================================
   TRAVAIL+ — AUTHENTIFICATION FRONTEND
========================================================= */

const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000/api/auth"
        : "https://travailplus-backend.onrender.com/api/auth";


/* =========================================================
   TOKEN
========================================================= */

function getToken() {
    return (
        localStorage.getItem("travailplus_token") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("travailplus_token") ||
        sessionStorage.getItem("token") ||
        null
    );
}


/* =========================================================
   UTILISATEUR LOCAL
========================================================= */

function getUser() {
    const data =
        localStorage.getItem("travailplus_user") ||
        localStorage.getItem("user");

    if (!data) {
        return null;
    }

    try {
        return JSON.parse(data);
    } catch (error) {
        console.error(
            "❌ Données utilisateur invalides :",
            error
        );

        localStorage.removeItem("travailplus_user");
        localStorage.removeItem("user");

        return null;
    }
}


/* =========================================================
   SAUVEGARDER UTILISATEUR
========================================================= */

function saveUser(user) {
    if (!user) {
        return;
    }

    const userJson = JSON.stringify(user);

    localStorage.setItem(
        "travailplus_user",
        userJson
    );

    localStorage.setItem(
        "user",
        userJson
    );
}


/* =========================================================
   OBTENIR L'UTILISATEUR CONNECTÉ
========================================================= */

async function getCurrentUser() {

    const token = getToken();

    if (!token) {
        return null;
    }

    try {

        /*
         * IMPORTANT :
         * Le backend Travail+ utilise :
         *
         * GET /api/auth/profile
         *
         * et non :
         *
         * GET /api/auth/me
         */

        const response = await fetch(
            `${API_URL}/profile`,
            {
                method: "GET",

                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        /* ================================================
           TOKEN INVALIDE / EXPIRÉ
        ================================================= */

        if (response.status === 401) {

            console.warn(
                "⚠️ Session expirée ou token invalide."
            );

            clearAuthStorage();

            return null;
        }


        /* ================================================
           AUTRE ERREUR HTTP
        ================================================= */

        if (!response.ok) {

            console.error(
                `❌ Erreur profil HTTP ${response.status}`
            );

            return null;
        }


        /* ================================================
           RÉPONSE JSON
        ================================================= */

        const data = await response.json();


        if (!data.success || !data.user) {

            console.error(
                "❌ Réponse profil invalide :",
                data
            );

            clearAuthStorage();

            return null;
        }


        /* ================================================
           SAUVEGARDE
        ================================================= */

        saveUser(data.user);

        return data.user;

    } catch (error) {

        /*
         * Une erreur réseau ne doit PAS supprimer
         * immédiatement le token.
         *
         * C'est important pour le mode hors ligne.
         */

        console.error(
            "❌ Erreur vérification session :",
            error
        );

        return null;
    }
}


/* =========================================================
   VÉRIFIER AUTHENTIFICATION
========================================================= */

async function requireAuth() {

    const user = await getCurrentUser();

    if (!user) {

        console.warn(
            "⚠️ Utilisateur non authentifié."
        );

        window.location.replace(
            "login.html"
        );

        return null;
    }

    return user;
}


/* =========================================================
   VÉRIFIER ADMIN
========================================================= */

async function requireAdmin() {

    const user = await getCurrentUser();

    if (!user) {

        window.location.replace(
            "login.html"
        );

        return null;
    }


    if (user.isAdmin !== true) {

        console.warn(
            "⚠️ Accès administrateur refusé."
        );

        window.location.replace(
            "dashboard.html"
        );

        return null;
    }

    return user;
}


/* =========================================================
   NETTOYER AUTHENTIFICATION
========================================================= */

function clearAuthStorage() {

    localStorage.removeItem(
        "travailplus_token"
    );

    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "travailplus_user"
    );

    localStorage.removeItem(
        "user"
    );

    sessionStorage.removeItem(
        "travailplus_token"
    );

    sessionStorage.removeItem(
        "token"
    );
}


/* =========================================================
   DÉCONNEXION
========================================================= */

function logout(redirect = true) {

    clearAuthStorage();

    if (redirect) {

        window.location.replace(
            "login.html"
        );
    }
}


/* =========================================================
   EXPORT GLOBAL
========================================================= */

window.TravailPlusAuth = {

    getToken,

    getUser,

    getCurrentUser,

    requireAuth,

    requireAdmin,

    logout
};