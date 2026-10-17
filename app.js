
const STORAGE_KEY = "galaxy_demo_accounts";
const SESSION_KEY = "galaxy_demo_session";
const DEFAULT_AVATAR = "images/earth.jpg";

let currentUser = null;

const $ = id => document.getElementById(id);

function getAccounts() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
        return {};
    }
}

function saveAccounts(accounts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

function getUserKey(email) {
    return email.trim().toLowerCase();
}

function getCurrentAccount() {
    if (!currentUser) return null;
    return getAccounts()[currentUser] || null;
}

function updateCurrentAccount(updater) {
    const accounts = getAccounts();
    if (!accounts[currentUser]) return;

    updater(accounts[currentUser]);
    saveAccounts(accounts);
}

function openAuth(type) {
    $("authModal").classList.add("active");
    $("authModal").setAttribute("aria-hidden", "false");

    $("loginForm").hidden = type !== "login";
    $("signupForm").hidden = type !== "signup";

    $("authTitle").textContent =
        type === "login" ? "Welcome Back" : "Join the Galaxy";

    $("authSubtitle").textContent =
        type === "login"
            ? "Login to explore the cosmos"
            : "Create your cosmic explorer account";

    clearMessages();

    $(type === "login" ? "loginEmail" : "signupName").focus();
}

function closeAuth() {
    $("authModal").classList.remove("active");
    $("authModal").setAttribute("aria-hidden", "true");
    clearMessages();
}

function clearMessages() {
    document.querySelectorAll(".auth-message").forEach(el => {
        el.textContent = "";
        el.className = "auth-message";
    });
}

function showMessage(id, message, type) {
    const el = $(id);
    el.textContent = message;
    el.className = "auth-message " + type;
}

$("signupForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = $("signupName").value.trim();
    const email = getUserKey($("signupEmail").value);
    const password = $("signupPassword").value;
    const confirm = $("confirmPassword").value;

    if (name.length < 2) {
        return showMessage(
            "signupMessage", "Please enter your full name.", "error"
        );
    }

    if (password.length < 8) {
        return showMessage(
            "signupMessage", "Use at least 8 characters for the password.", "error"
        );
    }

    if (password !== confirm) {
        return showMessage(
            "signupMessage", "Passwords do not match.", "error"
        );
    }

    const accounts = getAccounts();

    if (accounts[email]) {
        return showMessage(
            "signupMessage", "This email is already registered.", "error"
        );
    }

    accounts[email] = {
        name,
        email,
        password,
        bio: "",
        avatar: DEFAULT_AVATAR,
        favourites: [],
        history: [],
        createdAt: new Date().toISOString()
    };

    saveAccounts(accounts);
    $("signupForm").reset();

    showMessage(
        "signupMessage",
        "Account created! You can now log in.",
        "success"
    );

    setTimeout(() => {
        openAuth("login");
        $("loginEmail").value = email;

        showMessage(
            "loginMessage",
            "Account created. Enter your password to log in.",
            "success"
        );
    }, 700);
});


$("loginForm").addEventListener("submit", event => {
    event.preventDefault();

    const email = getUserKey($("loginEmail").value);
    const password = $("loginPassword").value;
    const account = getAccounts()[email];

    if (!account || account.password !== password) {
        return showMessage(
            "loginMessage", "Incorrect email or password.", "error"
        );
    }

    currentUser = email;
    sessionStorage.setItem(SESSION_KEY, email);

    $("loginForm").reset();
    closeAuth();
    showDashboard();
});

