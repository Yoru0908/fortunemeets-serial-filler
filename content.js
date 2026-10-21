(() => {
  const BUTTON_ID = "__fortune_serial_filler_button__";

  const {
    STORAGE_KEY, MAX_BATCH_SIZE, SERIAL_RE,
    initialState, now, cleanSerial, parseSerials, computeStats, appendSerials,
    getActiveBatch: getBatch, getItemsByIds: getItems, createBatchInState, syncRegisteredSerials
  } = window.FortuneSerialCore;

  const {
    PANEL_ID, findContinueButton, findSubmitButton,
    isConfirmationPage, isInputPage, detectPageError, scanRegisteredSerialsOnPage, fillInputs
  } = window.FortuneSerialDom;

  const { t, statusText, loadLang, setLang, onLangChange, applyI18n, buildLangSelect } = window.FortuneSerialI18n;

  let state = initialState();
  let autoModeInterval = null;

  const setPanelMessage = (message, isError = false) => {
    const messageElement = document.querySelector(`#${PANEL_ID} [data-fsf-message]`);
    if (!messageElement) return;
    messageElement.textContent = message || "";
    messageElement.style.color = isError ? "#d14c47" : "";
  };

  const loadState = async () => {
    try {
      const data = await chrome.storage.local.get(STORAGE_KEY);
      state = { ...initialState(), ...(data[STORAGE_KEY] || {}) };
      return true;
    } catch (_error) {
      setPanelMessage(t("msg.extUpdated"), true);
      return false;
    }
  };

  const saveState = async () => {
    await chrome.storage.local.set({ [STORAGE_KEY]: state });
  };

  const getActiveBatch = () => getBatch(state);
  const getItemsByIds = (ids) => getItems(state, ids);
  const createBatch = (items, mode) => createBatchInState(state, items, mode, window.location.href);

  const renderSerialList = (container, items) => {
    container.textContent = "";
    for (const item of items) {
      const li = document.createElement("li");
      li.textContent = item.value;
      container.append(li);
    }
  };

  const renderPoolGroups = (panel, unused) => {
    const groupsContainer = panel.querySelector("[data-fsf-groups]");
    const groupsLabel = panel.querySelector("[data-fsf-groups-label]");
    groupsContainer.textContent = "";

    const groupCount = Math.ceil(unused.length / MAX_BATCH_SIZE);
    groupsLabel.textContent = t("groups.panelLabel", { groups: groupCount, count: unused.length });

    for (let i = 0; i < groupCount; i += 1) {
      const slice = unused.slice(i * MAX_BATCH_SIZE, (i + 1) * MAX_BATCH_SIZE);
      const details = document.createElement("details");
      details.className = "__fsf_group";
      if (i === 0) details.open = true;

      const summary = document.createElement("summary");
      summary.textContent = t("groups.summary", { n: i + 1, size: slice.length }) + (i === 0 ? t("groups.next") : "");

      const ol = document.createElement("ol");
      ol.className = "__fsf_batch";
      renderSerialList(ol, slice);

      details.append(summary, ol);
      groupsContainer.append(details);
    }
  };

  const renderPanel = () => {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;

    applyI18n(panel);
    const stats = computeStats(state.serials);
    const unused = state.serials.filter((item) => item.status === "unused");
    const batch = getActiveBatch();
    const hasPendingBatch = Boolean(batch && batch.status === "pending");
    const batchItems = batch ? getItemsByIds(batch.serialIds) : [];

    panel.querySelector("[data-fsf-total]").textContent = stats.total;
    panel.querySelector("[data-fsf-unused]").textContent = stats.unused;
    panel.querySelector("[data-fsf-pending]").textContent = stats.pending;
    panel.querySelector("[data-fsf-failed-count]").textContent = stats.failed;
    panel.querySelector("[data-fsf-batch-label]").textContent = batch
      ? `#${batch.number} · ${statusText(batch.status)}`
      : t("label.none");

    renderSerialList(panel.querySelector("[data-fsf-batch-list]"), batchItems);
    renderPoolGroups(panel, unused);

    panel.querySelector("[data-fsf-fill-next]").disabled = hasPendingBatch || stats.unused === 0 || state.autoMode;
    panel.querySelector("[data-fsf-retry]").disabled = hasPendingBatch || stats.failed === 0 || state.autoMode;
    panel.querySelector("[data-fsf-success]").disabled = !batch || batch.status === "success" || state.autoMode;
    panel.querySelector("[data-fsf-mark-failed]").disabled = !batch || batch.status === "failed" || state.autoMode;
    panel.querySelector("[data-fsf-release]").disabled = stats.pending === 0 || state.autoMode;
    panel.querySelector("[data-fsf-clear-unused]").disabled = stats.unused === 0 || state.autoMode;

    const autoModeButton = panel.querySelector("[data-fsf-auto-mode]");
    autoModeButton.textContent = t(state.autoMode ? "btn.autoStop" : "btn.autoStart");
    autoModeButton.className = state.autoMode
      ? "__fsf_btn __fsf_btn_danger"
      : "__fsf_btn __fsf_btn_warning";
  };

  const handleImport = async () => {
    const textarea = document.querySelector(`#${PANEL_ID} [data-fsf-import]`);
    const values = parseSerials(textarea.value);
    if (values.length === 0) {
      setPanelMessage(t("msg.noSerials"), true);
      return;
    }

    const { added, duplicate } = appendSerials(state.serials, values);
    await saveState();
    textarea.value = "";
    setPanelMessage(t("msg.imported", { added, duplicate }));
    renderPanel();
  };

  const handleManualAdd = async () => {
    const input = document.querySelector(`#${PANEL_ID} [data-fsf-manual-input]`);
    const value = cleanSerial(input.value);

    if (!SERIAL_RE.test(value)) {
      setPanelMessage(t("msg.invalidSerial"), true);
      return;
    }

    const { duplicate } = appendSerials(state.serials, [value]);
    if (duplicate) {
      setPanelMessage(t("msg.alreadyInPool", { value }), true);
      return;
    }

    await saveState();
    input.value = "";
    setPanelMessage(t("msg.addedOne", { value }));
    renderPanel();
  };

  const syncFromHistoryPage = async () => {
    const synced = syncRegisteredSerials(state, scanRegisteredSerialsOnPage());
    if (synced > 0) await saveState();
    return synced;
  };

  const fillItems = async (items, mode) => {
    if (state.autoMode) {
      await stopAutoMode();
    }

    const activeBatch = getActiveBatch();
    if (activeBatch?.status === "pending") {
      setPanelMessage(t("msg.batchPending"), true);
      return;
    }

    if (items.length === 0) {
      setPanelMessage(t("msg.nothingToFill"), true);
      return;
    }

    const result = await fillInputs(items.map((item) => item.value));
    if (result.fillCount < items.length) {
      setPanelMessage(t("msg.notEnoughInputs", { count: result.inputCount }), true);
      return;
    }

    const batch = createBatch(items, mode);
    await saveState();
    setPanelMessage(t("msg.filled", { n: batch.number }));
    renderPanel();
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
    setPanelMessage(t("msg.marked", { n: batch.number, status: statusText(status) }));
    renderPanel();
  };

  const clearUnused = async () => {
    if (!confirm(t("confirm.clearUnused"))) return;
    state.serials = state.serials.filter((item) => item.status !== "unused");
    await saveState();
    setPanelMessage(t("msg.clearedUnused"));
    renderPanel();
  };

  const resetAll = async () => {
    if (!confirm(t("confirm.reset"))) return;
    state = initialState();
    await saveState();
    setPanelMessage(t("msg.resetDone"));
    renderPanel();
  };

  const clickPageButton = async (finder) => {
    const button = finder();
    if (!button) return false;
    button.click();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return true;
  };

  const stopAutoMode = async () => {
    if (autoModeInterval) {
      clearInterval(autoModeInterval);
      autoModeInterval = null;
    }
    state.autoMode = false;
    await saveState();
    setPanelMessage(t("msg.autoStopped"));
    renderPanel();
  };

  const autoCycle = async () => {
    if (!state.autoMode) return;

    const unused = state.serials.filter((item) => item.status === "unused");
    const activeBatch = getActiveBatch();
    const pageError = detectPageError();

    if (pageError && !isConfirmationPage()) {
      if (activeBatch?.status === "pending") {
        await markActiveBatch("failed");
      }
      await stopAutoMode();
      setPanelMessage(t("msg.autoPageError", { error: pageError }), true);
      return;
    }

    if (isConfirmationPage()) {
      if (activeBatch?.status === "pending") {
        await markActiveBatch("success");
      }

      const continueClicked = await clickPageButton(findContinueButton);
      if (!continueClicked) {
        await stopAutoMode();
        setPanelMessage(t("msg.autoNoContinue"), true);
      }
      return;
    }

    if (activeBatch?.status === "pending") {
      if (activeBatch.mode !== "auto") {
        await stopAutoMode();
        return;
      }
      if (Date.now() - new Date(activeBatch.createdAt).getTime() < 2500) {
        return;
      }
      await markActiveBatch("failed");
      await stopAutoMode();
      setPanelMessage(t("msg.autoTimeout"), true);
      return;
    }

    if (!isInputPage()) return;

    if (unused.length === 0) {
      await stopAutoMode();
      setPanelMessage(t("msg.autoDone"));
      return;
    }

    const items = unused.slice(0, MAX_BATCH_SIZE);
    const result = await fillInputs(items.map((item) => item.value));

    // Same rule as manual filling: a partial fill is never submitted. Stop on the first problem, never retry.
    if (result.fillCount < items.length) {
      await stopAutoMode();
      setPanelMessage(result.fillCount === 0 ? t("msg.autoNoInputs") : t("msg.notEnoughInputs", { count: result.inputCount }), true);
      return;
    }

    const batch = createBatch(items, "auto");
    await saveState();
    setPanelMessage(t("msg.autoFilled", { n: batch.number }));

    await new Promise((resolve) => setTimeout(resolve, 500));
    const submitted = await clickPageButton(findSubmitButton);

    if (!submitted) {
      await stopAutoMode();
      setPanelMessage(t("msg.autoNoSubmit"), true);
    }
  };

  const startAutoMode = async () => {
    if (state.autoMode) {
      await stopAutoMode();
      return;
    }

    if (state.serials.filter((item) => item.status === "unused").length === 0) {
      setPanelMessage(t("msg.autoNoUnused"), true);
      return;
    }

    if (!confirm(t("confirm.autoStart"))) return;

    state.autoMode = true;
    await saveState();
    setPanelMessage(t("msg.autoStarted"));
    renderPanel();

    if (!autoModeInterval) {
      autoModeInterval = setInterval(autoCycle, 3000);
      await autoCycle();
    }
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
    setPanelMessage(t("msg.released"));
    renderPanel();
  };

  const createPanel = async () => {
    if (!document.body) return;
    await loadLang();
    document.getElementById(BUTTON_ID)?.remove();
    document.getElementById(PANEL_ID)?.remove();

    const button = document.createElement("button");
    button.id = BUTTON_ID;
    button.type = "button";
    button.textContent = "Serial";

    const panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <div class="__fsf_header">
        <h2 class="__fsf_title">Serial Filler <span class="__fsf_ver">v${chrome.runtime.getManifest().version}</span></h2>
        <div class="__fsf_header_tools">
          <select class="__fsf_lang" data-fsf-lang data-i18n-aria-label="label.language"></select>
          <button class="__fsf_close" type="button" data-fsf-close aria-label="close">&times;</button>
        </div>
      </div>
      <div class="__fsf_body">
        <div class="__fsf_stats">
          <div class="__fsf_stat"><strong data-fsf-total>0</strong><span data-i18n="stat.total"></span></div>
          <div class="__fsf_stat"><strong data-fsf-unused>0</strong><span data-i18n="stat.unused"></span></div>
          <div class="__fsf_stat"><strong data-fsf-pending>0</strong><span data-i18n="stat.pending"></span></div>
          <div class="__fsf_stat"><strong data-fsf-failed-count>0</strong><span data-i18n="stat.failed"></span></div>
        </div>
        <textarea data-fsf-import spellcheck="false" data-i18n-placeholder="placeholder.import"></textarea>
        <div class="__fsf_row">
          <button class="__fsf_btn" type="button" data-fsf-import-button data-i18n="btn.import"></button>
          <button class="__fsf_btn" type="button" data-fsf-clear data-i18n="btn.clearInput"></button>
        </div>
        <div class="__fsf_manual_row">
          <input class="__fsf_input" type="text" data-fsf-manual-input spellcheck="false" autocomplete="off" data-i18n-placeholder="placeholder.manual">
          <button class="__fsf_btn" type="button" data-fsf-manual-add data-i18n="btn.manualAdd"></button>
        </div>
        <button class="__fsf_btn __fsf_btn_primary" type="button" data-fsf-fill-next data-i18n="btn.fillNext"></button>
        <button class="__fsf_btn __fsf_btn_warning" type="button" data-fsf-auto-mode></button>
        <div class="__fsf_row">
          <button class="__fsf_btn" type="button" data-fsf-success data-i18n="btn.markSuccess"></button>
          <button class="__fsf_btn __fsf_btn_danger" type="button" data-fsf-mark-failed data-i18n="btn.markFailed"></button>
        </div>
        <div class="__fsf_row">
          <button class="__fsf_btn" type="button" data-fsf-retry data-i18n="btn.retry"></button>
          <button class="__fsf_btn" type="button" data-fsf-release data-i18n="btn.release"></button>
        </div>
        <div class="__fsf_row">
          <button class="__fsf_btn __fsf_btn_danger" type="button" data-fsf-clear-unused data-i18n="btn.clearUnused"></button>
          <button class="__fsf_btn __fsf_btn_danger" type="button" data-fsf-reset data-i18n="btn.reset"></button>
        </div>
        <div class="__fsf_hint"><span data-i18n="label.currentBatchPrefix"></span><span data-fsf-batch-label></span></div>
        <ol class="__fsf_batch" data-fsf-batch-list></ol>
        <div class="__fsf_hint" data-fsf-groups-label></div>
        <div class="__fsf_groups" data-fsf-groups></div>
        <div class="__fsf_hint" data-fsf-message></div>
      </div>
    `;

    document.body.append(button, panel);
    buildLangSelect(panel.querySelector("[data-fsf-lang]"));
    renderPanel();

    button.addEventListener("click", async () => {
      panel.classList.toggle("__fsf_open");
      if (await loadState()) {
        const synced = await syncFromHistoryPage();
        if (synced > 0) {
          setPanelMessage(t("msg.synced", { count: synced }));
        }
        renderPanel();
      }
    });
    panel.querySelector("[data-fsf-lang]").addEventListener("change", async (event) => {
      await setLang(event.target.value);
      setPanelMessage("");
      renderPanel();
    });
    panel.querySelector("[data-fsf-close]").addEventListener("click", () => {
      panel.classList.remove("__fsf_open");
    });
    panel.querySelector("[data-fsf-import-button]").addEventListener("click", handleImport);
    panel.querySelector("[data-fsf-clear]").addEventListener("click", () => {
      panel.querySelector("[data-fsf-import]").value = "";
      setPanelMessage("");
    });
    panel.querySelector("[data-fsf-manual-add]").addEventListener("click", handleManualAdd);
    panel.querySelector("[data-fsf-manual-input]").addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleManualAdd();
      }
    });
    panel.querySelector("[data-fsf-fill-next]").addEventListener("click", () => {
      fillItems(state.serials.filter((item) => item.status === "unused").slice(0, MAX_BATCH_SIZE), "next");
    });
    panel.querySelector("[data-fsf-retry]").addEventListener("click", () => {
      fillItems(state.serials.filter((item) => item.status === "failed").slice(0, MAX_BATCH_SIZE), "retry");
    });
    panel.querySelector("[data-fsf-success]").addEventListener("click", () => markActiveBatch("success"));
    panel.querySelector("[data-fsf-mark-failed]").addEventListener("click", () => markActiveBatch("failed"));
    panel.querySelector("[data-fsf-release]").addEventListener("click", releasePending);
    panel.querySelector("[data-fsf-clear-unused]").addEventListener("click", clearUnused);
    panel.querySelector("[data-fsf-reset]").addEventListener("click", resetAll);
    panel.querySelector("[data-fsf-auto-mode]").addEventListener("click", startAutoMode);

    if (await loadState()) {
      if (state.autoMode && !isInputPage() && !isConfirmationPage()) {
        // An error page after submit is neither input nor confirmation: record the failure and stop (autoCycle does both).
        if (detectPageError()) {
          await autoCycle();
        } else {
          state.autoMode = false;
          await saveState();
          setPanelMessage(t("msg.autoStopped"));
        }
      }
      const initialSynced = await syncFromHistoryPage();
      if (initialSynced > 0) {
        setPanelMessage(t("msg.synced", { count: initialSynced }));
      }
      if (state.autoMode && !autoModeInterval) {
        autoModeInterval = setInterval(autoCycle, 3000);
        setTimeout(autoCycle, 1000);
      }
      renderPanel();
    }
  };

  onLangChange(() => {
    const select = document.querySelector(`#${PANEL_ID} [data-fsf-lang]`);
    if (select) buildLangSelect(select);
    setPanelMessage("");
    renderPanel();
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "FORTUNE_SERIAL_FILLER_PING") {
      sendResponse({ ok: true });
      return true;
    }

    if (message?.type === "FORTUNE_SERIAL_FILLER_FILL") {
      const serials = Array.isArray(message.serials) ? message.serials : [];
      fillInputs(serials)
        .then((res) => sendResponse({ ok: true, ...res }))
        .catch((error) => sendResponse({ ok: false, error: error?.message || String(error) }));
      return true;
    }

    return false;
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createPanel, { once: true });
  } else {
    createPanel();
  }
})();
