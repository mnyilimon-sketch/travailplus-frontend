
"use strict";

/* ======================================================
   TRAVAIL+ — GÉNÉRATION IA DES COURS
====================================================== */

const COURSE_AI_API_BASE_URL =
    window.COURSE_AI_API_BASE_URL ||
    "http://localhost:5000/api";


let generatedCourse = null;

let autoGenerationTimer = null;
let courseGenerationInProgress = false;



/* ======================================================
   OUTILS
====================================================== */

function getElement(id) {
    return document.getElementById(id);
}


function getCourseAiToken() {
    if (window.TravailPlusAuth?.getToken) {
        return window.TravailPlusAuth.getToken();
    }

    return (
        localStorage.getItem("travailplus_token") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("travailplus_token") ||
        sessionStorage.getItem("token") ||
        null
    );
}

function scheduleAutomaticCourseGeneration() {
    clearTimeout(autoGenerationTimer);

    autoGenerationTimer = setTimeout(() => {
        const requiredFields = [
            "courseAiTheme",
            "courseAiFaculty",
            "courseAiDepartment",
            "courseAiLevel"
        ];

        const formIsComplete = requiredFields.every(
            id => getValue(id)
        );

        if (
            formIsComplete &&
            !courseGenerationInProgress
        ) {
            generateCourseWithAI();
        }
    }, 1500);
}


function getValue(id) {

    const element =
        getElement(id);

    if (!element) {
        return "";
    }

    return String(
        element.value || ""
    ).trim();
}


/* ======================================================
   MESSAGES
====================================================== */

function showCourseAiMessage(
    message,
    type = "info"
) {

    const element =
        getElement("courseAiMessage");

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.hidden = false;

    element.className =
        "admin-status-message " + type;
}


function showGeneratedCourseMessage(
    message,
    type = "info"
) {

    const element =
        getElement("generatedCourseMessage");

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.hidden = false;

    element.className =
        "admin-status-message " + type;
}


/* ======================================================
   MODALE GÉNÉRATION
====================================================== */

function openGenerateCourseModal() {

    const modal =
        getElement("generateCourseModal");

    if (!modal) {

        console.error(
            "Travail+ : generateCourseModal introuvable."
        );

        return;
    }

    modal.hidden = false;

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    modal.classList.add("active");

    modal.style.display = "flex";


    const message =
        getElement("courseAiMessage");

    if (message) {

        message.hidden = true;

        message.textContent = "";

    }


    const input =
        getElement("courseAiTheme");

    if (input) {

        setTimeout(
            () => input.focus(),
            100
        );

    }
}


function closeGenerateCourseModal() {

    const modal =
        getElement("generateCourseModal");

    if (!modal) {
        return;
    }

    modal.hidden = true;

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    modal.classList.remove("active");

    modal.style.display = "none";
}

function openAdminModal(modal) {
    if (!modal) {
        return;
    }

    modal.hidden = false;
    modal.removeAttribute("aria-hidden");
    modal.classList.add("show");
}

function closeAdminModal(modal) {
    if (!modal) {
        return;
    }

    if (modal.contains(document.activeElement)) {
        document.activeElement.blur();
    }

    modal.setAttribute("aria-hidden", "true");
    modal.hidden = true;
    modal.classList.remove("show");
}

/* ======================================================
   MODALE APERÇU
====================================================== */

function openGeneratedCoursePreview() {

    const modal =
        getElement(
            "generatedCoursePreviewModal"
        );

    if (!modal) {

        console.error(
            "Travail+ : generatedCoursePreviewModal introuvable."
        );

        return;
    }

    modal.hidden = false;

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    modal.classList.add("active");

    modal.style.display = "flex";
}


function closeGeneratedCoursePreview() {

    const modal =
        getElement(
            "generatedCoursePreviewModal"
        );

    if (!modal) {
        return;
    }

    modal.hidden = true;

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    modal.classList.remove("active");

    modal.style.display = "none";
}


/* ======================================================
   BOUTON GÉNÉRATION
====================================================== */

