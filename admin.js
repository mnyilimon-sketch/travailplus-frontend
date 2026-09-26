"use strict";

/* ======================================================
   TRAVAIL+ ï¿½ï¿½ï¿½ ADMINISTRATION
   Dashboard + ï¿½0tudiants + Documents + Annonces
   + Exercices + GÒ©nÒ©ration IA
====================================================== */


/* ======================================================
   CONFIGURATION API
====================================================== */

const API_BASE_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000/api"
        : "https://travailplus-backend.onrender.com/api";


const AUTH_API_URL = `${API_BASE_URL}/auth`;
const EXERCISES_API_URL = `${API_BASE_URL}/exercises`;


/* ======================================================
   ï¿½0TAT GLOBAL
====================================================== */

const state = {

    currentSection: "dashboard",

    students: {
        data: [],
        page: 1,
        limit: 10,
        search: ""
    },

    documents: {
        data: [],
        page: 1,
        limit: 10,
        search: ""
    },

    announcements: {
        data: [],
        page: 1,
        limit: 10
    },

    exercises: {
        data: [],
        page: 1,
        limit: 10,
        search: "",
        subject: "",
        level: ""
    },

    generatedExercise: null,

    exerciseQuestionIndex: 0
};


/* ======================================================
   UTILITAIRES
====================================================== */

function getToken() {

    return (
        localStorage.getItem("token") ||
        localStorage.getItem("travailplus_token") ||
        localStorage.getItem("authToken") ||
        ""
    );
}


function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatNumber(value) {

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "0";
    }

    return number.toLocaleString("fr-FR");
}


function updateSectionCount(elementId, value) {

    const element =
        document.getElementById(elementId);

    if (element) {
        element.textContent =
            formatNumber(value);
    }
}


function formatDate(value) {

    if (!value) {
        return "ï¿½ï¿½ï¿½";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "ï¿½ï¿½ï¿½";
    }

    return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}


function getInitials(firstName, lastName) {

    const first =
        String(firstName || "")
            .trim()
            .charAt(0);

    const last =
        String(lastName || "")
            .trim()
            .charAt(0);

    return (
        `${first}${last}`.trim() ||
        "A"
    ).toUpperCase();
}


function showAdminMessage(message, type = "success") {

    const element =
        document.getElementById("adminStatusMessage");

    if (!element) {
        return;
    }

    element.textContent = message;

    element.className =
        `admin-status-message ${type}`;

    element.hidden = false;

    clearTimeout(
        showAdminMessage.timeout
    );

    showAdminMessage.timeout =
        setTimeout(() => {

            element.hidden = true;

        }, 5000);
}


function hideAdminMessage() {

    const element =
        document.getElementById("adminStatusMessage");

    if (!element) {
        return;
    }

    element.hidden = true;
}


function setButtonLoading(
    button,
    loading,
    normalText,
    loadingText
) {

    if (!button) {
        return;
    }

    button.disabled = loading;

    button.textContent =
        loading
            ? loadingText
            : normalText;
}


/* ======================================================
   API
====================================================== */

async function apiRequest(
    endpoint,
    options = {}
) {

    const token = getToken();

    const headers = {
        ...(options.headers || {})
    };

    if (!headers["Content-Type"] &&
        options.body &&
        !(options.body instanceof FormData)) {

        headers["Content-Type"] =
            "application/json";
    }

    if (token) {

        headers.Authorization =
            `Bearer ${token}`;
    }

    const response =
        await fetch(
            `${API_BASE_URL}${endpoint}`,
            {
                ...options,
                headers
            }
        );

    let data = null;

    const contentType =
        response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {

        data = await response.json();

    } else {

        const text =
            await response.text();

        data = {
            success: response.ok,
            message: text
        };
    }


    if (response.status === 401) {

        localStorage.removeItem("token");
        localStorage.removeItem("travailplus_token");
        localStorage.removeItem("authToken");

        window.location.href =
            "login.html";

        throw new Error(
            data?.message ||
            "Session expirÒ©e."
        );
    }


    if (response.status === 403) {

        throw new Error(
            data?.message ||
            "AccÒ¨s administrateur refusÒ©."
        );
    }


    if (!response.ok) {

        throw new Error(
            data?.message ||
            "Une erreur est survenue."
        );
    }


    return data;
}


/* ======================================================
   NAVIGATION
====================================================== */
const sectionConfig = {

    dashboard: {
        title: "Tableau de bord",
        subtitle: "Vue gÒ©nÒ©rale de Travail+"
    },

    students: {
        title: "ï¿½0tudiants",
        subtitle: "Gestion des Ò©tudiants"
    },

    documents: {
        title: "Documents",
        subtitle: "Gestion des documents pÒ©dagogiques"
    },

    announcements: {
        title: "Annonces",
        subtitle: "Gestion des annonces"
    },

    exercises: {
        title: "Exercices",
        subtitle: "Gestion des exercices"
    },

    courses: {
        title: "Cours",
        subtitle: "Gestion des cours et gÒ©nÒ©ration de cours avec IA"
    },

    profile: {
        title: "Profil",
        subtitle: "Gestion du profil administrateur"
    }

};

function showSection(sectionName) {

    const sections = [
        "dashboard",
        "students",
        "documents",
        "announcements",
        "exercises",
        "courses",
        "profile"
    ];

    


    sections.forEach(name => {

        const section =
            document.getElementById(
                `${name}Section`
            );

        if (!section) {
            return;
        }

        const active =
            name === sectionName;

        section.hidden = !active;

        section.classList.toggle(
            "active",
            active
        );
    });


    document
        .querySelectorAll(
            ".admin-nav-item[data-section]"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.section === sectionName
            );

        });


    const config =
        sectionConfig[sectionName] ||
        sectionConfig.dashboard;


    const pageTitle =
        document.getElementById("adminPageTitle");

    const pageSubtitle =
        document.getElementById("adminPageSubtitle");


    if (pageTitle) {
        pageTitle.textContent =
            config.title;
    }


    if (pageSubtitle) {
        pageSubtitle.textContent =
            config.subtitle;
    }


    state.currentSection =
        sectionName;
}


async function navigateTo(sectionName) {

    showSection(sectionName);

    hideAdminMessage();

    try {

        switch (sectionName) {

            case "dashboard":
                await loadDashboard();
                break;

            case "students":
                await loadStudents();
                break;

            case "documents":
                await loadDocuments();
                break;

            case "announcements":
                await loadAnnouncements();
                break;

            case "exercises":
                await loadExercises();
                break;

            case "courses":

                if (
                    typeof loadAdminCourses ===
                    "function"
                ) {
                    await loadAdminCourses();
                }

                break;

            case "profile":
                await loadProfile();
                break;

            default:
                await loadDashboard();
        }

    } catch (error) {

        console.error(
            `Erreur section ${sectionName}:`,
            error
        );

        showAdminMessage(
            error.message ||
            "Impossible de charger cette section.",
            "error"
        );
    }
}


/* ======================================================
   DASHBOARD
====================================================== */

async function loadDashboard() {

    try {

        const data =
            await apiRequest(
                "/admin/dashboard"
            );


        const dashboard =
            data.dashboard ||
            data.data ||
            data;

        const statistics =
            dashboard.statistics ||
            {};


        const studentsCount =
            dashboard.totalStudents ??
            dashboard.studentsCount ??
            dashboard.students ??
            statistics.totalStudents ??
            statistics.studentsCount ??
            statistics.students ??
            0;


        const documentsCount =
            dashboard.totalDocuments ??
            dashboard.documentsCount ??
            dashboard.documents ??
            statistics.totalDocuments ??
            statistics.documentsCount ??
            statistics.documents ??
            0;


        const announcementsCount =
            dashboard.totalAnnouncements ??
            dashboard.announcementsCount ??
            dashboard.announcements ??
            statistics.totalAnnouncements ??
            statistics.announcementsCount ??
            statistics.announcements ??
            0;


        const totalStudents =
            document.getElementById(
                "totalStudents"
            );

        const totalDocuments =
            document.getElementById(
                "totalDocuments"
            );

        const totalAnnouncements =
            document.getElementById(
                "totalAnnouncements"
            );


        if (totalStudents) {
            totalStudents.textContent =
                formatNumber(studentsCount);
        }

        if (totalDocuments) {
            totalDocuments.textContent =
                formatNumber(documentsCount);
        }

        if (totalAnnouncements) {
            totalAnnouncements.textContent =
                formatNumber(announcementsCount);
        }


    } catch (error) {

        console.error(
            "Erreur dashboard:",
            error
        );
    }


    await Promise.allSettled([
        loadDashboardStudents(),
        loadDashboardExercises(),
        loadDashboardAnnouncements()
    ]);
}


