const {
  STORAGE_KEY, MAX_BATCH_SIZE, SERIAL_RE, SUPPORTED_HOST_RE,
  initialState, now, cleanSerial, parseSerials, computeStats, appendSerials
} = window.FortuneSerialCore;

const { t, statusText, getLang, loadLang, setLang, applyI18n, buildLangSelect } = window.FortuneSerialI18n;

const $ = (id) => document.getElementById(id);

let state = initialState();
let activeTab = null;

const loadState = async () => {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  state = { ...initialState(), ...(data[STORAGE_KEY] || {}) };
};

const saveState = async () => {
  await chrome.storage.local.set({ [STORAGE_KEY]: state });
};

const getStats = () => computeStats(state.serials);

const getActiveBatch = () => {
  if (!state.activeBatchId) return null;
  return state.batches.find((batch) => batch.id === state.activeBatchId) || null;
};

const getItemsByIds = (ids) => {
  const idSet = new Set(ids);
  return state.serials.filter((item) => idSet.has(item.id));
};

const setMessage = (id, message, isError = false) => {
  const element = $(id);
  element.textContent = message || "";
  element.style.color = isError ? "#d14c47" : "";
};

const renderStats = () => {
  const stats = getStats();
  $("totalCount").textContent = stats.total;
  $("unusedCount").textContent = stats.unused;
  $("pendingCount").textContent = stats.pending;
  $("successCount").textContent = stats.success;
  $("failedCount").textContent = stats.failed;
};

const renderCurrentBatch = () => {
  const batch = getActiveBatch();
  const list = $("currentBatchList");
  list.textContent = "";

  if (!batch) {
    $("currentBatchLabel").textContent = t("label.none");
    return;
  }

  $("currentBatchLabel").textContent = `#${batch.number} · ${statusText(batch.status)}`;

  for (const item of getItemsByIds(batch.serialIds)) {
    const li = document.createElement("li");
    li.textContent = item.value;
    list.append(li);
  }
};

const renderGroups = () => {
  const unused = state.serials.filter((item) => item.status === "unused");
  const container = $("poolGroups");
  const groupCount = Math.ceil(unused.length / MAX_BATCH_SIZE);
  container.textContent = "";
  $("groupsLabel").textContent = t("groups.count", { groups: groupCount, count: unused.length });

  if (groupCount === 0) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = t("groups.empty");
    container.append(empty);
    return;
  }

  for (let i = 0; i < groupCount; i += 1) {
    const slice = unused.slice(i * MAX_BATCH_SIZE, (i + 1) * MAX_BATCH_SIZE);
    const details = document.createElement("details");
    details.className = "poolItem";
    if (i === 0) details.open = true;

    const summary = document.createElement("summary");
    summary.textContent = t("groups.summary", { n: i + 1, size: slice.length }) + (i === 0 ? t("groups.next") : "");

    const ol = document.createElement("ol");
    ol.className = "batchList";
    for (const item of slice) {
      const li = document.createElement("li");
      li.textContent = item.value;
      ol.append(li);
    }

    details.append(summary, ol);
    container.append(details);
  }
};

const renderPool = () => {
  const filter = $("statusFilter").value;
  const list = $("poolList");
  list.textContent = "";

  const items = state.serials
    .filter((item) => filter === "all" || item.status === filter)
    .slice(0, 120);

  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = t("pool.empty");
    list.append(empty);
    return;
  }

  for (const item of items) {
    const row = document.createElement("div");
    row.className = "poolItem";

    const serial = document.createElement("span");
    serial.className = "serial";
    serial.title = item.value;
    serial.textContent = item.value;

    const badge = document.createElement("span");
    badge.className = `badge badge-${item.status}`;
    badge.textContent = statusText(item.status);

    row.append(serial, badge);
    list.append(row);
  }
};

const renderButtons = () => {
  const stats = getStats();
  const batch = getActiveBatch();
  const canUsePage = isSupportedTab(activeTab);
  const hasPendingBatch = Boolean(batch && batch.status === "pending");

  $("fillNextButton").disabled = !canUsePage || hasPendingBatch || stats.unused === 0;
  $("retryFailedButton").disabled = !canUsePage || hasPendingBatch || stats.failed === 0;
  $("markSuccessButton").disabled = !batch || batch.status === "success";
  $("markFailedButton").disabled = !batch || batch.status === "failed";
  $("releasePendingButton").disabled = stats.pending === 0;
};

const renderPageStatus = () => {
  const element = $("pageStatus");
  if (!activeTab?.url) {
    element.textContent = t("page.noTab");
    return;
  }

  if (isSupportedTab(activeTab)) {
    element.textContent = t("page.supported");
    return;
  }

  element.textContent = t("page.unsupported");
};

const isSupportedTab = (tab) => {
  if (!tab?.url) return false;
  try {
    return SUPPORTED_HOST_RE.test(new URL(tab.url).hostname);
  } catch (_error) {
    return false;
  }
};

const render = () => {
  document.documentElement.lang = getLang();
  applyI18n();
  renderPageStatus();
  renderStats();
  renderCurrentBatch();
  renderGroups();
  renderPool();
  renderButtons();
};

const queryActiveTab = async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTab = tabs[0] || null;
};

const ensureContentScript = async () => {
  if (!activeTab?.id) {
    throw new Error(t("msg.noTab"));
  }

  try {
    await chrome.tabs.sendMessage(activeTab.id, { type: "FORTUNE_SERIAL_FILLER_PING" });
    return;
  } catch (_error) {
    await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      files: ["i18n.js", "serial-core.js", "page-dom.js", "content.js"]
    });
  }
};

const sendFillMessage = async (serials) => {
  await ensureContentScript();
  return chrome.tabs.sendMessage(activeTab.id, {
    type: "FORTUNE_SERIAL_FILLER_FILL",
    serials
  });
};

