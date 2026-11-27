// ================================================================
//  BALLOON BOUNCE — game.js
//  Themes + Balloon Colors + Welcome Screen + Bats (Night) +
//  Pause Menu + Home Button + Accurate Coin/Distance Display
// ================================================================

const canvas        = document.getElementById("gameCanvas");
const ctx           = canvas.getContext("2d");
const inflateButton = document.getElementById("inflateButton");
const replayButton  = document.getElementById("replayButton");
const homeButton    = document.getElementById("homeButton");
const gameOverBtns  = document.getElementById("gameOverBtns");

// ── Pause elements ───────────────────────────────────────────
const pauseBtn       = document.getElementById("pauseBtn");
const pauseModal     = document.getElementById("pauseModal");
const resumeBtn      = document.getElementById("resumeBtn");
const pauseThemeBtns = document.querySelectorAll("#pauseThemeRow .pause-opt-btn");
const pauseColorBtns = document.querySelectorAll("#pauseColorRow .pause-opt-btn");
const homeThemeBtns = document.querySelectorAll("#homeThemeRow .home-opt-btn");
const homeColorBtns = document.querySelectorAll("#homeColorRow .home-opt-btn");
let isPaused         = false;

// ── PLAYER NAME ──────────────────────────────────────────────
let playerName = "Guest";

// ── Welcome screen wiring ─────────────────────────────────────
const welcomeScreen = document.getElementById("welcomeScreen");
const gameScreen    = document.getElementById("gameScreen");
const usernameInput = document.getElementById("usernameInput");
const playButton    = document.getElementById("playButton");
const playerBadge   = document.getElementById("playerBadge");
const leaderboardButton = document.getElementById("leaderboardButton");
const leaderboardModal = document.getElementById("leaderboardModal");
const leaderboardRows = document.getElementById("leaderboardRows");
const leaderboardStatus = document.getElementById("leaderboardStatus");
const closeLeaderboardButton = document.getElementById("closeLeaderboardButton");
let gameLoopStarted = false;

function closeLeaderboard() {
    leaderboardModal.hidden = true;
    leaderboardButton.focus();
}

async function openLeaderboard() {
    leaderboardModal.hidden = false;
    leaderboardRows.replaceChildren();
    leaderboardStatus.textContent = "Loading scores…";
    closeLeaderboardButton.focus();

    try {
        const response = await fetch("https://balloon-bounce-backend.onrender.com/api/scores/leaderboard/");
        if (!response.ok) throw new Error("Leaderboard request failed");
        const scores = await response.json();
        if (!Array.isArray(scores)) throw new Error("Unexpected leaderboard response");

        if (scores.length === 0) {
            leaderboardStatus.textContent = "No scores yet. Be the first to make the leaderboard!";
            return;
        }

        scores.slice(0, 10).forEach((score, index) => {
            const row = document.createElement("tr");
            const rank = document.createElement("td");
            const name = document.createElement("th");
            const distance = document.createElement("td");
            const coins = document.createElement("td");
            rank.className = `leaderboard-rank rank-${index + 1}`;
            rank.textContent = String(index + 1).padStart(2, "0");
            name.scope = "row";
            name.textContent = score.player_name || "Guest";
            distance.textContent = `${Number(score.distance || 0).toLocaleString()} m`;
            coins.textContent = `🪙 ${Number(score.coins || 0).toLocaleString()}`;
            row.append(rank, name, distance, coins);
            leaderboardRows.append(row);
        });
        leaderboardStatus.textContent = "Showing the top flights.";
    } catch (error) {
        leaderboardStatus.textContent = "Couldn’t load scores. Check your connection and try again.";
    }
}

leaderboardButton.addEventListener("click", openLeaderboard);
closeLeaderboardButton.addEventListener("click", closeLeaderboard);
leaderboardModal.addEventListener("click", event => {
    if (event.target === leaderboardModal) closeLeaderboard();
});
document.addEventListener("keydown", event => {
    if (!leaderboardModal.hidden && event.key === "Escape") closeLeaderboard();
});

function launchGame(name) {
    playerName = name && name.trim() ? name.trim() : "Guest";

    playerBadge.textContent = "🎈 " + playerName;
    welcomeScreen.style.display = "none";
    gameScreen.style.display = "block";
    resetGameVariables();
    resizeGame();
    if (!gameLoopStarted) {
        gameLoopStarted = true;
        gameLoop();
    }
}

playButton.addEventListener("click", () => {
    launchGame(usernameInput.value);
});

usernameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") launchGame(usernameInput.value);
});