async function loadDashboardStudents() {

    try {

        const data =
            await apiRequest(
                "/admin/students"
            );


        const students =
            data.students ||
            data.data ||
            [];


        renderLatestStudents(
            students.slice(0, 5)
        );

        renderTopStudents(
            [...students]
                .sort(
                    (a, b) =>
                        Number(b.xp || 0) -
                        Number(a.xp || 0)
                )
                .slice(0, 5)
        );

    } catch (error) {

        console.warn(
            "Dashboard Ò©tudiants:",
            error.message
        );
    }
}


async function loadDashboardExercises() {

    try {

        const data =
            await apiRequest(
                "/exercises"
            );


        const exercises =
            data.exercises ||
            data.data ||
            [];


        const element =
            document.getElementById(
                "totalExercises"
            );


        if (element) {

            element.textContent =
                formatNumber(
                    exercises.length
                );
        }

    } catch (error) {

        console.warn(
            "Dashboard exercices:",
            error.message
        );
    }
}


async function loadDashboardAnnouncements() {

    try {

        const data =
            await apiRequest(
                "/admin/announcements?page=1&limit=1"
            );

        const element =
            document.getElementById(
                "totalAnnouncements"
            );

        if (!element) {
            return;
        }

        const total =
            data.pagination?.total ??
            data.total ??
            data.announcements?.length ??
            0;

        element.textContent =
            formatNumber(total);

    } catch (error) {

        console.warn(
            "Dashboard annonces:",
            error.message
        );
    }
}


function renderLatestStudents(students) {

    const container =
        document.getElementById(
            "latestStudents"
        );

    if (!container) {
        return;
    }


    if (!students.length) {

        container.innerHTML =
            `<div class="admin-empty">
                Aucun Ò©tudiant.
            </div>`;

        return;
    }


    container.innerHTML =
        students.map(student => {

            const name =
                `${student.firstName || student.first_name || ""}
                 ${student.lastName || student.last_name || ""}`
                    .trim() ||
                "ï¿½0tudiant";


            const initials =
                getInitials(
                    student.firstName ||
                    student.first_name,
                    student.lastName ||
                    student.last_name
                );


            return `
                <div class="admin-list-item">

                    <div class="admin-student-avatar">
                        ${escapeHtml(initials)}
                    </div>

                    <div>
                        <strong>
                            ${escapeHtml(name)}
                        </strong>

                        <span>
                            ${escapeHtml(
                                student.email || "ï¿½ï¿½ï¿½"
                            )}
                        </span>
                    </div>

                </div>
            `;

        }).join("");
}


function renderTopStudents(students) {

    const container =
        document.getElementById(
            "topStudents"
        );

    if (!container) {
        return;
    }


    if (!students.length) {

        container.innerHTML =
            `<div class="admin-empty">
                Aucun classement disponible.
            </div>`;

        return;
    }


    container.innerHTML =
        students.map((student, index) => {

            const name =
                `${student.firstName || student.first_name || ""}
                 ${student.lastName || student.last_name || ""}`
                    .trim() ||
                "ï¿½0tudiant";


            return `
                <div class="admin-list-item">

                    <div class="admin-ranking-number">
                        ${index + 1}
                    </div>

                    <div>
                        <strong>
                            ${escapeHtml(name)}
                        </strong>

                        <span class="admin-xp">
                            ${formatNumber(student.xp || 0)} XP
                        </span>
                    </div>

                </div>
            `;

        }).join("");
}


/* ======================================================
   ï¿½0TUDIANTS
====================================================== */

async function loadStudents() {

    const loading =
        document.getElementById(
            "studentsLoading"
        );

    if (loading) {
        loading.hidden = false;
    }


    try {

        const params =
            new URLSearchParams();


        if (state.students.search) {

            params.set(
                "search",
                state.students.search
            );
        }


        const query =
            params.toString();


        const data =
            await apiRequest(
                `/admin/students${query ? `?${query}` : ""}`
            );


        state.students.data =
            data.students ||
            data.data ||
            [];

        updateSectionCount(
            "studentsSectionCount",
            data.pagination?.total ??
            data.total ??
            state.students.data.length
        );


        renderStudents();

    } catch (error) {

        console.error(
            "Erreur Ò©tudiants:",
            error
        );

        const container =
            document.getElementById(
                "studentsTableBody"
            );

        if (container) {
            container.innerHTML = "";
        }

        showAdminMessage(
            error.message,
            "error"
        );

    } finally {

        if (loading) {
            loading.hidden = true;
        }
    }
}


