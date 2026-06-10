// ======================================================
//   HLL LIVE STATS OVERLAY
//   CREATED BY [CHM3] TONTONCAROTTE
//   FAN MADE PROJECT - NOT AFFILIATED WITH TEAM17
//
//   © 2026 TONTONCAROTTE - ALL RIGHTS RESERVED
// ======================================================

const {
  app,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  screen
} = require("electron");

const path = require("path");

let feedWindow = null;
let mainWindow = null;
let tankWindow = null;

let overlayClickable = true;

let tankCrew = [];
let previousTankPlayers = {};
let tankServerKey = "serv2";
let myPlayerName = "";

const SERVERS = {
  serv1: "https://serv1.7ecompagnie.fr/api/get_live_game_stats",
  serv2: "https://serv2.7ecompagnie.fr/api/get_live_game_stats",
  serv3: "https://serv3.7ecompagnie.fr/api/get_live_game_stats",
  serv4: "https://serv4.7ecompagnie.fr/api/get_live_game_stats",
  serv5: "http://5.189.173.70:7012/api/get_live_game_stats",
  serv6: "http://cfr.tagadap.ovh:7010/api/get_live_game_stats",
  serv7: "https://stats1.the-circle.team/api/get_live_game_stats",
  serv8: "https://stats2.the-circle.team/api/get_live_game_stats",
  serv9: "https://stats3.the-circle.team/api/get_live_game_stats",
  serv10: "https://stats4.the-circle.team/api/get_live_game_stats",
  serv11: "https://stats5.the-circle.team/api/get_live_game_stats",
  serv12: "https://stats6.the-circle.team/api/get_live_game_stats"
};

const PUBLIC_INFO = {
  serv1: "https://serv1.7ecompagnie.fr/api/get_public_info",
  serv2: "https://serv2.7ecompagnie.fr/api/get_public_info",
  serv3: "https://serv3.7ecompagnie.fr/api/get_public_info",
  serv4: "https://serv4.7ecompagnie.fr/api/get_public_info",
  serv5: "http://5.189.173.70:7012/api/get_public_info",
  serv6: "http://cfr.tagadap.ovh:7010/api/get_public_info",
  serv7: "https://stats1.the-circle.team/api/get_public_info",
  serv8: "https://stats2.the-circle.team/api/get_public_info",
  serv9: "https://stats3.the-circle.team/api/get_public_info",
  serv10: "https://stats4.the-circle.team/api/get_public_info",
  serv11: "https://stats5.the-circle.team/api/get_public_info",
  serv12: "https://stats6.the-circle.team/api/get_public_info"
};
const SCOREBOARDS = {
  serv1: "https://serv1.7ecompagnie.fr/api/get_live_scoreboard",
  serv2: "https://serv2.7ecompagnie.fr/api/get_live_scoreboard",
  serv3: "https://serv3.7ecompagnie.fr/api/get_live_scoreboard",
  serv4: "https://serv4.7ecompagnie.fr/api/get_live_scoreboard",
  serv5: "http://5.189.173.70:7012/api/get_live_scoreboard",
  serv6: "http://cfr.tagadap.ovh:7010/api/get_live_scoreboard",
  serv7: "https://stats1.the-circle.team/api/get_live_scoreboard",
  serv8: "https://stats2.the-circle.team/api/get_live_scoreboard",
  serv9: "https://stats3.the-circle.team/api/get_live_scoreboard",
  serv10: "https://stats4.the-circle.team/api/get_live_scoreboard",
  serv11: "https://stats5.the-circle.team/api/get_live_scoreboard",
  serv12: "https://stats6.the-circle.team/api/get_live_scoreboard"
};
app.commandLine.appendSwitch("disable-http-cache");

// ===============================
// WINDOWS
// ===============================

function createWindow() {

mainWindow = new BrowserWindow({
  width:280,
  height: 500,
  useContentSize: true,
  frame: false,
  transparent: true,
  alwaysOnTop: true,
  resizable: false,
  skipTaskbar: true,
  webPreferences: {
    contextIsolation: false,
    nodeIntegration: true
  }
});
   mainWindow.loadFile(
    path.join(__dirname, "renderer", "index.html")
  );
 mainWindow.setMinimumSize(200, 370);
  mainWindow.setMaximumSize(450, 1200);
  mainWindow.setAlwaysOnTop(
    true,
    "screen-saver"
  );

  mainWindow.setIgnoreMouseEvents(false);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createFeedWindow() {
  if (feedWindow && !feedWindow.isDestroyed()) {
    feedWindow.focus();
    return;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, x, y } = primaryDisplay.workArea;

  feedWindow = new BrowserWindow({
    width: 420,
    height: 180,
    x: x + width - 420,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true
    }
  });

  feedWindow.loadFile(path.join(__dirname, "renderer", "feed.html"));
  feedWindow.setAlwaysOnTop(true, "screen-saver");
  feedWindow.setIgnoreMouseEvents(!overlayClickable, { forward: true });

  feedWindow.on("closed", () => {
    feedWindow = null;

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("feed-window-state", false);
    }
  });

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("feed-window-state", true);
  }
}

