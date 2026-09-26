
(async function () {

    const user = await TravailPlusAuth.requireAuth();

    if (!user) {
        return;
    }

    window.TravailPlusCurrentUser = user;


"use strict";


/*
|--------------------------------------------------------------------------
| CONFIGURATION API
|--------------------------------------------------------------------------
*/

const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000/api/auth"
        : "https://travailplus-backend.onrender.com/api/auth";
    `${window.TravailPlusConfig?.apiBase || "http://localhost:5000/api"}/auth`;


/*
|--------------------------------------------------------------------------
| ÉLÉMENTS HTML
|--------------------------------------------------------------------------
*/

const userName = document.getElementById("userName");
const profileName = document.getElementById("profileName");

const userEmail = document.getElementById("userEmail");
const userFaculty = document.getElementById("userFaculty");
const userDepartment = document.getElementById("userDepartment");
const userLevel = document.getElementById("userLevel");

const userAvatar = document.getElementById("userAvatar");

const userXp = document.getElementById("userXp");
const userStreak = document.getElementById("userStreak");

const logoutButton = document.getElementById("logoutButton");


/*
|--------------------------------------------------------------------------
| CHARGEMENT DU PROFIL UTILISATEUR
|--------------------------------------------------------------------------
*/

async function loadUserProfile() {

    // Récupération du token JWT enregistré lors de la connexion
    const token =
        localStorage.getItem("travailplus_token");


    // Si aucun token n'est trouvé, retour à la connexion
    if (!token) {

        window.location.href = "login.html";

        return;
    }


    try {

        /*
        |--------------------------------------------------------------------------
        | APPEL DE L'API /ME
        |--------------------------------------------------------------------------
        */

        const response = await fetch(
            `${API_URL}/me`,
            {
                method: "GET",

                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        /*
        |--------------------------------------------------------------------------
        | VÉRIFICATION DE LA SESSION
        |--------------------------------------------------------------------------
        */

        if (!response.ok) {

            console.error(
                "Session invalide :",
                response.status
            );


            // Suppression du token invalide
            localStorage.removeItem(
                "travailplus_token"
            );

            localStorage.removeItem(
                "travailplus_user"
            );


            // Retour à la page de connexion
            window.location.href =
                "login.html";

            return;
        }


        /*
        |--------------------------------------------------------------------------
        | LECTURE DE LA RÉPONSE
        |--------------------------------------------------------------------------
        */

        const data =
            await response.json();


        console.log(
            "Profil utilisateur :",
            data
        );


        /*
        |--------------------------------------------------------------------------
        | VÉRIFICATION DES DONNÉES
        |--------------------------------------------------------------------------
        */

        if (!data.success || !data.user) {

            console.error(
                "Données utilisateur introuvables."
            );

            return;
        }


        /*
        |--------------------------------------------------------------------------
        | UTILISATEUR CONNECTÉ
        |--------------------------------------------------------------------------
        */

        const user =
            data.user;


        const firstName =
            user.firstName || "";

        const lastName =
            user.lastName || "";


        const fullName =
            `${firstName} ${lastName}`.trim();


        const displayName =
            firstName ||
            lastName ||
            "Utilisateur";


        /*
        |--------------------------------------------------------------------------
        | NOM DANS LE MESSAGE DE BIENVENUE
        |--------------------------------------------------------------------------
        */

        if (userName) {

            userName.textContent =
                displayName;
        }


        /*
        |--------------------------------------------------------------------------
        | NOM COMPLET DU PROFIL
        |--------------------------------------------------------------------------
        */

        if (profileName) {

            profileName.textContent =
                fullName ||
                "Utilisateur";
        }


        /*
        |--------------------------------------------------------------------------
        | EMAIL
        |--------------------------------------------------------------------------
        */

        if (userEmail) {

            userEmail.textContent =
                user.email || "-";
        }


        /*
        |--------------------------------------------------------------------------
        | FACULTÉ
        |--------------------------------------------------------------------------
        */

        if (userFaculty) {

            userFaculty.textContent =
                user.faculty || "-";
        }


        /*
        |--------------------------------------------------------------------------
        | DÉPARTEMENT
        |--------------------------------------------------------------------------
        */

        if (userDepartment) {

            userDepartment.textContent =
                user.department || "-";
        }


        /*
        |--------------------------------------------------------------------------
        | NIVEAU
        |--------------------------------------------------------------------------
        */

        if (userLevel) {

            userLevel.textContent =
                user.level || "-";
        }


        /*
        |--------------------------------------------------------------------------
        | AVATAR
        |--------------------------------------------------------------------------
        */

        if (userAvatar) {

            const firstLetter =
                (
                    firstName ||
                    lastName ||
                    "U"
                )
                .charAt(0)
                .toUpperCase();


            userAvatar.textContent =
                firstLetter;
        }


        /*
        |--------------------------------------------------------------------------
        | XP
        |--------------------------------------------------------------------------
        */

        if (userXp) {

            userXp.textContent =
                user.xp ?? 0;
        }


        /*
        |--------------------------------------------------------------------------
        | STREAK
        |--------------------------------------------------------------------------
        */

        if (userStreak) {

            userStreak.textContent =
                user.streak ?? 0;
        }


        /*
        |--------------------------------------------------------------------------
        | MISE À JOUR DU STOCKAGE LOCAL
        |--------------------------------------------------------------------------
        */

        localStorage.setItem(
            "travailplus_user",
            JSON.stringify(user)
        );

    } catch (error) {

        /*
        |--------------------------------------------------------------------------
        | ERREUR SERVEUR
        |--------------------------------------------------------------------------
        */

        console.error(
            "Erreur lors du chargement du profil :",
            error
        );

    }

}


/*
|--------------------------------------------------------------------------
| DÉCONNEXION
|--------------------------------------------------------------------------
*/

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        () => {

            /*
            |--------------------------------------------------------------------------
            | SUPPRESSION DE LA SESSION
            |--------------------------------------------------------------------------
            */

            localStorage.removeItem(
                "travailplus_token"
            );

            localStorage.removeItem(
                "travailplus_user"
            );


            /*
            |--------------------------------------------------------------------------
            | REDIRECTION
            |--------------------------------------------------------------------------
            */

            window.location.href =
                "login.html";

        }
    );

}


/*
|--------------------------------------------------------------------------
| INITIALISATION
|--------------------------------------------------------------------------
*/

// Chargement automatique du profil
// lorsque le dashboard est ouvert.

loadUserProfile();


/*
|--------------------------------------------------------------------------
| ACCÈS AUX MISSIONS
|--------------------------------------------------------------------------
*/

const missionsButton =
    document.getElementById("missionsButton");

if (missionsButton) {

    missionsButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "missions.html";

        }
    );

}


