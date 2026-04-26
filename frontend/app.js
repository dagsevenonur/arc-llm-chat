const API_BASE = "http://127.0.0.1:7860/api";
const STORAGE_KEY = "arc-ai-chat.desktop.state.v1";
const SETTINGS_KEY = "arc-ai-chat.desktop.settings.v1";

const els = {
  presenceDot: document.getElementById("presence-dot"),
  presenceText: document.getElementById("presence-text"),
  backendStatus: document.getElementById("backend-status"),
  llamaStatus: document.getElementById("llama-status"),
  activeModel: document.getElementById("active-model"),
  activeGpu: document.getElementById("active-gpu"),
  heroModelChip: document.getElementById("hero-model-chip"),
  conversationList: document.getElementById("conversation-list"),
  conversationCount: document.getElementById("conversation-count"),
  chatTitle: document.getElementById("chat-title"),
  latencyChip: document.getElementById("latency-chip"),
  tokenChip: document.getElementById("token-chip"),
  temperatureChip: document.getElementById("temperature-chip"),
  messages: document.getElementById("messages"),
  heroPanel: document.getElementById("hero-panel"),
  input: document.getElementById("input"),
  sendButton: document.getElementById("send-button"),
  temperatureInput: document.getElementById("temperature-input"),
  temperatureValue: document.getElementById("temperature-value"),
  maxTokensInput: document.getElementById("max-tokens-input"),
  sessionMeta: document.getElementById("session-meta"),
  backendEndpoint: document.getElementById("backend-endpoint"),
  clearChatButton: document.getElementById("clear-chat-button"),
  restartBackendButton: document.getElementById("restart-backend-button"),
  newChatButton: document.getElementById("new-chat-button"),
  promptGrid: document.getElementById("prompt-grid"),
  toastStack: document.getElementById("toast-stack"),
  refreshStatus: document.getElementById("refresh-status"),
  minimizeButton: document.getElementById("minimize-button"),
  maximizeButton: document.getElementById("maximize-button"),
  closeButton: document.getElementById("close-button"),
};

const defaultSettings = {
  temperature: 0.7,
  maxTokens: 512,
};

const state = {
  busy: false,
  health: null,
  settings: loadSettings(),
  conversations: loadConversations(),
  currentConversationId: null,
};

bootstrap();

function bootstrap() {
  document.body.classList.toggle("is-browser", !window.desktopShell);
  state.currentConversationId = resolveCurrentConversationId();
  syncSettingsToControls();
  bindEvents();
  renderAll();
  refreshHealth();
  loadModels();
  window.setInterval(refreshHealth, 10000);
  window.setInterval(loadModels, 30000);
}

function bindEvents() {
  els.sendButton.addEventListener("click", sendMessage);
  els.newChatButton.addEventListener("click", () => {
    createConversation();
    renderAll();
    focusInput();
  });
  els.clearChatButton.addEventListener("click", clearCurrentConversation);
  els.restartBackendButton.addEventListener("click", restartBackend);
  els.refreshStatus.addEventListener("click", async () => {
    await Promise.all([refreshHealth(), loadModels()]);
    showToast("Durum yenilendi", "Backend ve model bilgisi tekrar kontrol edildi.");
  });

  els.input.addEventListener("input", autoResizeInput);
  els.input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });

  els.temperatureInput.addEventListener("input", () => {
    state.settings.temperature = Number(els.temperatureInput.value);
    persistSettings();
    syncSettingsToControls();
  });

  els.maxTokensInput.addEventListener("change", () => {
    const nextValue = clampNumber(Number(els.maxTokensInput.value), 64, 4096, 512);
    state.settings.maxTokens = nextValue;
    persistSettings();
    syncSettingsToControls();
  });

  els.conversationList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-conversation-id]");
    if (!button) return;
    state.currentConversationId = button.dataset.conversationId;
    persistConversations();
    renderAll();
  });

  els.promptGrid.addEventListener("click", (event) => {
    const button = event.target.closest(".prompt-chip");
    if (!button) return;
    els.input.value = button.textContent.trim();
    autoResizeInput();
    focusInput();
  });

  els.messages.addEventListener("click", async (event) => {
    const copyButton = event.target.closest(".copy-code-button");
    if (!copyButton) return;
    const code = copyButton.closest(".code-block")?.querySelector("code")?.innerText ?? "";
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      copyButton.textContent = "Kopyalandi";
      window.setTimeout(() => {
        copyButton.textContent = "Kopyala";
      }, 1400);
    } catch {
      showToast("Kopyalama basarisiz", "Panoya yazarken bir sorun olustu.");
    }
  });

  if (window.desktopShell) {
    els.minimizeButton.addEventListener("click", () => window.desktopShell.minimize());
    els.maximizeButton.addEventListener("click", () => window.desktopShell.maximize());
    els.closeButton.addEventListener("click", () => window.desktopShell.close());
    window.desktopShell.onMaximizedChange?.((maximized) => {
      els.maximizeButton.classList.toggle("is-maximized", Boolean(maximized));
    });
  }
}