function renderStudents() {

    const tbody =
        document.getElementById(
            "studentsTableBody"
        );

    const empty =
        document.getElementById(
            "studentsEmpty"
        );

    const table =
        document.getElementById(
            "studentsTableContainer"
        );


    if (!tbody) {
        return;
    }


    let students =
        [...state.students.data];


    const search =
        state.students.search
            .trim()
            .toLowerCase();


    if (search) {

        students =
            students.filter(student => {

                const text =
                    [
                        student.firstName,
                        student.first_name,
                        student.lastName,
                        student.last_name,
                        student.email
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();

                return text.includes(search);
            });
    }


    if (!students.length) {

        tbody.innerHTML = "";

        if (empty) {
            empty.hidden = false;
        }

        if (table) {
            table.hidden = true;
        }

        return;
    }


    if (empty) {
        empty.hidden = true;
    }

    if (table) {
        table.hidden = false;
    }


    const start =
        (state.students.page - 1) *
        state.students.limit;


    const visible =
        students.slice(
            start,
            start + state.students.limit
        );


    tbody.innerHTML =
        visible.map(student => {

            const id =
                student.id;


            const firstName =
                student.firstName ||
                student.first_name ||
                "";


            const lastName =
                student.lastName ||
                student.last_name ||
                "";


            const name =
                `${firstName} ${lastName}`.trim() ||
                "ï¿½0tudiant";


            const initials =
                getInitials(
                    firstName,
                    lastName
                );


            const xp =
                Number(student.xp || 0);


            const streak =
                Number(student.streak || 0);


            const active =
                student.isActive !== false &&
                student.is_active !== false;


            return `
                <tr>

                    <td>

                        <div class="admin-student-name">

                            <div class="admin-student-avatar">
                                ${escapeHtml(initials)}
                            </div>

                            <span>
                                ${escapeHtml(name)}
                            </span>

                        </div>

                    </td>

                    <td>
                        ${escapeHtml(
                            student.email || "ï¿½ï¿½ï¿½"
                        )}
                    </td>

                    <td>
                        <span class="admin-xp">
                            ${formatNumber(xp)} XP
                        </span>
                    </td>

                    <td>
                        <span class="admin-streak">
                            ï¿½xï¿½ ${formatNumber(streak)}
                        </span>
                    </td>

                    <td>

                        <span class="admin-status ${active ? "active" : "inactive"}">
                            ${active ? "Actif" : "Inactif"}
                        </span>

                    </td>

                    <td>

                        <div class="student-actions">

                            <button
                                type="button"
                                class="student-action-button"
                                data-action="edit-student"
                                data-id="${id}"
                            >
                                Modifier
                            </button>

                        </div>

                    </td>

                </tr>
            `;

        }).join("");


    renderPagination(
        "studentsPagination",
        students.length,
        state.students.page,
        state.students.limit,
        page => {

            state.students.page = page;

            renderStudents();
        }
    );
}


/* ======================================================
   DOCUMENTS
====================================================== */

async function loadDocuments() {

    const loading =
        document.getElementById(
            "documentsLoading"
        );

    if (loading) {
        loading.hidden = false;
    }


    try {

        const data =
            await apiRequest(
                "/documents"
            );


        state.documents.data =
            data.documents ||
            data.data ||
            [];

        updateSectionCount(
            "documentsSectionCount",
            data.pagination?.total ??
            data.total ??
            state.documents.data.length
        );


        renderDocuments();

    } catch (error) {

        console.error(
            "Erreur documents:",
            error
        );

        showAdminMessage(
            error.message,
            "error"
        );

    } finally {

        if (loading) {
            loading.hidden = true;
        }
    }
}


function renderDocuments() {

    const tbody =
        document.getElementById(
            "documentsTableBody"
        );

    const empty =
        document.getElementById(
            "documentsEmpty"
        );

    const table =
        document.getElementById(
            "documentsTableContainer"
        );


    if (!tbody) {
        return;
    }


    let documents =
        [...state.documents.data];


    const search =
        state.documents.search
            .trim()
            .toLowerCase();


    if (search) {

        documents =
            documents.filter(document => {

                const text =
                    [
                        document.title,
                        document.name,
                        document.subject,
                        document.level
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();

                return text.includes(search);
            });
    }


    if (!documents.length) {

        tbody.innerHTML = "";

        if (empty) {
            empty.hidden = false;
        }

        if (table) {
            table.hidden = true;
        }

        return;
    }


    if (empty) {
        empty.hidden = true;
    }

    if (table) {
        table.hidden = false;
    }


    const start =
        (state.documents.page - 1) *
        state.documents.limit;


    const visible =
        documents.slice(
            start,
            start + state.documents.limit
        );


    tbody.innerHTML =
        visible.map(document => {

            const id =
                document.id;


            return `
                <tr>

                    <td>
                        <strong>
                            ${escapeHtml(
                                document.title ||
                                document.name ||
                                "Document"
                            )}
                        </strong>
                    </td>

                    <td>
                        ${escapeHtml(
                            document.subject || "ï¿½ï¿½ï¿½"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            document.level || "ï¿½ï¿½ï¿½"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            document.authorName ||
                            document.author_name ||
                            document.email ||
                            "ï¿½ï¿½ï¿½"
                        )}
                    </td>

                    <td>
                        ${formatDate(
                            document.createdAt ||
                            document.created_at
                        )}
                    </td>

                    <td>

                        <div class="student-actions">

                            <button
                                type="button"
                                class="student-action-button"
                                data-action="view-document"
                                data-id="${id}"
                            >
                                Voir
                            </button>

                            <button
                                type="button"
                                class="student-action-button"
                                data-action="delete-document"
                                data-id="${id}"
                            >
                                Supprimer
                            </button>

                        </div>

                    </td>

                </tr>
            `;

        }).join("");


    renderPagination(
        "documentsPagination",
        documents.length,
        state.documents.page,
        state.documents.limit,
        page => {

            state.documents.page = page;

            renderDocuments();
        }
    );
}


/* ======================================================
   ANNONCES
====================================================== */

async function loadAnnouncements() {

    const loading =
        document.getElementById(
            "announcementsLoading"
        );

    if (loading) {
        loading.hidden = false;
    }


    try {

        const data =
            await apiRequest(
                "/admin/announcements"
            );


        state.announcements.data =
            data.announcements ||
            data.data ||
            [];

        updateSectionCount(
            "announcementsSectionCount",
            data.pagination?.total ??
            data.total ??
            state.announcements.data.length
        );


        renderAnnouncements();

    } catch (error) {

        console.error(
            "Erreur annonces:",
            error
        );

        showAdminMessage(
            error.message,
            "error"
        );

    } finally {

        if (loading) {
            loading.hidden = true;
        }
    }
}


function renderAnnouncements() {

    const tbody =
        document.getElementById(
            "announcementsTableBody"
        );

    const empty =
        document.getElementById(
            "announcementsEmpty"
        );

    const table =
        document.getElementById(
            "announcementsTableContainer"
        );


    if (!tbody) {
        return;
    }


    const announcements =
        state.announcements.data;


    if (!announcements.length) {

        tbody.innerHTML = "";

        if (empty) {
            empty.hidden = false;
        }

        if (table) {
            table.hidden = true;
        }

        return;
    }


    if (empty) {
        empty.hidden = true;
    }

    if (table) {
        table.hidden = false;
    }


    const start =
        (state.announcements.page - 1) *
        state.announcements.limit;


    const visible =
        announcements.slice(
            start,
            start + state.announcements.limit
        );


    tbody.innerHTML =
        visible.map(announcement => {

            const id =
                announcement.id;


            const active =
                announcement.isActive !== false &&
                announcement.is_active !== false;


            return `
                <tr>

                    <td>
                        <strong>
                            ${escapeHtml(
                                announcement.title ||
                                "Annonce"
                            )}
                        </strong>
                    </td>

                    <td>
                        ${escapeHtml(
                            announcement.type || "info"
                        )}
                    </td>

                    <td>

                        <span class="admin-status ${active ? "active" : "inactive"}">
                            ${active ? "PubliÒ©e" : "Brouillon"}
                        </span>

                    </td>

                    <td>
                        ${formatDate(
                            announcement.createdAt ||
                            announcement.created_at
                        )}
                    </td>

                    <td>

                        <div class="student-actions">

                            <button
                                type="button"
                                class="student-action-button"
                                data-action="edit-announcement"
                                data-id="${id}"
                            >
                                Modifier
                            </button>

                            <button
                                type="button"
                                class="student-action-button"
                                data-action="toggle-announcement"
                                data-id="${id}"
                            >
                                ${active ? "DÒ©sactiver" : "Publier"}
                            </button>

                            <button
                                type="button"
                                class="student-action-button"
                                data-action="delete-announcement"
                                data-id="${id}"
                            >
                                Supprimer
                            </button>

                        </div>

                    </td>

                </tr>
            `;

        }).join("");


    renderPagination(
        "announcementsPagination",
        announcements.length,
        state.announcements.page,
        state.announcements.limit,
        page => {

            state.announcements.page = page;

            renderAnnouncements();
        }
    );
}


/* ======================================================
   EXERCICES ï¿½ï¿½ï¿½ CHARGEMENT
====================================================== */

async function loadExercises() {

    const loading =
        document.getElementById(
            "exercisesLoading"
        );


    if (loading) {
        loading.hidden = false;
    }


    try {

        const data =
            await apiRequest(
                "/exercises"
            );


        state.exercises.data =
            data.exercises ||
            data.data ||
            [];

        updateSectionCount(
            "exercisesSectionCount",
            data.pagination?.total ??
            data.total ??
            state.exercises.data.length
        );


        state.exercises.page = 1;


        renderExercises();

        updateExerciseStats();

        populateExerciseFilters();

    } catch (error) {

        console.error(
            "Erreur exercices:",
            error
        );

        showAdminMessage(
            error.message ||
            "Impossible de charger les exercices.",
            "error"
        );

    } finally {

        if (loading) {
            loading.hidden = true;
        }
    }
}


/* ======================================================
   EXERCICES ï¿½ï¿½ï¿½ STATISTIQUES
====================================================== */

function updateExerciseStats() {

    const exercises =
        state.exercises.data;


    const count =
        document.getElementById(
            "adminExercisesCount"
        );


    const dashboardCount =
        document.getElementById(
            "totalExercises"
        );


    const subjects =
        new Set(
            exercises
                .map(
                    exercise =>
                        exercise.subject
                )
                .filter(Boolean)
        );


    const averageXp =
        exercises.length
            ? exercises.reduce(
                (total, exercise) =>
                    total +
                    Number(
                        exercise.xpReward ??
                        exercise.xp_reward ??
                        0
                    ),
                0
            ) / exercises.length
            : 0;


    const average =
        Math.round(averageXp);


    if (count) {

        count.textContent =
            formatNumber(
                exercises.length
            );
    }


    if (dashboardCount) {

        dashboardCount.textContent =
            formatNumber(
                exercises.length
            );
    }


    const subjectElement =
        document.getElementById(
            "adminExerciseSubjects"
        );


    if (subjectElement) {

        subjectElement.textContent =
            formatNumber(
                subjects.size
            );
    }


    const xpElement =
        document.getElementById(
            "adminExerciseAverageXp"
        );


    if (xpElement) {

        xpElement.textContent =
            `${formatNumber(average)} XP`;
    }
}


/* ======================================================
   EXERCICES ï¿½ï¿½ï¿½ FILTRES
====================================================== */

function populateExerciseFilters() {

    const subjectFilter =
        document.getElementById(
            "exerciseSubjectFilter"
        );


    const levelFilter =
        document.getElementById(
            "exerciseLevelFilter"
        );


    const subjects =
        [
            ...new Set(
                state.exercises.data
                    .map(
                        exercise =>
                            exercise.subject
                    )
                    .filter(Boolean)
            )
        ]
            .sort();


    const levels =
        [
            ...new Set(
                state.exercises.data
                    .map(
                        exercise =>
                            exercise.level
                    )
                    .filter(Boolean)
            )
        ]
            .sort();


    if (subjectFilter) {

        subjectFilter.innerHTML =
            `<option value="">
                Toutes les matiÒ¨res
            </option>` +
            subjects.map(subject =>
                `<option value="${escapeHtml(subject)}">
                    ${escapeHtml(subject)}
                </option>`
            ).join("");


        subjectFilter.value =
            state.exercises.subject;
    }


    if (levelFilter) {

        levelFilter.innerHTML =
            `<option value="">
                Tous les niveaux
            </option>` +
            levels.map(level =>
                `<option value="${escapeHtml(level)}">
                    ${escapeHtml(level)}
                </option>`
            ).join("");


        levelFilter.value =
            state.exercises.level;
    }
}


/* ======================================================
   EXERCICES ï¿½ï¿½ï¿½ AFFICHAGE
====================================================== */

function getFilteredExercises() {

    let exercises =
        [...state.exercises.data];


    const search =
        state.exercises.search
            .trim()
            .toLowerCase();


    if (search) {

        exercises =
            exercises.filter(exercise => {

                const text =
                    [
                        exercise.title,
                        exercise.description,
                        exercise.subject,
                        exercise.level
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                return text.includes(search);
            });
    }


    if (state.exercises.subject) {

        exercises =
            exercises.filter(
                exercise =>
                    String(
                        exercise.subject || ""
                    ) ===
                    String(
                        state.exercises.subject
                    )
            );
    }


    if (state.exercises.level) {

        exercises =
            exercises.filter(
                exercise =>
                    String(
                        exercise.level || ""
                    ) ===
                    String(
                        state.exercises.level
                    )
            );
    }


    return exercises;
}


function renderExercises() {

    const tbody =
        document.getElementById(
            "exercisesTableBody"
        );


    const table =
        document.getElementById(
            "exercisesTableContainer"
        );


    const empty =
        document.getElementById(
            "exercisesEmpty"
        );


    if (!tbody) {
        return;
    }


    const exercises =
        getFilteredExercises();


    if (!exercises.length) {

        tbody.innerHTML = "";

        if (table) {
            table.hidden = true;
        }

        if (empty) {
            empty.hidden = false;
        }

        const pagination =
            document.getElementById(
                "exercisesPagination"
            );

        if (pagination) {
            pagination.innerHTML = "";
        }

        return;
    }


    if (table) {
        table.hidden = false;
    }

    if (empty) {
        empty.hidden = true;
    }


    const start =
        (state.exercises.page - 1) *
        state.exercises.limit;


    const visible =
        exercises.slice(
            start,
            start + state.exercises.limit
        );


    tbody.innerHTML =
        visible.map(exercise => {

            const questions =
                Array.isArray(
                    exercise.questions
                )
                    ? exercise.questions.length
                    : 0;


            const xp =
                Number(
                    exercise.xpReward ??
                    exercise.xp_reward ??
                    0
                );


            const active =
                exercise.isActive !== false &&
                exercise.is_active !== false;


            return `
                <tr>

                    <td>

                        <strong>
                            ${escapeHtml(
                                exercise.title ||
                                "Exercice"
                            )}
                        </strong>

                        ${
                            exercise.description
                                ? `
                                    <small>
                                        ${escapeHtml(
                                            exercise.description
                                        )}
                                    </small>
                                `
                                : ""
                        }

                    </td>

                    <td>
                        ${escapeHtml(
                            exercise.subject ||
                            "ï¿½ï¿½ï¿½"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            exercise.level ||
                            "ï¿½ï¿½ï¿½"
                        )}
                    </td>

                    <td>
                        ${formatNumber(
                            questions
                        )}
                    </td>

                    <td>

                        <span class="admin-xp">
                            +${formatNumber(xp)} XP
                        </span>

                    </td>

                    <td>

                        <span class="admin-status ${active ? "active" : "inactive"}">
                            ${active ? "Actif" : "Inactif"}
                        </span>

                    </td>

                    <td>

                        <div class="student-actions">

                            <button
                                type="button"
                                class="student-action-button"
                                data-action="view-exercise"
                                data-id="${exercise.id}"
                            >
                                Voir
                            </button>

                            <button
                                type="button"
                                class="student-action-button"
                                data-action="delete-exercise"
                                data-id="${exercise.id}"
                            >
                                Supprimer
                            </button>

                        </div>

                    </td>

                </tr>
            `;

        }).join("");


    renderPagination(
        "exercisesPagination",
        exercises.length,
        state.exercises.page,
        state.exercises.limit,
        page => {

            state.exercises.page = page;

            renderExercises();
        }
    );
}


/* ======================================================
   EXERCICES ï¿½ï¿½ï¿½ AJOUT MANUEL
====================================================== */

function openExerciseModal() {

    const modal =
        document.getElementById(
            "exerciseModal"
        );


    const form =
        document.getElementById(
            "exerciseForm"
        );


    if (!modal) {
        return;
    }


    if (form) {
        form.reset();
    }


    const xp =
        document.getElementById(
            "exerciseXP"
        );


    if (xp) {
        xp.value = "10";
    }


    const difficulty =
        document.getElementById(
            "exerciseDifficulty"
        );


    if (difficulty) {
        difficulty.value = "moyen";
    }


    const container =
        document.getElementById(
            "exerciseQuestionsContainer"
        );


    if (container) {

        container.innerHTML = "";

        addExerciseQuestion();
    }


    modal.hidden = false;

    modal.setAttribute(
        "aria-hidden",
        "false"
    );
}


function closeExerciseModal() {

    const modal =
        document.getElementById(
            "exerciseModal"
        );


    if (!modal) {
        return;
    }


    modal.hidden = true;

    modal.setAttribute(
        "aria-hidden",
        "true"
    );
}


function addExerciseQuestion(
    initialQuestion = null
) {

    const container =
        document.getElementById(
            "exerciseQuestionsContainer"
        );


    if (!container) {
        return;
    }


    const index =
        container.children.length;


    const question =
        initialQuestion || {};


    const options =
        Array.isArray(
            question.options
        )
            ? question.options
            : ["", "", "", ""];


    const correctAnswer =
        Number.isInteger(
            question.correctAnswer
        )
            ? question.correctAnswer
            : Number.isInteger(
                question.correct_answer
            )
                ? question.correct_answer
                : 0;


    const wrapper =
        document.createElement("div");


    wrapper.className =
        "admin-exercise-question";


    wrapper.dataset.index =
        String(index);


    wrapper.innerHTML = `

        <div class="admin-exercise-question-header">

            <h4>
                Question ${index + 1}
            </h4>

            <button
                type="button"
                class="admin-danger-button remove-exercise-question"
            >
                Supprimer
            </button>

        </div>


        <div class="admin-form-group">

            <label>
                ï¿½0noncÒ©
            </label>

            <textarea
                class="exercise-question-text"
                rows="3"
                required
                placeholder="ï¿½0crivez la question..."
            >${escapeHtml(
                question.question || ""
            )}</textarea>

        </div>


        <div class="admin-exercise-options">

            ${[0, 1, 2, 3].map(optionIndex => `

                <div class="admin-form-group">

                    <label>
                        RÒ©ponse ${String.fromCharCode(65 + optionIndex)}
                    </label>

                    <input
                        type="text"
                        class="exercise-option"
                        data-option="${optionIndex}"
                        required
                        value="${escapeHtml(
                            options[optionIndex] || ""
                        )}"
                        placeholder="RÒ©ponse ${String.fromCharCode(65 + optionIndex)}"
                    >

                </div>

            `).join("")}

        </div>


        <div class="admin-form-group">

            <label>
                Bonne rÒ©ponse
            </label>

            <select
                class="exercise-correct-answer"
                required
            >

                <option value="0" ${correctAnswer === 0 ? "selected" : ""}>
                    RÒ©ponse A
                </option>

                <option value="1" ${correctAnswer === 1 ? "selected" : ""}>
                    RÒ©ponse B
                </option>

                <option value="2" ${correctAnswer === 2 ? "selected" : ""}>
                    RÒ©ponse C
                </option>

                <option value="3" ${correctAnswer === 3 ? "selected" : ""}>
                    RÒ©ponse D
                </option>

            </select>

        </div>


        <div class="admin-form-group">

            <label>
                Explication
            </label>

            <textarea
                class="exercise-explanation"
                rows="2"
                placeholder="Explication facultative..."
            >${escapeHtml(
                question.explanation || ""
            )}</textarea>

        </div>
    `;


    container.appendChild(wrapper);

    refreshExerciseQuestionNumbers();
}


function refreshExerciseQuestionNumbers() {

    document
        .querySelectorAll(
            "#exerciseQuestionsContainer .admin-exercise-question"
        )
        .forEach((element, index) => {

            const title =
                element.querySelector("h4");

            if (title) {

                title.textContent =
                    `Question ${index + 1}`;
            }

            element.dataset.index =
                String(index);
        });

}


function collectManualExerciseQuestions() {

    const elements =
        [
            ...document.querySelectorAll(
                "#exerciseQuestionsContainer .admin-exercise-question"
            )
        ];


    if (!elements.length) {

        throw new Error(
            "Ajoutez au moins une question."
        );
    }


    return elements.map(
        (element, index) => {

            const question =
                element
                    .querySelector(
                        ".exercise-question-text"
                    )
                    ?.value
                    .trim();


            const options =
                [
                    ...element.querySelectorAll(
                        ".exercise-option"
                    )
                ]
                    .map(
                        input =>
                            input.value.trim()
                    );


            const correctAnswer =
                Number(
                    element
                        .querySelector(
                            ".exercise-correct-answer"
                        )
                        ?.value
                );


            const explanation =
                element
                    .querySelector(
                        ".exercise-explanation"
                    )
                    ?.value
                    .trim();


            if (!question) {

                throw new Error(
                    `La question ${index + 1} est vide.`
                );
            }


            if (
                options.length !== 4 ||
                options.some(
                    option => !option
                )
            ) {

                throw new Error(
                    `La question ${index + 1} doit avoir 4 rÒ©ponses.`
                );
            }


            if (
                !Number.isInteger(
                    correctAnswer
                ) ||
                correctAnswer < 0 ||
                correctAnswer > 3
            ) {

                throw new Error(
                    `La bonne rÒ©ponse de la question ${index + 1} est invalide.`
                );
            }


            return {
                question,
                options,
                correctAnswer,
                explanation
            };
        }
    );
}


async function saveManualExercise(
    event
) {

    event.preventDefault();


    const button =
        document.getElementById(
            "saveExerciseButton"
        );


    try {

        const title =
            document.getElementById(
                "exerciseTitle"
            )?.value.trim();


        const subject =
            document.getElementById(
                "exerciseSubject"
            )?.value.trim();


        const level =
            document.getElementById(
                "exerciseLevel"
            )?.value.trim();


        const difficulty =
            document.getElementById(
                "exerciseDifficulty"
            )?.value;


        const xpReward =
            Number(
                document.getElementById(
                    "exerciseXp"
                )?.value
            );


        const description =
            document.getElementById(
                "exerciseDescription"
            )?.value.trim();


        if (!title) {
            throw new Error(
                "Le titre est obligatoire."
            );
        }


        if (!subject) {
            throw new Error(
                "La matiÒ¨re est obligatoire."
            );
        }


        if (!level) {
            throw new Error(
                "Le niveau est obligatoire."
            );
        }


        if (
            !Number.isFinite(xpReward) ||
            xpReward <= 0
        ) {

            throw new Error(
                "L'XP doit Òªtre supÒ©rieure Ò  0."
            );
        }


        const questions =
            collectManualExerciseQuestions();


        setButtonLoading(
            button,
            true,
            "Publier l'exercice",
            "Publication..."
        );


        await apiRequest(
            "/exercises",
            {
                method: "POST",

                body: JSON.stringify({

                    title,
                    description,
                    subject,
                    level,

                    difficulty,

                    xpReward,

                    questions
                })
            }
        );


        closeExerciseModal();


        showAdminMessage(
            "Exercice crÒ©Ò© et publiÒ© avec succÒ¨s.",
            "success"
        );


        await loadExercises();

    } catch (error) {

        console.error(
            "CrÒ©ation exercice:",
            error
        );

        showAdminMessage(
            error.message,
            "error"
        );

    } finally {

        setButtonLoading(
            button,
            false,
            "Publier l'exercice",
            "Publication..."
        );
    }
}


/* ======================================================
   EXERCICES ï¿½ï¿½ï¿½ Gï¿½0Nï¿½0RATION IA
====================================================== */

function openGenerateExerciseModal() {

    const modal =
        document.getElementById(
            "generateExerciseModal"
        );


    const form =
        document.getElementById(
            "generateExerciseForm"
        );


    if (!modal) {
        return;
    }


    if (form) {
        form.reset();
    }


    const difficulty =
        document.getElementById(
            "generateDifficulty"
        );


    const count =
        document.getElementById(
            "generateQuestionCount"
        );


    const xp =
        document.getElementById(
            "generateXp"
        );


    if (difficulty) {
        difficulty.value = "moyen";
    }


    if (count) {
        count.value = "5";
    }


    if (xp) {
        xp.value = "10";
    }


    const message =
        document.getElementById(
            "generationMessage"
        );


    if (message) {
        message.hidden = true;
        message.textContent = "";
    }


    modal.hidden = false;

    modal.setAttribute(
        "aria-hidden",
        "false"
    );
}


function closeGenerateExerciseModal() {

    const modal =
        document.getElementById(
            "generateExerciseModal"
        );


    if (!modal) {
        return;
    }


    modal.hidden = true;

    modal.setAttribute(
        "aria-hidden",
        "true"
    );
}


async function generateExerciseWithAI(
    event
) {

    event.preventDefault();


    const button =
        document.getElementById(
            "generateExerciseSubmit"
        );


    const message =
        document.getElementById(
            "generationMessage"
        );


    try {

        const subject =
            document.getElementById(
                "generateSubject"
            )?.value.trim();


        const level =
            document.getElementById(
                "generateLevel"
            )?.value.trim();


        const difficulty =
            document.getElementById(
                "generateDifficulty"
            )?.value;


        const questionCount =
            Number(
                document.getElementById(
                    "generateQuestionCount"
                )?.value
            );


        const xpReward =
            Number(
                document.getElementById(
                    "generateXp"
                )?.value
            );


        if (!subject) {

            throw new Error(
                "La matiÒ¨re est obligatoire."
            );
        }


        if (!level) {

            throw new Error(
                "Le niveau est obligatoire."
            );
        }


        if (
            !Number.isInteger(questionCount) ||
            questionCount < 1 ||
            questionCount > 20
        ) {

            throw new Error(
                "Le nombre de questions doit Òªtre compris entre 1 et 20."
            );
        }


        if (
            !Number.isFinite(xpReward) ||
            xpReward <= 0
        ) {

            throw new Error(
                "L'XP doit Òªtre supÒ©rieure Ò  0."
            );
        }


        if (message) {

            message.hidden = false;

            message.className =
                "admin-status-message";

            message.textContent =
                "GÒ©nÒ©ration de l'exercice en cours...";
        }


        setButtonLoading(
            button,
            true,
            "ï¿½xï¿½ï¿½ GÒ©nÒ©rer",
            "GÒ©nÒ©ration..."
        );


        const data =
            await apiRequest(
                "/exercises/generate",
                {
                    method: "POST",

                    body: JSON.stringify({

                        subject,
                        level,
                        difficulty,
                        questionCount,
                        xpReward
                    })
                }
            );


        const exercise =
            data.exercise ||
            data.generatedExercise ||
            data.data;


        if (!exercise) {

            throw new Error(
                "L'IA n'a retournÒ© aucun exercice."
            );
        }


        state.generatedExercise =
            exercise;


        closeGenerateExerciseModal();


        renderExercisePreview(
            exercise
        );


        openExercisePreviewModal();


    } catch (error) {

        console.error(
            "GÒ©nÒ©ration IA:",
            error
        );


        if (message) {

            message.hidden = false;

            message.className =
                "admin-status-message error";

            message.textContent =
                error.message;
        }


        showAdminMessage(
            error.message,
            "error"
        );

    } finally {

        setButtonLoading(
            button,
            false,
            "ï¿½xï¿½ï¿½ GÒ©nÒ©rer",
            "GÒ©nÒ©ration..."
        );
    }
}


/* ======================================================
   EXERCICES ï¿½ï¿½ï¿½ APERï¿½!U IA
====================================================== */

function openExercisePreviewModal() {

    const modal =
        document.getElementById(
            "exercisePreviewModal"
        );


    if (!modal) {
        return;
    }


    modal.hidden = false;

    modal.setAttribute(
        "aria-hidden",
        "false"
    );
}


function closeExercisePreviewModal() {

    const modal =
        document.getElementById(
            "exercisePreviewModal"
        );


    if (!modal) {
        return;
    }


    modal.hidden = true;

    modal.setAttribute(
        "aria-hidden",
        "true"
    );
}


function renderExercisePreview(
    exercise
) {

    const container =
        document.getElementById(
            "exercisePreview"
        );


    if (!container) {
        return;
    }


    const questions =
        Array.isArray(
            exercise.questions
        )
            ? exercise.questions
            : [];


    container.innerHTML = `

        <div class="admin-exercise-preview-header">

            <span class="subject-badge">
                ${escapeHtml(
                    exercise.subject ||
                    "MatiÒ¨re"
                )}
            </span>

            <h3>
                ${escapeHtml(
                    exercise.title ||
                    "Exercice gÒ©nÒ©rÒ©"
                )}
            </h3>

            <p>
                ${escapeHtml(
                    exercise.description ||
                    ""
                )}
            </p>

            <div class="admin-exercise-preview-meta">

                <span>
                    Niveau :
                    <strong>
                        ${escapeHtml(
                            exercise.level ||
                            "ï¿½ï¿½ï¿½"
                        )}
                    </strong>
                </span>

                <span>
                    DifficultÒ© :
                    <strong>
                        ${escapeHtml(
                            exercise.difficulty ||
                            "ï¿½ï¿½ï¿½"
                        )}
                    </strong>
                </span>

                <span>
                    XP :
                    <strong>
                        +${formatNumber(
                            exercise.xpReward ??
                            exercise.xp_reward ??
                            0
                        )}
                    </strong>
                </span>

            </div>

        </div>


        <div class="admin-exercise-preview-questions">

            ${
                questions.length
                    ? questions.map(
                        (question, index) => {

                            const options =
                                Array.isArray(
                                    question.options
                                )
                                    ? question.options
                                    : [];


                            const correct =
                                Number.isInteger(
                                    question.correctAnswer
                                )
                                    ? question.correctAnswer
                                    : Number.isInteger(
                                        question.correct_answer
                                    )
                                        ? question.correct_answer
                                        : 0;


                            return `

                                <article
                                    class="admin-preview-question"
                                >

                                    <h4>
                                        ${index + 1}.
                                        ${escapeHtml(
                                            question.question ||
                                            ""
                                        )}
                                    </h4>


                                    <div
                                        class="admin-preview-options"
                                    >

                                        ${
                                            options.map(
                                                (
                                                    option,
                                                    optionIndex
                                                ) => `

                                                    <div
                                                        class="admin-preview-option ${
                                                            optionIndex === correct
                                                                ? "correct"
                                                                : ""
                                                        }"
                                                    >

                                                        <strong>
                                                            ${String.fromCharCode(
                                                                65 +
                                                                optionIndex
                                                            )}.
                                                        </strong>

                                                        ${escapeHtml(
                                                            option
                                                        )}

                                                        ${
                                                            optionIndex === correct
                                                                ? " ï¿½ï¿½ï¿½S"
                                                                : ""
                                                        }

                                                    </div>

                                                `
                                            ).join("")
                                        }

                                    </div>


                                    ${
                                        question.explanation
                                            ? `
                                                <p class="admin-preview-explanation">
                                                    <strong>
                                                        Explication :
                                                    </strong>
                                                    ${escapeHtml(
                                                        question.explanation
                                                    )}
                                                </p>
                                            `
                                            : ""
                                    }

                                </article>
                            `;

                        }
                    ).join("")
                    : `
                        <div class="admin-empty">
                            Aucune question gÒ©nÒ©rÒ©e.
                        </div>
                    `
            }

        </div>
    `;
}


/* ======================================================
   EXERCICES ï¿½ï¿½ï¿½ PUBLICATION IA
====================================================== */

async function publishGeneratedExercise() {

    const button =
        document.getElementById(
            "publishGeneratedExercise"
        );


    if (!state.generatedExercise) {

        showAdminMessage(
            "Aucun exercice Ò  publier.",
            "error"
        );

        return;
    }


    try {

        setButtonLoading(
            button,
            true,
            "ï¿½ï¿½ï¿½S Publier dans PostgreSQL",
            "Publication..."
        );


        const exercise =
            state.generatedExercise;


        await apiRequest(
            "/exercises",
            {
                method: "POST",

                body: JSON.stringify({

                    title:
                        exercise.title,

                    description:
                        exercise.description || "",

                    subject:
                        exercise.subject,

                    level:
                        exercise.level,

                    difficulty:
                        exercise.difficulty,

                    xpReward:
                        Number(
                            exercise.xpReward ??
                            exercise.xp_reward ??
                            10
                        ),

                    questions:
                        Array.isArray(
                            exercise.questions
                        )
                            ? exercise.questions
                            : []
                })
            }
        );


        state.generatedExercise =
            null;


        closeExercisePreviewModal();


        showAdminMessage(
            "Exercice gÒ©nÒ©rÒ© par l'IA publiÒ© avec succÒ¨s.",
            "success"
        );


        await loadExercises();


    } catch (error) {

        console.error(
            "Publication exercice IA:",
            error
        );


        showAdminMessage(
            error.message ||
            "Impossible de publier l'exercice.",
            "error"
        );


    } finally {

        setButtonLoading(
            button,
            false,
            "ï¿½ï¿½ï¿½S Publier dans PostgreSQL",
            "Publication..."
        );
    }
}


/* ======================================================
   EXERCICES ï¿½ï¿½ï¿½ SUPPRESSION
====================================================== */

async function deleteExercise(
    exerciseId
) {

    const exercise =
        state.exercises.data.find(
            item =>
                Number(item.id) ===
                Number(exerciseId)
        );


    const title =
        exercise?.title ||
        "cet exercice";


    const confirmed =
        window.confirm(
            `Voulez-vous vraiment supprimer ï¿½ï¿½ ${title} ï¿½ï¿½ ?`
        );


    if (!confirmed) {
        return;
    }


    try {

        await apiRequest(
            `/exercises/${exerciseId}`,
            {
                method: "DELETE"
            }
        );


        showAdminMessage(
            "Exercice supprimÒ©.",
            "success"
        );


        await loadExercises();


    } catch (error) {

        console.error(
            "Suppression exercice:",
            error
        );


        showAdminMessage(
            error.message,
            "error"
        );
    }
}


/* ======================================================
   EXERCICES ï¿½ï¿½ï¿½ VOIR
====================================================== */

function viewExercise(
    exerciseId
) {

    const exercise =
        state.exercises.data.find(
            item =>
                Number(item.id) ===
                Number(exerciseId)
        );


    if (!exercise) {

        showAdminMessage(
            "Exercice introuvable.",
            "error"
        );

        return;
    }


    state.generatedExercise =
        exercise;


    renderExercisePreview(
        exercise
    );


    openExercisePreviewModal();
}


/* ======================================================
   MODAL ï¿½0TUDIANT
====================================================== */

function openStudentModal(
    studentId
) {

    const student =
        state.students.data.find(
            item =>
                Number(item.id) ===
                Number(studentId)
        );


    if (!student) {
        return;
    }


    const modal =
        document.getElementById(
            "studentModal"
        );


    if (!modal) {
        return;
    }


    document.getElementById(
        "studentId"
    ).value =
        student.id;


    document.getElementById(
        "studentFirstName"
    ).value =
        student.firstName ||
        student.first_name ||
        "";


    document.getElementById(
        "studentLastName"
    ).value =
        student.lastName ||
        student.last_name ||
        "";


    document.getElementById(
        "studentEmail"
    ).value =
        student.email ||
        "";


    modal.hidden = false;

    modal.setAttribute(
        "aria-hidden",
        "false"
    );
}


function closeStudentModal() {

    const modal =
        document.getElementById(
            "studentModal"
        );


    if (!modal) {
        return;
    }


    modal.hidden = true;

    modal.setAttribute(
        "aria-hidden",
        "true"
    );
}


async function saveStudent(
    event
) {

    event.preventDefault();


    const id =
        document.getElementById(
            "studentId"
        )?.value;


    if (!id) {
        return;
    }


    const firstName =
        document.getElementById(
            "studentFirstName"
        )?.value.trim();


    const lastName =
        document.getElementById(
            "studentLastName"
        )?.value.trim();


    const email =
        document.getElementById(
            "studentEmail"
        )?.value.trim();


    try {

        await apiRequest(
            `/admin/students/${id}`,
            {
                method: "PUT",

                body: JSON.stringify({
                    firstName,
                    lastName,
                    email
                })
            }
        );


        closeStudentModal();


        showAdminMessage(
            "ï¿½0tudiant modifiÒ© avec succÒ¨s.",
            "success"
        );


        await loadStudents();

    } catch (error) {

        console.error(
            "Modification Ò©tudiant:",
            error
        );


        showAdminMessage(
            error.message,
            "error"
        );
    }
}


/* ======================================================
   MODAL DOCUMENT
====================================================== */

function openDocumentModal(
    documentId
) {

    const documentData =
        state.documents.data.find(
            item =>
                Number(item.id) ===
                Number(documentId)
        );


    const modal =
        document.getElementById(
            "documentModal"
        );


    const body =
        document.getElementById(
            "documentModalBody"
        );


    if (!modal || !body) {
        return;
    }


    if (!documentData) {

        body.innerHTML =
            `<p>Document introuvable.</p>`;

    } else {

        body.innerHTML = `

            <div class="admin-form-group">

                <h3>
                    ${escapeHtml(
                        documentData.title ||
                        documentData.name ||
                        "Document"
                    )}
                </h3>

                <p>
                    ${escapeHtml(
                        documentData.description ||
                        "Aucune description."
                    )}
                </p>

                <p>
                    <strong>MatiÒ¨re :</strong>
                    ${escapeHtml(
                        documentData.subject ||
                        "ï¿½ï¿½ï¿½"
                    )}
                </p>

                <p>
                    <strong>Niveau :</strong>
                    ${escapeHtml(
                        documentData.level ||
                        "ï¿½ï¿½ï¿½"
                    )}
                </p>

            </div>
        `;
    }


    modal.hidden = false;

    modal.setAttribute(
        "aria-hidden",
        "false"
    );
}


function closeDocumentModal() {

    const modal =
        document.getElementById(
            "documentModal"
        );


    if (!modal) {
        return;
    }


    modal.hidden = true;

    modal.setAttribute(
        "aria-hidden",
        "true"
    );
}


/* ======================================================
   MODAL ANNONCE
====================================================== */

function openNewAnnouncementModal() {

    const modal =
        document.getElementById(
            "announcementModal"
        );


    const form =
        document.getElementById(
            "announcementForm"
        );


    if (!modal) {
        return;
    }


    if (form) {
        form.reset();
    }


    document.getElementById(
        "announcementId"
    ).value = "";


    const title =
        document.getElementById(
            "announcementModalTitle"
        );


    if (title) {
        title.textContent =
            "Nouvelle annonce";
    }


    modal.hidden = false;

    modal.setAttribute(
        "aria-hidden",
        "false"
    );
}


function openAnnouncementModal(
    announcementId
) {

    const announcement =
        state.announcements.data.find(
            item =>
                Number(item.id) ===
                Number(announcementId)
        );


    if (!announcement) {
        return;
    }


    const modal =
        document.getElementById(
            "announcementModal"
        );


    if (!modal) {
        return;
    }


    document.getElementById(
        "announcementId"
    ).value =
        announcement.id;


    document.getElementById(
        "announcementTitle"
    ).value =
        announcement.title || "";


    document.getElementById(
        "announcementContent"
    ).value =
        announcement.content ||
        announcement.message ||
        "";


    document.getElementById(
        "announcementType"
    ).value =
        announcement.type ||
        "info";


    document.getElementById(
        "announcementActive"
    ).value =
        (
            announcement.isActive !== false &&
            announcement.is_active !== false
        )
            ? "true"
            : "false";


    const title =
        document.getElementById(
            "announcementModalTitle"
        );


    if (title) {
        title.textContent =
            "Modifier l'annonce";
    }


    modal.hidden = false;

    modal.setAttribute(
        "aria-hidden",
        "false"
    );
}


function closeAnnouncementModal() {

    const modal =
        document.getElementById(
            "announcementModal"
        );


    if (!modal) {
        return;
    }


    modal.hidden = true;

    modal.setAttribute(
        "aria-hidden",
        "true"
    );
}


async function saveAnnouncement(
    event
) {

    event.preventDefault();


    const id =
        document.getElementById(
            "announcementId"
        )?.value;


    const title =
        document.getElementById(
            "announcementTitle"
        )?.value.trim();


    const content =
        document.getElementById(
            "announcementContent"
        )?.value.trim();


    const type =
        document.getElementById(
            "announcementType"
        )?.value ||
        "info";


    const isActive =
        document.getElementById(
            "announcementActive"
        )?.value === "true";


    try {

        const body = {

            title,
            content,
            type,
            isActive
        };


        if (id) {

            await apiRequest(
                `/admin/announcements/${id}`,
                {
                    method: "PUT",
                    body: JSON.stringify(body)
                }
            );

        } else {

            await apiRequest(
                "/admin/announcements",
                {
                    method: "POST",
                    body: JSON.stringify(body)
                }
            );
        }


        closeAnnouncementModal();


        showAdminMessage(
            id
                ? "Annonce modifiÒ©e."
                : "Annonce crÒ©Ò©e.",
            "success"
        );


        await loadAnnouncements();

    } catch (error) {

        console.error(
            "Annonce:",
            error
        );


        showAdminMessage(
            error.message,
            "error"
        );
    }
}


async function toggleAnnouncementStatus(
    announcementId
) {

    try {

        await apiRequest(
            `/admin/announcements/${announcementId}/toggle`,
            {
                method: "PATCH"
            }
        );


        showAdminMessage(
            "Statut de l'annonce mis Ò  jour.",
            "success"
        );


        await loadAnnouncements();

    } catch (error) {

        showAdminMessage(
            error.message,
            "error"
        );
    }
}


async function deleteAnnouncement(
    announcementId
) {

    const confirmed =
        window.confirm(
            "Voulez-vous vraiment supprimer cette annonce ?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await apiRequest(
            `/admin/announcements/${announcementId}`,
            {
                method: "DELETE"
            }
        );


        showAdminMessage(
            "Annonce supprimÒ©e.",
            "success"
        );


        await loadAnnouncements();

    } catch (error) {

        showAdminMessage(
            error.message,
            "error"
        );
    }
}


