// ======================================================
//   HLL LIVE STATS OVERLAY
//   CREATED BY [CHM3] TONTONCAROTTE
//   FAN MADE PROJECT - NOT AFFILIATED WITH TEAM17
//
//   © 2026 TONTONCAROTTE - ALL RIGHTS RESERVED
// ======================================================

const { ipcRenderer } = require("electron");

// ===============================
// ELEMENTS
// ===============================

const closeTank = document.getElementById("closeTank");
const saveCrew = document.getElementById("saveCrew");
const crewList = document.getElementById("crewList");
const tankFeed = document.getElementById("tankFeed");
const tankKills = document.getElementById("tankKills");

// ===============================
// VARIABLES
// ===============================

let tankCrew = JSON.parse(
  localStorage.getItem("tankCrew") || "[]"
);

let feedHistory = [];

// ===============================
// OPACITY GLOBAL
// ===============================

ipcRenderer.on("overlay-opacity-apply", (event, opacity) => {
  document.documentElement.style.setProperty(
    "--overlay-opacity",
    opacity
  );
});

// ===============================
// CLOSE
// ===============================

if (closeTank) {
  closeTank.addEventListener("click", () => {
    window.close();
  });
}

// ===============================
// LOAD SAVED CREW
// ===============================

function loadSavedCrew() {
  if (!tankCrew.length) return;

  for (let i = 1; i <= 6; i++) {
    const input = document.getElementById(`tankName${i}`);
    if (input) {
      input.value = tankCrew[i - 1] || "";
    }
  }

  ipcRenderer.send("tank-crew-change", {
    crew: tankCrew
  });

  renderCrewList(
    tankCrew.map(name => ({
      name,
      kills: 0,
      deaths: 0
    }))
  );
}

// ===============================
// SAVE CREW
// ===============================

if (saveCrew) {
  saveCrew.addEventListener("click", () => {
    tankCrew = [];

    for (let i = 1; i <= 6; i++) {
      const value = document
        .getElementById(`tankName${i}`)
        ?.value
        ?.trim();

      if (value) {
        tankCrew.push(value.toLowerCase());
      }
    }

    localStorage.setItem(
      "tankCrew",
      JSON.stringify(tankCrew)
    );

    feedHistory = [];
    renderFeed();

    ipcRenderer.send("tank-crew-change", {
      crew: tankCrew
    });

    renderCrewList(
      tankCrew.map(name => ({
        name,
        kills: 0,
        deaths: 0
      }))
    );

    if (tankKills) {
      tankKills.textContent = "0";
    }
  });
}
/// ===============================
// DELETE CREW
// ===============================

const clearCrew = document.getElementById("clearCrew");

if (clearCrew) {
  clearCrew.addEventListener("click", () => {

    tankCrew = [];

    localStorage.removeItem("tankCrew");

    for (let i = 1; i <= 6; i++) {
      const input = document.getElementById(`tankName${i}`);

      if (input) {
        input.value = "";
      }
    }

    ipcRenderer.send("tank-crew-change", {
      crew: []
    });

    renderCrewList([]);

    if (tankKills) {
      tankKills.textContent = "0";
    }
  });
}
// ===============================
// UPDATE CREW DATA
// ===============================

ipcRenderer.on("tank-update", (event, data) => {
  const kills = Number(data?.kills || 0);

  if (tankKills) {
    tankKills.textContent = kills;
  }

  const crewData =
    data?.crew?.length
      ? data.crew
      : tankCrew.map(name => ({
          name,
          kills: 0,
          deaths: 0
        }));

  renderCrewList(crewData);
});

// ===============================
// FEED EVENTS
// ===============================

ipcRenderer.on("tank-feed-event", (event, data) => {
  feedHistory.unshift(data);
  feedHistory = feedHistory.slice(0, 8);
  renderFeed();
});

// ===============================
// RENDER CREW TABLE
// ===============================

function renderCrewList(crew = []) {
  if (!crewList) return;

  crewList.innerHTML = `
    <table class="crew-table-ui">
      <thead>
        <tr>
          <th>Soldat</th>
          <th>K</th>
          <th>D</th>
          <th>K/D</th>
        </tr>
      </thead>

      <tbody>
        ${Array.from({ length: 6 }).map((_, i) => {
          const player = crew[i];

          const kills = Number(player?.kills || 0);
          const deaths = Number(player?.deaths || 0);

          const kd =
            deaths > 0
              ? (kills / deaths).toFixed(2)
              : kills.toFixed(2);

          return `
            <tr>
              <td>${i + 1}. ${player?.name || "---"}</td>
              <td>${kills}</td>
              <td>${deaths}</td>
              <td>${kd}</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

// ===============================
// RENDER FEED
// ===============================

function renderFeed() {
  if (!tankFeed) return;

  tankFeed.innerHTML = "";

  if (!feedHistory.length) {
    tankFeed.innerHTML =
      `<div class="empty">En attente d’un kill équipage...</div>`;
    return;
  }

  feedHistory.forEach(item => {
    const row = document.createElement("div");

    row.className =
      `feed-row ${item.type || "kill"}`;

    row.textContent =
      item.text || "";

    tankFeed.appendChild(row);
  });
}

// ===============================
// START
// ===============================

loadSavedCrew();

renderCrewList(
  tankCrew.map(name => ({
    name,
    kills: 0,
    deaths: 0
  }))
);
console.log("tank.js chargé");
console.log("crewList =", crewList);
console.log("tankCrew =", tankCrew);