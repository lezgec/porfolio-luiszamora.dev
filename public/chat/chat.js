(function () {
  // ✅ Si Astro/Node evalúa esto en SSR, salimos sin romper
  if (typeof document === "undefined") return;

  document.addEventListener("DOMContentLoaded", () => {
    // =========================
    // Config
    // =========================
    const WS_URL = "wss://server-wodn.onrender.com/ws";

    // =========================
    // Helpers DOM (no explota)
    // =========================
    const el = (id) => document.getElementById(id);

    const statusEl = el("status");
    const loginBox = el("loginBox");
    const chatBox = el("chatBox");
    const messagesEl = el("messages");
    const currentRoomEl = el("currentRoom");
    const roomUsersEl = el("roomUsers");

    const usernameInput = el("username");
    const msgInput = el("msgInput");

    const connectBtn = el("connectBtn");
    const sendBtn = el("sendBtn");
    const roomsBtn = el("roomsBtn");
    const roomWhoBtn = el("roomWhoBtn");
    const joinRoomBtn = el("joinRoomBtn");
    const clearBtn = el("clearBtn");

    // Validación de IDs obligatorios
    const required = [
      ["status", statusEl],
      ["loginBox", loginBox],
      ["chatBox", chatBox],
      ["messages", messagesEl],
      ["currentRoom", currentRoomEl],
      ["roomUsers", roomUsersEl],
      ["username", usernameInput],
      ["msgInput", msgInput],
      ["connectBtn", connectBtn],
      ["sendBtn", sendBtn],
      ["roomsBtn", roomsBtn],
      ["roomWhoBtn", roomWhoBtn],
      ["joinRoomBtn", joinRoomBtn],
    ];

    const missing = required.filter(([, node]) => !node).map(([name]) => name);
    if (missing.length) {
      console.error("[chat] Faltan estos IDs en el HTML:", missing);
      if (statusEl) statusEl.textContent = "Error: faltan elementos en la página (revisa consola).";
      return;
    }

    // =========================
    // Estado
    // =========================
    let socket = null;
    let myUser = "";
    let currentRoom = "general";

    // =========================
    // UI helpers
    // =========================
    function setStatus(text) {
      statusEl.textContent = text;
    }

    function setRoom(room) {
      currentRoom = (room || "").trim() || "general";
      currentRoomEl.textContent = currentRoom;
    }

    function setRoomUsers(users) {
      roomUsersEl.innerHTML = "";
      const list = (users || []).slice().sort();

      if (!list.length) {
        roomUsersEl.innerHTML = `<div class="text-gray-400">(vacío)</div>`;
        return;
      }

      for (const u of list) {
        const item = document.createElement("div");
        item.className =
          "flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2";
        item.innerHTML = `<span class="inline-block h-2 w-2 rounded-full bg-emerald-400"></span><span>${u}</span>`;
        roomUsersEl.appendChild(item);
      }
    }

    function addLine(text, kind = "info", meta = {}) {
      const row = document.createElement("div");
      row.className = "w-full flex";

      const bubble = document.createElement("div");
      const isMine = meta.from && meta.from === myUser && kind === "message";
      row.classList.add(isMine ? "justify-end" : "justify-start");

      if (kind === "message") {
        bubble.className =
          "max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-sm border " +
          (isMine
            ? "bg-emerald-500 text-black border-emerald-400"
            : "bg-white/10 text-white border-white/10");
      } else if (kind === "error") {
        bubble.className =
          "w-full rounded-xl px-4 py-3 text-sm bg-red-500/15 text-red-200 border border-red-500/20";
      } else {
        bubble.className =
          "w-full rounded-xl px-4 py-3 text-sm bg-white/5 text-gray-200 border border-white/10";
      }

      bubble.textContent = text;
      row.appendChild(bubble);
      messagesEl.appendChild(row);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function fmtTime(ts) {
      if (!ts) return "";
      return new Date(ts * 1000).toLocaleTimeString();
    }

    function asString(v) {
      return typeof v === "string" ? v : undefined;
    }

    function asNumber(v) {
      return typeof v === "number" ? v : undefined;
    }

    function asStringArray(v) {
      return Array.isArray(v) && v.every((x) => typeof x === "string") ? v : undefined;
    }

    // =========================
    // WS helpers
    // =========================
    function send(obj) {
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      socket.send(JSON.stringify(obj));
    }

    function handleMessage(raw) {
      if (!raw || typeof raw !== "object" || typeof raw.type !== "string") {
        addLine(`[SERVER] ${JSON.stringify(raw)}`, "info");
        return;
      }

      const type = raw.type;

      if (type === "login_ok") {
        loginBox.classList.add("hidden");
        chatBox.classList.remove("hidden");

        setRoom(asString(raw.room));
        addLine("✔ Sesión iniciada", "info");
        setStatus("Listo.");

        // opcional: pedir usuarios de la sala apenas entras
        send({ type: "room_who" });
        return;
      }

      if (type === "info") {
        const message = asString(raw.message) || "(sin mensaje)";
        const room = asString(raw.room);
        if (room) setRoom(room);
        addLine(message, "info");
        return;
      }

      if (type === "error") {
        addLine(asString(raw.message) || "Error desconocido", "error");
        return;
      }

      if (type === "message") {
        const when = fmtTime(asNumber(raw.ts));
        const room = asString(raw.room) || "general";
        const from = asString(raw.from) || "?";
        const text = asString(raw.text) || "";
        addLine(`${from}: ${text} • ${when}`, "message", { from, room });
        return;
      }

      if (type === "rooms") {
        const rooms = asStringArray(raw.rooms) || [];
        addLine(`Salas: ${rooms.join(", ")}`, "info");
        return;
      }

      if (type === "room_users") {
        const room = asString(raw.room) || currentRoom;
        const users = asStringArray(raw.room_users) || [];
        setRoomUsers(users);
        addLine(`Usuarios en '${room}': ${users.join(", ")}`, "info");
        return;
      }

      // otros eventos opcionales
      if (type === "user_joined" || type === "user_left" || type === "user_joined_room" || type === "user_left_room") {
        const u = asString(raw.username) || "?";
        const r = asString(raw.room) || currentRoom;
        const ru = asStringArray(raw.room_users) || [];
        setRoomUsers(ru);
        addLine(`${u} • ${type.replaceAll("_", " ")} • (${r})`, "info");
        return;
      }

      addLine(`[SERVER] ${JSON.stringify(raw)}`, "info");
    }

    function setConnectButton(disabled) {
      connectBtn.disabled = disabled;
      connectBtn.classList.toggle("opacity-60", disabled);
      connectBtn.classList.toggle("cursor-not-allowed", disabled);
    }

    // =========================
    // Acciones UI
    // =========================
    function sendMessage() {
      const text = (msgInput.value || "").trim();
      if (!text) return;

      if (text === "/rooms") {
        send({ type: "rooms" });
        msgInput.value = "";
        return;
      }
      if (text === "/roomwho") {
        send({ type: "room_who" });
        msgInput.value = "";
        return;
      }
      if (text.startsWith("/room ")) {
        const room = text.slice(6).trim();
        if (room) send({ type: "join_room", room });
        msgInput.value = "";
        return;
      }
      if (text === "/exit") {
        socket && socket.close();
        msgInput.value = "";
        return;
      }

      send({ type: "message", text });
      msgInput.value = "";
    }

    // =========================
    // Eventos
    // =========================
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        messagesEl.innerHTML = "";
      });
    }

    connectBtn.addEventListener("click", () => {
      const username = (usernameInput.value || "").trim();

      if (!username) {
        setStatus("Ingresa un usuario.");
        return; // ✅ IMPORTANTÍSIMO
      }

      myUser = username;

      // ✅ Evita múltiples sockets
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        setStatus("Ya estás conectado (o conectando)...");
        return;
      }

      setStatus("Conectando...");
      setConnectButton(true);

      socket = new WebSocket(WS_URL);

      socket.addEventListener("open", () => {
        setStatus("Conectado. Iniciando sesión...");
        send({ type: "login", username });
      });

      socket.addEventListener("message", (event) => {
        try {
          handleMessage(JSON.parse(event.data));
        } catch {
          addLine("JSON inválido desde el servidor", "error");
        }
      });

      socket.addEventListener("error", () => {
        setStatus("Error de conexión.");
        setConnectButton(false);
      });

      socket.addEventListener("close", () => {
        setStatus("Desconectado.");
        setConnectButton(false);
      });
    });

    sendBtn.addEventListener("click", sendMessage);

    msgInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendMessage();
    });

    roomsBtn.addEventListener("click", () => send({ type: "rooms" }));
    roomWhoBtn.addEventListener("click", () => send({ type: "room_who" }));

    joinRoomBtn.addEventListener("click", () => {
      const room = prompt("Nombre de sala:");
      if (room) send({ type: "join_room", room });
    });

    // Estado inicial
    setStatus("Desconectado.");
  });
})();