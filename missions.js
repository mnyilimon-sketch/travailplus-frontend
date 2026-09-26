

"use strict";


/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000/api/missions"
        : "https://travailplus-backend.onrender.com/api/missions";


/*
|--------------------------------------------------------------------------
| ELEMENTS HTML
|--------------------------------------------------------------------------
*/

const missionsList =
    document.getElementById("missionsList");

const missionsMessage =
    document.getElementById("missionsMessage");

const missionCount =
    document.getElementById("missionCount");

const completedCount =
    document.getElementById("completedCount");

const totalXp =
    document.getElementById("totalXp");

const backButton =
    document.getElementById("backButton");


/*
|--------------------------------------------------------------------------
| TOKEN JWT
|--------------------------------------------------------------------------
*/

const token =
    localStorage.getItem("travailplus_token");


/*
|--------------------------------------------------------------------------
| VÉRIFICATION CONNEXION
|--------------------------------------------------------------------------
*/

if (!token) {

    window.location.href = "login.html";

}


/*
|--------------------------------------------------------------------------
| RETOUR DASHBOARD
|--------------------------------------------------------------------------
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
|--------------------------------------------------------------------------
| MESSAGE
|--------------------------------------------------------------------------
*/

function showMessage(message, type) {

    if (!missionsMessage) {
        return;
    }

    missionsMessage.textContent =
        message;

    missionsMessage.className =
        "missions-message " + type;

}


/*
|--------------------------------------------------------------------------
| CHARGER LES MISSIONS
|--------------------------------------------------------------------------
*/

async function loadMissions() {

    if (!missionsList) {
        return;
    }


    try {

        showMessage(
            "Chargement des missions...",
            "info"
        );


        const response =
            await fetch(
                API_URL,
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


        const data =
            await response.json();


        console.log(
            "Missions reçues :",
            data
        );


        /*
        |--------------------------------------------------------------------------
        | TOKEN INVALIDE
        |--------------------------------------------------------------------------
        */

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


        /*
        |--------------------------------------------------------------------------
        | ERREUR SERVEUR
        |--------------------------------------------------------------------------
        */

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Impossible de récupérer les missions."
            );

        }


        /*
        |--------------------------------------------------------------------------
        | VÉRIFICATION RÉPONSE
        |--------------------------------------------------------------------------
        */

        if (
            !data.success ||
            !Array.isArray(data.missions)
        ) {

            throw new Error(
                "Réponse du serveur invalide."
            );

        }


        /*
        |--------------------------------------------------------------------------
        | AFFICHAGE
        |--------------------------------------------------------------------------
        */

        displayMissions(
            data.missions
        );


        showMessage(
            "",
            ""
        );


    } catch (error) {

        console.error(
            "Erreur chargement missions :",
            error
        );


        missionsList.innerHTML = `
            <div class="error-box">
                Impossible de charger les missions.
                <br><br>
                Vérifie ta connexion Internet puis actualise la page.
            </div>
        `;


        showMessage(
            error.message,
            "error"
        );

    }

}


/*
|--------------------------------------------------------------------------
| AFFICHER LES MISSIONS
|--------------------------------------------------------------------------
*/

function displayMissions(missions) {

    missionCount.textContent =
        missions.length;


    const completed =
        missions.filter(
            mission => mission.completed
        );


    completedCount.textContent =
        completed.length;


    const xp =
        completed.reduce(
            (total, mission) =>
                total +
                Number(mission.xp_reward || 0),
            0
        );


    totalXp.textContent =
        `${xp} XP`;


    /*
    |--------------------------------------------------------------------------
    | AUCUNE MISSION
    |--------------------------------------------------------------------------
    */

    if (missions.length === 0) {

        missionsList.innerHTML = `
            <div class="loading">
                Aucune mission disponible aujourd'hui.
            </div>
        `;

        return;

    }


    /*
    |--------------------------------------------------------------------------
    | CARTES
    |--------------------------------------------------------------------------
    */

    missionsList.innerHTML =
        missions
            .map(
                mission =>
                    createMissionCard(mission)
            )
            .join("");


    /*
    |--------------------------------------------------------------------------
    | BOUTONS TERMINER
    |--------------------------------------------------------------------------
    */

    const buttons =
        document.querySelectorAll(
            ".complete-btn"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const missionId =
                    Number(
                        button.dataset.missionId
                    );

                completeMission(
                    missionId,
                    button
                );

            }
        );

    });

}


