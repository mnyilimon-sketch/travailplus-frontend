
"use strict";

/* ======================================================
   TRAVAIL+ — GÉNÉRATION IA DES COURS
   Gestion unique de la génération IA
====================================================== */


/* ======================================================
   CONFIGURATION API
====================================================== */

const COURSE_AI_API_BASE_URL =
    window.COURSE_AI_API_BASE_URL ||
    window.TravailPlusConfig?.apiBase ||
    "http://localhost:5000/api";


/* ======================================================
   ÉTAT
====================================================== */

let generatedCourse = null;
let courseGenerationInProgress = false;


/* ======================================================
   OUTILS
====================================================== */

function getElement(id) {
    return document.getElementById(id);
}


function getCourseAiToken() {
    if (
        window.TravailPlusAuth &&
        typeof window.TravailPlusAuth.getToken === "function"
    ) {
        return window.TravailPlusAuth.getToken();
    }

    return (
        localStorage.getItem("travailplus_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("travailplus_token") ||
        sessionStorage.getItem("token") ||
        sessionStorage.getItem("authToken") ||
        null
    );
}


function getValue(id) {
    const element = getElement(id);

    if (!element) {
        return "";
    }

    return String(element.value || "").trim();
}


/* ======================================================
   MESSAGES
====================================================== */

function showCourseAiMessage(message, type = "info") {
    const element = getElement("courseAiMessage");

    if (!element) {
        console.warn("Travail+ : #courseAiMessage introuvable.");
        return;
    }

    element.textContent = message;
    element.hidden = false;
    element.className = "admin-status-message " + type;
}


function showGeneratedCourseMessage(message, type = "info") {
    const element = getElement("generatedCourseMessage");

    if (!element) {
        return;
    }

    element.textContent = message;
    element.hidden = false;
    element.className = "admin-status-message " + type;
}


/* ======================================================
   MODALE GÉNÉRATION
====================================================== */

function openGenerateCourseModal() {
    const modal = getElement("generateCourseModal");

    if (!modal) {
        console.error(
            "Travail+ : #generateCourseModal introuvable."
        );
        return;
    }

    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    modal.classList.add("active");
    modal.style.display = "flex";

    const message = getElement("courseAiMessage");

    if (message) {
        message.hidden = true;
        message.textContent = "";
    }

    const input = getElement("courseAiTheme");

    if (input) {
        setTimeout(() => {
            input.focus();
        }, 100);
    }
}


function closeGenerateCourseModal() {
    const modal = getElement("generateCourseModal");

    if (!modal) {
        return;
    }

    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    modal.classList.remove("active");
    modal.style.display = "none";
}


/* ======================================================
   MODALE APERÇU
====================================================== */

function openGeneratedCoursePreview() {
    const modal = getElement(
        "generatedCoursePreviewModal"
    );

    if (!modal) {
        console.error(
            "Travail+ : #generatedCoursePreviewModal introuvable."
        );
        return;
    }

    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    modal.classList.add("active");
    modal.style.display = "flex";
}


function closeGeneratedCoursePreview() {
    const modal = getElement(
        "generatedCoursePreviewModal"
    );

    if (!modal) {
        return;
    }

    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    modal.classList.remove("active");
    modal.style.display = "none";
}


/* ======================================================
   CHARGEMENT
====================================================== */

function setGenerationLoading(loading) {
    const button = getElement("generateCourseSubmit");

    if (!button) {
        return;
    }

    if (loading) {
        button.disabled = true;

        if (!button.dataset.previousText) {
            button.dataset.previousText =
                button.textContent;
        }

        button.textContent =
            "Génération en cours...";
    } else {
        button.disabled = false;

        button.textContent =
            button.dataset.previousText ||
            "Générer le cours";
    }
}


/* ======================================================
   OBJECTIFS
====================================================== */

function normalizeObjectives(objectives) {
    if (Array.isArray(objectives)) {
        return objectives
            .map(item => String(item ?? "").trim())
            .filter(Boolean);
    }

    if (typeof objectives === "string") {
        return objectives
            .split(/\r?\n/)
            .map(item =>
                item
                    .replace(/^[-*•]\s*/, "")
                    .trim()
            )
            .filter(Boolean);
    }

    return [];
}


function renderObjectives(objectives) {
    const container =
        getElement("generatedCourseObjectives");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    const list =
        normalizeObjectives(objectives);

    if (list.length === 0) {
        const paragraph =
            document.createElement("p");

        paragraph.textContent =
            "Aucun objectif pédagogique fourni.";

        container.appendChild(paragraph);
        return;
    }

    const ul = document.createElement("ul");

    list.forEach(objective => {
        const li =
            document.createElement("li");

        li.textContent = objective;
        ul.appendChild(li);
    });

    container.appendChild(ul);
}


/* ======================================================
   CONTENU
====================================================== */

function renderContent(content) {
    const container =
        getElement("generatedCourseContent");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    const text =
        String(content || "").trim();

    if (!text) {
        const paragraph =
            document.createElement("p");

        paragraph.textContent =
            "Aucun contenu fourni.";

        container.appendChild(paragraph);
        return;
    }

    const paragraphs =
        text
            .split(/\r?\n/)
            .map(item => item.trim())
            .filter(Boolean);

    paragraphs.forEach(paragraph => {
        const element =
            document.createElement("p");

        element.textContent = paragraph;

        container.appendChild(element);
    });
}


/* ======================================================
   AFFICHAGE DU COURS GÉNÉRÉ
====================================================== */

function renderGeneratedCourse(course) {
    const title =
        getElement("generatedCourseTitle");

    const theme =
        getElement("generatedCourseTheme");

    const description =
        getElement("generatedCourseDescription");

    const faculty =
        getElement("generatedCourseFaculty");

    const department =
        getElement("generatedCourseDepartment");

    const level =
        getElement("generatedCourseLevel");


    if (title) {
        title.textContent =
            course.title || "—";
    }

    if (theme) {
        theme.textContent =
            course.theme || "—";
    }

    if (description) {
        description.textContent =
            course.description || "—";
    }

    if (faculty) {
        faculty.textContent =
            course.faculty || "—";
    }

    if (department) {
        department.textContent =
            course.department || "—";
    }

    if (level) {
        level.textContent =
            course.level || "—";
    }


    renderObjectives(
        course.objectives
    );

    renderContent(
        course.content
    );
}


/* ======================================================
   EXTRACTION RÉPONSE BACKEND
====================================================== */

function extractCourse(result) {
    if (!result) {
        return null;
    }

    if (
        result.data &&
        result.data.course
    ) {
        return result.data.course;
    }

    if (
        result.data &&
        (
            result.data.title ||
            result.data.content
        )
    ) {
        return result.data;
    }

    if (result.course) {
        return result.course;
    }

    if (
        result.title ||
        result.content
    ) {
        return result;
    }

    return null;
}


/* ======================================================
   FETCH AVEC TIMEOUT
====================================================== */

async function fetchWithTimeout(
    url,
    options = {},
    timeout = 90000
) {
    const controller =
        new AbortController();

    const timer =
        setTimeout(() => {
            controller.abort();
        }, timeout);

    try {
        return await fetch(url, {
            ...options,
            signal: controller.signal
        });
    } finally {
        clearTimeout(timer);
    }
}


/* ======================================================
   GÉNÉRATION IA
====================================================== */

async function generateCourseWithAI() {
    if (courseGenerationInProgress) {
        return;
    }

    const token =
        getCourseAiToken();

    if (!token) {
        showCourseAiMessage(
            "Aucun token administrateur trouvé. Reconnectez-vous à Travail+.",
            "error"
        );

        return;
    }


    const theme =
        getValue("courseAiTheme");

    const subject =
        getValue("courseAiSubject");

    const faculty =
        getValue("courseAiFaculty");

    const department =
        getValue("courseAiDepartment");

    const level =
        getValue("courseAiLevel");

    const language =
        getValue("courseAiLanguage") ||
        "français";

    const instructions =
        getValue("courseAiInstructions");


    /* ==================================================
       VALIDATION
    ================================================== */

    if (!theme) {
        showCourseAiMessage(
            "Le thème est obligatoire.",
            "error"
        );
        return;
    }

    if (!faculty) {
        showCourseAiMessage(
            "La faculté est obligatoire.",
            "error"
        );
        return;
    }

    if (!department) {
        showCourseAiMessage(
            "Le département est obligatoire.",
            "error"
        );
        return;
    }

    if (!level) {
        showCourseAiMessage(
            "Le niveau est obligatoire.",
            "error"
        );
        return;
    }


    const payload = {
        theme,
        subject,
        faculty,
        department,
        level,
        language,
        instructions
    };


    courseGenerationInProgress = true;

    setGenerationLoading(true);

    showCourseAiMessage(
        "Connexion au serveur IA...",
        "info"
    );


    try {
        const url =
            COURSE_AI_API_BASE_URL +
            "/courses/admin/generate";

        console.log(
            "Travail+ — génération IA :",
            url
        );

        console.log(
            "Travail+ — données envoyées :",
            payload
        );


        const response =
            await fetchWithTimeout(
                url,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json",

                        "Authorization":
                            "Bearer " + token
                    },

                    body:
                        JSON.stringify(payload)
                },
                90000
            );


        const responseText =
            await response.text();

        console.log(
            "Travail+ — HTTP :",
            response.status
        );

        console.log(
            "Travail+ — réponse :",
            responseText
        );


        let result = null;

        if (responseText) {
            try {
                result =
                    JSON.parse(
                        responseText
                    );
            } catch (error) {
                throw new Error(
                    "Le serveur a renvoyé une réponse qui n'est pas du JSON."
                );
            }
        }


        if (!response.ok) {
            throw new Error(
                result?.message ||
                result?.error ||
                responseText ||
                `Erreur HTTP ${response.status}`
            );
        }


        const course =
            extractCourse(result);


        if (!course) {
            throw new Error(
                "Le backend a répondu, mais aucun cours généré n'a été trouvé."
            );
        }


        if (
            !course.title ||
            !course.content
        ) {
            throw new Error(
                "Le backend a renvoyé un cours incomplet : le titre ou le contenu est absent."
            );
        }


        generatedCourse = {
            id:
                course.id ||
                null,

            title:
                String(
                    course.title
                ).trim(),

            theme:
                String(
                    course.theme ||
                    theme
                ).trim(),

            description:
                String(
                    course.description ||
                    ""
                ).trim(),

            content:
                String(
                    course.content
                ).trim(),

            objectives:
                normalizeObjectives(
                    course.objectives
                ),

            faculty:
                String(
                    course.faculty ||
                    faculty
                ).trim(),

            department:
                String(
                    course.department ||
                    department
                ).trim(),

            level:
                String(
                    course.level ||
                    level
                ).trim(),

            isAiGenerated: true,

            isPublished: false
        };


        console.log(
            "Travail+ — cours généré :",
            generatedCourse
        );


        renderGeneratedCourse(
            generatedCourse
        );


        closeGenerateCourseModal();


        showGeneratedCourseMessage(
            "Cours généré avec succès.",
            "success"
        );


        openGeneratedCoursePreview();


    } catch (error) {
        console.error(
            "Travail+ — génération IA échouée :",
            error
        );


        let message =
            error.message ||
            "Impossible de générer le cours.";


        if (
            error.name ===
            "AbortError"
        ) {
            message =
                "Le serveur n'a pas répondu dans les 90 secondes. Vérifiez le backend et la configuration IA.";
        }


        showCourseAiMessage(
            message,
            "error"
        );

    } finally {
        courseGenerationInProgress = false;
        setGenerationLoading(false);
    }
}


