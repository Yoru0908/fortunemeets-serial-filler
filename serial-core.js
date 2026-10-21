(() => {
  const STORAGE_KEY = "fortuneSerialFillerState";
  const MAX_BATCH_SIZE = 10;
  const SERIAL_RE = /^[A-Z0-9]{13}$/;
  const SUPPORTED_HOST_RE = /(^|\.)fortune(meets|music)\.(app|jp)$/;

  const initialState = () => ({
    serials: [],
    batches: [],
    activeBatchId: null,
    nextBatchNumber: 1,
    autoMode: false
  });

  const now = () => new Date().toISOString();

  const cleanSerial = (value) => {
    return String(value || "")
      .normalize("NFKC")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
  };

  const parseSerials = (text) => {
    const raw = String(text || "");
    const matches = raw.normalize("NFKC").toUpperCase().match(/[A-Z0-9]{13}/g);
    if (matches && matches.length > 0) {
      return matches;
    }
    return raw
      .split(/[\s,，、;；]+/)
      .map(cleanSerial)
      .filter((value) => SERIAL_RE.test(value));
  };

  const computeStats = (serials) => {
    const stats = {
      total: serials.length,
      unused: 0,
      pending: 0,
      success: 0,
      failed: 0,
      duplicate: 0,
      skipped: 0
    };

    for (const item of serials) {
      if (Object.hasOwn(stats, item.status)) {
        stats[item.status] += 1;
      }
    }

    return stats;
  };

  const appendSerials = (serials, values) => {
    const existing = new Set(serials.map((item) => item.value));
    const timestamp = now();
    let added = 0;
    let duplicate = 0;

    for (const value of values) {
      if (existing.has(value)) {
        duplicate += 1;
        continue;
      }

      existing.add(value);
      serials.push({
        id: crypto.randomUUID(),
        value,
        status: "unused",
        batchId: null,
        addedAt: timestamp,
        updatedAt: timestamp
      });
      added += 1;
    }

    return { added, duplicate };
  };

  const getActiveBatch = (state) => {
    if (!state.activeBatchId) return null;
    return state.batches.find((batch) => batch.id === state.activeBatchId) || null;
  };

  const getItemsByIds = (state, ids) => {
    const byId = new Map(state.serials.map((item) => [item.id, item]));
    return ids.map((id) => byId.get(id)).filter(Boolean);
  };

  const createBatchInState = (state, items, mode, pageUrl = "") => {
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
      pageUrl
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

  const syncRegisteredSerials = (state, pageSerialSet) => {
    if (!pageSerialSet || pageSerialSet.size === 0) return 0;

    const timestamp = now();
    let synced = 0;
    for (const item of state.serials) {
      if (pageSerialSet.has(item.value) && item.status !== "success") {
        item.status = "success";
        item.updatedAt = timestamp;
        synced += 1;
      }
    }

    const batch = getActiveBatch(state);
    if (batch && batch.status !== "success") {
      const batchItems = getItemsByIds(state, batch.serialIds);
      if (batchItems.length > 0 && batchItems.every((item) => item.status === "success")) {
        batch.status = "success";
        batch.updatedAt = timestamp;
      }
    }

    return synced;
  };

  window.FortuneSerialCore = {
    STORAGE_KEY,
    MAX_BATCH_SIZE,
    SERIAL_RE,
    SUPPORTED_HOST_RE,
    initialState,
    now,
    cleanSerial,
    parseSerials,
    computeStats,
    appendSerials,
    getActiveBatch,
    getItemsByIds,
    createBatchInState,
    syncRegisteredSerials
  };
})();
