

"use strict";

// ======================================================
// CONFIGURATION API
// ======================================================

const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000/api/users"
        : "https://travailplus-backend.onrender.com/api/users";


// ======================================================
// DOM
// ======================================================

const myRank =
    document.getElementById("myRank");

const myName =
    document.getElementById("myName");

const myDetails =
    document.getElementById("myDetails");

const myXp =
    document.getElementById("myXp");

const topThree =
    document.getElementById("topThree");

const topThreeLoading =
    document.getElementById("topThreeLoading");

const topThreeError =
    document.getElementById("topThreeError");

const leaderboardList =
    document.getElementById("leaderboardList");

const leaderboardLoading =
    document.getElementById("leaderboardLoading");

const leaderboardError =
    document.getElementById("leaderboardError");

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
// REDIRECTION SI SESSION ABSENTE
// ======================================================

function requireToken() {

    const token = getToken();

    if (!token) {

        window.location.href =
            "login.html";

        return null;
    }

    return token;
}


// ======================================================
// FORMAT XP
// ======================================================

function formatXp(xp) {

    return Number(xp || 0).toLocaleString(
        "fr-FR"
    );
}


// ======================================================
// NOM UTILISATEUR
// ======================================================

function getFullName(user) {

    return [
        user.first_name,
        user.last_name
    ]
        .filter(Boolean)
        .join(" ");
}


// ======================================================
// DÉTAILS UTILISATEUR
// ======================================================

function getUserDetails(user) {

    return [
        user.faculty,
        user.department,
        user.level
    ]
        .filter(Boolean)
        .join(" • ");
}


// ======================================================
// AFFICHER ERREUR
// ======================================================

function showError(element, message) {

    element.textContent = message;

    element.classList.remove(
        "hidden"
    );
}


// ======================================================
// CHARGER MA POSITION
// ======================================================

async function loadMyRanking() {

    const token = requireToken();

    if (!token) return;

    try {

        const response = await fetch(
            `${API_URL}/leaderboard/me`,
            {
                method: "GET",

                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        if (response.status === 401) {

            window.location.href =
                "login.html";

            return;
        }


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Impossible de récupérer votre classement."
            );
        }


        const ranking =
            data.ranking;


        myRank.textContent =
            `#${ranking.rank}`;

        myName.textContent =
            getFullName(ranking);

        myDetails.textContent =
            getUserDetails(ranking);

        myXp.textContent =
            formatXp(ranking.xp);


    } catch (error) {

        console.error(
            "Erreur récupération position :",
            error
        );

        myName.textContent =
            "Classement indisponible";

        myDetails.textContent =
            error.message ||
            "Impossible de récupérer votre position.";

        myRank.textContent =
            "—";

        myXp.textContent =
            "0";
    }
}


// ======================================================
// CHARGER TOP 3
// ======================================================

async function loadTopThree() {

    const token = requireToken();

    if (!token) return;

    topThreeLoading.classList.remove(
        "hidden"
    );

    topThree.innerHTML = "";

    topThreeError.classList.add(
        "hidden"
    );


    try {

        const response = await fetch(
            `${API_URL}/leaderboard/top`,
            {
                method: "GET",

                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        if (response.status === 401) {

            window.location.href =
                "login.html";

            return;
        }


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Impossible de récupérer le Top 3."
            );
        }


        renderTopThree(
            Array.isArray(data.topThree)
                ? data.topThree
                : []
        );


    } catch (error) {

        console.error(
            "Erreur Top 3 :",
            error
        );

        showError(
            topThreeError,
            error.message ||
            "Impossible de charger le Top 3."
        );

    } finally {

        topThreeLoading.classList.add(
            "hidden"
        );
    }
}


// ======================================================
// AFFICHER TOP 3
// ======================================================