function showDashboard() {
    const account = getCurrentAccount();
    if (!account) return;

    $("userDashboard").hidden = false;
    document.querySelector(".auth-buttons").hidden = true;

    document.querySelector("main").hidden = true;
    document.querySelector(".footer").hidden = true;
    document.querySelector(".music-player").hidden = true;

    $("welcomeName").textContent = account.name;
    $("overviewName").textContent = account.name;
    $("overviewEmail").textContent = account.email;

    renderProfile();
    renderDashboard();
    showView("overview");

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function showWebsite() {
    $("userDashboard").hidden = true;
    document.querySelector(".auth-buttons").hidden = false;

    document.querySelector("main").hidden = false;
    document.querySelector(".footer").hidden = false;
    document.querySelector(".music-player").hidden = false;
}

function showView(view) {
    document.querySelectorAll(".dashboard-view").forEach(section => {
        section.hidden = true;
    });

    const selected = $(view + "View");
    if (selected) selected.hidden = false;

    document.querySelectorAll(".dashboard-nav button").forEach(button => {
        const active = button.dataset.view === view;
        button.classList.toggle("active", active);

        if (active) {
            button.setAttribute("aria-current", "page");
        } else {
            button.removeAttribute("aria-current");
        }
    });

    if (view === "favourites") renderFavourites();
    if (view === "history") renderHistory();
    if (view === "achievements") renderAchievements();
}

document.querySelectorAll(".dashboard-nav button").forEach(button => {
    button.addEventListener("click", () => {
        showView(button.dataset.view);
    });
});

document.querySelector("[data-go-to-planets]").addEventListener("click", () => {
    showWebsite();
    $("planets").scrollIntoView({ behavior: "smooth" });
});

function renderProfile() {
    const account = getCurrentAccount();
    if (!account) return;

    $("profileName").value = account.name;
    $("profileEmail").value = account.email;
    $("profileBio").value = account.bio || "";

    $("profileAvatar").src = account.avatar || DEFAULT_AVATAR;
    $("dashboardAvatar").src = account.avatar || DEFAULT_AVATAR;
}

$("profileForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = $("profileName").value.trim();
    const bio = $("profileBio").value.trim();

    if (name.length < 2) {
        $("profileMessage").textContent = "Please enter a valid name.";
        return;
    }

    updateCurrentAccount(account => {
        account.name = name;
        account.bio = bio;
    });

    $("profileMessage").textContent = "Profile saved successfully!";
    renderProfile();
    renderDashboard();
});