/* ======================================================
   PAGINATION
====================================================== */

function renderPagination(
    containerId,
    total,
    currentPage,
    limit,
    onPageChange
) {

    const container =
        document.getElementById(
            containerId
        );


    if (!container) {
        return;
    }


    const totalPages =
        Math.ceil(
            total / limit
        );


    if (totalPages <= 1) {

        container.innerHTML = "";

        return;
    }


    let html = "";


    html += `
        <button
            type="button"
            class="admin-pagination-button"
            data-page="${currentPage - 1}"
            ${currentPage <= 1 ? "disabled" : ""}
        >
            ï¿½ ï¿½
        </button>
    `;


    for (
        let page = 1;
        page <= totalPages;
        page++
    ) {

        if (
            page === 1 ||
            page === totalPages ||
            Math.abs(page - currentPage) <= 2
        ) {

            html += `
                <button
                    type="button"
                    class="admin-pagination-button ${
                        page === currentPage
                            ? "active"
                            : ""
                    }"
                    data-page="${page}"
                >
                    ${page}
                </button>
            `;

        } else if (
            page === currentPage - 3 ||
            page === currentPage + 3
        ) {

            html += `
                <span class="admin-pagination-dots">
                    ï¿½ï¿½ï¿½ï¿½
                </span>
            `;
        }
    }


    html += `
        <button
            type="button"
            class="admin-pagination-button"
            data-page="${currentPage + 1}"
            ${currentPage >= totalPages ? "disabled" : ""}
        >
            ï¿½ ï¿½"
        </button>
    `;


    container.innerHTML = html;


    container
        .querySelectorAll(
            ".admin-pagination-button[data-page]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const page =
                        Number(
                            button.dataset.page
                        );


                    if (
                        !Number.isInteger(page) ||
                        page < 1 ||
                        page > totalPages
                    ) {
                        return;
                    }


                    onPageChange(page);
                }
            );
        });
}


