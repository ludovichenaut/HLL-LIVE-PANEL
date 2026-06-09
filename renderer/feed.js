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

const container = document.getElementById("feedContainer");
const closeBtn = document.getElementById("closeFeed");

let currentServerKey =
  localStorage.getItem("currentFeedServer") || "serv2";

let historyByServer =
  JSON.parse(localStorage.getItem("killFeedHistory")) || {
    serv1: [],
    serv2: [],
    serv3: [],
    serv4: []
  };

function saveHistory() {
  localStorage.setItem("killFeedHistory", JSON.stringify(historyByServer));
  localStorage.setItem("currentFeedServer", currentServerKey);
}

function render() {
  if (!container) {
    console.error("feedContainer introuvable");
    return;
  }

  const history = historyByServer[currentServerKey] || [];

  container.innerHTML = "";

  if (history.length === 0) {
    const div = document.createElement("div");
    div.className = "feed-row waiting";
    div.textContent = "En attente d'un kill...";
    container.appendChild(div);
    return;
  }

  history.forEach(item => {
    const div = document.createElement("div");
    div.className = `feed-row ${item.type || "info"}`;
    div.textContent = item.text || "";
    container.appendChild(div);
  });
}

ipcRenderer.on("feed-event", (event, data) => {
  const serverKey = data?.serverKey;

  if (!serverKey) {
    console.error("feed-event sans serverKey");
    return;
  }

  currentServerKey = serverKey;

  if (!historyByServer[serverKey]) {
    historyByServer[serverKey] = [];
  }

  historyByServer[serverKey].unshift({
    type: data.type || "info",
    text: data.text || "",
    date: Date.now()
  });

  historyByServer[serverKey] = historyByServer[serverKey].slice(0, 10);

  saveHistory();
  render();
});

ipcRenderer.on("feed-clear", (event, data) => {
  const serverKey = data?.serverKey;

  if (!serverKey) {
    console.error("feed-clear sans serverKey");
    return;
  }

  historyByServer[serverKey] = [];
  saveHistory();

  if (currentServerKey === serverKey) {
    render();
  }
});

ipcRenderer.on("feed-server-change", (event, data) => {
  const serverKey = data?.serverKey;

  if (!serverKey) {
    console.error("feed-server-change sans serverKey");
    return;
  }

  currentServerKey = serverKey;
  saveHistory();
  render();
});

if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    window.close();
  });
}

function updateScale() {
  const scale = window.innerWidth / 400;
  document.body.style.zoom = scale;
}

updateScale();
render();

window.addEventListener("resize", updateScale);