// ================================================================
//  THEME SYSTEM
// ================================================================
let currentTheme = "day"; // "day" | "sunset" | "night"

function setTheme(theme) {
    currentTheme = theme;
    homeThemeBtns.forEach(b => {
        b.classList.toggle("ht-active", b.dataset.ht === theme);
    });
    // Update pause menu buttons
    pauseThemeBtns.forEach(b => {
        b.classList.toggle("pt-active", b.dataset.pt === theme);
    });
    // Update body theme class
    document.body.classList.remove("theme-day", "theme-sunset", "theme-night");
    document.body.classList.add("theme-" + currentTheme);
    welcomeScreen.classList.remove("theme-day", "theme-sunset", "theme-night");
    welcomeScreen.classList.add("theme-" + currentTheme);
}

homeThemeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        setTheme(btn.dataset.ht);
    });
});

pauseThemeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        setTheme(btn.dataset.pt);
    });
});

// ================================================================
//  BALLOON COLOR SYSTEM
// ================================================================
const BALLOON_PALETTES = {
    pink: {
        body:    "#FF75AD",
        stroke:  "#D94383",
        knot:    "#E94C91",
        string:  "#80536C",
        shine:   "#FFD1E4",
        eye:     "#542D48",
        smile:   "#542D48",
    },
    lavender: {
        body:    "#C4A1FF",
        stroke:  "#8B5CF6",
        knot:    "#A78BFA",
        string:  "#5B4080",
        shine:   "#EDE9FE",
        eye:     "#3B1C6E",
        smile:   "#3B1C6E",
    },
    mint: {
        body:    "#6DEABF",
        stroke:  "#10B981",
        knot:    "#34D399",
        string:  "#2D6B54",
        shine:   "#D1FAE5",
        eye:     "#064E3B",
        smile:   "#064E3B",
    },
    coral: {
        body:    "#FF7F6B",
        stroke:  "#E84D35",
        knot:    "#F97254",
        string:  "#7C3020",
        shine:   "#FFE4DE",
        eye:     "#7C2010",
        smile:   "#7C2010",
    },
};

let currentBalloonColor = "pink";

function setBalloonColor(color) {
    if (!BALLOON_PALETTES[color]) return;
    currentBalloonColor = color;
    welcomeScreen.style.setProperty("--hero-balloon", BALLOON_PALETTES[color].body);
    homeColorBtns.forEach(b => {
        b.classList.toggle("hc-active", b.dataset.hc === color);
    });
    // Update pause menu options
    pauseColorBtns.forEach(b => {
        b.classList.toggle("pc-active", b.dataset.pc === color);
    });
}

homeColorBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        setBalloonColor(btn.dataset.hc);
    });
});

pauseColorBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        setBalloonColor(btn.dataset.pc);
    });
});

// ================================================================
//  PAUSE SYSTEM
// ================================================================
function togglePause() {
    if (gameOver) return;
    isPaused = !isPaused;
    if (isPaused) {
        pauseModal.style.display = "flex";
        isInflating = false;
    } else {
        pauseModal.style.display = "none";
    }
}

pauseBtn.addEventListener("click", togglePause);
resumeBtn.addEventListener("click", () => {
    if (isPaused) togglePause();
});


// ================================================================
//  GAME VARIABLES
// ================================================================
let coins           = [];
let formationActive = false;
let totalCoins      = 0;
let distance        = 0;

let balloonX = 0;
let balloonY = 0;
let velocity = 0;
let groundY  = 0;

let crow      = null;
let crowTimer = 1000;

let isInflating   = false;
const liftForce   = 0.22;
const gravity     = 0.06;

let gameOver          = false;
let balloonPopped     = false;
let popAnimationFrame = 0;

let pipeX         = 0;
const pipeWidth   = 70;
const gapHeight   = 180;
let gapY          = 0;
const pipeSpeed   = 2;


function resetGameVariables() {
    balloonY          = canvas.height * 0.45;
    velocity          = 0;
    distance          = 0;
    totalCoins        = 0;
    coins             = [];
    formationActive   = false;
    crow              = null;
    crowTimer         = 1000;
    pipeX             = canvas.width;
    gapY              = canvas.height * 0.3;
    gameOver          = false;
    isInflating       = false;
    balloonPopped     = false;
    popAnimationFrame = 0;
    isPaused          = false;
    pauseModal.style.display = "none";
    gameOverBtns.style.display = "none";
}


// ================================================================
//  RESIZE
// ================================================================
function resizeGame() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    groundY  = canvas.height - 60;
    balloonX = canvas.width * 0.25;

    if (balloonY === 0) {
        balloonY = canvas.height * 0.45;
    }

    gapY = Math.max(
        60,
        Math.min(canvas.height - gapHeight - 60, gapY || canvas.height * 0.3)
    );
}