/* ======================================================
   PROFIL
====================================================== */

async function loadProfile() {

    try {

        const data =
            await apiRequest(
                "/auth/profile"
            );


        const user =
            data.user ||
            data.data ||
            data;


        updateAdminIdentity(user);


    } catch (error) {

        console.warn(
            "Profil admin:",
            error.message
        );
    }
}


function updateAdminIdentity(
    user
) {

    if (!user) {
        return;
    }


    const firstName =
        user.firstName ||
        user.first_name ||
        "";


    const lastName =
        user.lastName ||
        user.last_name ||
        "";


    const fullName =
        `${firstName} ${lastName}`.trim() ||
        user.name ||
        "Administrateur";


    const avatar =
        getInitials(
            firstName,
            lastName
        );


    const adminName =
        document.getElementById(
            "adminName"
        );


    const adminAvatar =
        document.getElementById(
            "adminAvatar"
        );


    const profileName =
        document.getElementById(
            "profileName"
        );


    const profileEmail =
        document.getElementById(
            "profileEmail"
        );


    const profileAvatar =
        document.getElementById(
            "profileAvatar"
        );


    if (adminName) {
        adminName.textContent =
            fullName;
    }


    if (adminAvatar) {
        adminAvatar.textContent =
            avatar;
    }


    if (profileName) {
        profileName.textContent =
            fullName;
    }


    if (profileEmail) {
        profileEmail.textContent =
            user.email ||
            "ï¿½ï¿½ï¿½";
    }


    if (profileAvatar) {
        profileAvatar.textContent =
            avatar;
    }
}


