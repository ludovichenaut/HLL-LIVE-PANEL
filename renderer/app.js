// ======================================================
//   ████████╗ ██████╗ ███╗   ██╗████████╗ ██████╗ ███╗   ██╗
//   ╚══██╔══╝██╔═══██╗████╗  ██║╚══██╔══╝██╔═══██╗████╗  ██║
//      ██║   ██║   ██║██╔██╗ ██║   ██║   ██║   ██║██╔██╗ ██║
//      ██║   ██║   ██║██║╚██╗██║   ██║   ██║   ██║██║╚██╗██║
//      ██║   ╚██████╔╝██║ ╚████║   ██║   ╚██████╔╝██║ ╚████║
//      ╚═╝    ╚═════╝ ╚═╝  ╚═══╝   ╚═╝    ╚═════╝ ╚═╝  ╚═══╝
//
//              ██████╗ █████╗ ██████╗  ██████╗ ████████╗████████╗███████╗
//             ██╔════╝██╔══██╗██╔══██╗██╔═══██╗╚══██╔══╝╚══██╔══╝██╔════╝
//             ██║     ███████║██████╔╝██║   ██║   ██║      ██║   █████╗
//             ██║     ██╔══██║██╔══██╗██║   ██║   ██║      ██║   ██╔══╝
//             ╚██████╗██║  ██║██║  ██║╚██████╔╝   ██║      ██║   ███████╗
//              ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝    ╚═╝      ╚═╝   ╚══════╝
//
//   HLL LIVE STATS OVERLAY
//   CREATED BY [CHM3] TONTONCAROTTE
//   FAN MADE PROJECT - NOT AFFILIATED WITH TEAM17
//
//© 2026 TONTONCAROTTE - ALL RIGHTS RESERVED
// ======================================================

const { ipcRenderer } = require("electron");

const quitBtn =
  document.getElementById("quitBtn");

if (quitBtn) {

  quitBtn.addEventListener("click", () => {

    ipcRenderer.send("quit-app");

  });

}
// ===============================
// VARIABLES
// ===============================

let currentServerKey = "serv2";
let currentGameId = null;
let previousPlayer = null;
let matchStart = null;
let baseline = {};
let currentMapData = null;
let autoDetectEnabled = true;
let missingCount = 0;
let manualServerMode = false;
let playerIsOnline = false;
// ONLINE / OFFLINE SYSTEM
const playerActivity = {};

let myPlayerName = localStorage.getItem("myPlayerName") || "";
const startScreen = document.getElementById("startScreen");
const startPlayerName = document.getElementById("startPlayerName");
const startBtn = document.getElementById("startBtn");
const appScale = document.getElementById("appScale");
const widget = document.getElementById("widget");

if (appScale) {
  appScale.style.display = "none";
}

if (myPlayerName && startPlayerName) {
  startPlayerName.value = myPlayerName;
}

if (startBtn) {
  startBtn.addEventListener("click", async () => {

    myPlayerName = startPlayerName.value.trim();

    if (!myPlayerName) return;

    localStorage.setItem("myPlayerName", myPlayerName);

    startOverlay();
  });
}

async function startOverlay() {

  if (startScreen) {
    startScreen.style.display = "none";
  }

if (appScale) {
  appScale.style.display = "";
}

  ipcRenderer.send(
    "my-player-name-change",
    myPlayerName
  );
ipcRenderer.send("set-main-size", {
  width: 450,
  height: 630
});
  resetDisplayedStats("Recherche serveur...");

  await autoDetectServer();
  await loadPublicInfo();
  await loadFullStats();
  await loadKillFeedStats();
}

let lastResources = {
  combat: 0,
  offense: 0,
  defense: 0,
  support: 0
};

let compactMode = false;
let mouseLocked = false;
let feedOpened = false;
let tankCrew = [];
// =====================================
// DONATION
// =====================================

const donateBtn =
  document.getElementById("donateBtn");

