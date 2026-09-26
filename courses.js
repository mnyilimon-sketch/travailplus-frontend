"use strict";

const COURSES_API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000/api/courses"
        : "https://travailplus-backend.onrender.com/api/courses";

const coursesContainer = document.getElementById("coursesContainer");
const coursesLoading = document.getElementById("coursesLoading");
const coursesEmpty = document.getElementById("coursesEmpty");
const coursesMessage = document.getElementById("coursesMessage");
const courseSearch = document.getElementById("courseSearch");
const searchButton = document.getElementById("searchButton");
const googleSearchButton = document.getElementById("googleSearchButton");
const backButton = document.getElementById("backButton");
const courseDialog = document.getElementById("courseDialog");
const closeDialog = document.getElementById("closeDialog");

function getToken() {
    return localStorage.getItem("travailplus_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("authToken");
}

function showMessage(text) {
    coursesMessage.textContent = text;
    coursesMessage.className = "message error";
    coursesMessage.hidden = false;
}

function escapeHtml(value) {
    return String(value || "").replace(/[&<>'"]/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#039;",
        '"': "&quot;"
    }[character]));
}

function renderCourses(courses) {
    coursesContainer.innerHTML = courses.map((course) => `
        <article class="course-card">
            <p class="course-meta">${escapeHtml(course.theme || course.subject || "Cours")}</p>
            <h2>${escapeHtml(course.title)}</h2>
            <p>${escapeHtml(course.description || "Aucune description disponible.")}</p>
            <button type="button" data-course-id="${course.id}">Voir le cours</button>
        </article>
    `).join("");

    coursesEmpty.hidden = courses.length > 0;
}

async function loadCourses() {
    const token = getToken();

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    coursesLoading.hidden = false;
    coursesEmpty.hidden = true;
    coursesMessage.hidden = true;

    try {
        const search = courseSearch.value.trim();
        const query = search ? `?search=${encodeURIComponent(search)}` : "";
        const response = await fetch(`${COURSES_API_URL}${query}`, {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`
            }
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Impossible de charger les cours.");
        }

        renderCourses(Array.isArray(data.courses) ? data.courses : []);
    } catch (error) {
        showMessage(error.message || "Impossible de charger les cours.");
        coursesContainer.innerHTML = "";
    } finally {
        coursesLoading.hidden = true;
    }
}

async function openCourse(courseId) {
    const token = getToken();

    try {
        const response = await fetch(`${COURSES_API_URL}/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Cours introuvable.");
        }

        const course = data.course;
        document.getElementById("dialogMeta").textContent =
            [course.theme, course.faculty, course.department, course.level]
                .filter(Boolean).join(" · ");
        document.getElementById("dialogTitle").textContent = course.title || "Cours";
        document.getElementById("dialogDescription").textContent = course.description || "";
        document.getElementById("dialogContent").textContent = course.content || "";
        document.getElementById("dialogObjectives").innerHTML =
            String(course.objectives || "").split("\n").filter(Boolean)
                .map((objective) => `<li>${escapeHtml(objective)}</li>`).join("");
        courseDialog.showModal();
    } catch (error) {
        showMessage(error.message || "Impossible d'ouvrir ce cours.");
    }
}

searchButton.addEventListener("click", loadCourses);
googleSearchButton.addEventListener("click", () => {
    const search = courseSearch.value.trim() || "cours universitaires";
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(search)}`;
    window.open(googleUrl, "_blank", "noopener,noreferrer");
});
courseSearch.addEventListener("keydown", (event) => {
    if (event.key === "Enter") loadCourses();
});
coursesContainer.addEventListener("click", (event) => {
    const button = event.target.closest("[data-course-id]");
    if (button) openCourse(button.dataset.courseId);
});
backButton.addEventListener("click", () => {
    window.location.href = "dashboard.html";
});
closeDialog.addEventListener("click", () => courseDialog.close());

loadCourses();