/* ======================================================
   THï¿½ï¿½ ME
====================================================== */

function initTheme() {

    const savedTheme =
        localStorage.getItem(
            "travailplus_theme"
        );


    if (
        savedTheme === "dark"
    ) {

        document.body.classList.add(
            "dark-mode"
        );
    }

    document
        .getElementById("themeToggle")
        ?.addEventListener("click", () => {
            const darkMode =
                document.body.classList.toggle("dark-mode");

            localStorage.setItem(
                "travailplus_theme",
                darkMode ? "dark" : "light"
            );
        });
}


/* ======================================================
   Dï¿½0CONNEXION
====================================================== */

function logout() {

    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "travailplus_token"
    );

    localStorage.removeItem(
        "authToken"
    );

    localStorage.removeItem(
        "user"
    );

    window.location.href =
        "login.html";
}


/* ======================================================
   MENU MOBILE
====================================================== */

function initMobileMenu() {

    const button =
        document.getElementById(
            "mobileMenuButton"
        );


    const sidebar =
        document.getElementById(
            "adminSidebar"
        );

    const closeButton =
        document.getElementById(
            "mobileMenuClose"
        );

    const overlay =
        document.getElementById(
            "adminSidebarOverlay"
        );


    if (!button || !sidebar) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );
        }
    );

    const closeMenu = () => {
        sidebar.classList.remove("open");
    };

    closeButton?.addEventListener("click", closeMenu);
    overlay?.addEventListener("click", closeMenu);


    document
        .querySelectorAll(
            ".admin-nav-item"
        )
        .forEach(item => {

            item.addEventListener(
                "click",
                () => {

                    sidebar.classList.remove(
                        "open"
                    );
                }
            );
        });
}