/* ======================================================
   MODIFIER LE COURS GÉNÉRÉ
====================================================== */

function editGeneratedCourse() {
    if (!generatedCourse) {
        showGeneratedCourseMessage(
            "Aucun cours généré disponible.",
            "error"
        );

        return;
    }


    const fields = {
        courseTitle:
            generatedCourse.title,

        courseTheme:
            generatedCourse.theme,

        courseFaculty:
            generatedCourse.faculty,

        courseDepartment:
            generatedCourse.department,

        courseLevel:
            generatedCourse.level,

        courseDescription:
            generatedCourse.description,

        courseContent:
            generatedCourse.content
    };


    Object.entries(fields).forEach(
        ([id, value]) => {
            const element =
                getElement(id);

            if (element) {
                element.value =
                    value || "";
            }
        }
    );


    const objectives =
        getElement("courseObjectives");

    if (objectives) {
        objectives.value =
            normalizeObjectives(
                generatedCourse.objectives
            ).join("\n");
    }


    const courseId =
        getElement("courseId");

    if (courseId) {
        courseId.value =
            generatedCourse.id || "";
    }


    const title =
        getElement(
            "courseFormModalTitle"
        );

    if (title) {
        title.textContent =
            "Modifier le cours généré par IA";
    }


    closeGeneratedCoursePreview();


    const modal =
        getElement("courseFormModal");

    if (modal) {
        modal.hidden = false;
        modal.setAttribute(
            "aria-hidden",
            "false"
        );
        modal.classList.add("active");
        modal.style.display = "flex";
    }
}