function setGenerationLoading(
    loading
) {

    const button =
        getElement(
            "generateCourseSubmit"
        );

    if (!button) {
        return;
    }


    if (loading) {

        button.disabled = true;

        button.dataset.previousText =
            button.textContent;

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
   NORMALISATION OBJECTIFS
====================================================== */

function normalizeObjectives(
    objectives
) {

    if (Array.isArray(objectives)) {

        return objectives
            .map(
                objective =>
                    String(
                        objective ?? ""
                    ).trim()
            )
            .filter(Boolean);
    }


    if (typeof objectives === "string") {

        return objectives
            .split(/\r?\n/)
            .map(
                objective =>
                    objective
                        .replace(
                            /^[-*•]\s*/,
                            ""
                        )
                        .trim()
            )
            .filter(Boolean);
    }


    return [];
}


/* ======================================================
   AFFICHER OBJECTIFS
====================================================== */

function renderObjectives(
    objectives
) {

    const container =
        getElement(
            "generatedCourseObjectives"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";


    const list =
        normalizeObjectives(
            objectives
        );


    if (list.length === 0) {

        const paragraph =
            document.createElement("p");

        paragraph.textContent =
            "Aucun objectif pédagogique fourni.";

        container.appendChild(
            paragraph
        );

        return;
    }


    const ul =
        document.createElement("ul");


    list.forEach(
        objective => {

            const li =
                document.createElement("li");

            li.textContent =
                objective;

            ul.appendChild(li);

        }
    );


    container.appendChild(ul);
}


/* ======================================================
   AFFICHER CONTENU
====================================================== */

function renderContent(
    content
) {

    const container =
        getElement(
            "generatedCourseContent"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";


    const text =
        String(
            content || ""
        ).trim();


    if (!text) {

        const paragraph =
            document.createElement("p");

        paragraph.textContent =
            "Aucun contenu fourni.";

        container.appendChild(
            paragraph
        );

        return;
    }


    const paragraphs =
        text
            .split(/\r?\n/)
            .map(
                paragraph =>
                    paragraph.trim()
            )
            .filter(Boolean);


    paragraphs.forEach(
        paragraph => {

            const element =
                document.createElement("p");

            element.textContent =
                paragraph;

            container.appendChild(
                element
            );

        }
    );
}


/* ======================================================
   AFFICHER LE COURS
====================================================== */

function renderGeneratedCourse(
    course
) {

    const title =
        getElement(
            "generatedCourseTitle"
        );

    const theme =
        getElement(
            "generatedCourseTheme"
        );

    const description =
        getElement(
            "generatedCourseDescription"
        );

    const faculty =
        getElement(
            "generatedCourseFaculty"
        );

    const department =
        getElement(
            "generatedCourseDepartment"
        );

    const level =
        getElement(
            "generatedCourseLevel"
        );


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

function extractCourse(
    result
) {

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
   REQUÊTE AVEC TIMEOUT
====================================================== */

async function fetchWithTimeout(
    url,
    options,
    timeout = 90000
) {

    const controller =
        new AbortController();


    const timer =
        setTimeout(
            () => {
                controller.abort();
            },
            timeout
        );


    try {

        return await fetch(
            url,
            {
                ...options,
                signal:
                    controller.signal
            }
        );

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

        setGenerationLoading(false);

        return;
    }


    const theme =
        getValue(
            "courseAiTheme"
        );

    const subject =
        getValue(
            "courseAiSubject"
        );

    const faculty =
        getValue(
            "courseAiFaculty"
        );

    const department =
        getValue(
            "courseAiDepartment"
        );

    const level =
        getValue(
            "courseAiLevel"
        );

    const language =
        getValue(
            "courseAiLanguage"
        ) || "français";

    const instructions =
        getValue(
            "courseAiInstructions"
        );


    /* ==============================================
       VALIDATION
    ============================================== */

    if (!theme) {

        showCourseAiMessage(
            "Le thème est obligatoire.",
            "error"
        );

        setGenerationLoading(false);

        return;
    }


    if (!faculty) {

        showCourseAiMessage(
            "La faculté est obligatoire.",
            "error"
        );

        setGenerationLoading(false);

        return;
    }


    if (!department) {

        showCourseAiMessage(
            "Le département est obligatoire.",
            "error"
        );

        setGenerationLoading(false);

        return;
    }


    if (!level) {

        showCourseAiMessage(
            "Le niveau est obligatoire.",
            "error"
        );

        setGenerationLoading(false);

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


    console.log(
        "Travail+ — demande génération IA :",
        payload
    );


        courseGenerationInProgress = true;
    setGenerationLoading(true);

    
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
            "Travail+ — POST :",
            url
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
                        JSON.stringify(
                            payload
                        )
                },
                90000
            );


        console.log(
            "Travail+ — HTTP :",
            response.status
        );


        const responseText =
            await response.text();


        console.log(
            "Travail+ — réponse serveur :",
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

            const serverMessage =
                result?.message ||
                result?.error ||
                responseText ||
                (
                    "Erreur HTTP " +
                    response.status
                );


            throw new Error(
                serverMessage
            );
        }


        const course =
            extractCourse(
                result
            );


        if (!course) {

            throw new Error(
                "Le backend a répondu, mais aucun cours généré n'a été trouvé dans sa réponse."
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

            isAiGenerated:
                true,

            isPublished:
                false
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


        let message;


        if (
            error.name ===
            "AbortError"
        ) {

            message =
                "Le serveur n'a pas répondu dans les 90 secondes. Vérifiez le serveur backend et la configuration OpenAI.";

        } else {

            message =
                error.message ||
                "Impossible de générer le cours.";
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
        getElement(
            "courseObjectives"
        );


    if (objectives) {

        objectives.value =
            normalizeObjectives(
                generatedCourse.objectives
            ).join("\n");
    }


    const courseId =
        getElement(
            "courseId"
        );


    if (courseId) {
        courseId.value = "";
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
        getElement(
            "courseFormModal"
        );


    if (modal) {

        modal.hidden = false;

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        modal.classList.add(
            "active"
        );

        modal.style.display =
            "flex";
    }
}


/* ======================================================
   ENREGISTRER LE COURS
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

        button.dataset.previousText =
            button.textContent;

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

            isAiGenerated:
                true,

            isPublished:
                false
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
                        JSON.stringify(
                            payload
                        )
                },
                30000
            );


        const text =
            await response.text();


        let result = null;


        try {

            result =
                text
                    ? JSON.parse(text)
                    : null;

        } catch (error) {

            throw new Error(
                "Réponse invalide du serveur lors de l'enregistrement."
            );
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


        setTimeout(
            () => {

                closeGeneratedCoursePreview();

            },
            800
        );


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


function scheduleAutomaticCourseGeneration() {

    clearTimeout(autoGenerationTimer);

    autoGenerationTimer = setTimeout(() => {

        const theme = getValue("courseAiTheme");
        const faculty = getValue("courseAiFaculty");
        const department = getValue("courseAiDepartment");
        const level = getValue("courseAiLevel");

        if (
            theme &&
            faculty &&
            department &&
            level &&
            !courseGenerationInProgress
        ) {
            generateCourseWithAI();
        }

    }, 1500);
}

document.addEventListener(
    "DOMContentLoaded",
    function () {

        [
            "courseAiTheme",
            "courseAiSubject",
            "courseAiFaculty",
            "courseAiDepartment",
            "courseAiLevel",
            "courseAiLanguage",
            "courseAiInstructions"
        ].forEach(id => {
            const element = getElement(id);

            if (element) {
                element.addEventListener(
                    "input",
                    scheduleAutomaticCourseGeneration
                );

                element.addEventListener(
                    "change",
                    scheduleAutomaticCourseGeneration
                );
            }
        });
        });

        console.log(
            "Travail+ : course-ai.js chargé."
        );


        /* ==============================================
           GÉNÉRER AVEC IA
        ============================================== */

        const generateButton =
            getElement(
                "generateCourseButton"
            );


        if (!generateButton) {

            console.error(
                "Travail+ : #generateCourseButton introuvable."
            );

        } else {

            generateButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    event.stopPropagation();

                    openGenerateCourseModal();

                }
            );
        }


        /* ==============================================
           FORMULAIRE IA
        ============================================== */

        const generateForm =
            getElement(
                "generateCourseForm"
            );


        if (!generateForm) {

            console.error(
                "Travail+ : #generateCourseForm introuvable."
            );

        } else {

            generateForm.addEventListener(
                "submit",
                async function (event) {

                    event.preventDefault();

                    event.stopPropagation();

                    await generateCourseWithAI();

                }
            );
        }


        /* ==============================================
           ANNULER
        ============================================== */

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


        /* ==============================================
           FERMER GÉNÉRATION
        ============================================== */

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


        /* ==============================================
           FERMER APERÇU
        ============================================== */

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


        /* ==============================================
           MODIFIER
        ============================================== */

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


        /* ==============================================
           ENREGISTRER
        ============================================== */

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


        /* ==============================================
           OVERLAY GÉNÉRATION
        ============================================== */

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


        /* ==============================================
           OVERLAY APERÇU
        ============================================== */

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


        /* ==============================================
           ESCAPE
        ============================================== */

        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key !==
                    "Escape"
                ) {
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