if (donateBtn) {

  donateBtn.addEventListener("click", () => {

    const { shell } =
      require("electron");

    shell.openExternal(
      "https://fr.tipeee.com/tontoncarotte"
    );

  });

}
// ===============================
// ELEMENTS HTML
// ===============================

const feedBtn = document.getElementById("feedBtn");
const mouseToggleBtn = document.getElementById("mouseToggleBtn");
const tankBtn = document.getElementById("tankBtn");
const closeBtn = document.getElementById("closeBtn");
const compactBtn = document.getElementById("compactBtn");
// ===============================
// Opacity
// ===============================
const opacitySlider = document.getElementById("opacitySlider");

const savedOpacity =
  localStorage.getItem("overlayOpacity") || "0.82";

if (opacitySlider) {
  opacitySlider.value = savedOpacity;

  updateOverlayOpacity(savedOpacity);

  ipcRenderer.send("overlay-opacity-change", savedOpacity);

  opacitySlider.addEventListener("input", () => {
    const value = opacitySlider.value;

    localStorage.setItem("overlayOpacity", value);

    updateOverlayOpacity(value);

    ipcRenderer.send("overlay-opacity-change", value);
  });
}

function updateOverlayOpacity(opacity) {
  document.documentElement.style.setProperty(
    "--overlay-opacity",
    opacity
  );
}
// ===============================
// resize 
// ===============================
function updateResponsiveLayout() {
  const widget = document.getElementById("widget");
  if (!widget) return;

  if (window.innerWidth < 360) {
    widget.classList.add("compact-layout");
  } else {
    widget.classList.remove("compact-layout");
  }
}

window.addEventListener("resize", updateResponsiveLayout);
updateResponsiveLayout();
// ===============================
// BOUTONS
// ===============================

feedBtn.addEventListener("click", async () => {
  await ipcRenderer.invoke("toggle-feed-window");
});

closeBtn.addEventListener("click", () => {
  window.close();
});

compactBtn.addEventListener("click", () => {

  compactMode = !compactMode;

  const widget =
    document.getElementById("widget");

  if (compactMode) {

    widget.classList.add("mini");

    ipcRenderer.send(
      "set-compact-mode",
      true
    );

  } else {

    widget.classList.remove("mini");

    ipcRenderer.send(
      "set-compact-mode",
      false
    );
  }
});

// ===============================
// TANK PANEL
// ===============================

tankBtn.addEventListener("click", async () => {
  const crew1 = prompt("Nom joueur 1");
  const crew2 = prompt("Nom joueur 2");
  const crew3 = prompt("Nom joueur 3");

  tankCrew = [crew1, crew2, crew3]
    .filter(Boolean)
    .map(v => normalize(v));

  ipcRenderer.send("tank-crew-change", {
    crew: tankCrew
  });

  await ipcRenderer.invoke("toggle-tank-window");
});

ipcRenderer.on("tank-crew-change", (event, data) => {
  tankCrew = data.crew || [];
});

// ===============================
// SOURIS
// ===============================

function updateMouseIcon() {
  if (mouseLocked) {
    mouseToggleBtn.textContent = "🖱️";
    mouseToggleBtn.style.background = "rgba(63, 31, 31, 0.85)";
    mouseToggleBtn.style.color = "white";
  } else {
    mouseToggleBtn.textContent = "🖱️";
    mouseToggleBtn.style.background = "rgba(45, 66, 55, 0.85)";
    mouseToggleBtn.style.color = "black";
  }
}

mouseToggleBtn.addEventListener("click", () => {
  mouseLocked = !mouseLocked;
  ipcRenderer.send("toggle-mouse-lock", mouseLocked);
  updateMouseIcon();
});

ipcRenderer.on("mouse-lock-state", (event, locked) => {
  mouseLocked = locked;
  updateMouseIcon();
});

updateMouseIcon();

// ===============================
// KILL FEED BUTTON
// ===============================

function updateFeedButton() {
  if (feedOpened) {
    feedBtn.style.background = "rgba(45, 66, 55, 0.85)";
    feedBtn.style.color = "white";
  } else {
    feedBtn.style.background = "rgba(63, 31, 31, 0.85)";
    feedBtn.style.color = "white";
  }
}