function createTankWindow() {
  if (tankWindow && !tankWindow.isDestroyed()) {
    tankWindow.focus();
    return;
  }

tankWindow = new BrowserWindow({
  width: 800,
  height: 400,
  x: 50,
  y: 480,
  frame: false,
  transparent: true,
  alwaysOnTop: true,
  resizable: false,
  skipTaskbar: true,
  webPreferences: {
    contextIsolation: false,
    nodeIntegration: true
  }
});
tankWindow.setMinimumSize(800, 400);
tankWindow.setMaximumSize(800, 400);

  tankWindow.loadFile(path.join(__dirname, "renderer", "tank.html"));
  tankWindow.setAlwaysOnTop(true, "screen-saver");
  tankWindow.setIgnoreMouseEvents(!overlayClickable, { forward: true });

  tankWindow.on("closed", () => {
    tankWindow = null;
  });
}

// ===============================
// UTILS
// ===============================

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\[.*?\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

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

function sendFeedEvent(data) {
  if (!feedWindow || feedWindow.isDestroyed()) {
    createFeedWindow();
  }

  if (feedWindow && !feedWindow.isDestroyed()) {
    feedWindow.webContents.send("feed-event", data);
  }
}

// ===============================
// TANK CREW DETECTION
// ===============================

async function updateTankCrewStats() {
  if (!tankCrew.length) return;

  try {
    const apiUrl = SERVERS[tankServerKey];
    if (!apiUrl) return;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error("API tank inaccessible :", tankServerKey);
      return;
    }

    const json = await response.json();

    const stats =
      json?.result?.stats ||
      json?.stats ||
      json?.scoreboard?.result?.stats ||
      [];

    if (!Array.isArray(stats)) return;

    const crewData = tankCrew.map(name => {
      const searchedName = normalize(name);

      const found = stats.find(p =>
        normalize(p.player).includes(searchedName)
      );

      return {
        name: found?.player || name,
        kills: Number(found?.kills || 0),
        deaths: Number(found?.deaths || 0),
        weapons: found?.weapons || {},
        most_killed: found?.most_killed || {}
      };
    });

    for (const player of crewData) {
      const oldPlayer = previousTankPlayers[player.name];

      if (!oldPlayer) {
        previousTankPlayers[player.name] = structuredClone(player);
        continue;
      }

      const killDiff =
        Number(player.kills || 0) - Number(oldPlayer.kills || 0);

      if (killDiff > 0) {
        const weapons = getIncreases(oldPlayer.weapons, player.weapons);
        const victims = getIncreases(oldPlayer.most_killed, player.most_killed);

        const weapon = weapons.at(-1)?.name || "arme inconnue";
        const victim = victims.at(-1)?.name || "victime inconnue";

        previousTankPlayers[player.name] = structuredClone(player);

        const tankPlayerName = normalize(player.name);
        const myName = normalize(myPlayerName);

        if (myName && tankPlayerName.includes(myName)) {
          continue;
        }

        sendFeedEvent({
          serverKey: tankServerKey,
          type: "kill",
          text: `🪖 ${player.name} a tué ${victim} avec ${weapon}`
        });

        continue;
      }

      previousTankPlayers[player.name] = structuredClone(player);
    }

    const totalKills = crewData.reduce(
      (sum, p) => sum + Number(p.kills || 0),
      0
    );

    const totalDeaths = crewData.reduce(
      (sum, p) => sum + Number(p.deaths || 0),
      0
    );

    if (tankWindow && !tankWindow.isDestroyed()) {
      tankWindow.webContents.send("tank-update", {
        kills: totalKills,
        deaths: totalDeaths,
        crew: crewData
      });
    }

  } catch (e) {
    console.error("Erreur updateTankCrewStats :", e);
  }
}

// ===============================
// IPC
// ===============================

