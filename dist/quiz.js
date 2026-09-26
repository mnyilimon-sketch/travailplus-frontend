"use strict";

/*
|--------------------------------------------------------------------------
| CONFIGURATION API
|--------------------------------------------------------------------------
*/

const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000/api/quizzes"
        : "https://travailplus-backend.onrender.com/api/quizzes";


/*
|--------------------------------------------------------------------------
| ÉLÉMENTS HTML
|--------------------------------------------------------------------------
*/

const generatorCard =
    document.getElementById("generatorCard");

const generateQuizForm =
    document.getElementById("generateQuizForm");

const quizTheme =
    document.getElementById("quizTheme");

const questionCount =
    document.getElementById("questionCount");

const quizLevel =
    document.getElementById("quizLevel");

const generateQuizButton =
    document.getElementById("generateQuizButton");

const generatorMessage =
    document.getElementById("generatorMessage");

const quizLoading =
    document.getElementById("quizLoading");

const quizError =
    document.getElementById("quizError");

const quizContent =
    document.getElementById("quizContent");

const questionsContainer =
    document.getElementById("questionsContainer");

const quizTitle =
    document.getElementById("quizTitle");

const quizDescription =
    document.getElementById("quizDescription");

const xpReward =
    document.getElementById("xpReward");

const submitQuizButton =
    document.getElementById("submitQuizButton");

const resultCard =
    document.getElementById("resultCard");

const resultTitle =
    document.getElementById("resultTitle");

const resultMessage =
    document.getElementById("resultMessage");

const resultScore =
    document.getElementById("resultScore");

const correctAnswers =
    document.getElementById("correctAnswers");

const earnedXp =
    document.getElementById("earnedXp");

const backButton =
    document.getElementById("backButton");

const backDashboardButton =
    document.getElementById("backDashboardButton");


/*
|--------------------------------------------------------------------------
| VARIABLES
|--------------------------------------------------------------------------
*/

let currentQuiz = null;


/*
|--------------------------------------------------------------------------
| TOKEN
|--------------------------------------------------------------------------
*/

function getToken() {

    return localStorage.getItem(
        "travailplus_token"
    );

}


/*
|--------------------------------------------------------------------------
| REDIRECTION SI NON CONNECTÉ
|--------------------------------------------------------------------------
*/

function checkAuthentication() {

    const token = getToken();

    if (!token) {

        window.location.href =
            "login.html";

        return false;
    }

    return true;
}


/*
|--------------------------------------------------------------------------
| AFFICHER MESSAGE GÉNÉRATEUR
|--------------------------------------------------------------------------
*/

function showGeneratorMessage(
    message,
    type = "info"
) {

    if (!generatorMessage) {
        return;
    }

    generatorMessage.textContent =
        message;

    generatorMessage.className =
        `generator-message ${type}`;

}


/*
|--------------------------------------------------------------------------
| MASQUER MESSAGE GÉNÉRATEUR
|--------------------------------------------------------------------------
*/

function hideGeneratorMessage() {

    if (!generatorMessage) {
        return;
    }

    generatorMessage.textContent = "";

    generatorMessage.className =
        "generator-message hidden";

}


/*
|--------------------------------------------------------------------------
| AFFICHER ERREUR
|--------------------------------------------------------------------------
*/

function showError(message) {

    if (quizLoading) {
        quizLoading.classList.add("hidden");
    }

    if (quizContent) {
        quizContent.classList.add("hidden");
    }

    if (quizError) {

        quizError.textContent =
            message;

        quizError.classList.remove(
            "hidden"
        );
    }

}


/*
|--------------------------------------------------------------------------
| CHARGER LES QUIZ
|--------------------------------------------------------------------------
*/

async function loadQuiz() {

    if (!checkAuthentication()) {
        return;
    }

    if (quizLoading) {
        quizLoading.classList.remove(
            "hidden"
        );
    }

    try {

        const token =
            getToken();

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


        const data =
            await response.json();


        console.log(
            "Quiz reçus :",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            showError(
                data.message ||
                "Impossible de récupérer les quiz."
            );

            return;
        }


        if (
            !Array.isArray(data.quizzes) ||
            data.quizzes.length === 0
        ) {

            if (quizLoading) {
                quizLoading.classList.add(
                    "hidden"
                );
            }

            return;
        }


        /*
        |------------------------------------------------------------------
        | Le backend renvoie les quiz du plus récent
        | au plus ancien.
        |------------------------------------------------------------------
        */

        currentQuiz =
            data.quizzes[0];


        displayQuiz(
            currentQuiz
        );


    } catch (error) {

        console.error(
            "Erreur chargement quiz :",
            error
        );

        showError(
            "Impossible de contacter le serveur."
        );

    }

}


