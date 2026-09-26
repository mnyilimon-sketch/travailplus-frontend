

"use strict";

/* ======================================================
   TRAVAIL+ — EXERCICES
   Frontend définitif
====================================================== */


/* ======================================================
   CONFIGURATION API
====================================================== */

const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000/api/exercises"
        : "https://travailplus-backend.onrender.com/api/exercises";
    `${window.TravailPlusConfig?.apiBase || "http://localhost:5000/api"}/exercises`;


const TOKEN_KEY = "travailplus_token";
const USER_KEY = "travailplus_user";

/* ======================================================
   ÉTAT GLOBAL
====================================================== */

let exercises = [];
let filteredExercises = [];

let currentExercise = null;
let currentQuestions = [];

let currentQuestionIndex = 0;
let answers = [];

let isSubmitting = false;


/* ======================================================
   DOM
====================================================== */

const loading =
    document.getElementById("loading");

const exerciseGrid =
    document.getElementById("exerciseGrid");

const emptyState =
    document.getElementById("emptyState");

const pageMessage =
    document.getElementById("pageMessage");

const searchInput =
    document.getElementById("searchInput");

const subjectFilter =
    document.getElementById("subjectFilter");

const levelFilter =
    document.getElementById("levelFilter");

const resetFilters =
    document.getElementById("resetFilters");

const exerciseModal =
    document.getElementById("exerciseModal");

const resultModal =
    document.getElementById("resultModal");

const questionContainer =
    document.getElementById("questionContainer");

const previousQuestion =
    document.getElementById("previousQuestion");

const nextQuestion =
    document.getElementById("nextQuestion");

const submitExerciseButton =
    document.getElementById("submitExercise");

const closeModal =
    document.getElementById("closeModal");

const closeResult =
    document.getElementById("closeResult");

const backButton =
    document.getElementById("backButton");


/* ======================================================
   INITIALISATION
====================================================== */

document.addEventListener(
    "DOMContentLoaded",
    initialize
);


async function initialize() {

    const token = getToken();

    if (!token) {

        window.location.href =
            "login.html";

        return;
    }


    bindEvents();

    updateHeaderXP();

    await loadExercises();
}


/* ======================================================
   AUTHENTIFICATION
====================================================== */

function getToken() {

    return localStorage.getItem(
        TOKEN_KEY
    );
}


function getUser() {

    try {

        const value =
            localStorage.getItem(
                USER_KEY
            );

        if (!value) {
            return null;
        }

        return JSON.parse(value);

    } catch (error) {

        console.error(
            "❌ Erreur lecture utilisateur :",
            error
        );

        return null;
    }
}


/* ======================================================
   ÉVÉNEMENTS
====================================================== */

function bindEvents() {

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            applyFilters
        );
    }


    if (subjectFilter) {

        subjectFilter.addEventListener(
            "change",
            applyFilters
        );
    }


    if (levelFilter) {

        levelFilter.addEventListener(
            "change",
            applyFilters
        );
    }


    if (resetFilters) {

        resetFilters.addEventListener(
            "click",
            resetAllFilters
        );
    }


    if (closeModal) {

        closeModal.addEventListener(
            "click",
            closeExercise
        );
    }


    if (closeResult) {

        closeResult.addEventListener(
            "click",
            closeResultModal
        );
    }


    if (previousQuestion) {

        previousQuestion.addEventListener(
            "click",
            previousQuestionHandler
        );
    }


    if (nextQuestion) {

        nextQuestion.addEventListener(
            "click",
            nextQuestionHandler
        );
    }


    if (submitExerciseButton) {

        submitExerciseButton.addEventListener(
            "click",
            submitExercise
        );
    }


    if (backButton) {

        backButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "dashboard.html";
            }
        );
    }


    /* OVERLAYS */

    document
        .querySelectorAll(".modal-overlay")
        .forEach(
            overlay => {

                overlay.addEventListener(
                    "click",
                    () => {

                        if (
                            exerciseModal &&
                            !exerciseModal.classList.contains(
                                "hidden"
                            )
                        ) {

                            closeExercise();
                        }


                        if (
                            resultModal &&
                            !resultModal.classList.contains(
                                "hidden"
                            )
                        ) {

                            closeResultModal();
                        }
                    }
                );
            }
        );


    /* ESC */

    document.addEventListener(
        "keydown",
        event => {

            if (event.key !== "Escape") {
                return;
            }


            if (
                exerciseModal &&
                !exerciseModal.classList.contains(
                    "hidden"
                )
            ) {

                closeExercise();
            }


            if (
                resultModal &&
                !resultModal.classList.contains(
                    "hidden"
                )
            ) {

                closeResultModal();
            }
        }
    );
}


