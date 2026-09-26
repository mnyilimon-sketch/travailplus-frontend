"use strict";

/* ======================================================
   TRAVAIL+ - ANNUAIRE
====================================================== */
const ANNUAIRE_API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000/api/annuaire"
        : "https://travailplus-backend.onrender.com/api/annuaire";
    `${window.TravailPlusConfig?.apiBase || "http://localhost:5000/api"}/annuaire`;


/* ======================================================
   ELEMENTS
====================================================== */

const searchInput =
    document.getElementById("searchInput");

const clearSearch =
    document.getElementById("clearSearch");

const facultyFilter =
    document.getElementById("facultyFilter");

const departmentFilter =
    document.getElementById("departmentFilter");

const levelFilter =
    document.getElementById("levelFilter");

const resetFilters =
    document.getElementById("resetFilters");

const studentsGrid =
    document.getElementById("studentsGrid");

const loadingState =
    document.getElementById("loadingState");

const emptyState =
    document.getElementById("emptyState");

const studentCount =
    document.getElementById("studentCount");

const annuaireMessage =
    document.getElementById("annuaireMessage");

const studentModal =
    document.getElementById("studentModal");

const closeModal =
    document.getElementById("closeModal");

const modalOverlay =
    document.querySelector(".modal-overlay");

const themeToggle =
    document.getElementById("themeToggle");

const logoutButton =
    document.getElementById("logoutButton");


let students = [];
let searchTimer = null;


/* ======================================================
   TOKEN
====================================================== */

function getToken() {

    try {

        if (
            typeof TravailPlusAuth !== "undefined" &&
            typeof TravailPlusAuth.getToken === "function"
        ) {
            return TravailPlusAuth.getToken();
        }

    } catch (error) {

        console.warn(
            "TravailPlusAuth indisponible."
        );
    }

    return (
        localStorage.getItem("token") ||
        localStorage.getItem("travailplus_token") ||
        null
    );
}


/* ======================================================
   HEADERS
====================================================== */

function getHeaders() {

    const token = getToken();

    const headers = {
        "Content-Type": "application/json"
    };

    if (token) {
        headers.Authorization =
            `Bearer ${token}`;
    }

    return headers;
}


/* ======================================================
   MESSAGES
====================================================== */

function showMessage(message) {

    if (!annuaireMessage) return;

    annuaireMessage.textContent = message;

    annuaireMessage.classList.remove(
        "hidden"
    );
}


function hideMessage() {

    if (!annuaireMessage) return;

    annuaireMessage.classList.add(
        "hidden"
    );
}


/* ======================================================
   LOADING
====================================================== */

function showLoading() {

    if (loadingState) {
        loadingState.classList.remove(
            "hidden"
        );
    }

    if (emptyState) {
        emptyState.classList.add(
            "hidden"
        );
    }

    if (studentsGrid) {
        studentsGrid.innerHTML = "";
    }
}


function hideLoading() {

    if (loadingState) {
        loadingState.classList.add(
            "hidden"
        );
    }
}


/* ======================================================
   CHARGER LES ETUDIANTS
====================================================== */

async function loadStudents() {

    showLoading();
    hideMessage();

    try {

        const params =
            new URLSearchParams();

        const search =
            searchInput?.value.trim() || "";

        const faculty =
            facultyFilter?.value || "";

        const department =
            departmentFilter?.value || "";

        const level =
            levelFilter?.value || "";


        if (search) {
            params.set(
                "search",
                search
            );
        }

        if (faculty) {
            params.set(
                "faculty",
                faculty
            );
        }

        if (department) {
            params.set(
                "department",
                department
            );
        }

        if (level) {
            params.set(
                "level",
                level
            );
        }


        const query =
            params.toString();

        const url =
            query
                ? `${ANNUAIRE_API_URL}?${query}`
                : ANNUAIRE_API_URL;


        const response =
            await fetch(url, {
                method: "GET",
                headers: getHeaders()
            });


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {
            throw new Error(
                data.message ||
                "Impossible de charger l'annuaire."
            );
        }


        students =
            Array.isArray(data.students)
                ? data.students
                : [];


        renderStudents();

    } catch (error) {

        console.error(
            "Erreur annuaire :",
            error
        );

        students = [];

        hideLoading();

        if (studentsGrid) {
            studentsGrid.innerHTML = "";
        }

        if (studentCount) {
            studentCount.textContent =
                "0 étudiant";
        }

        showMessage(
            error.message ||
            "Impossible de contacter le serveur."
        );
    }
}