async function refreshHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.health = await response.json();
    renderHealth();
  } catch (error) {
    state.health = null;
    renderHealth();
    console.error(error);
  }
}

async function loadModels() {
  try {
    const response = await fetch(`${API_BASE}/models`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!state.health) state.health = {};
    state.health.model = data.active;
    renderHealth();
  } catch (error) {
    console.error(error);
  }
}

async function restartBackend() {
  if (!window.desktopShell?.restartBackend) {
    showToast("Desktop shell gerekli", "Backend yenileme yalnizca masaustu uygulamasinda calisir.");
    return;
  }

  els.restartBackendButton.disabled = true;
  els.restartBackendButton.textContent = "Yenileniyor";

  try {
    const restarted = await window.desktopShell.restartBackend();
    if (!restarted) throw new Error("Restart sonucu alinmadi");
    await Promise.all([refreshHealth(), loadModels()]);
    showToast("Backend yenilendi", "FastAPI ve llama.cpp baglantisi tekrar baslatildi.");
  } catch (error) {
    showToast("Backend yenilenemedi", error.message);
  } finally {
    els.restartBackendButton.disabled = false;
    els.restartBackendButton.textContent = "Backend'i yenile";
  }
}

async function sendMessage() {
  const text = els.input.value.trim();
  if (!text || state.busy) return;

  const conversation = getCurrentConversation();
  if (!conversation) return;

  const userMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content: text,
    timestamp: Date.now(),
  };

  const pendingMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: "",
    timestamp: Date.now(),
    pending: true,
  };

  conversation.messages.push(userMessage, pendingMessage);
  updateConversationTitle(conversation, text);
  touchConversation(conversation);
  persistConversations();

  state.busy = true;
  els.sendButton.disabled = true;
  els.input.value = "";
  autoResizeInput();
  renderAll();
  focusInput();

  const startedAt = performance.now();

  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: conversation.messages
          .filter((message) => !message.pending)
          .map(({ role, content }) => ({ role, content })),
        max_tokens: state.settings.maxTokens,
        temperature: state.settings.temperature,
      }),
    });

    if (!response.ok) {
      const detail = await extractError(response);
      throw new Error(detail);
    }

    const data = await response.json();
    const replyText = data.choices?.[0]?.message?.content?.trim() || "(bos yanit)";
    const elapsed = ((performance.now() - startedAt) / 1000).toFixed(1);
    const usage = data.usage;
    const stats = usage?.completion_tokens
      ? `${usage.completion_tokens} token · ${Math.max(1, Math.round(usage.completion_tokens / Math.max(0.1, Number(elapsed))))} t/s · ${elapsed}s`
      : `${elapsed}s`;

    Object.assign(pendingMessage, {
      content: replyText,
      stats,
      pending: false,
      timestamp: Date.now(),
    });

    els.latencyChip.textContent = `Son yanit ${elapsed}s`;
  } catch (error) {
    Object.assign(pendingMessage, {
      content: `Baglanti hatasi: ${error.message}`,
      stats: "Yanit alinamadi",
      pending: false,
      timestamp: Date.now(),
      isError: true,
    });

    els.latencyChip.textContent = "Baglanti sorunu";
    showToast("Mesaj gonderilemedi", error.message);
  } finally {
    state.busy = false;
    els.sendButton.disabled = false;
    touchConversation(conversation);
    persistConversations();
    renderAll();
    focusInput();
  }
}

function renderAll() {
  renderConversationList();
  renderConversationMeta();
  renderMessages();
  renderHealth();
}