/*
|--------------------------------------------------------------------------
| AFFICHER UN QUIZ
|--------------------------------------------------------------------------
*/

function displayQuiz(quiz) {

    if (!quiz) {
        return;
    }

    currentQuiz =
        quiz;


    if (quizLoading) {
        quizLoading.classList.add(
            "hidden"
        );
    }

    if (quizError) {
        quizError.classList.add(
            "hidden"
        );
    }

    if (quizContent) {
        quizContent.classList.remove(
            "hidden"
        );
    }


    if (quizTitle) {

        quizTitle.textContent =
            quiz.title ||
            "Quiz";
    }


    if (quizDescription) {

        quizDescription.textContent =
            quiz.description ||
            "Teste tes connaissances.";
    }


    if (xpReward) {

        xpReward.textContent =
            `+${quiz.xpReward || 0} XP`;
    }


    if (!questionsContainer) {
        return;
    }


    questionsContainer.innerHTML = "";


    if (
        !Array.isArray(
            quiz.questions
        )
    ) {

        showError(
            "Les questions du quiz sont invalides."
        );

        return;
    }


    quiz.questions.forEach(
        (question, index) => {

            const questionDiv =
                document.createElement(
                    "div"
                );

            questionDiv.className =
                "question";


            const title =
                document.createElement(
                    "h3"
                );

            title.textContent =
                `${index + 1}. ${question.question}`;


            questionDiv.appendChild(
                title
            );


            question.options.forEach(
                option => {

                    const label =
                        document.createElement(
                            "label"
                        );

                    label.className =
                        "option";


                    const input =
                        document.createElement(
                            "input"
                        );

                    input.type =
                        "radio";

                    input.name =
                        `question-${index}`;

                    input.value =
                        option;


                    label.appendChild(
                        input
                    );


                    const text =
                        document.createTextNode(
                            option
                        );

                    label.appendChild(
                        text
                    );


                    questionDiv.appendChild(
                        label
                    );

                }
            );


            questionsContainer.appendChild(
                questionDiv
            );

        }
    );

}


/*
|--------------------------------------------------------------------------
| GÉNÉRER UN QUIZ AVEC OPENAI
|--------------------------------------------------------------------------
*/

async function generateQuiz(event) {

    event.preventDefault();


    if (!checkAuthentication()) {
        return;
    }


    const theme =
        quizTheme.value.trim();

    const numberOfQuestions =
        Number(
            questionCount.value
        );

    const level =
        quizLevel.value;


    if (!theme) {

        showGeneratorMessage(
            "Veuillez saisir un thème.",
            "error"
        );

        quizTheme.focus();

        return;
    }


    const token =
        getToken();


    if (!token) {

        window.location.href =
            "login.html";

        return;
    }


    generateQuizButton.disabled =
        true;

    generateQuizButton.textContent =
        "🤖 Génération en cours...";


    showGeneratorMessage(
        "L'intelligence artificielle prépare ton quiz...",
        "info"
    );


    try {

        const response =
            await fetch(
                `${API_URL}/generate`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        theme,
                        numberOfQuestions,
                        level
                    })
                }
            );


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


        const data =
            await response.json();


        console.log(
            "Réponse génération quiz :",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            showGeneratorMessage(
                data.message ||
                "Impossible de générer le quiz.",
                "error"
            );

            return;
        }


        if (!data.quiz) {

            showGeneratorMessage(
                "Le serveur n'a pas retourné le quiz.",
                "error"
            );

            return;
        }


        /*
        |------------------------------------------------------------------
        | Le nouveau quiz devient immédiatement le quiz affiché.
        |------------------------------------------------------------------
        */

        currentQuiz =
            data.quiz;


        displayQuiz(
            currentQuiz
        );


        showGeneratorMessage(
            "✅ Quiz généré avec succès !",
            "success"
        );


        /*
        |------------------------------------------------------------------
        | Nettoyage du formulaire
        |------------------------------------------------------------------
        */

        quizTheme.value = "";


        /*
        |------------------------------------------------------------------
        | Remonter vers le quiz
        |------------------------------------------------------------------
        */

        if (quizContent) {

            quizContent.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }


    } catch (error) {

        console.error(
            "Erreur génération quiz :",
            error
        );

        showGeneratorMessage(
            "Impossible de contacter le serveur.",
            "error"
        );

    } finally {

        generateQuizButton.disabled =
            false;

        generateQuizButton.textContent =
            "🤖 Générer le quiz";

    }

}