$("profilePicture").addEventListener("change", event => {
    const file = event.target.files[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        $("profileMessage").textContent = "Choose a JPG, PNG or WebP image.";
        event.target.value = "";
        return;
    }
    if (file.size > 1024 * 1024) {
        $("profileMessage").textContent = "Please choose an image under 1 MB.";
        event.target.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {
        updateCurrentAccount(account => {
            account.avatar = reader.result;
        });

        renderProfile();
        $("profileMessage").textContent = "Profile picture updated!";
    };

    reader.readAsDataURL(file);
});

function getPlanetName(card) {
    return card.querySelector("h3")?.textContent.trim() || "Planet";
}

function renderPlanetButtons() {
    document.querySelectorAll(".planet-card").forEach(card => {
        const name = getPlanetName(card);
        let button = card.querySelector(".favourite-toggle");

        if (!button) {
            button = document.createElement("button");
            button.type = "button";
            button.className = "favourite-toggle";
            button.style.cssText =
                "margin-top:14px;padding:9px 13px;border-radius:22px;" +
                "border:1px solid #a78bfa;background:#17152f;" +
                "color:white;cursor:pointer;";
            card.appendChild(button);
        }

        const account = getCurrentAccount();
        const saved = account?.favourites.includes(name);

        button.textContent = saved
            ? "♥ Remove Favourite"
            : "♡ Add Favourite";

        button.onclick = () => {
            if (!currentUser) {
                openAuth("login");
                return;
            }

            updateCurrentAccount(user => {
                if (user.favourites.includes(name)) {
                    user.favourites = user.favourites.filter(p => p !== name);
                } else {
                    user.favourites.push(name);
                }
            });

            renderPlanetButtons();
            renderDashboard();
            renderFavourites();
        };
    });
}

function explorePlanet(name) {
    if (!currentUser) return;

    updateCurrentAccount(account => {
        account.history = [
            name,
            ...account.history.filter(p => p !== name)
        ].slice(0, 10);
    });

    renderDashboard();
}

document.querySelectorAll(".planet-card").forEach(card => {
    card.querySelector("a")?.addEventListener("click", () => {
        explorePlanet(getPlanetName(card));
    });
});

function renderFavourites() {
    const account = getCurrentAccount();
    if (!account) return;

    const container = $("favouritesList");
    container.replaceChildren();

    if (!account.favourites.length) {
        container.textContent = "No favourites yet. Explore planets to add some!";
        return;
    }

    account.favourites.forEach(name => {
        const item = document.createElement("article");
        item.className = "saved-item";

        const heading = document.createElement("h3");
        heading.textContent = name;

        const button = document.createElement("button");
        button.textContent = "Remove Favourite";
        button.addEventListener("click", () => {
            updateCurrentAccount(user => {
                user.favourites = user.favourites.filter(p => p !== name);
            });
            renderDashboard();
            renderFavourites();
            renderPlanetButtons();
        });

        item.append(heading, button);
        container.appendChild(item);
    });
}

function renderHistory() {
    const account = getCurrentAccount();
    if (!account) return;

    const container = $("historyList");
    container.replaceChildren();

    if (!account.history.length) {
        container.textContent = "Your explored planets will appear here.";
        return;
    }

    account.history.forEach(name => {
        const item = document.createElement("article");
        item.className = "saved-item";

        const heading = document.createElement("h3");
        heading.textContent = name;

        const text = document.createElement("p");
        text.textContent = "Recently explored";

        item.append(heading, text);
        container.appendChild(item);
    });
}

const achievements = [
    {
        id: "first",
        title: "First Discovery",
        description: "Explore your first planet.",
        goal: 1
    },
    {
        id: "explorer",
        title: "Space Explorer",
        description: "Explore 3 different planets.",
        goal: 3
    },
    {
        id: "collector",
        title: "Cosmic Collector",
        description: "Save 3 favourite planets.",
        goal: 3,
        favourites: true
    },
    {
        id: "pioneer",
        title: "Planet Pioneer",
        description: "Explore all 4 planets on this page.",
        goal: 4
    }
];

function getUnlocked(account) {
    return achievements.filter(item => {
        const count = item.favourites
            ? account.favourites.length
            : account.history.length;

        return count >= item.goal;
    });
}

function renderAchievements() {
    const account = getCurrentAccount();
    if (!account) return;

    const container = $("achievementsList");
    container.replaceChildren();

    achievements.forEach(item => {
        const count = item.favourites
            ? account.favourites.length
            : account.history.length;

        const unlocked = count >= item.goal;

        const card = document.createElement("article");
        card.className = "achievement-item" + (unlocked ? "" : " locked");

        const heading = document.createElement("h3");
        heading.textContent = (unlocked ? "🏆 " : "🔒 ") + item.title;

        const description = document.createElement("p");
        description.textContent = item.description;

        const status = document.createElement("p");
        status.textContent = unlocked ? "Unlocked!" : `${count} / ${item.goal}`;

        card.append(heading, description, status);
        container.appendChild(card);
    });
}

function renderDashboard() {
    const account = getCurrentAccount();
    if (!account) return;

    $("welcomeName").textContent = account.name;
    $("overviewName").textContent = account.name;
    $("overviewEmail").textContent = account.email;

    $("exploredCount").textContent = account.history.length;
    $("favouriteCount").textContent = account.favourites.length;
    $("achievementCount").textContent = getUnlocked(account).length;

    const progress = Math.min(100, account.history.length / 4 * 100);

    $("progressBar").style.width = progress + "%";
    $("progressText").textContent =
        `${account.history.length} of 4 different planets explored`;

    $("nextGoal").textContent = account.history.length >= 4
        ? "All planets on this page explored. Great work!"
        : `Explore ${4 - account.history.length} more planet(s) to complete this goal.`;

    renderFavourites();
    renderHistory();
    renderAchievements();
}

$("logoutButton").addEventListener("click", () => {
    currentUser = null;
    sessionStorage.removeItem(SESSION_KEY);
    showWebsite();
    window.scrollTo({ top: 0, behavior: "smooth" });
});

$("authModal").addEventListener("click", event => {
    if (event.target === $("authModal")) closeAuth();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" &&
        $("authModal").classList.contains("active")) {
        closeAuth();
    }
});
const savedSession = sessionStorage.getItem(SESSION_KEY);

if (savedSession && getAccounts()[savedSession]) {
    currentUser = savedSession;
    showDashboard();
} else {
    sessionStorage.removeItem(SESSION_KEY);
}

renderPlanetButtons();