/* ======================================================
   API
====================================================== */

async function apiRequest(
    endpoint = "",
    options = {}
) {

    const token =
        getToken();


    const headers = {
        Accept: "application/json",
        "Content-Type": "application/json"
    };


    if (token) {

        headers.Authorization =
            `Bearer ${token}`;
    }


    let response;

    try {

        response =
            await fetch(
                `${API_URL}${endpoint}`,
                {
                    ...options,

                    headers: {
                        ...headers,
                        ...(options.headers || {})
                    }
                }
            );

    } catch (error) {

        console.error(
            "❌ Erreur réseau :",
            error
        );

        throw new Error(
            "Impossible de contacter le serveur. Vérifie que le backend Travail+ est démarré."
        );
    }


    let data = null;


    const contentType =
        response.headers.get(
            "content-type"
        );


    if (
        contentType &&
        contentType.includes(
            "application/json"
        )
    ) {

        try {

            data =
                await response.json();

        } catch (error) {

            data = null;
        }

    } else {

        const text =
            await response.text();

        data = {
            message: text
        };
    }


    /* SESSION EXPIRÉE */

    if (response.status === 401) {

        localStorage.removeItem(
            TOKEN_KEY
        );

        localStorage.removeItem(
            USER_KEY
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
            `Erreur HTTP ${response.status}.`
        );
    }


    return data;
}


/* ======================================================
   CHARGEMENT DES EXERCICES
====================================================== */

async function loadExercises() {

    showLoading(true);

    hideMessage();


    try {

        const data =
            await apiRequest();


        if (
            !data ||
            data.success !== true
        ) {

            throw new Error(
                data?.message ||
                "Impossible de récupérer les exercices."
            );
        }


        exercises =
            Array.isArray(data.exercises)
                ? data.exercises
                : Array.isArray(data.data)
                    ? data.data
                    : Array.isArray(data.items)
                        ? data.items
                        : [];


        populateFilters();

        updateStatistics();

        applyFilters();


    } catch (error) {

        console.error(
            "❌ Chargement exercices :",
            error
        );


        showMessage(
            error.message ||
            "Impossible de charger les exercices."
        );

        exercises = [];
        filteredExercises = [];
        updateStatistics();
        renderExercises();


    } finally {

        showLoading(false);
    }
}


/* ======================================================
   FILTRES
====================================================== */

function populateFilters() {

    if (
        !subjectFilter ||
        !levelFilter
    ) {
        return;
    }


    const subjects =
        [
            ...new Set(
                exercises
                    .map(
                        exercise =>
                            exercise.subject
                    )
                    .filter(
                        value =>
                            value !== null &&
                            value !== undefined &&
                            String(value).trim() !== ""
                    )
                    .map(
                        value =>
                            String(value).trim()
                    )
            )
        ]
        .sort(
            (a, b) =>
                a.localeCompare(
                    b,
                    "fr",
                    {
                        sensitivity: "base"
                    }
                )
        );


    const levels =
        [
            ...new Set(
                exercises
                    .map(
                        exercise =>
                            exercise.level
                    )
                    .filter(
                        value =>
                            value !== null &&
                            value !== undefined &&
                            String(value).trim() !== ""
                    )
                    .map(
                        value =>
                            String(value).trim()
                    )
            )
        ]
        .sort(
            (a, b) =>
                a.localeCompare(
                    b,
                    "fr",
                    {
                        numeric: true,
                        sensitivity: "base"
                    }
                )
        );


    subjectFilter.innerHTML = `
        <option value="all">
            Toutes les matières
        </option>
    `;


    subjects.forEach(
        subject => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                subject;

            option.textContent =
                subject;

            subjectFilter.appendChild(
                option
            );
        }
    );


    levelFilter.innerHTML = `
        <option value="all">
            Tous les niveaux
        </option>
    `;


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


