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

const closeTank = document.getElementById("closeTank");
const saveCrew = document.getElementById("saveCrew");

let tankCrew = JSON.parse(localStorage.getItem("tankCrew") || "[]");
let feedHistory = [];

// ===============================
// CLOSE
// ===============================

closeTank.addEventListener("click", () => {
  window.close();
});

// ===============================
// CHARGER CREW SAUVEGARDÉE
// ===============================

if (tankCrew.length) {
  for (let i = 1; i <= 6; i++) {
    const input = document.getElementById(`tankName${i}`);
    if (input) input.value = tankCrew[i - 1] || "";
  }

  ipcRenderer.send("tank-crew-change", {
    crew: tankCrew
  });
}

// ===============================
// SAUVEGARDER CREW
// ===============================

saveCrew.addEventListener("click", () => {
  tankCrew = [
    document.getElementById("tankName1")?.value,
    document.getElementById("tankName2")?.value,
    document.getElementById("tankName3")?.value,
    document.getElementById("tankName4")?.value,
    document.getElementById("tankName5")?.value,
    document.getElementById("tankName6")?.value
  ]
    .map(v => String(v || "").trim().toLowerCase())
    .filter(Boolean);

  localStorage.setItem("tankCrew", JSON.stringify(tankCrew));

  feedHistory = [];
  renderFeed();

  ipcRenderer.send("tank-crew-change", {
    crew: tankCrew
  });

  renderCrewList(
    tankCrew.map(name => ({
      name,
      kills: 0
    }))
  );

  document.getElementById("tankKills").textContent = "0";
});

// ===============================
// UPDATE TANK
// ===============================

ipcRenderer.on("tank-update", (event, data) => {
  const kills = Number(data.kills || 0);
  document.getElementById("tankKills").textContent = kills;

  if (data.crew?.length) {
    renderCrewList(data.crew);
  }
});

// ===============================
// FEED TANK
// ===============================

ipcRenderer.on("tank-feed-event", (event, data) => {
  feedHistory.unshift(data);
  feedHistory = feedHistory.slice(0, 8);
  renderFeed();
});

// ===============================
// RENDER CREW
// ===============================

function renderCrewList(crew = []) {
  const crewList = document.getElementById("crewList");
  if (!crewList) return;

  crewList.innerHTML = "";

  for (let i = 0; i < 6; i++) {
    const player = crew[i];

    const div = document.createElement("div");
    div.innerHTML = `
      🪖 Soldat ${i + 1} : ${player?.name || "---"}
      <strong>${player?.kills || 0}</strong>
    `;

    crewList.appendChild(div);
  }
}

// ===============================
// RENDER FEED
// ===============================

function renderFeed() {
  const tankFeed = document.getElementById("tankFeed");
  if (!tankFeed) return;

  tankFeed.innerHTML = "";

  if (!feedHistory.length) {
    tankFeed.innerHTML =
      `<div class="empty">En attente d’un kill équipage...</div>`;
    return;
  }

  feedHistory.forEach(item => {
    const row = document.createElement("div");
    row.className = `feed-row ${item.type || "kill"}`;
    row.textContent = item.text;
    tankFeed.appendChild(row);
  });
}

renderCrewList(
  tankCrew.map(name => ({
    name,
    kills: 0
  }))
);

renderFeed();