function renderTopThree(players) {

    topThree.innerHTML = "";


    if (players.length === 0) {

        topThree.innerHTML = `
            <div class="empty-state">
                Aucun étudiant classé pour le moment.
            </div>
        `;

        return;
    }


    players.forEach(player => {

        const card =
            document.createElement("article");

        card.className =
            "top-player";


        const rank =
            document.createElement("div");

        rank.className =
            "top-rank";

        rank.textContent =
            `#${player.rank}`;


        const avatar =
            document.createElement("div");

        avatar.className =
            "player-avatar";

        avatar.textContent =
            getInitials(player);


        const info =
            document.createElement("div");

        info.className =
            "top-player-info";


        const name =
            document.createElement("h3");

        name.textContent =
            getFullName(player);


        const details =
            document.createElement("p");

        details.textContent =
            player.level ||
            "Étudiant";


        const xp =
            document.createElement("strong");

        xp.className =
            "top-player-xp";

        xp.textContent =
            `${formatXp(player.xp)} XP`;


        info.appendChild(name);

        info.appendChild(details);


        card.appendChild(rank);

        card.appendChild(avatar);

        card.appendChild(info);

        card.appendChild(xp);


        topThree.appendChild(card);

    });
}


// ======================================================
// CHARGER CLASSEMENT COMPLET
// ======================================================

async function loadLeaderboard() {

    const token = requireToken();

    if (!token) return;

    leaderboardLoading.classList.remove(
        "hidden"
    );

    leaderboardList.innerHTML = "";

    leaderboardError.classList.add(
        "hidden"
    );


    try {

        const response = await fetch(
            `${API_URL}/leaderboard?limit=50`,
            {
                method: "GET",

                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        if (response.status === 401) {

            window.location.href =
                "login.html";

            return;
        }


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Impossible de récupérer le classement."
            );
        }


        renderLeaderboard(
            Array.isArray(data.leaderboard)
                ? data.leaderboard
                : []
        );


    } catch (error) {

        console.error(
            "Erreur classement :",
            error
        );

        showError(
            leaderboardError,
            error.message ||
            "Impossible de charger le classement."
        );

    } finally {

        leaderboardLoading.classList.add(
            "hidden"
        );
    }
}


// ======================================================
// AFFICHER CLASSEMENT
// ======================================================

function renderLeaderboard(players) {

    leaderboardList.innerHTML = "";


    if (players.length === 0) {

        leaderboardList.innerHTML = `
            <div class="empty-state">
                Aucun étudiant classé pour le moment.
            </div>
        `;

        return;
    }


    players.forEach(player => {

        const row =
            document.createElement("article");

        row.className =
            "ranking-row";


        const rank =
            document.createElement("div");

        rank.className =
            "ranking-number";

        rank.textContent =
            `#${player.rank}`;


        const avatar =
            document.createElement("div");

        avatar.className =
            "ranking-avatar";

        avatar.textContent =
            getInitials(player);


        const info =
            document.createElement("div");

        info.className =
            "ranking-info";


        const name =
            document.createElement("h3");

        name.textContent =
            getFullName(player);


        const details =
            document.createElement("p");

        details.textContent =
            getUserDetails(player);


        info.appendChild(name);

        info.appendChild(details);


        const streak =
            document.createElement("div");

        streak.className =
            "ranking-streak";

        streak.textContent =
            `🔥 ${Number(player.streak || 0)}`;


        const xp =
            document.createElement("strong");

        xp.className =
            "ranking-xp";

        xp.textContent =
            `${formatXp(player.xp)} XP`;


        row.appendChild(rank);

        row.appendChild(avatar);

        row.appendChild(info);

        row.appendChild(streak);

        row.appendChild(xp);


        leaderboardList.appendChild(row);

    });
}


// ======================================================
// INITIALLES
// ======================================================

function getInitials(user) {

    const first =
        user.first_name
            ? user.first_name.charAt(0)
            : "";

    const last =
        user.last_name
            ? user.last_name.charAt(0)
            : "";

    return (
        `${first}${last}`.toUpperCase() ||
        "?"
    );
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
// INITIALISATION
// ======================================================

async function initializeLeaderboard() {

    await Promise.all([
        loadMyRanking(),
        loadTopThree(),
        loadLeaderboard()
    ]);
}


initializeLeaderboard();