function applyFilters() {

    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const subject =
        subjectFilter
            ? subjectFilter.value
            : "all";


    const level =
        levelFilter
            ? levelFilter.value
            : "all";


    filteredExercises =
        exercises.filter(
            exercise => {

                const text =
                    [
                        exercise.title,
                        exercise.description,
                        exercise.subject,
                        exercise.level
                    ]
                    .filter(
                        value =>
                            value !== null &&
                            value !== undefined
                    )
                    .join(" ")
                    .toLowerCase();


                const matchesSearch =
                    !search ||
                    text.includes(search);


                const matchesSubject =
                    subject === "all" ||
                    String(
                        exercise.subject || ""
                    ) === subject;


                const matchesLevel =
                    level === "all" ||
                    String(
                        exercise.level || ""
                    ) === level;


                return (
                    matchesSearch &&
                    matchesSubject &&
                    matchesLevel
                );
            }
        );


    renderExercises();
}


function resetAllFilters() {

    if (searchInput) {
        searchInput.value = "";
    }


    if (subjectFilter) {
        subjectFilter.value = "all";
    }


    if (levelFilter) {
        levelFilter.value = "all";
    }

    hideMessage();

    applyFilters();
}


/* ======================================================
   AFFICHAGE DES CARTES
====================================================== */