/* ======================================================
   ENREGISTRER LE COURS GÉNÉRÉ
====================================================== */

async function saveGeneratedCourse() {
    if (!generatedCourse) {
        showGeneratedCourseMessage(
            "Aucun cours généré disponible.",
            "error"
        );

        return;
    }


    const token =
        getCourseAiToken();

    if (!token) {
        showGeneratedCourseMessage(
            "Votre session administrateur a expiré. Reconnectez-vous.",
            "error"
        );

        return;
    }


    const button =
        getElement(
            "saveGeneratedCourse"
        );


    if (button) {
        button.disabled = true;

        if (!button.dataset.previousText) {
            button.dataset.previousText =
                button.textContent;
        }

        button.textContent =
            "Enregistrement...";
    }


    try {
        const payload = {
            title:
                generatedCourse.title,

            theme:
                generatedCourse.theme,

            description:
                generatedCourse.description,

            content:
                generatedCourse.content,

            objectives:
                normalizeObjectives(
                    generatedCourse.objectives
                ),

            faculty:
                generatedCourse.faculty,

            department:
                generatedCourse.department,

            level:
                generatedCourse.level,

            isAiGenerated: true,

            isPublished: false
        };


        const response =
            await fetchWithTimeout(
                COURSE_AI_API_BASE_URL +
                "/courses/admin",

                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json",

                        "Authorization":
                            "Bearer " + token
                    },

                    body:
                        JSON.stringify(payload)
                },

                30000
            );


        const responseText =
            await response.text();


        let result = null;

        if (responseText) {
            try {
                result =
                    JSON.parse(
                        responseText
                    );
            } catch (error) {
                throw new Error(
                    "Réponse invalide du serveur lors de l'enregistrement."
                );
            }
        }


        if (!response.ok) {
            throw new Error(
                result?.message ||
                result?.error ||
                "Impossible d'enregistrer le cours."
            );
        }


        showGeneratedCourseMessage(
            "Cours enregistré avec succès.",
            "success"
        );


        if (
            typeof window.loadAdminCourses ===
            "function"
        ) {
            await window.loadAdminCourses();
        }


        setTimeout(() => {
            closeGeneratedCoursePreview();
        }, 800);


    } catch (error) {
        console.error(
            "Travail+ — erreur enregistrement :",
            error
        );

        showGeneratedCourseMessage(
            error.message ||
            "Impossible d'enregistrer le cours.",
            "error"
        );

    } finally {
        if (button) {
            button.disabled = false;

            button.textContent =
                button.dataset.previousText ||
                "Enregistrer le cours";
        }
    }
}