/* ======================================================
   NAVIGATION
====================================================== */

function initNavigation() {

    document
        .querySelectorAll(
            "[data-section]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    const section =
                        button.dataset.section;

                    if (!section) {
                        return;
                    }

                    window.location.assign(
                        `admin.html?section=${encodeURIComponent(section)}`
                    );
                }
            );
        });
}


/* ======================================================
   MODALES
====================================================== */

function initModals() {

    /* ï¿½0tudiant */

    document
        .getElementById(
            "studentModalClose"
        )
        ?.addEventListener(
            "click",
            closeStudentModal
        );


    document
        .getElementById(
            "studentModalCancel"
        )
        ?.addEventListener(
            "click",
            closeStudentModal
        );


    document
        .getElementById(
            "studentForm"
        )
        ?.addEventListener(
            "submit",
            saveStudent
        );


    /* Document */

    document
        .getElementById(
            "closeDocumentModal"
        )
        ?.addEventListener(
            "click",
            closeDocumentModal
        );


    /* Annonce */

    document
        .getElementById(
            "createAnnouncementButton"
        )
        ?.addEventListener(
            "click",
            openNewAnnouncementModal
        );


    document
        .getElementById(
            "announcementModalClose"
        )
        ?.addEventListener(
            "click",
            closeAnnouncementModal
        );


    document
        .getElementById(
            "announcementModalCancel"
        )
        ?.addEventListener(
            "click",
            closeAnnouncementModal
        );


    document
        .getElementById(
            "announcementForm"
        )
        ?.addEventListener(
            "submit",
            saveAnnouncement
        );


    /* Exercice manuel */


    document
        .getElementById(
            "createExerciseButton"
        )
        ?.addEventListener(
            "click",
            openExerciseModal
        );


    document
        .getElementById(
            "exerciseModalClose"
        )
        ?.addEventListener(
            "click",
            closeExerciseModal
        );


    document
        .getElementById(
            "exerciseModalCancel"
        )
        ?.addEventListener(
            "click",
            closeExerciseModal
        );


    document
        .getElementById(
            "exerciseForm"
        )
        ?.addEventListener(
            "submit",
            saveManualExercise
        );


    document
        .getElementById(
            "addExerciseQuestion"
        )
        ?.addEventListener(
            "click",
            () => addExerciseQuestion()
        );


    /* GÒ©nÒ©ration IA */

    document
        .getElementById(
            "generateExerciseButton"
        )
        ?.addEventListener(
            "click",
            openGenerateExerciseModal
        );


    document
        .getElementById(
            "closeGenerateExerciseModal"
        )
        ?.addEventListener(
            "click",
            closeGenerateExerciseModal
        );


    document
        .getElementById(
            "cancelGenerateExercise"
        )
        ?.addEventListener(
            "click",
            closeGenerateExerciseModal
        );


    document
        .getElementById(
            "generateExerciseForm"
        )
        ?.addEventListener(
            "submit",
            generateExerciseWithAI
        );


    /* AperÒ§u IA */

    document
        .getElementById(
            "closeExercisePreviewModal"
        )
        ?.addEventListener(
            "click",
            closeExercisePreviewModal
        );


    document
        .getElementById(
            "cancelExercisePreview"
        )
        ?.addEventListener(
            "click",
            closeExercisePreviewModal
        );


    document
        .getElementById(
            "publishGeneratedExercise"
        )
        ?.addEventListener(
            "click",
            publishGeneratedExercise
        );
}