function renderExercises() {

    if (!exerciseGrid) {
        return;
    }


    exerciseGrid.innerHTML = "";


    if (
        filteredExercises.length === 0
    ) {

        const emptyTitle =
            emptyState?.querySelector("h3");

        const emptyDescription =
            emptyState?.querySelector("p");

        const hasActiveFilters =
            Boolean(
                searchInput?.value.trim() ||
                subjectFilter?.value !== "all" ||
                levelFilter?.value !== "all"
            );

        if (emptyTitle) {
            emptyTitle.textContent =
                hasActiveFilters
                    ? "Aucun résultat"
                    : "Aucun exercice disponible";
        }

        if (emptyDescription) {
            emptyDescription.textContent =
                hasActiveFilters
                    ? "Aucun exercice ne correspond à ta recherche ou aux filtres sélectionnés."
                    : "Les exercices publiés par l'administration apparaîtront ici.";
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


    filteredExercises.forEach(
        exercise => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "exercise-card";


            const questions =
                getQuestions(
                    exercise
                );


            const questionCount =
                questions.length;


            const xp =
                getExerciseXP(
                    exercise
                );


            card.innerHTML = `

                <div class="card-top">

                    <span class="subject-badge">
                        ${escapeHtml(
                            exercise.subject ||
                            "Général"
                        )}
                    </span>

                    <span class="xp-small">
                        +${xp} XP
                    </span>

                </div>


                <h3>
                    ${escapeHtml(
                        exercise.title ||
                        "Exercice"
                    )}
                </h3>


                <p class="exercise-description">
                    ${escapeHtml(
                        exercise.description ||
                        "Exercice d'entraînement Travail+."
                    )}
                </p>


                <div class="card-meta">

                    <span class="meta-item">
                        📝
                        ${questionCount}
                        question${questionCount > 1 ? "s" : ""}
                    </span>

                    <span class="meta-item">
                        📊
                        ${escapeHtml(
                            exercise.level ||
                            "Tous niveaux"
                        )}
                    </span>

                </div>


                <button
                    type="button"
                    class="start-button"
                    data-exercise-id="${escapeHtml(
                        String(exercise.id)
                    )}"
                >
                    Commencer l'exercice →
                </button>

            `;


            const button =
                card.querySelector(
                    ".start-button"
                );


            if (button) {

                button.addEventListener(
                    "click",
                    () => {

                        openExercise(
                            exercise.id
                        );
                    }
                );
            }


            exerciseGrid.appendChild(
                card
            );
        }
    );
}


/* ======================================================
   QUESTIONS
====================================================== */

function getQuestions(exercise) {

    if (!exercise) {
        return [];
    }


    if (
        Array.isArray(
            exercise.questions
        )
    ) {

        return exercise.questions;
    }


    if (
        typeof exercise.questions ===
        "string"
    ) {

        try {

            const parsed =
                JSON.parse(
                    exercise.questions
                );


            return Array.isArray(parsed)
                ? parsed
                : [];


        } catch (error) {

            console.error(
                "❌ JSON questions invalide :",
                error
            );

            return [];
        }
    }


    return [];
}


/* ======================================================
   XP EXERCICE
====================================================== */

function getExerciseXP(
    exercise
) {

    if (!exercise) {
        return 0;
    }


    const value =
        exercise.xpReward ??
        exercise.xp_reward ??
        0;


    const xp =
        Number(value);


    return Number.isFinite(xp)
        ? xp
        : 0;
}


/* ======================================================
   OUVRIR UN EXERCICE
====================================================== */

async function openExercise(
    exerciseId
) {

    hideMessage();


    try {

        const data =
            await apiRequest(
                `/${encodeURIComponent(
                    exerciseId
                )}`
            );


        if (
            !data ||
            data.success !== true ||
            !data.exercise
        ) {

            throw new Error(
                data?.message ||
                "Exercice introuvable."
            );
        }


        currentExercise =
            data.exercise;


        currentQuestions =
            getQuestions(
                currentExercise
            );


        if (
            currentQuestions.length === 0
        ) {

            throw new Error(
                "Cet exercice ne contient aucune question."
            );
        }


        currentQuestionIndex = 0;


        answers =
            new Array(
                currentQuestions.length
            ).fill(null);


        renderCurrentQuestion();


        if (exerciseModal) {

            exerciseModal.classList.remove(
                "hidden"
            );
        }


        document.body.style.overflow =
            "hidden";


    } catch (error) {

        console.error(
            "❌ Ouverture exercice :",
            error
        );


        showMessage(
            error.message ||
            "Impossible d'ouvrir l'exercice."
        );
    }
}


/* ======================================================
   AFFICHER LA QUESTION ACTUELLE
====================================================== */

function renderCurrentQuestion() {

    if (
        !currentExercise ||
        !questionContainer
    ) {
        return;
    }


    const question =
        currentQuestions[
            currentQuestionIndex
        ];


    if (!question) {
        return;
    }


    const modalSubject =
        document.getElementById(
            "modalSubject"
        );


    const modalTitle =
        document.getElementById(
            "modalTitle"
        );


    const modalDescription =
        document.getElementById(
            "modalDescription"
        );


    const modalXP =
        document.getElementById(
            "modalXP"
        );


    if (modalSubject) {

        modalSubject.textContent =
            currentExercise.subject ||
            "Général";
    }


    if (modalTitle) {

        modalTitle.textContent =
            currentExercise.title ||
            "Exercice";
    }


    if (modalDescription) {

        modalDescription.textContent =
            currentExercise.description ||
            "";
    }


    if (modalXP) {

        modalXP.textContent =
            `+${getExerciseXP(
                currentExercise
            )} XP`;
    }


    const total =
        currentQuestions.length;


    const current =
        currentQuestionIndex + 1;


    const progress =
        Math.round(
            (current / total) * 100
        );


    const questionCounter =
        document.getElementById(
            "questionCounter"
        );


    const progressPercent =
        document.getElementById(
            "progressPercent"
        );


    const progressFill =
        document.getElementById(
            "progressFill"
        );


    if (questionCounter) {

        questionCounter.textContent =
            `Question ${current} / ${total}`;
    }


    if (progressPercent) {

        progressPercent.textContent =
            `${progress}%`;
    }


    if (progressFill) {

        progressFill.style.width =
            `${progress}%`;
    }


    const questionText =
        question.question ??
        question.text ??
        question.title ??
        "";


    const options =
        Array.isArray(
            question.options
        )
            ? question.options
            : [];


    if (options.length === 0) {

        questionContainer.innerHTML = `

            <h3 class="question-title">
                ${escapeHtml(
                    String(questionText)
                )}
            </h3>

            <div class="page-message">
                Cette question ne contient aucune option.
            </div>

        `;

    } else {

        questionContainer.innerHTML = `

            <h3 class="question-title">
                ${escapeHtml(
                    String(questionText)
                )}
            </h3>


            <div class="options">

                ${options
                    .map(
                        (option, index) => {

                            const optionValue =
                                String(
                                    option
                                );


                            const selected =
                                answers[
                                    currentQuestionIndex
                                ] === optionValue;


                            return `

                                <label
                                    class="option ${
                                        selected
                                            ? "selected"
                                            : ""
                                    }"
                                >

                                    <input
                                        type="radio"
                                        name="exerciseAnswer"
                                        value="${escapeHtml(
                                            optionValue
                                        )}"
                                        ${
                                            selected
                                                ? "checked"
                                                : ""
                                        }
                                    >

                                    <span>
                                        ${escapeHtml(
                                            optionValue
                                        )}
                                    </span>

                                </label>
                            `;
                        }
                    )
                    .join("")}

            </div>

        `;
    }


    questionContainer
        .querySelectorAll(
            'input[name="exerciseAnswer"]'
        )
        .forEach(
            input => {

                input.addEventListener(
                    "change",
                    () => {

                        answers[
                            currentQuestionIndex
                        ] =
                            input.value;


                        questionContainer
                            .querySelectorAll(
                                ".option"
                            )
                            .forEach(
                                option => {

                                    option.classList.remove(
                                        "selected"
                                    );
                                }
                            );


                        const selectedOption =
                            input.closest(
                                ".option"
                            );


                        if (
                            selectedOption
                        ) {

                            selectedOption.classList.add(
                                "selected"
                            );
                        }
                    }
                );
            }
        );


    if (previousQuestion) {

        previousQuestion.disabled =
            currentQuestionIndex === 0;
    }


    const lastQuestion =
        currentQuestionIndex ===
        total - 1;


    if (nextQuestion) {

        nextQuestion.classList.toggle(
            "hidden",
            lastQuestion
        );
    }


    if (submitExerciseButton) {

        submitExerciseButton.classList.toggle(
            "hidden",
            !lastQuestion
        );
    }


    updateProgressAccessibility(
        progress
    );
}