window.addEventListener("resize", resizeGame);


// ================================================================
//  BACKGROUND THEMES
// ================================================================
function drawCloud(x, y, scale = 1, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(x,            y,            20 * scale, 0, Math.PI * 2);
    ctx.arc(x + 25*scale, y - 10*scale, 25 * scale, 0, Math.PI * 2);
    ctx.arc(x + 50*scale, y,            20 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawSoilBlock(x, y) {
    ctx.fillStyle = "#A67C3D";
    ctx.beginPath();
    ctx.roundRect(x, y, 65, 38, 10);
    ctx.fill();

    ctx.strokeStyle = "#795326";
    ctx.lineWidth   = 3;
    ctx.stroke();

    ctx.strokeStyle = "#C49A56";
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 8);
    ctx.lineTo(x + 25, y + 5);
    ctx.lineTo(x + 45, y + 12);
    ctx.stroke();
}

function drawGrassTexture(surface) {
    for (let i = 0; i < 3; i++) {
        ctx.fillStyle = ["#A5DF67","#8BD657","#72C34B"][i];
        ctx.beginPath();
        ctx.moveTo(0, surface - 10 + i * 5);
        for (let x = 0; x <= canvas.width; x += 20) {
            ctx.lineTo(x, surface - 12 + i * 5 + Math.sin(x * 0.04) * 5);
        }
        ctx.lineTo(canvas.width, surface + 15);
        ctx.lineTo(0,            surface + 15);
        ctx.closePath();
        ctx.fill();
    }

    ctx.fillStyle = "#4F9D35";
    for (let x = 0; x < canvas.width; x += 7) {
        let length = 5 + Math.abs(Math.sin(x * 2.3)) * 12;
        ctx.beginPath();
        ctx.moveTo(x,     surface);
        ctx.lineTo(x + 4, surface + length);
        ctx.lineTo(x + 8, surface);
        ctx.fill();
    }
}

/* Day */
function drawDayBackground() {
    ctx.fillStyle = "#80D8FF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.arc(canvas.width * 0.85, canvas.height * 0.15, 28, 0, Math.PI * 2);
    ctx.fillStyle = "#FFD84D";
    ctx.fill();

    drawCloud(canvas.width * 0.2,  canvas.height * 0.2);
    drawCloud(canvas.width * 0.65, canvas.height * 0.35);

    let surface = groundY - 35;
    ctx.fillStyle = "#8B642D";
    ctx.fillRect(0, surface, canvas.width, canvas.height - surface);
    for (let x = 0; x < canvas.width; x += 65) {
        for (let y = surface + 15; y < canvas.height; y += 40) {
            drawSoilBlock(x, y);
        }
    }
    ctx.fillStyle = "#75C94F";
    ctx.fillRect(0, surface - 12, canvas.width, 18);
    drawGrassTexture(surface);
}

/* Sunset */
function drawSunsetBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.75);
    sky.addColorStop(0,   "#f97316");
    sky.addColorStop(0.3, "#fb923c");
    sky.addColorStop(0.6, "#fda4af");
    sky.addColorStop(1,   "#fce7f3");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.75);

    const glow = ctx.createLinearGradient(0, canvas.height * 0.55, 0, canvas.height * 0.75);
    glow.addColorStop(0, "rgba(254,215,170,0.0)");
    glow.addColorStop(1, "rgba(254,215,170,0.5)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, canvas.height * 0.55, canvas.width, canvas.height * 0.2);

    const sunX = canvas.width * 0.5;
    const sunY = groundY - 35 - 2;
    const sunR = 55;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 1.8);
    sunGrad.addColorStop(0,   "#fef08a");
    sunGrad.addColorStop(0.3, "#fbbf24");
    sunGrad.addColorStop(0.7, "#f97316");
    sunGrad.addColorStop(1,   "rgba(249,115,22,0)");
    ctx.fillStyle = sunGrad;
    ctx.fillRect(sunX - sunR * 1.8, sunY - sunR * 1.8, sunR * 3.6, sunR * 1.8);

    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, Math.PI, 0);
    ctx.fillStyle = "#fef08a";
    ctx.fill();

    ctx.save();
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = "#fde68a";
    ctx.beginPath();
    ctx.arc(canvas.width * 0.15,      canvas.height * 0.22, 24, 0, Math.PI * 2);
    ctx.arc(canvas.width * 0.15 + 30, canvas.height * 0.22 - 12, 30, 0, Math.PI * 2);
    ctx.arc(canvas.width * 0.15 + 62, canvas.height * 0.22, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fecdd3";
    ctx.beginPath();
    ctx.arc(canvas.width * 0.72,      canvas.height * 0.3, 20, 0, Math.PI * 2);
    ctx.arc(canvas.width * 0.72 + 26, canvas.height * 0.3 - 10, 26, 0, Math.PI * 2);
    ctx.arc(canvas.width * 0.72 + 52, canvas.height * 0.3, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#fff7ed";
    ctx.beginPath();
    ctx.arc(canvas.width * 0.42,      canvas.height * 0.14, 18, 0, Math.PI * 2);
    ctx.arc(canvas.width * 0.42 + 23, canvas.height * 0.14 - 9, 22, 0, Math.PI * 2);
    ctx.arc(canvas.width * 0.42 + 46, canvas.height * 0.14, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    let surface = groundY - 35;
    const groundGrad = ctx.createLinearGradient(0, surface, 0, canvas.height);
    groundGrad.addColorStop(0, "#92400e");
    groundGrad.addColorStop(1, "#78350f");
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, surface, canvas.width, canvas.height - surface);

    for (let x = 0; x < canvas.width; x += 65) {
        for (let y = surface + 15; y < canvas.height; y += 40) {
            drawSoilBlock(x, y);
        }
    }

    ctx.fillStyle = "#a16207";
    ctx.fillRect(0, surface - 12, canvas.width, 18);
    ctx.fillStyle = "#ca8a04";
    for (let x = 0; x < canvas.width; x += 7) {
        let length = 5 + Math.abs(Math.sin(x * 2.3)) * 12;
        ctx.beginPath();
        ctx.moveTo(x,     surface);
        ctx.lineTo(x + 4, surface + length);
        ctx.lineTo(x + 8, surface);
        ctx.fill();
    }
}

/* Night */
const STARS = Array.from({ length: 160 }, () => ({
    x:             Math.random(),
    y:             Math.random() * 0.75,
    r:             0.5 + Math.random() * 1.5,
    alpha:         0.4 + Math.random() * 0.6,
    twinkleOffset: Math.random() * Math.PI * 2,
}));

function drawNightBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.75);
    sky.addColorStop(0,   "#0f172a");
    sky.addColorStop(0.4, "#1e3a5f");
    sky.addColorStop(0.75,"#312e81");
    sky.addColorStop(1,   "#1e1b4b");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.75);

    const t = Date.now() / 1200;
    STARS.forEach(s => {
        const tw = 0.6 + 0.4 * Math.sin(t + s.twinkleOffset);
        ctx.beginPath();
        ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${(s.alpha * tw).toFixed(2)})`;
        ctx.fill();
    });

    const moonX = canvas.width * 0.78;
    const moonY = canvas.height * 0.14;
    const moonR = 32;

    const halo = ctx.createRadialGradient(moonX, moonY, moonR * 0.6, moonX, moonY, moonR * 2.8);
    halo.addColorStop(0,   "rgba(224,231,255,0.25)");
    halo.addColorStop(0.5, "rgba(199,210,254,0.10)");
    halo.addColorStop(1,   "rgba(199,210,254,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fillStyle = "#e0e7ff";
    ctx.fill();

    ctx.fillStyle = "rgba(100,116,139,0.18)";
    [[moonX - 8, moonY - 6, 7], [moonX + 10, moonY + 7, 5], [moonX - 2, moonY + 10, 4]].forEach(([cx, cy, cr]) => {
        ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.fill();
    });

    const nebulaGrad = ctx.createRadialGradient(
        canvas.width * 0.3, canvas.height * 0.3, 0,
        canvas.width * 0.3, canvas.height * 0.3, canvas.height * 0.25
    );
    nebulaGrad.addColorStop(0,   "rgba(99,102,241,0.08)");
    nebulaGrad.addColorStop(0.5, "rgba(139,92,246,0.04)");
    nebulaGrad.addColorStop(1,   "rgba(139,92,246,0)");
    ctx.fillStyle = nebulaGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.75);

    let surface = groundY - 35;
    const groundGrad = ctx.createLinearGradient(0, surface, 0, canvas.height);
    groundGrad.addColorStop(0, "#1e293b");
    groundGrad.addColorStop(1, "#0f172a");
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, surface, canvas.width, canvas.height - surface);

    for (let x = 0; x < canvas.width; x += 65) {
        for (let y = surface + 15; y < canvas.height; y += 40) {
            ctx.fillStyle = "#334155";
            ctx.beginPath();
            ctx.roundRect(x, y, 65, 38, 10);
            ctx.fill();
            ctx.strokeStyle = "#1e293b";
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }

    const grassGrad = ctx.createLinearGradient(0, surface - 14, 0, surface + 10);
    grassGrad.addColorStop(0, "#0f4c3a");
    grassGrad.addColorStop(1, "#064e3b");
    ctx.fillStyle = grassGrad;
    ctx.fillRect(0, surface - 12, canvas.width, 18);

    for (let x = 0; x < canvas.width; x += 7) {
        let length = 5 + Math.abs(Math.sin(x * 2.3)) * 12;
        const gb = ctx.createLinearGradient(x, surface, x, surface + length);
        gb.addColorStop(0, "#34d399");
        gb.addColorStop(1, "#064e3b");
        ctx.fillStyle = gb;
        ctx.beginPath();
        ctx.moveTo(x,     surface);
        ctx.lineTo(x + 4, surface + length);
        ctx.lineTo(x + 8, surface);
        ctx.fill();
    }
}

function drawBackground() {
    if      (currentTheme === "sunset") drawSunsetBackground();
    else if (currentTheme === "night")  drawNightBackground();
    else                                drawDayBackground();
}


// ================================================================
//  COINS
// ================================================================
function spawnCoin() {
    const patterns = [
        [[0,0],[40,0],[80,0],[120,0],[160,0]],
        [[0,0],[40,-30],[80,-45],[120,-30],[160,0],[200,30]],
        [[0,40],[40,10],[80,-20],[120,-20],[160,10],[200,40]],
        [[0,-30],[40,30],[80,-30],[120,30],[160,-30]],
        [[0,0],[40,-30],[80,-60],[120,-30],[160,0],[120,30],[80,60],[40,30]]
    ];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    const centerY = gapY + gapHeight / 2;
    const startX  = pipeX + pipeWidth + 100;

    pattern.forEach(([dx, dy]) => {
        coins.push({ x: startX + dx, y: centerY + dy, radius: 14 });
    });
}

function drawGoldCoin(x, y, radius = 14) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#FFD700";
    ctx.fill();

    ctx.strokeStyle = "#B8860B";
    ctx.lineWidth   = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, radius - 5, 0, Math.PI * 2);
    ctx.strokeStyle = "#FFF3A3";
    ctx.lineWidth   = 2;
    ctx.stroke();

    ctx.fillStyle     = "#B8860B";
    ctx.font          = `bold ${radius}px Arial`;
    ctx.textAlign     = "center";
    ctx.textBaseline  = "middle";
    ctx.fillText("$", x, y);
}

function drawCoins() {
    coins.forEach(coin => drawGoldCoin(coin.x, coin.y, coin.radius));
}

function drawCoinCount() {
    const coinX = canvas.width - 110;
    const coinY = 32;
    drawGoldCoin(coinX, coinY, 14);

    ctx.fillStyle     = "white";
    ctx.font          = "bold 20px Arial";
    ctx.textAlign     = "left";
    ctx.strokeStyle   = "rgba(0,0,0,0.55)";
    ctx.lineWidth     = 4;

    ctx.strokeText("× " + totalCoins, coinX + 20, coinY + 7);
    ctx.fillText(  "× " + totalCoins, coinX + 20, coinY + 7);
}


// ================================================================
//  BALLOON DRAWING
// ================================================================
function drawBalloon() {
    const pal = BALLOON_PALETTES[currentBalloonColor] || BALLOON_PALETTES.pink;

    // Body
    ctx.beginPath();
    ctx.ellipse(balloonX, balloonY, 35, 45, 0, 0, Math.PI * 2);
    ctx.fillStyle = pal.body;
    ctx.fill();

    ctx.strokeStyle = pal.stroke;
    ctx.lineWidth   = 3;
    ctx.stroke();

    // Knot
    ctx.beginPath();
    ctx.moveTo(balloonX - 10, balloonY + 39);
    ctx.lineTo(balloonX + 10, balloonY + 39);
    ctx.lineTo(balloonX,      balloonY + 53);
    ctx.closePath();
    ctx.fillStyle = pal.knot;
    ctx.fill();

    // String
    ctx.beginPath();
    ctx.moveTo(balloonX, balloonY + 53);
    ctx.bezierCurveTo(
        balloonX - 20, balloonY + 70,
        balloonX + 20, balloonY + 85,
        balloonX,      balloonY + 100
    );
    ctx.strokeStyle = pal.string;
    ctx.lineWidth   = 2;
    ctx.stroke();

    // Eyes
    ctx.fillStyle = pal.eye;
    ctx.beginPath(); ctx.arc(balloonX - 12, balloonY - 5, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(balloonX + 12, balloonY - 5, 3, 0, Math.PI * 2); ctx.fill();

    // Smile
    ctx.beginPath();
    ctx.arc(balloonX, balloonY + 5, 10, 0.2, Math.PI - 0.2);
    ctx.strokeStyle = pal.smile;
    ctx.lineWidth   = 2;
    ctx.stroke();

    // Shine
    ctx.fillStyle = pal.shine;
    ctx.beginPath();
    ctx.ellipse(balloonX - 13, balloonY - 20, 5, 9, 0, 0, Math.PI * 2);
    ctx.fill();
}


// ================================================================
//  PHYSICS + COINS
// ================================================================
function update() {
    if (isPaused) return;

    if (!formationActive && pipeX < canvas.width * 0.5) {
        spawnCoin();
        formationActive = true;
    }

    for (let i = coins.length - 1; i >= 0; i--) {
        let coin = coins[i];
        coin.x -= pipeSpeed;

        if (Math.abs(coin.x - balloonX) < 40 && Math.abs(coin.y - balloonY) < 50) {
            totalCoins++;
            coins.splice(i, 1);
        }
    }

    coins = coins.filter(coin => coin.x > -30);

    // Physics
    velocity += gravity;
    if (isInflating) velocity -= liftForce;
    velocity  = Math.max(-4, Math.min(4, velocity));
    balloonY += velocity;

    // Ceiling collision
    if (balloonY - 45 <= 0) { popBalloon(); return; }

    // Ground collision
    if (balloonY + 45 >= groundY - 35) { popBalloon(); return; }

    // Distance
    distance += pipeSpeed / 10;

    // Move pipe
    pipeX -= pipeSpeed;
    if (pipeX < -pipeWidth) {
        pipeX = canvas.width;
        gapY  = Math.random() * (canvas.height - gapHeight - 120) + 60;
        formationActive = false;
    }

    // Creature spawn (Crow by day/sunset, Bat at night)
    crowTimer--;
    if (crowTimer <= 0 && !crow) {
        spawnCrow();
        crowTimer = 1000 + Math.random() * 300;
    }

    if (crow) {
        crow.x -= crow.speed;
        if (crow.x < -50) {
            crow = null;
        } else if (Math.abs(crow.x - balloonX) < 35 && Math.abs(crow.y - balloonY) < 40) {
            popBalloon(); return;
        }
    }

    checkCollision();
}


// ================================================================
//  OBSTACLE CREATURE: CROW (Day/Sunset) OR BAT (Night with Red Eyes)
// ================================================================
function spawnCrow() {
    crow = {
        x:     canvas.width + 50,
        y:     Math.max(100, Math.min(groundY - 100, balloonY - 60)),
        speed: 3
    };
}

function drawCrow() {
    if (!crow) return;

    if (currentTheme === "night") {
        drawBat();
    } else {
        drawBird();
    }
}

/* Original Crow for Day/Sunset */
function drawBird() {
    ctx.save();
    ctx.translate(crow.x, crow.y);

    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(-15, -10, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#F59E0B";
    ctx.beginPath();
    ctx.moveTo(-23, -10);
    ctx.lineTo(-35, -6);
    ctx.lineTo(-23, -3);
    ctx.fill();

    let wingAngle = Math.sin(Date.now() / 100) * 0.7;
    ctx.save();
    ctx.translate(-3, -5);
    ctx.rotate(wingAngle);
    ctx.fillStyle = "#555";
    ctx.beginPath();
    ctx.ellipse(0, -8, 15, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "white";
    ctx.beginPath(); ctx.arc(-17, -12, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "black";
    ctx.beginPath(); ctx.arc(-18, -12, 1.5, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
}

/* Bat for Night with Glowing Red Eyes */
function drawBat() {
    ctx.save();
    ctx.translate(crow.x, crow.y);

    // Flapping wing angle
    const wingFlap = Math.sin(Date.now() / 90) * 0.8;

    // Left Bat Wing (back)
    ctx.save();
    ctx.translate(4, -3);
    ctx.rotate(-wingFlap);
    ctx.fillStyle = "#1e1e24";
    ctx.strokeStyle = "#121217";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(14, -20, 28, -16);
    ctx.quadraticCurveTo(22, -6, 18, 2);
    ctx.quadraticCurveTo(10, -2, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Bat Body (charcoal black)
    ctx.fillStyle = "#18181b";
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bat Head (facing left)
    ctx.beginPath();
    ctx.arc(-13, -4, 9, 0, Math.PI * 2);
    ctx.fill();

    // Pointed Bat Ears
    ctx.fillStyle = "#27272a";
    // Left ear
    ctx.beginPath();
    ctx.moveTo(-16, -11);
    ctx.lineTo(-19, -23);
    ctx.lineTo(-11, -12);
    ctx.closePath();
    ctx.fill();
    // Right ear
    ctx.beginPath();
    ctx.moveTo(-9, -11);
    ctx.lineTo(-6, -21);
    ctx.lineTo(-4, -10);
    ctx.closePath();
    ctx.fill();

    // Main Left Wing (front)
    ctx.save();
    ctx.translate(-2, -3);
    ctx.rotate(wingFlap);
    ctx.fillStyle = "#27272a";
    ctx.strokeStyle = "#18181b";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-15, -24, -30, -18);
    ctx.quadraticCurveTo(-24, -6, -20, 3);
    ctx.quadraticCurveTo(-10, -2, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Glowing Red Bat Eyes!
    const eyeX = -15;
    const eyeY = -5;

    // Red eye glow halo
    ctx.save();
    ctx.shadowColor = "#ff0000";
    ctx.shadowBlur  = 8;
    ctx.fillStyle   = "#ff2222";
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Center bright pupil
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(eyeX - 0.5, eyeY - 0.5, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Subtle little white fangs
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.moveTo(-20, -1);
    ctx.lineTo(-22, 3);
    ctx.lineTo(-18, 1);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}


// ================================================================
//  PIPES / BRICK WALLS
// ================================================================
function drawPipes() {
    drawBrickWall(pipeX, 0, pipeWidth, gapY);
    drawBrickWall(pipeX, gapY + gapHeight, pipeWidth, canvas.height - (gapY + gapHeight));
}

function drawBrickWall(x, y, width, height) {
    if (height <= 0) return;

    ctx.fillStyle = "#808080";
    ctx.fillRect(x, y, width, height);

    ctx.strokeStyle = "#555555";
    ctx.lineWidth   = 2;

    const brickHeight = 20;
    const brickWidth  = 35;

    for (let row = y; row < y + height; row += brickHeight) {
        ctx.beginPath();
        ctx.moveTo(x,         row);
        ctx.lineTo(x + width, row);
        ctx.stroke();

        let offset = Math.floor((row - y) / brickHeight) % 2 === 0 ? 0 : brickWidth / 2;
        for (let col = x + offset; col < x + width; col += brickWidth) {
            ctx.beginPath();
            ctx.moveTo(col, row);
            ctx.lineTo(col, row + brickHeight);
            ctx.stroke();
        }
    }

    ctx.strokeStyle = "#444444";
    ctx.strokeRect(x, y, width, height);
}


// ================================================================
//  COLLISION
// ================================================================
function checkCollision() {
    let balloonLeft   = balloonX - 30;
    let balloonRight  = balloonX + 30;
    let balloonTop    = balloonY - 40;
    let balloonBottom = balloonY + 40;
    let pipeLeft      = pipeX;
    let pipeRight     = pipeX + pipeWidth;

    if (balloonRight > pipeLeft && balloonLeft < pipeRight) {
        if (balloonTop < gapY || balloonBottom > gapY + gapHeight) {
            popBalloon();
        }
    }
}


// ================================================================
//  POP
// ================================================================
function popBalloon() {
    if (balloonPopped) return;

    balloonPopped = true;
    gameOver      = true;

    fetch("https://balloon-bounce-backend.onrender.com/api/scores/save/" ,{
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            player_name: playerName,
            distance:    Math.floor(distance),
            coins:       totalCoins
        })
    })
    .then(r  => r.json())
    .then(d  => console.log("Score saved:", d))
    .catch(e => console.error("Score error:", e));

    isInflating       = false;
    popAnimationFrame = 1;
}

function drawPop() {
    if (popAnimationFrame > 20) return;

    ctx.save();
    ctx.translate(balloonX, balloonY);

    const pal    = BALLOON_PALETTES[currentBalloonColor] || BALLOON_PALETTES.pink;
    let   radius = popAnimationFrame * 3;
    ctx.fillStyle = pal.body;

    for (let i = 0; i < 8; i++) {
        let angle = i * Math.PI / 4;
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
    popAnimationFrame++;
}


// ================================================================
//  DISTANCE HUD
// ================================================================
function drawDistance() {
    ctx.fillStyle     = "#ffffff";
    ctx.font          = "bold 20px Arial";
    ctx.textAlign     = "left";
    ctx.strokeStyle   = "rgba(0,0,0,0.55)";
    ctx.lineWidth     = 4;

    const label = "📍 " + Math.floor(distance) + " m";
    ctx.strokeText(label, 66, 38);
    ctx.fillText(label,   66, 38);
}


// ================================================================
//  CONTROLS
// ================================================================
inflateButton.addEventListener("pointerdown", function(event) {
    event.preventDefault();
    if (!gameOver && !isPaused) {
        isInflating = true;
        inflateButton.setPointerCapture(event.pointerId);
    }
});
inflateButton.addEventListener("pointerup",     () => { isInflating = false; });
inflateButton.addEventListener("pointercancel", () => { isInflating = false; });

window.addEventListener("keydown", function(event) {
    if (event.code === "Space") {
        event.preventDefault();
        if (gameOver) {
            replayButton.click();
        } else if (!isPaused) {
            isInflating = true;
        }
    } else if (event.code === "KeyP" || event.code === "Escape") {
        togglePause();
    }
});
window.addEventListener("keyup", function(event) {
    if (event.code === "Space") isInflating = false;
});


// ================================================================
//  REPLAY & HOME
// ================================================================
replayButton.addEventListener("click", function() {
    resetGameVariables();
});

homeButton.addEventListener("click", function() {
    resetGameVariables();
    gameScreen.style.display    = "none";
    welcomeScreen.style.display = "grid";
    welcomeScreen.style.opacity = "1";
});


// ================================================================
//  GAME OVER OVERLAY
// ================================================================
function drawGameOver() {
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pw = Math.min(400, canvas.width * 0.88);
    const ph = 180;
    const px = (canvas.width  - pw) / 2;
    const py = canvas.height  * 0.25;

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.32)";
    ctx.shadowBlur  = 26;
    ctx.fillStyle   = currentTheme === "night"
                        ? "rgba(15,23,42,0.94)"
                        : "rgba(255,255,255,0.94)";
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, 22);
    ctx.fill();
    ctx.restore();

    // "GAME OVER!" title
    const titleColor = currentTheme === "night" ? "#a78bfa" : "#ff1493";
    ctx.fillStyle    = titleColor;
    ctx.font         = "bold 28px 'Nunito', Arial";
    ctx.textAlign    = "center";
    ctx.fillText("GAME OVER! 🎈", canvas.width / 2, py + 42);

    // Player name
    const nameColor = currentTheme === "night" ? "#cbd5e1" : "#64748b";
    ctx.fillStyle   = nameColor;
    ctx.font        = "700 15px 'Nunito', Arial";
    ctx.fillText("Good flight, " + playerName + "!", canvas.width / 2, py + 68);

    // Divider
    ctx.strokeStyle = currentTheme === "night" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(px + 24, py + 84);
    ctx.lineTo(px + pw - 24, py + 84);
    ctx.stroke();

    // Stats Row: Distance + Exactly matching gold coin with Coin count
    const statTextColor = currentTheme === "night" ? "#f1f5f9" : "#1e293b";
    ctx.fillStyle       = statTextColor;
    ctx.font            = "800 17px 'Nunito', Arial";
    ctx.textAlign       = "center";

    // Distance on left
    const distText = "📍 Distance: " + Math.floor(distance) + " m";
    ctx.fillText(distText, canvas.width / 2 - 80, py + 118);

    // Coin on right in exact collected gold coin appearance
    const coinDrawX = canvas.width / 2 + 38;
    const coinDrawY = py + 112;
    drawGoldCoin(coinDrawX, coinDrawY, 11);

    ctx.fillStyle = statTextColor;
    ctx.textAlign = "left";
    ctx.fillText("Coins: " + totalCoins, coinDrawX + 16, py + 118);

    // Hint
    const hintColor = currentTheme === "night" ? "#94a3b8" : "#94a3b8";
    ctx.fillStyle   = hintColor;
    ctx.font        = "600 12px 'Nunito', Arial";
    ctx.textAlign   = "center";
    ctx.fillText("Press Space or click PLAY AGAIN", canvas.width / 2, py + 154);

    // Position buttons row below the card
    const btnTop = py + ph + 18;
    gameOverBtns.style.top     = btnTop + "px";
    gameOverBtns.style.display = "flex";
}


// ================================================================
//  GAME LOOP
// ================================================================
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();
    drawDistance();
    drawCoinCount();
    drawPipes();
    drawCoins();
    drawCrow();

    if (!balloonPopped) {
        drawBalloon();
    } else {
        drawPop();
    }

    if (!gameOver) {
        update();
    } else {
        drawGameOver();
    }

    requestAnimationFrame(gameLoop);
}