/* ======================================================
   INITIALISATION
====================================================== */

function initCourseAI() {
    console.log(
        "Travail+ : course-ai.js chargé."
    );


    /* ==================================================
       BOUTON GÉNÉRER
    ================================================== */

    const generateButton =
        getElement(
            "generateCourseButton"
        );


    if (generateButton) {
        generateButton.addEventListener(
            "click",
            function (event) {
                event.preventDefault();

                openGenerateCourseModal();
            }
        );
    } else {
        console.warn(
            "Travail+ : #generateCourseButton introuvable."
        );
    }


    /* ==================================================
       FORMULAIRE IA
    ================================================== */

    const generateForm =
        getElement(
            "generateCourseForm"
        );


    if (generateForm) {
        generateForm.addEventListener(
            "submit",
            async function (event) {
                event.preventDefault();

                await generateCourseWithAI();
            }
        );
    } else {
        console.warn(
            "Travail+ : #generateCourseForm introuvable."
        );
    }


    /* ==================================================
       ANNULER
    ================================================== */

    const cancelButton =
        getElement(
            "cancelGenerateCourse"
        );


    if (cancelButton) {
        cancelButton.addEventListener(
            "click",
            function (event) {
                event.preventDefault();

                closeGenerateCourseModal();
            }
        );
    }


    /* ==================================================
       FERMER MODALE GÉNÉRATION
    ================================================== */

    const closeButton =
        getElement(
            "closeGenerateCourseModal"
        );


    if (closeButton) {
        closeButton.addEventListener(
            "click",
            function (event) {
                event.preventDefault();

                closeGenerateCourseModal();
            }
        );
    }


    /* ==================================================
       FERMER APERÇU
    ================================================== */

    const closePreviewButton =
        getElement(
            "closeGeneratedCoursePreview"
        );


    if (closePreviewButton) {
        closePreviewButton.addEventListener(
            "click",
            function (event) {
                event.preventDefault();

                closeGeneratedCoursePreview();
            }
        );
    }


    /* ==================================================
       MODIFIER
    ================================================== */

    const editButton =
        getElement(
            "editGeneratedCourse"
        );


    if (editButton) {
        editButton.addEventListener(
            "click",
            function (event) {
                event.preventDefault();

                editGeneratedCourse();
            }
        );
    }


    /* ==================================================
       ENREGISTRER
    ================================================== */

    const saveButton =
        getElement(
            "saveGeneratedCourse"
        );


    if (saveButton) {
        saveButton.addEventListener(
            "click",
            async function (event) {
                event.preventDefault();

                await saveGeneratedCourse();
            }
        );
    }


    /* ==================================================
       OVERLAY MODALE GÉNÉRATION
    ================================================== */

    const generateModal =
        getElement(
            "generateCourseModal"
        );


    if (generateModal) {
        const overlay =
            generateModal.querySelector(
                ".admin-modal-overlay"
            );

        if (overlay) {
            overlay.addEventListener(
                "click",
                closeGenerateCourseModal
            );
        }
    }


    /* ==================================================
       OVERLAY APERÇU
    ================================================== */

    const previewModal =
        getElement(
            "generatedCoursePreviewModal"
        );


    if (previewModal) {
        const overlay =
            previewModal.querySelector(
                ".admin-modal-overlay"
            );

        if (overlay) {
            overlay.addEventListener(
                "click",
                closeGeneratedCoursePreview
            );
        }
    }


    /* ==================================================
       ESCAPE
    ================================================== */

    document.addEventListener(
        "keydown",
        function (event) {
            if (event.key !== "Escape") {
                return;
            }

            const generateModal =
                getElement(
                    "generateCourseModal"
                );

            const previewModal =
                getElement(
                    "generatedCoursePreviewModal"
                );


            if (
                generateModal &&
                !generateModal.hidden
            ) {
                closeGenerateCourseModal();
            }


            if (
                previewModal &&
                !previewModal.hidden
            ) {
                closeGeneratedCoursePreview();
            }
        }
    );
}


/* ======================================================
   DÉMARRAGE
====================================================== */

if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        initCourseAI,
        { once: true }
    );
} else {
    initCourseAI();
}


/* ======================================================
   EXPOSITION POUR LES AUTRES SCRIPTS
====================================================== */

window.TravailPlusCourseAI = {
    generateCourseWithAI,
    openGenerateCourseModal,
    closeGenerateCourseModal,
    openGeneratedCoursePreview,
    closeGeneratedCoursePreview,
    editGeneratedCourse,
    saveGeneratedCourse
};