/* ======================================================
   ACCESSIBILITÉ PROGRESSION
====================================================== */

function updateProgressAccessibility(
    progress
) {

    const progressBar =
        document.querySelector(
            ".progress-bar"
        );


    if (progressBar) {

        progressBar.setAttribute(
            "aria-valuenow",
            String(progress)
        );
    }
}


/* ======================================================
   QUESTION PRÉCÉDENTE
====================================================== */

function previousQuestionHandler() {

    if (
        currentQuestionIndex <= 0
    ) {
        return;
    }


    currentQuestionIndex--;

    renderCurrentQuestion();
}


/* ======================================================
   QUESTION SUIVANTE
====================================================== */

function nextQuestionHandler() {

    if (
        currentQuestionIndex >=
        currentQuestions.length - 1
    ) {
        return;
    }


    currentQuestionIndex++;

    renderCurrentQuestion();
}


/* ======================================================
   TERMINER L'EXERCICE
====================================================== */

async function submitExercise() {

    if (
        !currentExercise ||
        isSubmitting
    ) {
        return;
    }


    const unanswered =
        answers.some(
            answer =>
                answer === null ||
                answer === undefined ||
                answer === ""
        );


    if (unanswered) {

        const confirmed =
            window.confirm(
                "Certaines questions n'ont pas de réponse. Voulez-vous terminer quand même ?"
            );


        if (!confirmed) {
            return;
        }
    }


    isSubmitting = true;


    if (submitExerciseButton) {

        submitExerciseButton.disabled =
            true;

        submitExerciseButton.textContent =
            "Enregistrement...";
    }


    try {

        const data =
            await apiRequest(
                `/${encodeURIComponent(
                    currentExercise.id
                )}/submit`,
                {
                    method: "POST",

                    body: JSON.stringify({
                        answers
                    })
                }
            );


        if (
            !data ||
            data.success !== true
        ) {

            throw new Error(
                data?.message ||
                "Impossible d'enregistrer l'exercice."
            );
        }


        displayResult(
            data
        );


    } catch (error) {

        console.error(
            "❌ Soumission exercice :",
            error
        );


        showMessage(
            error.message ||
            "Impossible de terminer l'exercice."
        );


    } finally {

        isSubmitting = false;


        if (submitExerciseButton) {

            submitExerciseButton.disabled =
                false;

            submitExerciseButton.textContent =
                "✓ Terminer l'exercice";
        }
    }
}