ipcRenderer.on("feed-window-state", (event, opened) => {
  feedOpened = opened;
  updateFeedButton();
});

updateFeedButton();

// ===============================
// PUBLIC INFO
// ===============================

async function loadPublicInfo() {
  try {
    const serverKey = currentServerKey;
    currentServerKey = serverKey;

    const publicInfo = await ipcRenderer.invoke("get-public-info", serverKey);

    const mapData = publicInfo?.result?.current_map?.map?.map;
    currentMapData = mapData;

    const score = publicInfo?.result?.score;

    document.getElementById("alliedScore").textContent = score?.allied ?? 0;
    document.getElementById("axisScore").textContent = score?.axis ?? 0;

    document.getElementById("alliedLogo").src =
      `assets/${mapData?.allies?.name || "us"}.png`;

    document.getElementById("axisLogo").src =
      `assets/${mapData?.axis?.name || "ger"}.png`;

    const mapId = publicInfo?.result?.current_map?.map?.id;
    const mapStart = publicInfo?.result?.current_map?.start;

    const gameId = mapId && mapStart ? `${mapId}_${mapStart}` : null;

    if (gameId && currentGameId !== gameId) {
      currentGameId = gameId;
      previousPlayer = null;

      ipcRenderer.send("feed-clear", {
        serverKey: currentServerKey
      });

      console.log("🗺️ Nouvelle carte détectée");
    }

  } catch (e) {
    console.error("Erreur public info :", e);
  }
}
async function autoDetectServer() {

  if (!myPlayerName) return;

  if (!autoDetectEnabled) {
    return;
  }

  try {

    const result = await ipcRenderer.invoke(
      "find-my-server",
      myPlayerName
    );

    if (!result?.found) {
      return;
    }

    currentServerKey = result.serverKey;
    updateServerDisplay(currentServerKey);
    
    ipcRenderer.send("feed-server-change", {
      serverKey: currentServerKey
    });

    currentGameId = null;
    previousPlayer = null;

    autoDetectEnabled = false;
    manualServerMode = false;

    console.log("🟢 Serveur détecté :", currentServerKey);

    await loadPublicInfo();
    await loadFullStats();
    await loadKillFeedStats();

  } catch (e) {
    console.error("Erreur auto detect server", e);
  }
}

// ===============================
// ServerDisplay
// ===============================
function updateServerDisplay(serverKey) {

  const names = {
    serv1: "7eCIE1",
    serv2: "7eCIE2",
    serv3: "7eCIE3",
    serv4: "7eCIE4",
    serv5: "F&CO",
    serv6: "CFr",
    serv7: "Circle1",
    serv8: "Circle2",
    serv9: "Circle3",
    serv10:"Circle4",
    serv11:"Circle5",
    serv12:"Circle6",
  };

  const el = document.getElementById("serverDisplay");

  if (!el) return;

  el.textContent =
    `Vous êtes sur ${names[serverKey] || serverKey}`;
}
function updateServerDisplay(serverKey) {
  const names = {
    serv1: "7eCIE1",
    serv2: "7eCIE2",
    serv3: "7eCIE3",
    serv4: "7eCIE4",
    serv5: "F&CO",
    serv6: "CFr",
    serv7: "Circle1",
    serv8: "Circle2",
    serv9: "Circle3",
    serv10:"Circle4",
    serv11:"Circle5",
    serv12:"Circle6"
  };

  const el = document.getElementById("serverDisplay");
  if (!el) return;

  el.textContent = `Vous êtes sur ${names[serverKey] || serverKey}`;
}
// ===============================
// FULL STATS
// ===============================

