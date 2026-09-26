"use strict";

/* ======================================================
   TRAVAIL+ — ADMINISTRATION DES COURS
   - Liste des cours
   - Ajout manuel
   - Modification
   - Suppression
   - Publication / dépublication
   - Génération IA réelle
   - Prévisualisation
   - Modification du cours généré avant sauvegarde
====================================================== */


/* ======================================================
   CONFIGURATION API
====================================================== */

const COURSES_API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000/api/courses"
        : "https://travailplus-backend.onrender.com/api/courses";


/* ======================================================
   ÉTAT
====================================================== */

const coursesAdminState = {
    courses: [],
    themes: [],
    generatedCourse: null,
    editingCourseId: null
};


/* ======================================================
   UTILITAIRES
====================================================== */

function courseGetToken() {
    return (
        localStorage.getItem("travailplus_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        ""
    );
}


function courseEscapeHtml(value) {
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


function courseFormatDate(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}


function courseGetElement(id) {
    return document.getElementById(id);
}


function courseShowMessage(message, type = "info") {
    const element =
        courseGetElement("courseAiMessage") ||
        courseGetElement("coursesAdminMessage");

    if (!element) {
        console.log(message);
        return;
    }

    element.textContent = message;

    element.className =
        `admin-message ${type}`;

    element.hidden = false;
}


/* ======================================================
   NORMALISATION DES DONNÉES
====================================================== */

function normalizeCourse(course) {
    if (!course || typeof course !== "object") {
        return null;
    }

    return {
        ...course,

        id:
            course.id ??
            course.courseId ??
            null,

        title:
            course.title ??
            "",

        theme:
            course.theme ??
            "",

        description:
            course.description ??
            "",

        content:
            course.content ??
            "",

        objectives:
            course.objectives ??
            "",

        faculty:
            course.faculty ??
            "",

        department:
            course.department ??
            "",

        level:
            course.level ??
            "",

        isAiGenerated:
            Boolean(
                course.isAiGenerated ??
                course.is_ai_generated
            ),

        isPublished:
            Boolean(
                course.isPublished ??
                course.is_published
            ),

        createdAt:
            course.createdAt ??
            course.created_at ??
            null,

        updatedAt:
            course.updatedAt ??
            course.updated_at ??
            null
    };
}


/* ======================================================
   REQUÊTE API
====================================================== */

async function courseApiRequest(
    endpoint = "",
    options = {}
) {
    const token = courseGetToken();

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization =
            `Bearer ${token}`;
    }

    const response =
        await fetch(
            `${COURSES_API_URL}${endpoint}`,
            {
                ...options,
                headers
            }
        );

    let data = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }


    if (response.status === 401) {

        localStorage.removeItem(
            "travailplus_token"
        );

        localStorage.removeItem(
            "travailplus_user"
        );

        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "authToken"
        );

        window.location.href =
            "login.html";

        throw new Error(
            "Session expirée. Veuillez vous reconnecter."
        );
    }


    if (!response.ok) {

        throw new Error(
            data?.message ||
            data?.error ||
            `Erreur HTTP ${response.status}`
        );
    }


    return data;
}


/* ======================================================
   EXTRACTION DES LISTES API
====================================================== */

function extractCourses(data) {
    const list =
        Array.isArray(data)
            ? data
            : (
                data?.courses ||
                data?.data ||
                []
            );

    return list
        .map(normalizeCourse)
        .filter(Boolean);
}


function extractCourse(data) {
    const course =
        data?.course ||
        data?.data ||
        data;

    return normalizeCourse(course);
}


/* ======================================================
   CHARGEMENT DES COURS ADMIN
====================================================== */

async function loadAdminCourses() {

    const loading =
        courseGetElement(
            "coursesAdminLoading"
        );

    const empty =
        courseGetElement(
            "coursesAdminEmpty"
        );

    const container =
        courseGetElement(
            "coursesAdminTableContainer"
        );


    if (loading) {
        loading.hidden = false;
    }

    if (empty) {
        empty.hidden = true;
    }

    if (container) {
        container.hidden = true;
    }


    try {

        const params =
            new URLSearchParams();


        const faculty =
            courseGetElement(
                "courseFilterFaculty"
            )?.value?.trim();

        const department =
            courseGetElement(
                "courseFilterDepartment"
            )?.value?.trim();

        const level =
            courseGetElement(
                "courseFilterLevel"
            )?.value?.trim();

        const theme =
            courseGetElement(
                "courseFilterTheme"
            )?.value?.trim();

        const search =
            courseGetElement(
                "courseSearch"
            )?.value?.trim();


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

        if (theme) {
            params.set(
                "theme",
                theme
            );
        }

        if (search) {
            params.set(
                "search",
                search
            );
        }


        const query =
            params.toString()
                ? `?${params.toString()}`
                : "";


        const data =
            await courseApiRequest(
                `/admin${query}`
            );


        coursesAdminState.courses =
            extractCourses(data);

        if (typeof updateSectionCount === "function") {
            updateSectionCount(
                "coursesSectionCount",
                data.pagination?.total ??
                data.total ??
                coursesAdminState.courses.length
            );
        }


        renderAdminCourses();


    } catch (error) {

        console.error(
            "Erreur chargement cours :",
            error
        );

        if (empty) {

            empty.textContent =
                error.message ||
                "Impossible de charger les cours.";

            empty.hidden = false;
        }

    } finally {

        if (loading) {
            loading.hidden = true;
        }
    }
}