function renderConversationList() {
  const conversations = [...state.conversations].sort((a, b) => b.updatedAt - a.updatedAt);
  els.conversationCount.textContent = String(conversations.length);

  if (!conversations.length) {
    els.conversationList.innerHTML = "";
    return;
  }

  els.conversationList.innerHTML = conversations
    .map((conversation) => {
      const isActive = conversation.id === state.currentConversationId;
      const preview = conversation.messages.find((message) => message.role === "assistant" && !message.pending)?.content
        || conversation.messages[0]?.content
        || "Bos oturum";

      return `
        <button class="conversation-item ${isActive ? "conversation-item--active" : ""}" type="button" data-conversation-id="${conversation.id}">
          <strong>${escapeHtml(conversation.title)}</strong>
          <span>${escapeHtml(truncate(preview, 68))}</span>
        </button>
      `;
    })
    .join("");
}

function renderConversationMeta() {
  const conversation = getCurrentConversation();
  const messages = conversation?.messages ?? [];
  const visibleMessages = messages.filter((message) => !message.pending);

  els.chatTitle.textContent = conversation?.title ?? "Yeni chat";
  els.sessionMeta.textContent = `${visibleMessages.length} mesaj`;
  els.tokenChip.textContent = `${state.settings.maxTokens} token`;
  els.temperatureChip.textContent = `${state.settings.temperature.toFixed(1)} temp`;
}