async function loadFullStats() {
  try {
    const serverKey = currentServerKey;
    updateServerDisplay(serverKey);

    const json = await ipcRenderer.invoke("get-live-scoreboard", serverKey);

    const stats =
      json?.result?.stats ||
      json?.stats ||
      json?.scoreboard?.result?.stats;

    if (!Array.isArray(stats)) {
      console.warn("Scoreboard API invalide");
      return;
    }

    const onlinePlayer = findCurrentPlayer(stats);

    if (!onlinePlayer) {
      playerIsOnline = false;

      resetDisplayedStats("Joueur introuvable", false);
      previousPlayer = null;

      setTimeout(async () => {
        autoDetectEnabled = true;
        manualServerMode = false;

        console.log("🔍 Relance recherche auto...");

        await autoDetectServer();
        await loadPublicInfo();
        await loadFullStats();
        await loadKillFeedStats();

      }, 30000);

      return;
    }

    playerIsOnline = true;

    const fullJson = await ipcRenderer.invoke("get-hll-stats", serverKey);

    const fullStats =
      fullJson?.result?.stats ||
      fullJson?.stats ||
      fullJson?.scoreboard?.result?.stats;

    if (Array.isArray(fullStats)) {
      updateLeaderboards(fullStats);
      updateTankCrew(fullStats);
    }

    const player = Array.isArray(fullStats)
      ? findCurrentPlayer(fullStats)
      : null;

    if (!player) {
      updateStats({
        player: onlinePlayer.player,
        kills: 0,
        deaths: 0,
        kills_per_minute: 0,
        deaths_per_minute: 0,
        kills_streak: 0,
        longest_life_secs: 0,
        teamkills: 0,
        combat: 0,
        offense: 0,
        defense: 0,
        support: 0
      }, true);

      return;
    }

    updatePlayerFactionLogo(player, currentMapData);
    updateStats(player, true);

  } catch (e) {
    console.error("Erreur loadFullStats :", e);
  }
}

// ===============================
// KILL FEED JOUEUR
// ===============================

async function loadKillFeedStats() {
  try {

    if (!playerIsOnline) {
      previousPlayer = null;
      return;
    }

    const serverKey = currentServerKey;
    currentServerKey = serverKey;

    const json = await ipcRenderer.invoke("get-hll-stats", serverKey);

    const stats =
      json?.result?.stats ||
      json?.stats ||
      json?.scoreboard?.result?.stats;

    if (!Array.isArray(stats)) return;

    const player = findCurrentPlayer(stats);

    if (!player) {
      previousPlayer = null;
      return;
    }

    if (previousPlayer) {
      detectLiveEvent(player);
    }

    updatePlayerFactionLogo(player, currentMapData);
    updateStats(player, true);

    previousPlayer = structuredClone(player);

  } catch (e) {
    console.error("Erreur loadKillFeedStats :", e);
  }
}
// ===============================
// JOUEUR
// ===============================

function findCurrentPlayer(stats) {
  const targetPlayer = normalize(myPlayerName);

  if (!targetPlayer || targetPlayer.length < 6) {
    return null;
  }

  return stats.find(p => {
    const name = normalize(p.player);
    return name.includes(targetPlayer);
  }) || null;
}

function updatePlayerFactionLogo(player, mapData) {
  const logo = document.getElementById("myFactionLogo");
  if (!logo) return;

  const myTeam = String(player.team || "").toLowerCase();

  const myFaction =
    myTeam.includes("axis")
      ? mapData?.axis?.name
      : mapData?.allies?.name;

  logo.src = `assets/${myFaction || "us"}.png`;
}

// ===============================
// UPDATE STATS
// ===============================

function resetDisplayedStats(playerName = "Chargement...", isOnline = false) {

  lastResources = {
    combat: 0,
    offense: 0,
    defense: 0,
    support: 0
  };

  updateStats({
    player: playerName,
    kills: 0,
    deaths: 0,
    kills_per_minute: 0,
    deaths_per_minute: 0,
    kills_streak: 0,
    longest_life_secs: 0,
    teamkills: 0,
    combat: 0,
    offense: 0,
    defense: 0,
    support: 0
  }, isOnline);
}