/* ======================================================
   CONTRï¿½LES ï¿½0TUDIANTS
====================================================== */

function bindStudentControls() {

    document
        .getElementById(
            "studentSearch"
        )
        ?.addEventListener(
            "input",
            event => {

                state.students.search =
                    event.target.value;

                state.students.page =
                    1;

                renderStudents();
            }
        );


    document
        .getElementById(
            "refreshStudentsButton"
        )
        ?.addEventListener(
            "click",
            loadStudents
        );
}


/* ======================================================
   CONTRï¿½LES DOCUMENTS
====================================================== */

function bindDocumentControls() {

    document
        .getElementById(
            "documentSearch"
        )
        ?.addEventListener(
            "input",
            event => {

                state.documents.search =
                    event.target.value;

                state.documents.page =
                    1;

                renderDocuments();
            }
        );


    document
        .getElementById(
            "refreshDocumentsButton"
        )
        ?.addEventListener(
            "click",
            loadDocuments
        );
}


/* ======================================================
   CONTRï¿½LES EXERCICES
====================================================== */

function bindExerciseControls() {

    document
        .getElementById(
            "exerciseSearch"
        )
        ?.addEventListener(
            "input",
            event => {

                state.exercises.search =
                    event.target.value;

                state.exercises.page =
                    1;

                renderExercises();
            }
        );


    document
        .getElementById(
            "exerciseSubjectFilter"
        )
        ?.addEventListener(
            "change",
            event => {

                state.exercises.subject =
                    event.target.value;

                state.exercises.page =
                    1;

                renderExercises();
            }
        );


    document
        .getElementById(
            "exerciseLevelFilter"
        )
        ?.addEventListener(
            "change",
            event => {

                state.exercises.level =
                    event.target.value;

                state.exercises.page =
                    1;

                renderExercises();
            }
        );


    document
        .getElementById(
            "refreshExercisesButton"
        )
        ?.addEventListener(
            "click",
            loadExercises
        );
}


/* ======================================================
   CONTRï¿½LES GLOBAUX
====================================================== */

function initGlobalButtons() {

    document
        .getElementById(
            "logoutButton"
        )
        ?.addEventListener(
            "click",
            logout
        );


    document
        .getElementById(
            "refreshButton"
        )
        ?.addEventListener(
            "click",
            () => {

                navigateTo(
                    state.currentSection
                );
            }
        );
}


/* ======================================================
   Dï¿½0Lï¿½0GATION DES ACTIONS TABLEAUX
====================================================== */

function initTableActions() {

    document.addEventListener(
        "click",
        event => {

            const sectionButton =
                event.target.closest(
                    "[data-section-action]"
                );

            if (sectionButton) {
                window.location.assign(
                    `admin.html?section=${encodeURIComponent(
                        sectionButton.dataset.sectionAction
                    )}`
                );
                return;
            }

            const button =
                event.target.closest(
                    "[data-action]"
                );


            if (!button) {
                return;
            }


            const action =
                button.dataset.action;


            const id =
                button.dataset.id;


            if (!id) {
                return;
            }


            switch (action) {

                case "edit-student":
                    openStudentModal(id);
                    break;


                case "view-document":
                    openDocumentModal(id);
                    break;


                case "delete-document":
                    deleteDocument(id);
                    break;


                case "edit-announcement":
                    openAnnouncementModal(id);
                    break;


                case "toggle-announcement":
                    toggleAnnouncementStatus(id);
                    break;


                case "delete-announcement":
                    deleteAnnouncement(id);
                    break;


                case "view-exercise":
                    viewExercise(id);
                    break;


                case "delete-exercise":
                    deleteExercise(id);
                    break;
            }
        }
    );
}


/* ======================================================
   SUPPRESSION DOCUMENT
====================================================== */

async function deleteDocument(
    documentId
) {

    const confirmed =
        window.confirm(
            "Voulez-vous vraiment supprimer ce document ?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await apiRequest(
            `/admin/documents/${documentId}`,
            {
                method: "DELETE"
            }
        );


        showAdminMessage(
            "Document supprimÒ©.",
            "success"
        );


        await loadDocuments();

    } catch (error) {

        console.error(
            "Suppression document:",
            error
        );


        showAdminMessage(
            error.message,
            "error"
        );
    }
}


/* ======================================================
   Vï¿½0RIFICATION SESSION ADMIN
====================================================== */

async function verifyAdminSession() {

    try {

        const data =
            await apiRequest(
                "/auth/profile"
            );


        const user =
            data.user ||
            data.data ||
            data;


        const isAdmin =
            user?.isAdmin === true ||
            user?.is_admin === true;


        if (!isAdmin) {

            throw new Error(
                "AccÒ¨s rÒ©servÒ© aux administrateurs."
            );
        }


        updateAdminIdentity(
            user
        );


        return true;

    } catch (error) {

        console.error(
            "VÒ©rification admin:",
            error
        );


        if (
            error.message !==
            "AccÒ¨s rÒ©servÒ© aux administrateurs."
        ) {

            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "travailplus_token"
            );

            localStorage.removeItem(
                "authToken"
            );

            window.location.href =
                "login.html";
        }


        return false;
    }
}


/* ======================================================
   INITIALISATION
====================================================== */

async function initAdmin() {

    initTheme();

    initNavigation();

    initModals();

    initGlobalButtons();

    initMobileMenu();

    bindStudentControls();

    bindDocumentControls();

    bindExerciseControls();

    initTableActions();


    const authenticated =
        await verifyAdminSession();


    if (!authenticated) {
        return;
    }


    const initialSection =
        new URLSearchParams(
            window.location.search
        ).get("section") ||
        "dashboard";

    await navigateTo(initialSection);
}

const pageTitle =
    document.getElementById("adminPageTitle");

const pageSubtitle =
    document.getElementById("adminPageSubtitle");


/* ======================================================
   DOM READY
====================================================== */

document.addEventListener(
    "DOMContentLoaded",
    initAdmin
);