/* ======================================================
   AFFICHAGE DES COURS
====================================================== */

function renderAdminCourses() {

    const tbody =
        courseGetElement(
            "coursesAdminTableBody"
        );

    const empty =
        courseGetElement(
            "coursesAdminEmpty"
        );

    const container =
        courseGetElement(
            "coursesAdminTableContainer"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = "";


    if (
        !coursesAdminState.courses.length
    ) {

        if (container) {
            container.hidden = true;
        }

        if (empty) {
            empty.hidden = false;
        }

        return;
    }


    if (container) {
        container.hidden = false;
    }

    if (empty) {
        empty.hidden = true;
    }


    coursesAdminState.courses
        .forEach(course => {

            const row =
                document.createElement("tr");


            const published =
                Boolean(
                    course.isPublished ??
                    course.is_published
                );


            const aiGenerated =
                Boolean(
                    course.isAiGenerated ??
                    course.is_ai_generated
                );


            row.innerHTML = `

                <td>
                    <strong>
                        ${courseEscapeHtml(
                            course.title
                        )}
                    </strong>

                    ${
                        aiGenerated
                            ? `
                                <span class="badge badge-ai">
                                    IA
                                </span>
                              `
                            : ""
                    }
                </td>


                <td>
                    ${courseEscapeHtml(
                        course.theme
                    )}
                </td>


                <td>
                    ${courseEscapeHtml(
                        course.faculty
                    )}
                </td>


                <td>
                    ${courseEscapeHtml(
                        course.department
                    )}
                </td>


                <td>
                    ${courseEscapeHtml(
                        course.level
                    )}
                </td>


                <td>
                    ${
                        published
                            ? `
                                <span class="badge badge-success">
                                    Publié
                                </span>
                              `
                            : `
                                <span class="badge badge-secondary">
                                    Brouillon
                                </span>
                              `
                    }
                </td>


                <td>
                    ${courseFormatDate(
                        course.createdAt ??
                        course.created_at
                    )}
                </td>


                <td>

                    <div class="admin-action-buttons">

                        <button
                            type="button"
                            class="btn btn-small"
                            data-course-action="preview"
                            data-course-id="${course.id}"
                        >
                            Voir
                        </button>


                        <button
                            type="button"
                            class="btn btn-small"
                            data-course-action="edit"
                            data-course-id="${course.id}"
                        >
                            Modifier
                        </button>


                        <button
                            type="button"
                            class="btn btn-small"
                            data-course-action="publish"
                            data-course-id="${course.id}"
                        >
                            ${
                                published
                                    ? "Dépublier"
                                    : "Publier"
                            }
                        </button>


                        <button
                            type="button"
                            class="btn btn-small btn-danger"
                            data-course-action="delete"
                            data-course-id="${course.id}"
                        >
                            Supprimer
                        </button>

                    </div>

                </td>
            `;


            tbody.appendChild(row);
        });
}


/* ======================================================
   THÈMES
====================================================== */

async function loadCourseThemes() {

    try {

        const data =
            await courseApiRequest(
                "/themes"
            );


        coursesAdminState.themes =
            Array.isArray(data)
                ? data
                : (
                    data?.themes ||
                    data?.data ||
                    []
                );


        renderCourseThemeOptions();

    } catch (error) {

        console.error(
            "Erreur chargement thèmes :",
            error
        );
    }
}


function renderCourseThemeOptions() {

    const select =
        courseGetElement(
            "courseFilterTheme"
        );

    if (!select) {
        return;
    }


    const current =
        select.value;


    select.innerHTML =
        `
            <option value="">
                Tous les thèmes
            </option>
        `;


    coursesAdminState.themes
        .forEach(theme => {

            const option =
                document.createElement(
                    "option"
                );

            option.value = theme;
            option.textContent = theme;

            select.appendChild(option);
        });


    select.value = current;
}


/* ======================================================
   MODALE COURS MANUEL
====================================================== */

function openCourseForm(course = null) {

    const modal =
        courseGetElement(
            "courseFormModal"
        );

    const title =
        courseGetElement(
            "courseFormModalTitle"
        );


    const normalized =
        normalizeCourse(course);


    coursesAdminState.editingCourseId =
        normalized?.id
            ? Number(normalized.id)
            : null;


    if (title) {

        title.textContent =
            normalized
                ? "Modifier le cours"
                : "Ajouter un cours";
    }


    const fields = {

        courseId:
            normalized?.id || "",

        courseTitle:
            normalized?.title || "",

        courseTheme:
            normalized?.theme || "",

        courseFaculty:
            normalized?.faculty || "",

        courseDepartment:
            normalized?.department || "",

        courseLevel:
            normalized?.level || "",

        courseDescription:
            normalized?.description || "",

        courseObjectives:
            Array.isArray(normalized?.objectives)
                ? normalized.objectives.join("\n")
                : normalized?.objectives || "",

        courseContent:
            normalized?.content || ""
    };


    Object.entries(fields)
        .forEach(([id, value]) => {

            const element =
                courseGetElement(id);

            if (element) {
                element.value = value;
            }
        });


    if (modal) {
        modal.hidden = false;
    }
}


function closeCourseForm() {

    const modal =
        courseGetElement(
            "courseFormModal"
        );

    if (modal) {
        modal.hidden = true;
    }


    coursesAdminState.editingCourseId =
        null;
}


/* ======================================================
   SAUVEGARDE COURS MANUEL
====================================================== */

async function saveCourse(event) {

    event.preventDefault();


    const payload = {

        title:
            courseGetElement(
                "courseTitle"
            )?.value?.trim(),

        theme:
            courseGetElement(
                "courseTheme"
            )?.value?.trim(),

        faculty:
            courseGetElement(
                "courseFaculty"
            )?.value?.trim(),

        department:
            courseGetElement(
                "courseDepartment"
            )?.value?.trim(),

        level:
            courseGetElement(
                "courseLevel"
            )?.value?.trim(),

        description:
            courseGetElement(
                "courseDescription"
            )?.value?.trim() || null,

        objectives:
            courseGetElement(
                "courseObjectives"
            )?.value?.trim() || null,

        content:
            courseGetElement(
                "courseContent"
            )?.value?.trim(),

        isAiGenerated: false
    };


    if (
        !payload.title ||
        !payload.theme ||
        !payload.faculty ||
        !payload.department ||
        !payload.level ||
        !payload.content
    ) {

        alert(
            "Veuillez remplir tous les champs obligatoires."
        );

        return;
    }


    try {

        const id =
            coursesAdminState.editingCourseId;


        if (id) {

            await courseApiRequest(
                `/admin/${id}`,
                {
                    method: "PUT",

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );

        } else {

            await courseApiRequest(
                "/admin",
                {
                    method: "POST",

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );
        }


        closeCourseForm();

        await loadAdminCourses();

        await loadCourseThemes();


        alert(
            id
                ? "Cours modifié avec succès."
                : "Cours créé avec succès."
        );


    } catch (error) {

        console.error(
            "Erreur sauvegarde cours :",
            error
        );

        alert(
            error.message ||
            "Impossible de sauvegarder le cours."
        );
    }
}


/* ======================================================
   GÉNÉRATION IA
====================================================== */

function openGenerateCourseModal() {

    const modal =
        courseGetElement(
            "generateCourseModal"
        );

    const form =
        courseGetElement(
            "generateCourseForm"
        );

    const message =
        courseGetElement(
            "courseAiMessage"
        );


    if (form) {
        form.reset();
    }

    if (message) {
        message.hidden = true;
        message.textContent = "";
    }

    if (modal) {
        modal.hidden = false;
        modal.setAttribute(
            "aria-hidden",
            "false"
        );
    }
}


function closeGenerateCourseModal() {

    const modal =
        courseGetElement(
            "generateCourseModal"
        );

    if (modal) {
        const generateButton =
            courseGetElement(
                "generateCourseButton"
            );

        if (modal.contains(document.activeElement)) {
            generateButton?.focus();
        }

        modal.hidden = true;

        modal.setAttribute(
            "aria-hidden",
            "true"
        );
    }
}


async function generateCourseWithAI(event) {

    event.preventDefault();


    const theme =
        courseGetElement(
            "courseAiTheme"
        )?.value?.trim();

    const subject =
        courseGetElement(
            "courseAiSubject"
        )?.value?.trim();

    const faculty =
        courseGetElement(
            "courseAiFaculty"
        )?.value?.trim();

    const department =
        courseGetElement(
            "courseAiDepartment"
        )?.value?.trim();

    const level =
        courseGetElement(
            "courseAiLevel"
        )?.value?.trim();

    const language =
        courseGetElement(
            "courseAiLanguage"
        )?.value?.trim() ||
        "français";

    const instructions =
        courseGetElement(
            "courseAiInstructions"
        )?.value?.trim() ||
        "";


    if (
        !theme ||
        !faculty ||
        !department ||
        !level
    ) {

        alert(
            "Le thème, la faculté, le département et le niveau sont obligatoires."
        );

        return;
    }


    const submitButton =
        courseGetElement(
            "generateCourseSubmit"
        );

    const message =
        courseGetElement(
            "courseAiMessage"
        );


    if (submitButton) {

        submitButton.disabled = true;

        submitButton.textContent =
            "Génération en cours...";
    }


    if (message) {

        message.hidden = false;

        message.textContent =
            "L'IA génère le cours. Veuillez patienter...";
    }


    try {

        const data =
            await courseApiRequest(
                "/admin/generate",
                {
                    method: "POST",

                    body:
                        JSON.stringify({

                            theme,

                            subject:
                                subject ||
                                theme,

                            faculty,

                            department,

                            level,

                            language,

                            instructions
                        })
                }
            );


        const generated =
            extractCourse(data);


        if (!generated) {

            throw new Error(
                "L'IA n'a retourné aucun cours."
            );
        }


        if (
            !generated.title ||
            !generated.content
        ) {

            throw new Error(
                "Le cours généré est incomplet."
            );
        }


        coursesAdminState.generatedCourse = {

            ...generated,

            theme:
                generated.theme ||
                theme,

            faculty:
                generated.faculty ||
                faculty,

            department:
                generated.department ||
                department,

            level:
                generated.level ||
                level,

            isAiGenerated: true,

            isPublished: false
        };


        closeGenerateCourseModal();


        openGeneratedCoursePreview(
            coursesAdminState.generatedCourse
        );


    } catch (error) {

        console.error(
            "Erreur génération cours IA :",
            error
        );


        if (message) {

            message.hidden = false;

            message.textContent =
                error.message ||
                "Erreur pendant la génération du cours.";

        } else {

            alert(
                error.message ||
                "Erreur pendant la génération du cours."
            );
        }

    } finally {

        if (submitButton) {

            submitButton.disabled = false;

            submitButton.textContent =
                "Générer le cours";
        }
    }
}


/* ======================================================
   PRÉVISUALISATION COURS IA
====================================================== */

function openGeneratedCoursePreview(course) {

    const normalized =
        normalizeCourse(course);


    if (!normalized) {

        alert(
            "Impossible d'afficher le cours généré."
        );

        return;
    }


    coursesAdminState.generatedCourse =
        normalized;


    const modal =
        courseGetElement(
            "generatedCoursePreviewModal"
        );


    if (!modal) {

        /*
         * Compatibilité avec l'ancien système
         * si cette modale existe encore dans admin.html.
         */
        showGeneratedCoursePreview(
            normalized
        );

        return;
    }


    const title =
        courseGetElement(
            "generatedCourseTitle"
        );

    const theme =
        courseGetElement(
            "generatedCourseTheme"
        );

    const description =
        courseGetElement(
            "generatedCourseDescription"
        );

    const faculty =
        courseGetElement(
            "generatedCourseFaculty"
        );

    const department =
        courseGetElement(
            "generatedCourseDepartment"
        );

    const level =
        courseGetElement(
            "generatedCourseLevel"
        );

    const objectives =
        courseGetElement(
            "generatedCourseObjectives"
        );

    const content =
        courseGetElement(
            "generatedCourseContent"
        );

    const message =
        courseGetElement(
            "generatedCourseMessage"
        );


    if (title) {
        title.textContent =
            normalized.title ||
            "Sans titre";
    }


    if (theme) {
        theme.textContent =
            normalized.theme ||
            "—";
    }


    if (description) {
        description.textContent =
            normalized.description ||
            "Aucune description.";
    }


    if (faculty) {
        faculty.textContent =
            normalized.faculty ||
            "—";
    }


    if (department) {
        department.textContent =
            normalized.department ||
            "—";
    }


    if (level) {
        level.textContent =
            normalized.level ||
            "—";
    }


    renderGeneratedObjectives(
        objectives,
        normalized.objectives
    );


    if (content) {

        content.textContent =
            normalized.content ||
            "Aucun contenu.";
    }


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


function renderGeneratedObjectives(
    container,
    objectives
) {

    if (!container) {
        return;
    }


    container.innerHTML = "";


    let objectiveList = [];


    if (Array.isArray(objectives)) {

        objectiveList =
            objectives
                .map(item =>
                    String(item).trim()
                )
                .filter(Boolean);

    } else if (
        typeof objectives === "string"
    ) {

        objectiveList =
            objectives
                .split(/\r?\n/)
                .map(item =>
                    item.trim()
                )
                .filter(Boolean);
    }


    if (!objectiveList.length) {

        container.textContent =
            "Aucun objectif fourni.";

        return;
    }


    objectiveList.forEach(
        objective => {

            const element =
                document.createElement(
                    "div"
                );

            element.className =
                "generated-course-objective";

            element.textContent =
                objective;

            container.appendChild(
                element
            );
        }
    );
}


function closeGeneratedCoursePreview() {

    const modal =
        courseGetElement(
            "generatedCoursePreviewModal"
        );


    if (modal) {

        modal.hidden = true;

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        return;
    }


    closeCoursePreview();
}


/* ======================================================
   ANCIENNE PRÉVISUALISATION
   Conservée pour compatibilité avec admin.html
====================================================== */

function showGeneratedCoursePreview(course) {

    const modal =
        courseGetElement(
            "coursePreviewModal"
        );

    const content =
        courseGetElement(
            "coursePreviewContent"
        );


    if (!modal || !content) {

        alert(
            "La fenêtre de prévisualisation des cours est introuvable."
        );

        return;
    }


    content.innerHTML =
        renderCoursePreviewHtml(
            normalizeCourse(course)
        );


    modal.hidden = false;
}


function renderCoursePreviewHtml(course) {

    const normalized =
        normalizeCourse(course);


    if (!normalized) {
        return "";
    }


    const objectives =
        Array.isArray(normalized.objectives)
            ? normalized.objectives.join("\n")
            : normalized.objectives || "";


    return `

        <article class="course-preview">

            <h2>
                ${courseEscapeHtml(
                    normalized.title
                )}
            </h2>


            <p>
                <strong>Thème :</strong>
                ${courseEscapeHtml(
                    normalized.theme
                )}
            </p>


            <p>
                <strong>Faculté :</strong>
                ${courseEscapeHtml(
                    normalized.faculty
                )}
            </p>


            <p>
                <strong>Département :</strong>
                ${courseEscapeHtml(
                    normalized.department
                )}
            </p>


            <p>
                <strong>Niveau :</strong>
                ${courseEscapeHtml(
                    normalized.level
                )}
            </p>


            ${
                normalized.description
                    ? `
                        <section>
                            <h3>Description</h3>

                            <p>
                                ${courseEscapeHtml(
                                    normalized.description
                                )}
                            </p>
                        </section>
                      `
                    : ""
            }


            ${
                objectives
                    ? `
                        <section>
                            <h3>Objectifs</h3>

                            <div>
                                ${courseEscapeHtml(
                                    objectives
                                ).replace(
                                    /\n/g,
                                    "<br>"
                                )}
                            </div>
                        </section>
                      `
                    : ""
            }


            <section>

                <h3>Contenu</h3>

                <div class="course-content-preview">

                    ${courseEscapeHtml(
                        normalized.content
                    ).replace(
                        /\n/g,
                        "<br>"
                    )}

                </div>

            </section>

        </article>
    `;
}


function closeCoursePreview() {

    const modal =
        courseGetElement(
            "coursePreviewModal"
        );


    if (modal) {
        modal.hidden = true;
    }
}


/* ======================================================
   ENREGISTRER LE COURS GÉNÉRÉ
====================================================== */

async function saveGeneratedCourse() {

    const course =
        normalizeCourse(
            coursesAdminState.generatedCourse
        );


    if (!course) {

        alert(
            "Aucun cours généré n'est disponible."
        );

        return;
    }


    const button =
        courseGetElement(
            "saveGeneratedCourse"
        ) ||
        courseGetElement(
            "saveGeneratedCourseButton"
        );


    const message =
        courseGetElement(
            "generatedCourseMessage"
        );


    if (button) {

        button.disabled = true;

        button.textContent =
            "Enregistrement...";
    }


    if (message) {

        message.hidden = false;

        message.textContent =
            "Enregistrement du cours...";
    }


    try {

        const payload = {

            title:
                course.title,

            theme:
                course.theme,

            description:
                course.description ||
                null,

            content:
                course.content,

            objectives:
                Array.isArray(course.objectives)
                    ? course.objectives.join("\n")
                    : course.objectives ||
                      null,

            faculty:
                course.faculty,

            department:
                course.department,

            level:
                course.level,

            isAiGenerated:
                true,

            isPublished:
                false
        };


        if (
            !payload.title ||
            !payload.theme ||
            !payload.content ||
            !payload.faculty ||
            !payload.department ||
            !payload.level
        ) {

            throw new Error(
                "Le cours généré contient des informations obligatoires manquantes."
            );
        }


        const data =
            await courseApiRequest(
                "/admin",
                {
                    method: "POST",

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        const savedCourse =
            extractCourse(data);


        if (!savedCourse) {

            throw new Error(
                "Le serveur n'a retourné aucun cours enregistré."
            );
        }


        coursesAdminState.generatedCourse =
            null;


        closeGeneratedCoursePreview();

        closeCoursePreview();


        await loadAdminCourses();

        await loadCourseThemes();


        alert(
            "Cours enregistré avec succès. Il est actuellement non publié."
        );


    } catch (error) {

        console.error(
            "Erreur enregistrement cours IA :",
            error
        );


        if (message) {

            message.hidden = false;

            message.textContent =
                error.message ||
                "Impossible d'enregistrer le cours.";

        } else {

            alert(
                error.message ||
                "Impossible d'enregistrer le cours."
            );
        }

    } finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                "Enregistrer le cours";
        }
    }
}


/* ======================================================
   MODIFIER LE COURS GÉNÉRÉ AVANT SAUVEGARDE
====================================================== */

function editGeneratedCourse() {

    const course =
        normalizeCourse(
            coursesAdminState.generatedCourse
        );


    if (!course) {
        return;
    }


    closeGeneratedCoursePreview();

    closeCoursePreview();


    /*
     * On réutilise le formulaire
     * d'ajout/modification existant.
     */

    openCourseForm(course);


    /*
     * On conserve le cours IA dans l'état
     * afin de pouvoir l'identifier comme généré
     * si nécessaire.
     */
    coursesAdminState.generatedCourse =
        course;
}


/* ======================================================
   VOIR UN COURS EXISTANT
====================================================== */

async function previewCourse(id) {

    try {

        const data =
            await courseApiRequest(
                `/admin/${id}`
            );


        const course =
            extractCourse(data);


        if (!course) {

            throw new Error(
                "Cours introuvable."
            );
        }


        /*
         * Pour un cours déjà enregistré,
         * on utilise la prévisualisation classique.
         */
        showGeneratedCoursePreview(
            course
        );


    } catch (error) {

        console.error(
            "Erreur prévisualisation :",
            error
        );

        alert(
            error.message ||
            "Impossible d'afficher le cours."
        );
    }
}


/* ======================================================
   MODIFIER UN COURS EXISTANT
====================================================== */

async function editCourse(id) {

    try {

        const data =
            await courseApiRequest(
                `/admin/${id}`
            );


        const course =
            extractCourse(data);


        if (!course) {

            throw new Error(
                "Cours introuvable."
            );
        }


        openCourseForm(course);


    } catch (error) {

        console.error(
            "Erreur modification cours :",
            error
        );

        alert(
            error.message ||
            "Impossible de modifier le cours."
        );
    }
}


/* ======================================================
   PUBLICATION / DÉPUBLICATION
====================================================== */

async function toggleCoursePublication(
    id,
    currentlyPublished
) {

    const action =
        currentlyPublished
            ? "dépublier"
            : "publier";


    if (
        !confirm(
            `Voulez-vous vraiment ${action} ce cours ?`
        )
    ) {
        return;
    }


    try {

        await courseApiRequest(
            `/admin/${id}/publish`,
            {
                method: "PATCH",

                body:
                    JSON.stringify({
                        isPublished:
                            !currentlyPublished
                    })
            }
        );


        await loadAdminCourses();


    } catch (error) {

        console.error(
            "Erreur publication cours :",
            error
        );

        alert(
            error.message ||
            "Impossible de modifier la publication du cours."
        );
    }
}


/* ======================================================
   SUPPRESSION
====================================================== */

async function deleteCourse(id) {

    const course =
        coursesAdminState.courses
            .find(
                item =>
                    Number(item.id) ===
                    Number(id)
            );


    const title =
        course?.title ||
        "ce cours";


    if (
        !confirm(
            `Voulez-vous vraiment supprimer "${title}" ?`
        )
    ) {
        return;
    }


    try {

        await courseApiRequest(
            `/admin/${id}`,
            {
                method: "DELETE"
            }
        );


        await loadAdminCourses();


    } catch (error) {

        console.error(
            "Erreur suppression cours :",
            error
        );

        alert(
            error.message ||
            "Impossible de supprimer le cours."
        );
    }
}


/* ======================================================
   ÉVÉNEMENTS DU TABLEAU
====================================================== */

function initCourseTableEvents() {

    const tbody =
        courseGetElement(
            "coursesAdminTableBody"
        );


    if (!tbody) {
        return;
    }


    tbody.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-course-action]"
                );


            if (!button) {
                return;
            }


            const action =
                button.dataset.courseAction;


            const id =
                Number(
                    button.dataset.courseId
                );


            if (!id) {
                return;
            }


            const course =
                coursesAdminState.courses
                    .find(
                        item =>
                            Number(item.id) ===
                            id
                    );


            switch (action) {

                case "preview":

                    previewCourse(id);

                    break;


                case "edit":

                    editCourse(id);

                    break;


                case "publish":

                    toggleCoursePublication(
                        id,

                        Boolean(
                            course?.isPublished ??
                            course?.is_published
                        )
                    );

                    break;


                case "delete":

                    deleteCourse(id);

                    break;


                default:

                    console.warn(
                        "Action cours inconnue :",
                        action
                    );
            }
        }
    );
}