function updateStats(player, isOnline = playerIsOnline) {
  playerIsOnline = isOnline;
  const p = normalizePlayer(player);

  const statusWrap = document.querySelector(".player-status");
  const statusEl = document.getElementById("onlineStatus");

  if (statusWrap && statusEl) {
    statusEl.textContent = isOnline ? "En ligne" : "Hors ligne";

    statusWrap.classList.remove("online", "offline");
    statusWrap.classList.add(isOnline ? "online" : "offline");
  }

  document.getElementById("playerName").textContent = p.player;
  document.getElementById("kills").textContent = p.kills;
  document.getElementById("deaths").textContent = p.deaths;
  document.getElementById("kd").textContent = p.kd.toFixed(2);
  document.getElementById("streak").textContent = p.streak;
  document.getElementById("kpm").textContent = p.kpm.toFixed(2);
  document.getElementById("dpm").textContent = p.dpm.toFixed(2);

  document.getElementById("combat").textContent = p.combat;
  document.getElementById("offense").textContent = p.offense;
  document.getElementById("defense").textContent = p.defense;
  document.getElementById("support").textContent = p.support;

  lastResources = {
    combat: p.combat,
    offense: p.offense,
    defense: p.defense,
    support: p.support
  };
}

function normalizePlayer(player) {
  const kills = Number(player.kills || 0);
  const deaths = Number(player.deaths || 0);

  return {
    raw: player,
    player: player.player || "Inconnu",
    kills,
    deaths,
    kd: deaths > 0 ? kills / deaths : kills,
    kpm: Number(player.kills_per_minute || 0),
    dpm: Number(player.deaths_per_minute || 0),
    streak: Number(player.kills_streak || 0),
    life: Number(player.longest_life_secs || 0),
    tk: Number(player.teamkills || 0),

    combat:
      player.combat != null
        ? Number(player.combat)
        : lastResources.combat,

    offense:
      player.offense != null
        ? Number(player.offense)
        : lastResources.offense,

    defense:
      player.defense != null
        ? Number(player.defense)
        : lastResources.defense,

    support:
      player.support != null
        ? Number(player.support)
        : lastResources.support
  };
}

// ===============================
// DETECTION LIVE JOUEUR
// ===============================

function detectLiveEvent(player) {
  if (!previousPlayer) return;

  const current = normalizePlayer(player);
  const previous = normalizePlayer(previousPlayer);

  const killDiff = current.kills - previous.kills;
  const deathDiff = current.deaths - previous.deaths;

  const tkDeathDiff =
    Number(player.deaths_by_tk ?? 0) -
    Number(previousPlayer.deaths_by_tk ?? 0);

  if (killDiff > 0) {
    const weapons = getIncreases(previousPlayer.weapons, player.weapons);
    const victims = getIncreases(previousPlayer.most_killed, player.most_killed);

    const weapon = weapons.at(-1)?.name || "arme inconnue";
    const victim = victims.at(-1)?.name || "victime inconnue";

    ipcRenderer.send("feed-event", {
      serverKey: currentServerKey,
      type: "kill",
      text: `🔥 Tu as tué ${victim} avec ${weapon}`
    });
  }

  if (deathDiff > 0) {
    const killers = getIncreases(previousPlayer.death_by, player.death_by);
    const weapons = getIncreases(
      previousPlayer.death_by_weapons,
      player.death_by_weapons
    );

    const killer = killers.at(-1)?.name || "ennemi inconnu";
    const weapon = weapons.at(-1)?.name || "arme inconnue";

    const msg =
      tkDeathDiff > 0
        ? `⚠️ ${killer} t'a TK avec ${weapon}`
        : `☠ ${killer} t'a tué avec ${weapon}`;

    ipcRenderer.send("feed-event", {
      serverKey: currentServerKey,
      type: "death",
      text: msg
    });
  }
}

// ===============================
// TANK UI UNIQUEMENT
// ===============================