/* ======================================================
   AFFICHER LES ETUDIANTS
====================================================== */

function renderStudents() {

    hideLoading();

    const count =
        students.length;


    if (studentCount) {

        studentCount.textContent =
            `${count} étudiant${count > 1 ? "s" : ""}`;
    }


    if (count === 0) {

        if (studentsGrid) {
            studentsGrid.innerHTML = "";
        }

        if (emptyState) {
            emptyState.classList.remove(
                "hidden"
            );
        }

        return;
    }


    if (emptyState) {
        emptyState.classList.add(
            "hidden"
        );
    }


    if (studentsGrid) {

        studentsGrid.innerHTML =
            students
                .map(createStudentCard)
                .join("");
    }
}


/* ======================================================
   CARTE ETUDIANT
====================================================== */

function createStudentCard(student) {

    const rawFirstName =
        student.firstName || "";

    const rawLastName =
        student.lastName || "";


    const fullName =
        student.fullName ||
        `${rawFirstName} ${rawLastName}`.trim();


    const faculty =
        student.faculty ||
        "Non renseignée";


    const department =
        student.department ||
        "Non renseigné";


    const academicLevel =
        student.level ||
        "Non renseigné";


    const gameLevel =
        student.levelName ||
        "Débutant";


    const initials =
        getInitials(
            rawFirstName,
            rawLastName
        );


    const premium =
        student.isPremium
            ? `
                <span class="premium-badge">
                    <span class="material-icons">
                        workspace_premium
                    </span>
                    Premium
                </span>
              `
            : "";


    const online =
        student.isOnline
            ? `
                <span
                    class="online-dot"
                    title="En ligne"
                ></span>
              `
            : "";


    return `
        <article
            class="student-card"
            data-id="${Number(student.id)}"
            tabindex="0"
            role="button"
            aria-label="Voir le profil de ${escapeHtml(fullName)}"
        >

            <div class="student-top">

                <div class="avatar">

                    ${escapeHtml(initials)}

                    ${online}

                </div>


                <div>

                    <div class="student-name">

                        ${escapeHtml(fullName)}

                        ${premium}

                    </div>


                    <div class="student-level">

                        Niveau
                        ${escapeHtml(gameLevel)}

                    </div>

                </div>

            </div>


            <div class="student-info">

                <div class="info-row">

                    <span class="material-icons">
                        school
                    </span>

                    <span>
                        ${escapeHtml(faculty)}
                    </span>

                </div>


                <div class="info-row">

                    <span class="material-icons">
                        account_tree
                    </span>

                    <span>
                        ${escapeHtml(department)}
                    </span>

                </div>


                <div class="info-row">

                    <span class="material-icons">
                        menu_book
                    </span>

                    <span>
                        ${escapeHtml(academicLevel)}
                    </span>

                </div>

            </div>


            <div class="student-stats">

                <div class="stat">

                    <span class="material-icons">
                        stars
                    </span>

                    ${Number(student.xp) || 0} XP

                </div>


                <div class="stat">

                    <span class="material-icons">
                        local_fire_department
                    </span>

                    ${
                        Number(student.streak) || 0
                    }
                    jour${
                        Number(student.streak) > 1
                            ? "s"
                            : ""
                    }

                </div>

            </div>

        </article>
    `;
}


/* ======================================================
   INITIALES
====================================================== */

function getInitials(
    firstName,
    lastName
) {

    const first =
        String(firstName)
            .trim()
            .charAt(0)
            .toUpperCase();


    const last =
        String(lastName)
            .trim()
            .charAt(0)
            .toUpperCase();


    return (
        first + last
    ) || "?";
}