/* ======================================================
   INITIALISATION
====================================================== */

function initCoursesAdmin() {

    const courseForm =
        courseGetElement(
            "courseForm"
        );

    const newButton =
        courseGetElement(
            "newCourseButton"
        );

    const emptyNewButton =
        courseGetElement(
            "emptyNewCourseButton"
        );

    const generateButton =
        courseGetElement(
            "generateCourseButton"
        );

    const filterButton =
        courseGetElement(
            "courseFilterButton"
        );

    const resetButton =
        courseGetElement(
            "courseResetFilters"
        );

    const closeFormButton =
        courseGetElement(
            "closeCourseFormModal"
        );

    const cancelFormButton =
        courseGetElement(
            "cancelCourseForm"
        );

    const closeGenerateButton =
        courseGetElement(
            "closeGenerateCourseModal"
        );

    const cancelGenerateButton =
        courseGetElement(
            "cancelGenerateCourse"
        );

    const generateForm =
        courseGetElement(
            "generateCourseForm"
        );


    /*
     * Ancienne modale de prévisualisation
     */
    const closePreviewButton =
        courseGetElement(
            "closeCoursePreviewModal"
        );

    const cancelPreviewButton =
        courseGetElement(
            "cancelCoursePreview"
        );

    const oldEditGeneratedButton =
        courseGetElement(
            "editGeneratedCourseButton"
        );

    const oldSaveGeneratedButton =
        courseGetElement(
            "saveGeneratedCourseButton"
        );


    /*
     * Nouvelle modale de prévisualisation IA
     */
    const generatedPreviewCloseButton =
        courseGetElement(
            "closeGeneratedCoursePreview"
        );

    const generatedPreviewSaveButton =
        courseGetElement(
            "saveGeneratedCourse"
        );

    const generatedPreviewEditButton =
        courseGetElement(
            "editGeneratedCourse"
        );


    /* ==================================================
       NOUVEAU COURS
    ================================================== */

    newButton?.addEventListener(
        "click",
        () => openCourseForm()
    );

    emptyNewButton?.addEventListener(
        "click",
        () => openCourseForm()
    );


    /* ==================================================
       GÉNÉRATION IA
    ================================================== */

    generateButton?.addEventListener(
        "click",
        openGenerateCourseModal
    );


    generateForm?.addEventListener(
        "submit",
        generateCourseWithAI
    );


    closeGenerateButton?.addEventListener(
        "click",
        closeGenerateCourseModal
    );


    cancelGenerateButton?.addEventListener(
        "click",
        closeGenerateCourseModal
    );


    /* ==================================================
       FORMULAIRE COURS
    ================================================== */

    courseForm?.addEventListener(
        "submit",
        saveCourse
    );


    closeFormButton?.addEventListener(
        "click",
        closeCourseForm
    );


    cancelFormButton?.addEventListener(
        "click",
        closeCourseForm
    );


    /* ==================================================
       FILTRES
    ================================================== */

    filterButton?.addEventListener(
        "click",
        loadAdminCourses
    );


    const courseSearch =
        courseGetElement(
            "courseSearch"
        );


    courseSearch?.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                loadAdminCourses();
            }
        }
    );


    resetButton?.addEventListener(
        "click",
        () => {

            [
                "courseFilterFaculty",
                "courseFilterDepartment",
                "courseFilterLevel",
                "courseFilterTheme",
                "courseSearch"
            ]
                .forEach(id => {

                    const element =
                        courseGetElement(
                            id
                        );

                    if (element) {
                        element.value = "";
                    }
                });


            loadAdminCourses();
        }
    );


    /* ==================================================
       ANCIENNE PRÉVISUALISATION
    ================================================== */

    closePreviewButton?.addEventListener(
        "click",
        closeCoursePreview
    );


    cancelPreviewButton?.addEventListener(
        "click",
        closeCoursePreview
    );


    oldEditGeneratedButton?.addEventListener(
        "click",
        editGeneratedCourse
    );


    oldSaveGeneratedButton?.addEventListener(
        "click",
        saveGeneratedCourse
    );


    /* ==================================================
       NOUVELLE PRÉVISUALISATION IA
    ================================================== */

    generatedPreviewCloseButton?.addEventListener(
        "click",
        closeGeneratedCoursePreview
    );


    generatedPreviewSaveButton?.addEventListener(
        "click",
        saveGeneratedCourse
    );


    generatedPreviewEditButton?.addEventListener(
        "click",
        editGeneratedCourse
    );


    /* ==================================================
       TABLEAU
    ================================================== */

    initCourseTableEvents();


    /* ==================================================
       CHARGEMENT INITIAL
    ================================================== */

    loadCourseThemes();

    loadAdminCourses();
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
        initCoursesAdmin
    );

} else {

    initCoursesAdmin();
}