/*
|--------------------------------------------------------------------------
| ACCÈS AUX QUIZ
|--------------------------------------------------------------------------
*/

const quizButton =
    document.getElementById("quizButton");

if (quizButton) {

    quizButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "quiz.html";

        }
    );

}


const documentsButton =
    document.getElementById("documentsButton");

if (documentsButton) {

    documentsButton.addEventListener(
        "click",
        () => {
            window.location.href =
                "documents.html";
        }
    );

}


/*
|--------------------------------------------------------------------------
| NAVIGATION DES CARTES DU DASHBOARD
|--------------------------------------------------------------------------
| Cette partie permet aux boutons possédant
| data-page="..." de fonctionner.
|--------------------------------------------------------------------------
*/

const actionCards =
    document.querySelectorAll(
        ".action-card[data-page]"
    );

console.log(
    "Cartes du dashboard trouvées :",
    actionCards.length
);


actionCards.forEach(
    (button) => {

        button.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                const page =
                    button.getAttribute(
                        "data-page"
                    );


                console.log(
                    "Clic dashboard :",
                    page
                );


                if (!page) {

                    console.error(
                        "Aucune page définie pour ce bouton."
                    );

                    return;
                }


                window.location.href =
                    page;

            }
        );

    }
);


/*
|--------------------------------------------------------------------------
| FIN
|--------------------------------------------------------------------------
*/

})();


Avec cette version, tes cartes actuelles :

* **Cours** → `courses.html`
* **Exercices** → `exercises.html`
* **Classement** → `leaderboard.html`
* **Missions** → `missions.html`
* **Quiz** → `quiz.html`
* **Documents** → `documents.html`
* **Boutique** → `shop.html`
* **Mon profil** → `annuaire.html`

fonctionneront **si elles possèdent bien `data-page="..."`**, comme dans ton `dashboard.html`.

Et tes anciens boutons avec `id="missionsButton"`, `id="quizButton"` et `id="documentsButton"` restent également fonctionnels.