ipcMain.on("my-player-name-change", (event, name) => {
  myPlayerName = normalize(name);
});
ipcMain.on("quit-app", () => {
  app.quit();
});
ipcMain.on("set-main-size", (event, size) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  mainWindow.setContentSize(size.width, size.height);
});
ipcMain.on("overlay-opacity-change", (event, opacity) => {
  const value = Number(opacity);

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("overlay-opacity-apply", value);
  }

  if (feedWindow && !feedWindow.isDestroyed()) {
    feedWindow.webContents.send("overlay-opacity-apply", value);
  }

  if (tankWindow && !tankWindow.isDestroyed()) {
    tankWindow.webContents.send("overlay-opacity-apply", value);
  }
});
ipcMain.handle("get-hll-stats", async (event, serverKey = "serv2") => {
  const apiUrl = SERVERS[serverKey];

  if (!apiUrl) {
    throw new Error("Serveur inconnu : " + serverKey);
  }

  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error("API inaccessible : " + serverKey);
  }

  return await response.json();
});
ipcMain.handle("get-live-scoreboard", async (event, serverKey = "serv2") => {

  const apiUrl = SCOREBOARDS[serverKey];

  if (!apiUrl) {
    throw new Error("Scoreboard inconnu : " + serverKey);
  }

  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error("Scoreboard inaccessible : " + serverKey);
  }

  return await response.json();
});
ipcMain.handle("get-public-info", async (event, serverKey = "serv2") => {
  const apiUrl = PUBLIC_INFO[serverKey];

  if (!apiUrl) {
    throw new Error("Serveur inconnu : " + serverKey);
  }

  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error("API public info inaccessible : " + serverKey);
  }

  return await response.json();
});
ipcMain.handle("find-my-server", async (event, playerName) => {

  playerName =
    String(playerName || "")
      .toLowerCase()
      .trim();

  for (const [key, url] of Object.entries(SCOREBOARDS)) {

    try {

      const response =
        await fetch(url);

      const json =
        await response.json();

      const stats =
        json?.result?.stats ||
        json?.stats ||
        json?.scoreboard?.result?.stats;

      if (!Array.isArray(stats)) {
        continue;
      }

      const found = stats.find(p => {

     const name = normalize(p.player);
const search = normalize(playerName);

return (
  search.length >= 6 &&
  name.includes(search)
);
      });

      if (found) {

        return {
          found: true,
          serverKey: key
        };
      }

    } catch (e) {
      console.error(
        "Erreur scan serveur",
        key,
        e
      );
    }
  }

  return {
    found: false
  };
});
ipcMain.handle("open-feed-window", () => {
  createFeedWindow();
  return true;
});

ipcMain.handle("toggle-feed-window", () => {
  let opened = false;

  if (feedWindow && !feedWindow.isDestroyed()) {
    feedWindow.close();
    feedWindow = null;
    opened = false;
  } else {
    createFeedWindow();
    opened = true;
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("feed-window-state", opened);
  }

  return opened;
});

ipcMain.handle("toggle-tank-window", () => {
  let opened = false;

  if (tankWindow && !tankWindow.isDestroyed()) {
    tankWindow.close();
    tankWindow = null;
    opened = false;
  } else {
    createTankWindow();
    opened = true;
  }

  return opened;
});

ipcMain.on("feed-event", (event, data) => {
  sendFeedEvent(data);
});

ipcMain.on("feed-clear", (event, data) => {
  if (feedWindow && !feedWindow.isDestroyed()) {
    feedWindow.webContents.send("feed-clear", data);
  }
});

ipcMain.on("feed-server-change", (event, data) => {
  if (!data?.serverKey) return;

  tankServerKey = data.serverKey;
  previousTankPlayers = {};

  if (feedWindow && !feedWindow.isDestroyed()) {
    feedWindow.webContents.send("feed-server-change", data);
  }
});

ipcMain.on("tank-crew-change", (event, data) => {
  tankCrew = Array.isArray(data?.crew)
    ? data.crew.map(normalize).filter(Boolean)
    : [];

  previousTankPlayers = {};
});

ipcMain.on("tank-update", (event, data) => {
  if (tankWindow && !tankWindow.isDestroyed()) {
    tankWindow.webContents.send("tank-update", data);
  }
});

ipcMain.on("toggle-mouse-lock", (event, locked) => {
  overlayClickable = !locked;

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setIgnoreMouseEvents(locked, { forward: true });
    mainWindow.webContents.send("mouse-lock-state", locked);
  }

  if (feedWindow && !feedWindow.isDestroyed()) {
    feedWindow.setIgnoreMouseEvents(locked, { forward: true });
  }

  if (tankWindow && !tankWindow.isDestroyed()) {
    tankWindow.setIgnoreMouseEvents(locked, { forward: true });
  }
});

ipcMain.on("set-compact-mode", (event, compact) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;

  if (compact) {
    win.setMinimumSize(200, 200);
    win.setContentSize(330, 430);
    win.setResizable(true);
  } else {
    win.setMinimumSize(430, 610);
    win.setContentSize(450, 630);
    win.setResizable(true);
  }
});
// ===============================
// START
// ===============================

app.whenReady().then(() => {
  createWindow();

  setInterval(updateTankCrewStats, 30000);

  globalShortcut.register("F6", () => {
    if (tankWindow && !tankWindow.isDestroyed()) {
      tankWindow.close();
      tankWindow = null;
    } else {
      createTankWindow();
    }
  });

  globalShortcut.register("F7", () => {
    let opened = false;

    if (feedWindow && !feedWindow.isDestroyed()) {
      feedWindow.close();
      feedWindow = null;
      opened = false;
    } else {
      createFeedWindow();
      opened = true;
    }

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("feed-window-state", opened);
    }
  });

  globalShortcut.register("F8", () => {
    overlayClickable = !overlayClickable;
    const locked = !overlayClickable;

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setIgnoreMouseEvents(locked, { forward: true });
      mainWindow.webContents.send("mouse-lock-state", locked);
    }

    if (feedWindow && !feedWindow.isDestroyed()) {
      feedWindow.setIgnoreMouseEvents(locked, { forward: true });
    }

    if (tankWindow && !tankWindow.isDestroyed()) {
      tankWindow.setIgnoreMouseEvents(locked, { forward: true });
    }
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});