/*
|--------------------------------------------------------------------------
| SOUMETTRE LE QUIZ
|--------------------------------------------------------------------------
*/

async function submitQuiz() {

    if (!currentQuiz) {

        alert(
            "Aucun quiz sélectionné."
        );

        return;
    }


    const token =
        getToken();


    if (!token) {

        window.location.href =
            "login.html";

        return;
    }


    const answers = [];


    for (
        let index = 0;
        index < currentQuiz.questions.length;
        index++
    ) {

        const selected =
            document.querySelector(
                `input[name="question-${index}"]:checked`
            );


        if (!selected) {

            alert(
                `Veuillez répondre à la question ${index + 1}.`
            );

            return;
        }


        answers.push(
            selected.value
        );

    }


    submitQuizButton.disabled =
        true;

    submitQuizButton.textContent =
        "Correction en cours...";


    try {

        const response =
            await fetch(
                `${API_URL}/submit`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({

                        quizId:
                            currentQuiz.id,

                        answers

                    })
                }
            );


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


        const data =
            await response.json();


        console.log(
            "Résultat du quiz :",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            alert(
                data.message ||
                "Erreur lors de la soumission."
            );

            submitQuizButton.disabled =
                false;

            submitQuizButton.textContent =
                "Terminer le quiz";

            return;
        }


        /*
        |------------------------------------------------------------------
        | Mise à jour éventuelle de l'utilisateur
        |------------------------------------------------------------------
        */

        if (data.user) {

            localStorage.setItem(
                "travailplus_user",
                JSON.stringify(
                    data.user
                )
            );

        }


        showResult(
            data
        );

    } catch (error) {

        console.error(
            "Erreur soumission quiz :",
            error
        );


        alert(
            "Impossible de contacter le serveur."
        );


        submitQuizButton.disabled =
            false;

        submitQuizButton.textContent =
            "Terminer le quiz";

    }

}


/*
|--------------------------------------------------------------------------
| AFFICHER LE RÉSULTAT
|--------------------------------------------------------------------------
*/

function showResult(data) {

    if (quizContent) {

        quizContent.classList.add(
            "hidden"
        );

    }


    if (resultCard) {

        resultCard.classList.remove(
            "hidden"
        );

    }


    if (resultScore) {

        resultScore.textContent =
            `${data.score}%`;

    }


    if (correctAnswers) {

        correctAnswers.textContent =
            data.correctAnswers;

    }


    if (earnedXp) {

        earnedXp.textContent =
            data.xpEarned;

    }


    if (resultTitle) {

        resultTitle.textContent =
            data.passed
                ? "Quiz réussi ! 🎉"
                : "Quiz terminé";

    }


    if (resultMessage) {

        resultMessage.textContent =
            data.passed
                ? `Bravo ! Tu as gagné ${data.xpEarned} XP.`
                : "Continue tes efforts pour améliorer ton score.";

    }

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


if (backDashboardButton) {

    backDashboardButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "dashboard.html";

        }
    );

}


/*
|--------------------------------------------------------------------------
| ÉVÉNEMENT GÉNÉRATION
|--------------------------------------------------------------------------
*/

if (generateQuizForm) {

    generateQuizForm.addEventListener(
        "submit",
        generateQuiz
    );

}


/*
|--------------------------------------------------------------------------
| ÉVÉNEMENT SOUMISSION
|--------------------------------------------------------------------------
*/

if (submitQuizButton) {

    submitQuizButton.addEventListener(
        "click",
        submitQuiz
    );

}


/*
|--------------------------------------------------------------------------
| INITIALISATION
|--------------------------------------------------------------------------
*/

loadQuiz();