/* ======================================================
   TRAVAIL+ — GÉNÉRATION IA DES COURS
   Correctif : branchement direct du bouton et du formulaire
====================================================== */

(function initCourseAIGeneration() {
    function init() {
        const generateButton =
            document.getElementById("generateCourseButton");

        const generateModal =
            document.getElementById("generateCourseModal");

        const generateForm =
            document.getElementById("generateCourseForm");

        const cancelButton =
            document.getElementById("cancelGenerateCourse");

        const closeButton =
            document.getElementById("closeGenerateCourseModal");

        if (!generateButton) {
            console.error(
                "Travail+ IA : #generateCourseButton introuvable."
            );
            return;
        }

        /*
         * Ouvre le formulaire de génération IA.
         */
        generateButton.addEventListener("click", function () {
            if (!generateModal) {
                console.error(
                    "Travail+ IA : #generateCourseModal introuvable."
                );
                return;
            }

            generateModal.hidden = false;
            generateModal.setAttribute(
                "aria-hidden",
                "false"
            );

            const theme =
                document.getElementById("courseAiTheme");

            if (theme) {
                setTimeout(() => {
                    theme.focus();
                }, 50);
            }
        });

        /*
         * Ferme le formulaire.
         */
        function closeModal() {
            if (!generateModal) {
                return;
            }

            generateModal.hidden = true;
            generateModal.setAttribute(
                "aria-hidden",
                "true"
            );
        }

        cancelButton?.addEventListener(
            "click",
            closeModal
        );

        closeButton?.addEventListener(
            "click",
            closeModal
        );

        /*
         * Génération du cours avec l'IA.
         */
        if (generateForm) {
            generateForm.addEventListener(
                "submit",
                async function (event) {
                    event.preventDefault();

                    const submitButton =
                        document.getElementById(
                            "generateCourseSubmit"
                        );

                    const message =
                        document.getElementById(
                            "courseAiMessage"
                        );

                    const theme =
                        document.getElementById(
                            "courseAiTheme"
                        )?.value.trim();

                    const subject =
                        document.getElementById(
                            "courseAiSubject"
                        )?.value.trim();

                    const faculty =
                        document.getElementById(
                            "courseAiFaculty"
                        )?.value.trim();

                    const department =
                        document.getElementById(
                            "courseAiDepartment"
                        )?.value.trim();

                    const level =
                        document.getElementById(
                            "courseAiLevel"
                        )?.value.trim();

                    const language =
                        document.getElementById(
                            "courseAiLanguage"
                        )?.value || "français";

                    const instructions =
                        document.getElementById(
                            "courseAiInstructions"
                        )?.value.trim();

                    if (
                        !theme ||
                        !faculty ||
                        !department ||
                        !level
                    ) {
                        if (message) {
                            message.textContent =
                                "Veuillez remplir tous les champs obligatoires.";
                            message.className =
                                "admin-status-message error";
                            message.hidden = false;
                        }

                        return;
                    }

                    try {
                        if (submitButton) {
                            submitButton.disabled = true;
                            submitButton.textContent =
                                "Génération en cours...";
                        }

                        if (message) {
                            message.textContent =
                                "L'IA prépare votre cours...";
                            message.className =
                                "admin-status-message";
                            message.hidden = false;
                        }

                        const token =
                            localStorage.getItem(
                                "travailplus_token"
                            ) ||
                            localStorage.getItem(
                                "token"
                            ) ||
                            localStorage.getItem(
                                "authToken"
                            );

                        if (!token) {
                            throw new Error(
                                "Session administrateur introuvable. Veuillez vous reconnecter."
                            );
                        }

                        const response =
                            await fetch(
                                "http://localhost:5000/api/courses/admin/generate",
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type":
                                            "application/json",
                                        "Authorization":
                                            `Bearer ${token}`
                                    },
                                    body: JSON.stringify({
                                        theme,
                                        subject,
                                        faculty,
                                        department,
                                        level,
                                        language,
                                        instructions
                                    })
                                }
                            );

                        const data =
                            await response.json();

                        if (!response.ok) {
                            throw new Error(
                                data.message ||
                                "Impossible de générer le cours."
                            );
                        }

                        /*
                         * La réponse attendue est :
                         * {
                         *   success: true,
                         *   course: {...}
                         * }
                         */
                        const generatedCourse =
                            data.course ||
                            data.data ||
                            data;

                        if (
                            !generatedCourse ||
                            !generatedCourse.title
                        ) {
                            throw new Error(
                                "L'IA a retourné une réponse de cours invalide."
                            );
                        }

                        /*
                         * Sauvegarde temporaire pour
                         * l'aperçu.
                         */
                        window.generatedCourse =
                            generatedCourse;

                        closeModal();

                        /*
                         * Utilise la fonction déjà présente
                         * dans courses-admin.js si elle existe.
                         */
                        if (
                            typeof openGeneratedCoursePreview ===
                            "function"
                        ) {
                            openGeneratedCoursePreview(
                                generatedCourse
                            );
                        } else {
                            /*
                             * Fallback direct si la fonction
                             * d'aperçu n'est pas disponible.
                             */
                            const previewModal =
                                document.getElementById(
                                    "generatedCoursePreviewModal"
                                );

                            if (previewModal) {
                                const title =
                                    document.getElementById(
                                        "generatedCourseTitle"
                                    );

                                const previewTheme =
                                    document.getElementById(
                                        "generatedCourseTheme"
                                    );

                                const description =
                                    document.getElementById(
                                        "generatedCourseDescription"
                                    );

                                const previewFaculty =
                                    document.getElementById(
                                        "generatedCourseFaculty"
                                    );

                                const previewDepartment =
                                    document.getElementById(
                                        "generatedCourseDepartment"
                                    );

                                const previewLevel =
                                    document.getElementById(
                                        "generatedCourseLevel"
                                    );

                                const objectives =
                                    document.getElementById(
                                        "generatedCourseObjectives"
                                    );

                                const content =
                                    document.getElementById(
                                        "generatedCourseContent"
                                    );

                                if (title) {
                                    title.textContent =
                                        generatedCourse.title || "";
                                }

                                if (previewTheme) {
                                    previewTheme.textContent =
                                        generatedCourse.theme || theme;
                                }

                                if (description) {
                                    description.textContent =
                                        generatedCourse.description || "";
                                }

                                if (previewFaculty) {
                                    previewFaculty.textContent =
                                        generatedCourse.faculty || faculty;
                                }

                                if (previewDepartment) {
                                    previewDepartment.textContent =
                                        generatedCourse.department ||
                                        department;
                                }

                                if (previewLevel) {
                                    previewLevel.textContent =
                                        generatedCourse.level || level;
                                }

                                if (objectives) {
                                    const list =
                                        Array.isArray(
                                            generatedCourse.objectives
                                        )
                                            ? generatedCourse.objectives
                                            : [];

                                    objectives.innerHTML =
                                        list
                                            .map(
                                                item =>
                                                    `<li>${String(item)}</li>`
                                            )
                                            .join("");
                                }

                                if (content) {
                                    content.textContent =
                                        generatedCourse.content || "";
                                }

                                previewModal.hidden = false;

                                previewModal.setAttribute(
                                    "aria-hidden",
                                    "false"
                                );
                            }
                        }

                    } catch (error) {
                        console.error(
                            "Erreur génération cours IA :",
                            error
                        );

                        if (message) {
                            message.textContent =
                                error.message ||
                                "Impossible de générer le cours.";
                            message.className =
                                "admin-status-message error";
                            message.hidden = false;
                        }

                        /*
                         * Le modal reste ouvert afin que
                         * l'administrateur voie l'erreur.
                         */
                        if (generateModal) {
                            generateModal.hidden = false;
                            generateModal.setAttribute(
                                "aria-hidden",
                                "false"
                            );
                        }

                    } finally {
                        if (submitButton) {
                            submitButton.disabled = false;
                            submitButton.textContent =
                                "Générer le cours";
                        }
                    }
                }
            );
        } else {
            console.error(
                "Travail+ IA : #generateCourseForm introuvable."
            );
        }

        console.log(
            "Travail+ IA : génération des cours initialisée."
        );
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            init,
            { once: true }
        );
    } else {
        init();
    }
})();