/* ======================================================
   SECURITE HTML
====================================================== */

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* ======================================================
   FACULTES
====================================================== */

async function loadFaculties() {

    try {

        const response =
            await fetch(
                `${ANNUAIRE_API_URL}/faculties`,
                {
                    headers: getHeaders()
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {
            throw new Error(
                data.message ||
                "Impossible de charger les facultés."
            );
        }


        facultyFilter.innerHTML = `
            <option value="">
                Toutes les facultés
            </option>
        `;


        const faculties =
            Array.isArray(data.faculties)
                ? data.faculties
                : [];


        faculties.forEach(
            faculty => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    faculty;

                option.textContent =
                    faculty;

                facultyFilter.appendChild(
                    option
                );
            }
        );

    } catch (error) {

        console.error(
            "Erreur facultés :",
            error
        );
    }
}


/* ======================================================
   DEPARTEMENTS
====================================================== */

async function loadDepartments() {

    try {

        const params =
            new URLSearchParams();


        if (facultyFilter.value) {

            params.set(
                "faculty",
                facultyFilter.value
            );
        }


        const query =
            params.toString();


        const url =
            query
                ? `${ANNUAIRE_API_URL}/departments?${query}`
                : `${ANNUAIRE_API_URL}/departments`;


        const response =
            await fetch(
                url,
                {
                    headers: getHeaders()
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {
            throw new Error(
                data.message ||
                "Impossible de charger les départements."
            );
        }


        departmentFilter.innerHTML = `
            <option value="">
                Tous les départements
            </option>
        `;


        const departments =
            Array.isArray(data.departments)
                ? data.departments
                : [];


        departments.forEach(
            department => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    department;

                option.textContent =
                    department;

                departmentFilter.appendChild(
                    option
                );
            }
        );

    } catch (error) {

        console.error(
            "Erreur départements :",
            error
        );
    }
}


/* ======================================================
   NIVEAUX
====================================================== */

function loadLevels() {

    const levels = [
        "L1",
        "L2",
        "L3",
        "M1",
        "M2",
        "Doctorat"
    ];


    levels.forEach(
        level => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                level;

            option.textContent =
                level;

            levelFilter.appendChild(
                option
            );
        }
    );
}


/* ======================================================
   PROFIL ETUDIANT
====================================================== */

async function openStudentProfile(
    studentId
) {

    try {

        const response =
            await fetch(
                `${ANNUAIRE_API_URL}/${studentId}`,
                {
                    headers: getHeaders()
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {
            throw new Error(
                data.message ||
                "Impossible de charger le profil."
            );
        }


        showStudentModal(
            data.student
        );

    } catch (error) {

        console.error(
            "Erreur profil étudiant :",
            error
        );

        showMessage(
            error.message ||
            "Impossible de charger le profil."
        );
    }
}


/* ======================================================
   MODAL
====================================================== */

function showStudentModal(student) {

    const fullName =
        student.fullName ||
        `${student.firstName || ""} ${student.lastName || ""}`.trim();


    document.getElementById(
        "modalAvatar"
    ).textContent =
        getInitials(
            student.firstName || "",
            student.lastName || ""
        );


    document.getElementById(
        "modalStudentName"
    ).textContent =
        fullName;


    document.getElementById(
        "modalStudentEmail"
    ).textContent =
        student.email || "";


    document.getElementById(
        "modalFaculty"
    ).textContent =
        student.faculty ||
        "Non renseignée";


    document.getElementById(
        "modalDepartment"
    ).textContent =
        student.department ||
        "Non renseigné";


    document.getElementById(
        "modalAcademicLevel"
    ).textContent =
        student.level ||
        "Non renseigné";


    document.getElementById(
        "modalGameLevel"
    ).textContent =
        student.levelName ||
        "Débutant";


    document.getElementById(
        "modalXP"
    ).textContent =
        `${Number(student.xp) || 0} XP`;


    const streak =
        Number(student.streak) || 0;


    document.getElementById(
        "modalStreak"
    ).textContent =
        `${streak} jour${streak > 1 ? "s" : ""}`;


    studentModal.classList.remove(
        "hidden"
    );

    studentModal.setAttribute(
        "aria-hidden",
        "false"
    );
}


function closeStudentModal() {

    studentModal.classList.add(
        "hidden"
    );

    studentModal.setAttribute(
        "aria-hidden",
        "true"
    );
}


/* ======================================================
   RECHERCHE
====================================================== */

searchInput.addEventListener(
    "input",
    () => {

        clearSearch.classList.toggle(
            "hidden",
            !searchInput.value
        );


        clearTimeout(
            searchTimer
        );


        searchTimer =
            setTimeout(
                loadStudents,
                300
            );
    }
);


/* ======================================================
   EFFACER RECHERCHE
====================================================== */

clearSearch.addEventListener(
    "click",
    () => {

        searchInput.value = "";

        clearSearch.classList.add(
            "hidden"
        );

        loadStudents();
    }
);


/* ======================================================
   FACULTE
====================================================== */

facultyFilter.addEventListener(
    "change",
    async () => {

        await loadDepartments();

        departmentFilter.value = "";

        loadStudents();
    }
);


/* ======================================================
   DEPARTEMENT
====================================================== */

departmentFilter.addEventListener(
    "change",
    loadStudents
);


/* ======================================================
   NIVEAU
====================================================== */

levelFilter.addEventListener(
    "change",
    loadStudents
);


/* ======================================================
   RESET
====================================================== */

resetFilters.addEventListener(
    "click",
    async () => {

        searchInput.value = "";

        facultyFilter.value = "";

        departmentFilter.value = "";

        levelFilter.value = "";

        clearSearch.classList.add(
            "hidden"
        );

        await loadDepartments();

        loadStudents();
    }
);


/* ======================================================
   CLIC SUR CARTE
====================================================== */

studentsGrid.addEventListener(
    "click",
    event => {

        const card =
            event.target.closest(
                ".student-card"
            );


        if (!card) return;


        openStudentProfile(
            card.dataset.id
        );
    }
);


/* ======================================================
   CLAVIER
====================================================== */

studentsGrid.addEventListener(
    "keydown",
    event => {

        if (
            event.key !== "Enter" &&
            event.key !== " "
        ) {
            return;
        }


        const card =
            event.target.closest(
                ".student-card"
            );


        if (!card) return;


        event.preventDefault();


        openStudentProfile(
            card.dataset.id
        );
    }
);


/* ======================================================
   FERMER MODAL
====================================================== */

closeModal.addEventListener(
    "click",
    closeStudentModal
);


modalOverlay.addEventListener(
    "click",
    closeStudentModal
);


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            !studentModal.classList.contains(
                "hidden"
            )
        ) {
            closeStudentModal();
        }
    }
);


/* ======================================================
   THEME
====================================================== */

function applyTheme() {

    const theme =
        localStorage.getItem(
            "travailplus_theme"
        );


    if (theme === "dark") {

        document.body.classList.add(
            "dark"
        );

    } else {

        document.body.classList.remove(
            "dark"
        );
    }
}


themeToggle.addEventListener(
    "click",
    () => {

        const isDark =
            document.body.classList.toggle(
                "dark"
            );


        localStorage.setItem(
            "travailplus_theme",
            isDark
                ? "dark"
                : "light"
        );
    }
);


/* ======================================================
   DECONNEXION
====================================================== */

logoutButton.addEventListener(
    "click",
    () => {

        try {

            if (
                typeof TravailPlusAuth !== "undefined" &&
                typeof TravailPlusAuth.logout === "function"
            ) {

                TravailPlusAuth.logout();

                return;
            }

        } catch (error) {

            console.warn(
                "Déconnexion TravailPlusAuth échouée.",
                error
            );
        }


        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "travailplus_token"
        );


        window.location.href =
            "login.html";
    }
);


/* ======================================================
   INITIALISATION
====================================================== */

async function init() {

    applyTheme();

    loadLevels();

    await loadFaculties();

    await loadDepartments();

    await loadStudents();
}


init();