function renderMessages() {
  const conversation = getCurrentConversation();
  if (!conversation || !conversation.messages.length) {
    els.messages.innerHTML = `
      <div class="empty-state">
        <p class="eyebrow">Ready</p>
        <h3>Yeni bir yerel sohbet baslatin.</h3>
        <p>
          Bu masaustu arayuzu mevcut backend ile dogrudan konusur. Oturumlar tarayici yerine uygulama icinde yerel olarak saklanir ve tasarim dili Stitch projesindeki koyu workspace yaklasimini izler.
        </p>
      </div>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const message of conversation.messages) {
    fragment.appendChild(renderMessageRow(message));
  }

  els.messages.innerHTML = "";
  els.messages.appendChild(fragment);
  els.messages.scrollTop = els.messages.scrollHeight;
}

function renderMessageRow(message) {
  const row = document.createElement("article");
  row.className = `message-row message-row--${message.role === "user" ? "user" : "assistant"}`;

  if (message.role !== "user") {
    row.appendChild(createAvatar("AI", "avatar avatar--assistant"));
  }

  const messageCard = document.createElement("div");
  messageCard.className = "message";

  const meta = document.createElement("div");
  meta.className = "message__meta";
  meta.innerHTML = `
    <span class="message__role">${message.role === "user" ? "Operator" : "Assistant"}</span>
    <span class="message__time">${formatTime(message.timestamp)}</span>
  `;
  messageCard.appendChild(meta);

  const body = document.createElement("div");
  body.className = "message__body";
  if (message.pending) {
    body.innerHTML = `
      <div class="thinking" aria-label="Yaziyor">
        <span></span><span></span><span></span>
      </div>
    `;
  } else {
    body.appendChild(formatRichContent(message.content));
  }
  messageCard.appendChild(body);

  if (message.stats) {
    const stats = document.createElement("div");
    stats.className = "message__stats";
    stats.textContent = message.stats;
    messageCard.appendChild(stats);
  }

  row.appendChild(messageCard);

  if (message.role === "user") {
    row.appendChild(createAvatar("YOU", "avatar"));
  }

  return row;
}

function createAvatar(label, className) {
  const avatar = document.createElement("div");
  avatar.className = className;
  avatar.textContent = label;
  return avatar;
}

function renderHealth() {
  const healthy = state.health?.backend === "ok" && state.health?.llama_server === "ok";

  els.presenceDot.className = `presence__dot ${healthy ? "presence__dot--ok" : state.health ? "presence__dot--error" : ""}`;
  els.presenceText.textContent = healthy ? "Backend bagli" : "Backend bekleniyor";
  els.backendStatus.textContent = state.health?.backend === "ok" ? "Hazir" : "Ulasilamiyor";
  els.llamaStatus.textContent = healthy ? "Hazir" : (state.health?.llama_server || "Kapali");
  els.activeModel.textContent = state.health?.model || "Bilinmiyor";
  els.activeGpu.textContent = state.health?.gpu || "Intel Arc B580";
  els.heroModelChip.textContent = state.health?.model || "Model bilgisi bekleniyor";
  els.backendEndpoint.textContent = API_BASE;
}

function syncSettingsToControls() {
  els.temperatureInput.value = state.settings.temperature.toFixed(1);
  els.temperatureValue.textContent = state.settings.temperature.toFixed(1);
  els.maxTokensInput.value = String(state.settings.maxTokens);
  els.tokenChip.textContent = `${state.settings.maxTokens} token`;
  els.temperatureChip.textContent = `${state.settings.temperature.toFixed(1)} temp`;
}

function createConversation() {
  const conversation = {
    id: crypto.randomUUID(),
    title: "Yeni chat",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  };

  state.conversations.unshift(conversation);
  state.currentConversationId = conversation.id;
  persistConversations();
  return conversation;
}

function clearCurrentConversation() {
  const conversation = getCurrentConversation();
  if (!conversation) return;
  conversation.messages = [];
  conversation.title = "Yeni chat";
  touchConversation(conversation);
  persistConversations();
  renderAll();
  els.latencyChip.textContent = "Hazir";
}

function getCurrentConversation() {
  return state.conversations.find((conversation) => conversation.id === state.currentConversationId) ?? null;
}

function resolveCurrentConversationId() {
  if (state.conversations.length === 0) {
    return createConversation().id;
  }
  return state.conversations[0].id;
}

function updateConversationTitle(conversation, text) {
  if (conversation.title !== "Yeni chat" && conversation.messages.length > 2) return;
  conversation.title = truncate(text.replace(/\s+/g, " ").trim(), 40);
}

function touchConversation(conversation) {
  conversation.updatedAt = Date.now();
}

function loadConversations() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistConversations() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.conversations));
}

function loadSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    return {
      temperature: clampNumber(Number(parsed.temperature), 0, 1.2, defaultSettings.temperature),
      maxTokens: clampNumber(Number(parsed.maxTokens), 64, 4096, defaultSettings.maxTokens),
    };
  } catch {
    return { ...defaultSettings };
  }
}

function persistSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

function autoResizeInput() {
  els.input.style.height = "auto";
  els.input.style.height = `${Math.min(els.input.scrollHeight, 180)}px`;
}

function focusInput() {
  els.input.focus();
}

function showToast(title, body) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(body)}</span>`;
  els.toastStack.appendChild(toast);
  window.setTimeout(() => toast.remove(), 3200);
}

function formatRichContent(text) {
  const fragment = document.createDocumentFragment();
  const blocks = [];
  const marked = text.replace(/```([^\n`]*)\n?([\s\S]*?)```/g, (_, language, code) => {
    const token = `__CODE_BLOCK_${blocks.length}__`;
    blocks.push({
      language: (language || "text").trim() || "text",
      code,
    });
    return token;
  });

  const pieces = marked.split(/(__CODE_BLOCK_\d+__)/g).filter(Boolean);
  for (const piece of pieces) {
    const codeMatch = piece.match(/__CODE_BLOCK_(\d+)__/);
    if (codeMatch) {
      const block = blocks[Number(codeMatch[1])];
      fragment.appendChild(renderCodeBlock(block.language, block.code));
      continue;
    }

    const paragraphHtml = escapeHtml(piece)
      .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    const wrapper = document.createElement("div");
    wrapper.innerHTML = paragraphHtml
      .split(/\n{2,}/)
      .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
      .join("");

    while (wrapper.firstChild) {
      fragment.appendChild(wrapper.firstChild);
    }
  }

  return fragment;
}

function renderCodeBlock(language, code) {
  const shell = document.createElement("section");
  shell.className = "code-block";
  shell.innerHTML = `
    <div class="code-block__header">
      <span>${escapeHtml(language)}</span>
      <button class="copy-code-button" type="button">Kopyala</button>
    </div>
    <pre><code>${escapeHtml(code.trim())}</code></pre>
  `;
  return shell;
}

async function extractError(response) {
  try {
    const data = await response.json();
    return data?.detail || `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}

function truncate(text, limit) {
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

function formatTime(timestamp) {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function clampNumber(value, min, max, fallback) {
  if (Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}