const createBatch = (items, mode) => {
  const batchId = crypto.randomUUID();
  const timestamp = now();
  const batch = {
    id: batchId,
    number: state.nextBatchNumber,
    serialIds: items.map((item) => item.id),
    status: "pending",
    mode,
    createdAt: timestamp,
    updatedAt: timestamp,
    pageUrl: activeTab?.url || ""
  };

  state.nextBatchNumber += 1;
  state.activeBatchId = batchId;
  state.batches.push(batch);

  for (const item of items) {
    item.status = "pending";
    item.batchId = batchId;
    item.updatedAt = timestamp;
  }

  return batch;
};

const fillItems = async (items, mode) => {
  const activeBatch = getActiveBatch();
  if (activeBatch?.status === "pending") {
    setMessage("actionResult", t("msg.batchPending"), true);
    return;
  }

  if (items.length === 0) {
    setMessage("actionResult", t("msg.nothingToFill"), true);
    return;
  }

  const response = await sendFillMessage(items.map((item) => item.value));
  if (!response?.ok) {
    throw new Error(response?.error || t("msg.fillFailed"));
  }

  if (response.fillCount < items.length) {
    throw new Error(t("msg.notEnoughInputs", { count: response.inputCount }));
  }

  const batch = createBatch(items, mode);
  await saveState();
  setMessage("actionResult", t("msg.filled", { n: batch.number }));
  render();
};

const addSerialsToPool = async (values) => {
  const result = appendSerials(state.serials, values);
  await saveState();
  return result;
};

const handleImport = async () => {
  const values = parseSerials($("importText").value);
  if (values.length === 0) {
    setMessage("importResult", t("msg.noSerials"), true);
    return;
  }

  const { added, duplicate } = await addSerialsToPool(values);
  setMessage("importResult", t("msg.imported", { added, duplicate }));
  $("importText").value = "";
  render();
};

const handleManualAdd = async () => {
  const input = $("manualSerial");
  const value = cleanSerial(input.value);

  if (!SERIAL_RE.test(value)) {
    setMessage("importResult", t("msg.invalidSerial"), true);
    return;
  }

  const { duplicate } = await addSerialsToPool([value]);
  if (duplicate) {
    setMessage("importResult", t("msg.alreadyInPool", { value }), true);
    return;
  }

  input.value = "";
  setMessage("importResult", t("msg.addedOne", { value }));
  render();
};

const markActiveBatch = async (status) => {
  const batch = getActiveBatch();
  if (!batch) return;

  const timestamp = now();
  batch.status = status;
  batch.updatedAt = timestamp;

  for (const item of getItemsByIds(batch.serialIds)) {
    item.status = status;
    item.updatedAt = timestamp;
  }

  await saveState();
  setMessage("actionResult", t("msg.marked", { n: batch.number, status: statusText(status) }));
  render();
};

const releasePending = async () => {
  const timestamp = now();
  for (const item of state.serials) {
    if (item.status === "pending") {
      item.status = "unused";
      item.batchId = null;
      item.updatedAt = timestamp;
    }
  }

  for (const batch of state.batches) {
    if (batch.status === "pending") {
      batch.status = "skipped";
      batch.updatedAt = timestamp;
    }
  }

  state.activeBatchId = null;
  await saveState();
  setMessage("actionResult", t("msg.released"));
  render();
};

const exportData = () => {
  const payload = JSON.stringify(state, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fortunemeets-serials-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const clearUnused = async () => {
  if (!confirm(t("confirm.clearUnused"))) {
    return;
  }

  state.serials = state.serials.filter((item) => item.status !== "unused");
  await saveState();
  setMessage("actionResult", t("msg.clearedUnused"));
  render();
};

const resetAll = async () => {
  if (!confirm(t("confirm.reset"))) {
    return;
  }

  state = initialState();
  await saveState();
  setMessage("actionResult", t("msg.resetDone"));
  render();
};

const bindEvents = () => {
  $("importButton").addEventListener("click", handleImport);
  $("clearImportButton").addEventListener("click", () => {
    $("importText").value = "";
    setMessage("importResult", "");
  });
  $("manualAddButton").addEventListener("click", handleManualAdd);
  $("manualSerial").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleManualAdd();
    }
  });
  $("fillNextButton").addEventListener("click", () => {
    const items = state.serials.filter((item) => item.status === "unused").slice(0, MAX_BATCH_SIZE);
    fillItems(items, "next").catch((error) => {
      setMessage("actionResult", error.message, true);
      render();
    });
  });
  $("retryFailedButton").addEventListener("click", () => {
    const items = state.serials.filter((item) => item.status === "failed").slice(0, MAX_BATCH_SIZE);
    fillItems(items, "retry").catch((error) => {
      setMessage("actionResult", error.message, true);
      render();
    });
  });
  $("markSuccessButton").addEventListener("click", () => markActiveBatch("success"));
  $("markFailedButton").addEventListener("click", () => markActiveBatch("failed"));
  $("releasePendingButton").addEventListener("click", releasePending);
  $("exportButton").addEventListener("click", exportData);
  $("clearUnusedButton").addEventListener("click", clearUnused);
  $("resetButton").addEventListener("click", resetAll);
  $("statusFilter").addEventListener("change", renderPool);
  $("langSelect").addEventListener("change", async (event) => {
    await setLang(event.target.value);
    setMessage("importResult", "");
    setMessage("actionResult", "");
    render();
  });
};

const init = async () => {
  bindEvents();
  await Promise.all([loadState(), queryActiveTab(), loadLang()]);
  buildLangSelect($("langSelect"));
  render();
};

init().catch((error) => {
  setMessage("actionResult", error?.message || String(error), true);
});