/*
|--------------------------------------------------------------------------
| CRÉER UNE CARTE
|--------------------------------------------------------------------------
*/

function createMissionCard(mission) {

    const completed =
        Boolean(mission.completed);


    const icon =
        getMissionIcon(mission.type);


    const type =
        formatMissionType(
            mission.type
        );


    return `
        <article
            class="mission-card ${completed ? "completed" : ""}"
            data-mission-id="${mission.id}"
        >

            <div class="mission-icon">
                ${icon}
            </div>


            <h2>
                ${escapeHTML(
                    mission.title
                )}
            </h2>


            <p class="mission-description">
                ${escapeHTML(
                    mission.description || ""
                )}
            </p>


            <div class="mission-info">

                <span class="mission-xp">
                    ⭐ +${Number(
                        mission.xp_reward || 0
                    )} XP
                </span>

                <span class="mission-type">
                    ${escapeHTML(type)}
                </span>

            </div>


            ${
                completed
                    ? `
                        <button
                            class="complete-btn"
                            disabled
                            type="button"
                        >
                            ✓ Mission terminée
                        </button>

                        <div class="completed-label">
                            Mission déjà accomplie
                        </div>
                    `
                    : `
                        <button
                            class="complete-btn"
                            data-mission-id="${mission.id}"
                            type="button"
                        >
                            Terminer la mission
                        </button>
                    `
            }

        </article>
    `;

}


/*
|--------------------------------------------------------------------------
| TERMINER UNE MISSION
|--------------------------------------------------------------------------
*/

async function completeMission(missionId, button) {

    if (!missionId || !button) {
        return;
    }

    const currentToken =
        localStorage.getItem("travailplus_token");

    if (!currentToken) {
        window.location.href = "login.html";
        return;
    }

    try {

        // Désactiver immédiatement le bouton
        button.disabled = true;
        button.textContent = "Validation...";

        const response = await fetch(
            `${API_URL}/complete`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${currentToken}`
                },

                body: JSON.stringify({
                    missionId: Number(missionId)
                })
            }
        );

        const data = await response.json();

        console.log(
            "Réponse completion :",
            data
        );

        // ==================================================
        // TOKEN INVALIDE / EXPIRÉ
        // ==================================================

        if (response.status === 401) {

            localStorage.removeItem(
                "travailplus_token"
            );

            localStorage.removeItem(
                "travailplus_user"
            );

            window.location.href = "login.html";

            return;
        }

        // ==================================================
        // ERREUR SERVEUR
        // ==================================================

        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Impossible de terminer la mission."
            );
        }

        // ==================================================
        // SAUVEGARDER L'UTILISATEUR MIS À JOUR
        // ==================================================

        if (data.user) {

            localStorage.setItem(
                "travailplus_user",
                JSON.stringify(data.user)
            );
        }

        // ==================================================
        // MISSION TERMINÉE
        // ==================================================

        const missionCard =
            button.closest(".mission-card");

        if (missionCard) {

            missionCard.classList.add("completed");
        }

        button.disabled = true;
        button.textContent = "✓ Terminée";

        // ==================================================
        // MESSAGE DE SUCCÈS
        // ==================================================

        showMessage(
            data.message ||
            "Mission terminée avec succès !",
            "success"
        );

        // ==================================================
        // ACTUALISER LES MISSIONS DEPUIS LA BASE
        // ==================================================

        await loadMissions();

    } catch (error) {

        console.error(
            "Erreur completion mission :",
            error
        );

        // Réactiver le bouton si la mission n'a pas été
        // validée par le serveur.

        button.disabled = false;
        button.textContent = "Terminer la mission";

        showMessage(
            error.message ||
            "Impossible de terminer la mission.",
            "error"
        );
    }
}

/*
|--------------------------------------------------------------------------
| DÉMARRAGE
|--------------------------------------------------------------------------
*/

loadMissions();