/* ======================================================
   AFFICHER LE RÉSULTAT
====================================================== */

function displayResult(
    data
) {

    closeExercise();


    const score =
        Number(
            data.score ?? 0
        );


    const correct =
        Number(
            data.correctAnswers ??
            data.correct_answers ??
            0
        );


    const total =
        Number(
            data.totalQuestions ??
            data.total_questions ??
            currentQuestions.length
        );


    const xp =
        Number(
            data.xpEarned ??
            data.xp_earned ??
            0
        );


    const resultScore =
        document.getElementById(
            "resultScore"
        );


    const resultCorrect =
        document.getElementById(
            "resultCorrect"
        );


    const resultXP =
        document.getElementById(
            "resultXP"
        );


    if (resultScore) {

        resultScore.textContent =
            `${score}%`;
    }


    if (resultCorrect) {

        resultCorrect.textContent =
            `${correct}/${total}`;
    }


    if (resultXP) {

        resultXP.textContent =
            `+${xp} XP`;
    }


    let title =
        "Continue tes efforts !";


    let message =
        "Chaque exercice est une occasion de progresser.";


    let icon =
        "💪";


    if (score >= 80) {

        title =
            "Excellent travail !";


        message =
            "Très bon résultat. Continue comme ça !";


        icon =
            "🎉";

    } else if (score >= 50) {

        title =
            "Bon travail !";


        message =
            "Tu progresses. Continue à t'entraîner !";


        icon =
            "👏";

    } else {

        title =
            "Continue à t'entraîner !";


        message =
            "Relis tes cours et réessaie avec un autre exercice.";


        icon =
            "📚";
    }


    const resultTitle =
        document.getElementById(
            "resultTitle"
        );


    const resultMessage =
        document.getElementById(
            "resultMessage"
        );


    const resultIcon =
        document.getElementById(
            "resultIcon"
        );


    if (resultTitle) {

        resultTitle.textContent =
            title;
    }


    if (resultMessage) {

        resultMessage.textContent =
            message;
    }


    if (resultIcon) {

        resultIcon.textContent =
            icon;
    }


    updateUserAfterExercise(
        data.user
    );


    updateStatisticsAfterCompletion(
        data,
        xp
    );


    if (resultModal) {

        resultModal.classList.remove(
            "hidden"
        );
    }


    document.body.style.overflow =
        "hidden";
}


/* ======================================================
   METTRE À JOUR L'UTILISATEUR
====================================================== */

