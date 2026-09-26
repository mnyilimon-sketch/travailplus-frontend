"use strict";

const fs = require("fs");
const path = require("path");

const root = __dirname;
const dist = path.join(root, "dist");

function removeDir(directory) {
    if (fs.existsSync(directory)) {
        fs.rmSync(directory, {
            recursive: true,
            force: true
        });
    }
}

function copyFile(source, destination) {
    fs.mkdirSync(path.dirname(destination), {
        recursive: true
    });

    fs.copyFileSync(source, destination);
}

function copyDir(source, destination) {
    if (!fs.existsSync(source)) {
        return;
    }

    fs.mkdirSync(destination, {
        recursive: true
    });

    for (const item of fs.readdirSync(source)) {
        const sourcePath = path.join(source, item);
        const destinationPath = path.join(destination, item);

        const stat = fs.statSync(sourcePath);

        if (stat.isDirectory()) {
            copyDir(sourcePath, destinationPath);
        } else {
            copyFile(sourcePath, destinationPath);
        }
    }
}


function copyHtmlWithConfig(source, destination) {
    let html = fs.readFileSync(source, "utf8");

    if (!html.includes('src="config.js"')) {
        html = html.replace(
            /<\/head>/i,
            '    <script src="config.js"></script>\n</head>'
        );
    }

    fs.mkdirSync(path.dirname(destination), {
        recursive: true
    });

    fs.writeFileSync(destination, html);
}

console.log("==============================================");
console.log("TRAVAIL+ — BUILD FRONTEND");
console.log("==============================================");
for (const file of htmlFiles) {
    const source = path.join(root, file);

    if (fs.existsSync(source)) {
        copyFile(
        copyHtmlWithConfig(
            source,
            path.join(dist, file)
        );
console.log("");
console.log("Copie des fichiers JavaScript classiques...");

const jsFiles = [
    "config.js",
    "admin.js",
    "annuaire.js",
    "auth.js",
    "course-ai.js",
    "courses-admin.js"
];

// Le formulaire d'inscription utilise cette version JavaScript héritée
// conservée dans src/ (elle n'est pas compilée par le tsconfig actuel).
const srcJsFiles = [
    "src/register.js"
];

for (const file of jsFiles) {
    const source = path.join(root, file);

    if (fs.existsSync(source)) {
        console.log(`  ✓ ${file}`);
    }
}

for (const file of srcJsFiles) {
    const source = path.join(root, file);

    if (fs.existsSync(source)) {
        copyFile(
            source,
            path.join(dist, file)
        );

        console.log(`  ✓ ${file}`);
    }
}

console.log("");
console.log("Copie des fichiers CSS...");

console.log("==============================================");
console.log("TRAVAIL+ — BUILD FRONTEND");
console.log("==============================================");

console.log("");
console.log("Nettoyage de dist...");

removeDir(dist);

fs.mkdirSync(dist, {
    recursive: true
});

console.log("OK — dist nettoyé.");

console.log("");
console.log("Copie des fichiers HTML...");

const htmlFiles = [
    "index.html",
    "login.html",
    "register.html",
    "forgot-password.html",
    "dashboard.html",
    "documents.html",
    "exercises.html",
    "quiz.html",
    "missions.html",
    "messages.html",
    "notifications.html",
    "annuaire.html",
    "leaderboard.html",
    "shop.html",
    "shop-history.html",
    "shop-admin.html",
    "admin.html",
    "courses.html"
    "reset-password.html",
    
];

for (const file of htmlFiles) {
    const source = path.join(root, file);

    if (fs.existsSync(source)) {
        copyFile(
            source,
            path.join(dist, file)
        );

        console.log(`  ✓ ${file}`);
    }
}

console.log("");
console.log("Copie des fichiers JavaScript classiques...");

const jsFiles = [
    "admin.js",
    "annuaire.js",
    "auth.js",
    "dashboard.js",
    "documents.js",
    "exercises.js",
    "forgot-password.js",
    "leaderboard.js",
    "login.js",
    "messages.js",
    "missions.js",
    "notifications.js",
    "quiz.js",
    "shop.js",
    "shop-admin.js",
    "shop-history.js",
    "courses.js",
    "course-ai.js",
    "courses-admin.js"
];

for (const file of jsFiles) {
    const source = path.join(root, file);

    if (fs.existsSync(source)) {
        copyFile(
            source,
            path.join(dist, file)
        );

        console.log(`  ✓ ${file}`);
    }
}

console.log("");
console.log("Copie des fichiers CSS...");

const cssFiles = [
    "admin.css",
    "annuaire.css",
    "dashboard.css",
    "documents.css",
    "exercises.css",
    "leaderboard.css",
    "messages.css",
    "missions.css",
    "notifications.css",
    "quiz.css",
    "shop.css",
    "shop-admin.css",
    "shop-history.css",
    "courses.css"
];

const assetFiles = [
    "favicon.svg"
];

for (const file of assetFiles) {
    const source = path.join(root, file);

    if (fs.existsSync(source)) {
        copyFile(
            source,
            path.join(dist, file)
        );

        console.log(`  ✓ ${file}`);
    }
}

const cssDirectories = [
    "css"
];

for (const directory of cssDirectories) {
    const source = path.join(root, directory);

    if (fs.existsSync(source)) {
        copyDir(
            source,
            path.join(dist, directory)
        );

        console.log(`  ✓ ${directory}/`);
    }
}

for (const file of cssFiles) {
    const source = path.join(root, file);

    if (fs.existsSync(source)) {
        copyFile(
            source,
            path.join(dist, file)
        );

        console.log(`  ✓ ${file}`);
    }
}

console.log("");
console.log("Copie du frontend TypeScript compilé...");

/*
 * TypeScript compile :
 *
 * frontend/src/app.ts
 *        ↓
 * frontend/dist/src/app.js
 *
 * Le fichier est ensuite conservé dans dist/src/
 * car index.html le charge avec :
 *
 * <script type="module" src="dist/src/app.js"></script>
 */

const compiledSrc = path.join(dist, "src");

if (fs.existsSync(compiledSrc)) {
    console.log("  ✓ dist/src conservé");
} else {
    console.log("  ⚠ Aucun fichier TypeScript compilé trouvé dans dist/src");
}

console.log("");
console.log("==============================================");
console.log("BUILD TERMINE AVEC SUCCES.");
console.log("Dossier de production :", dist);
console.log("==============================================");