function updateTankCrew(stats) {
  if (!tankCrew.length) return;

  const crewPlayers = stats.filter(p => {
    const playerName = normalize(p.player);

    return tankCrew.some(name =>
      playerName.includes(name)
    );
  });

  const tankKills = crewPlayers.reduce(
    (sum, p) => sum + Number(p.kills || 0),
    0
  );

  const tankDeaths = crewPlayers.reduce(
    (sum, p) => sum + Number(p.deaths || 0),
    0
  );

  ipcRenderer.send("tank-update", {
    kills: tankKills,
    deaths: tankDeaths,
    crew: crewPlayers.map(p => ({
      name: p.player,
      kills: p.kills,
      deaths: p.deaths
    }))
  });
}

// ===============================
// LEADERBOARDS
// ===============================

function updateLeaderboards(stats) {
  console.log("TOP 5 API :", stats.slice(0, 5))
  const players = stats
    .filter(p => p.player)
    .map(normalizePlayer);

  renderTopCustom("topKills", players, "kills", "number");
  renderTopCustom("topKpm", players, "kpm", "decimal");
  renderTopCustom("topKd", players, "kd", "decimal");
  renderTopCustom("topStreak", players, "streak", "number");
  renderTopCustom("topLife", players, "life", "time");
  renderTopCustom("topTk", players, "tk", "number");
}

function renderTopCustom(elementId, players, field, type) {
  const container = document.getElementById(elementId);
  if (!container) return;

  const top = [...players]
    .filter(p => Number(p[field] || 0) > 0)
    .sort((a, b) => Number(b[field] || 0) - Number(a[field] || 0))
    .slice(0, 3);

  container.innerHTML = "";

  top.forEach((p, index) => {
    let value = p[field];

    if (type === "decimal") {
      value = Number(value || 0).toFixed(2);
    }

    if (type === "time") {
      value = formatTime(value);
    }

    const div = document.createElement("div");
    div.className = "top-row";

    div.innerHTML = `
      <span>${index + 1}. ${p.player}</span>
      <strong>${value}</strong>
    `;

    container.appendChild(div);
  });
}

// ===============================
// UTILS
// ===============================

function getIncreases(oldObj = {}, newObj = {}) {
  const changes = [];

  oldObj = oldObj || {};
  newObj = newObj || {};

  for (const key in newObj) {
    const oldValue = Number(oldObj[key] || 0);
    const newValue = Number(newObj[key] || 0);
    const diff = newValue - oldValue;

    for (let i = 0; i < diff; i++) {
      changes.push({ name: key });
    }
  }

  return changes;
}

function formatTime(seconds) {
  seconds = Number(seconds || 0);

  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);

  return `${min}m${sec.toString().padStart(2, "0")}`;
}
function normalize(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/\[.*?\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
// ===============================
// START
// ===============================

setInterval(loadKillFeedStats, 5000);
setInterval(loadPublicInfo, 30000);
setInterval(loadFullStats, 20000);
serverWatcher();
async function serverWatcher() {

  if (manualServerMode) {
  console.log("⏸️ Mode manuel actif, pas de scan auto");
  setTimeout(serverWatcher, 30000);
  return;
}

  try {

    const json =
      await ipcRenderer.invoke(
        "get-live-scoreboard",
        currentServerKey
      );

    const stats =
      json?.result?.stats ||
      json?.stats ||
      json?.scoreboard?.result?.stats ||
      [];

   const targetPlayer = normalize(myPlayerName);

const stillHere =
  Array.isArray(stats) &&
  stats.some(p => {
    const name = normalize(p.player);

   return (
  targetPlayer.length >= 6 &&
  name.includes(targetPlayer)
);
  });

    if (!stillHere) {

      console.log("🔍 Joueur absent du scoreboard -> scan rapide");

      autoDetectEnabled = true;

      const end = Date.now() + 30000;

      while (
        autoDetectEnabled &&
        Date.now() < end
      ) {

        await autoDetectServer();

        await new Promise(resolve =>
          setTimeout(resolve, 3000)
        );
      }
    }

  } catch (e) {
    console.error("Erreur serverWatcher :", e);
  }

  setTimeout(serverWatcher, 30000);
}