function updateUserAfterExercise(
    user
) {

    if (!user) {
        return;
    }


    const oldUser =
        getUser() || {};


    const updatedUser = {
        ...oldUser,
        ...user
    };


    try {

        localStorage.setItem(
            USER_KEY,
            JSON.stringify(
                updatedUser
            )
        );

    } catch (error) {

        console.error(
            "❌ Impossible de sauvegarder l'utilisateur :",
            error
        );
    }


    updateHeaderXP();
}


/* ======================================================
   HEADER XP
====================================================== */

function updateHeaderXP() {

    const user =
        getUser();


    const xp =
        Number(
            user?.xp ??
            user?.XP ??
            0
        );


    const element =
        document.getElementById(
            "headerXP"
        );


    if (element) {

        element.textContent =
            `${Number.isFinite(xp) ? xp : 0} XP`;
    }
}


/* ======================================================
   STATISTIQUES
====================================================== */

function updateStatistics() {

    const totalElement =
        document.getElementById(
            "totalExercises"
        );


    if (totalElement) {

        totalElement.textContent =
            exercises.length;
    }


    /*
     * Le backend doit fournir les statistiques
     * utilisateur pour afficher les valeurs réelles.
     *
     * Tant que cette route n'existe pas,
     * on ne fabrique pas de statistiques.
     */

    const completedElement =
        document.getElementById(
            "completedExercises"
        );


    if (completedElement) {

        completedElement.textContent =
            "—";
    }


    const xpElement =
        document.getElementById(
            "totalXP"
        );


    if (xpElement) {

        xpElement.textContent =
            "—";
    }
}


/* ======================================================
   MISE À JOUR APRÈS UN EXERCICE
====================================================== */

function updateStatisticsAfterCompletion(
    data,
    xp
) {

    const completedElement =
        document.getElementById(
            "completedExercises"
        );


    if (completedElement) {

        const current =
            parseInt(
                completedElement.textContent,
                10
            );


        if (
            Number.isFinite(current)
        ) {

            completedElement.textContent =
                String(
                    current + 1
                );

        } else {

            completedElement.textContent =
                "1";
        }
    }


    const xpElement =
        document.getElementById(
            "totalXP"
        );


    if (xpElement) {

        const currentXP =
            parseInt(
                xpElement.textContent,
                10
            );


        if (
            Number.isFinite(currentXP)
        ) {

            xpElement.textContent =
                `${currentXP + xp} XP`;

        } else {

            xpElement.textContent =
                `+${xp} XP`;
        }
    }
}


/* ======================================================
   FERMER L'EXERCICE
====================================================== */

function closeExercise() {

    if (!exerciseModal) {
        return;
    }


    exerciseModal.classList.add(
        "hidden"
    );


    document.body.style.overflow =
        "";
}


/* ======================================================
   FERMER LE RÉSULTAT
====================================================== */

function closeResultModal() {

    if (!resultModal) {
        return;
    }


    resultModal.classList.add(
        "hidden"
    );


    document.body.style.overflow =
        "";


    currentExercise = null;

    currentQuestions = [];

    currentQuestionIndex = 0;

    answers = [];

    isSubmitting = false;


    updateHeaderXP();
}


/* ======================================================
   LOADING
====================================================== */

function showLoading(
    show
) {

    if (!loading) {
        return;
    }


    loading.classList.toggle(
        "hidden",
        !show
    );
}


/* ======================================================
   MESSAGE
====================================================== */

function showMessage(
    message
) {

    if (!pageMessage) {
        return;
    }


    pageMessage.textContent =
        message;


    pageMessage.classList.remove(
        "hidden"
    );
}


function hideMessage() {

    if (!pageMessage) {
        return;
    }


    pageMessage.textContent =
        "";


    pageMessage.classList.add(
        "hidden"
    );
}


/* ======================================================
   ESCAPE HTML
====================================================== */

function escapeHtml(
    value
) {

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}