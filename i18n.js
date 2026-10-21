(() => {
  const LANG_KEY = "fortuneSerialFillerLang";
  const DEFAULT_LANG = "ja";

  const LANGS = {
    ja: "日本語",
    zh: "中文",
    en: "English"
  };

  const messages = {
    ja: {
      "status.unused": "未使用",
      "status.pending": "確認待ち",
      "status.success": "成功",
      "status.failed": "失敗",
      "status.duplicate": "重複",
      "status.skipped": "スキップ",
      "stat.total": "合計",
      "stat.unused": "未使用",
      "stat.pending": "確認待ち",
      "stat.success": "成功",
      "stat.failed": "失敗",
      "filter.all": "すべて",
      "btn.export": "書き出し",
      "btn.import": "リストに追加",
      "btn.clearInput": "入力をクリア",
      "btn.manualAdd": "番号を追加",
      "btn.fillNext": "次の10件を入力",
      "btn.markSuccess": "このバッチは成功",
      "btn.markFailed": "このバッチは失敗",
      "btn.retry": "失敗分を再入力",
      "btn.release": "確認待ちを戻す",
      "btn.clearUnused": "未使用の番号を削除",
      "btn.reset": "全データを削除",
      "btn.autoStart": "全自動登録を開始",
      "btn.autoStop": "全自動登録を停止",
      "label.exportTitle": "バックアップを書き出す",
      "label.statsAria": "番号の集計",
      "label.importBatch": "シリアルナンバーを一括取り込み",
      "label.currentBatch": "現在のバッチ",
      "label.currentBatchPrefix": "現在のバッチ：",
      "label.groupsPreview": "未使用グループ",
      "label.pool": "番号リスト",
      "label.filterAria": "ステータスで絞り込み",
      "label.none": "なし",
      "label.language": "言語",
      "placeholder.import": "OCR結果をまとめて貼り付け（スペース・改行・カンマ区切り対応、順番どおりに読み込み）",
      "placeholder.manual": "番号を手入力（自動で13桁に整形）",
      "page.checking": "現在のページを確認中...",
      "page.noTab": "現在のタブを読み取れません。",
      "page.supported": "forTUNEのページです。入力できます。",
      "page.unsupported": "forTUNE / fortunemusic のシリアル入力ページを開いてください。",
      "groups.count": "{groups}グループ · {count}件",
      "groups.panelLabel": "未使用グループ（{groups}グループ · {count}件 · 取り込み順）",
      "groups.summary": "グループ{n}（{size}件）",
      "groups.next": " · 次に入力",
      "groups.empty": "未使用の番号はありません。",
      "pool.empty": "条件に合う番号はありません。",
      "msg.noSerials": "13桁の英数字の番号が見つかりません。",
      "msg.imported": "{added}件を順番どおり追加しました（重複{duplicate}件はスキップ）。",
      "msg.invalidSerial": "無効な番号です：13桁の英数字（A-Z、0-9）が必要です。",
      "msg.alreadyInPool": "{value} はすでにリストにあります。",
      "msg.addedOne": "{value} を追加しました。",
      "msg.batchPending": "現在のバッチが確認待ちです。先に成功/失敗を記録するか、確認待ちを戻してください。",
      "msg.nothingToFill": "入力できる番号がありません。",
      "msg.notEnoughInputs": "入力欄が{count}個しか見つからないため、このバッチは記録していません。",
      "msg.filled": "バッチ #{n} を入力しました。サイトで送信後、成功か失敗を記録してください。",
      "msg.marked": "バッチ #{n} を「{status}」にしました。",
      "msg.clearedUnused": "未使用の番号を削除しました。",
      "msg.resetDone": "全データを削除しました。",
      "msg.released": "確認待ちの番号を元の順番で未使用に戻しました。",
      "msg.noTab": "使用できるタブがありません。",
      "msg.fillFailed": "ページへの入力に失敗しました。",
      "msg.extUpdated": "拡張機能が更新されました。F5でページを再読み込みしてください。",
      "msg.synced": "このページで登録済みの番号{count}件を確認し、成功にしました。",
      "msg.autoStarted": "全自動モードを開始しました。順番に入力・送信・続けて登録を行います。",
      "msg.autoStopped": "全自動モードを停止しました。",
      "msg.autoNoUnused": "未使用の番号がないため、全自動モードを開始できません。",
      "msg.autoPageError": "ページでエラーを検出しました（{error}）。再試行せずに停止しました。",
      "msg.autoNoContinue": "「続けて登録」ボタンが見つからないため、停止しました。",
      "msg.autoTimeout": "送信後に完了ページへ進まなかったため、このバッチを失敗にして停止しました（自動再試行なし）。",
      "msg.autoDone": "すべての番号を処理しました。全自動モードを終了します。",
      "msg.autoNoInputs": "入力欄が見つからないため、全自動モードを停止しました。",
      "msg.autoFilled": "バッチ #{n} を自動入力しました。送信します...",
      "msg.autoNoSubmit": "送信ボタンが見つからないため、全自動モードを停止しました。",
      "confirm.clearUnused": "未使用の番号をすべて削除しますか？元に戻せません。",
      "confirm.reset": "拡張機能内のすべての番号とバッチ記録を削除しますか？元に戻せません。",
      "confirm.autoStart": "全自動モードは入力・送信・「続けて登録」を自動で行います。\nサイト側に自動操作と判断され、アカウントが制限される可能性があります。自己責任でご利用ください。\n\n開始しますか？"
    },
    zh: {
      "status.unused": "未使用",
      "status.pending": "待确认",
      "status.success": "成功",
      "status.failed": "失败",
      "status.duplicate": "重复",
      "status.skipped": "跳过",
      "stat.total": "总数",
      "stat.unused": "未用",
      "stat.pending": "待确认",
      "stat.success": "成功",
      "stat.failed": "失败",
      "filter.all": "全部",
      "btn.export": "导出",
      "btn.import": "加入号池",
      "btn.clearInput": "清空输入",
      "btn.manualAdd": "仅添加号码",
      "btn.fillNext": "填入下一组 10 张",
      "btn.markSuccess": "当前批次成功",
      "btn.markFailed": "当前批次失败",
      "btn.retry": "重试失败号码",
      "btn.release": "释放待确认",
      "btn.clearUnused": "清空未使用号码",
      "btn.reset": "清空全部数据",
      "btn.autoStart": "开始全自动注册",
      "btn.autoStop": "停止全自动注册",
      "label.exportTitle": "导出备份",
      "label.statsAria": "号码统计",
      "label.importBatch": "批量导入号码",
      "label.currentBatch": "当前批次",
      "label.currentBatchPrefix": "当前批次：",
      "label.groupsPreview": "未用分组预览",
      "label.pool": "号池",
      "label.filterAria": "状态筛选",
      "label.none": "无",
      "label.language": "语言",
      "placeholder.import": "把 OCR 结果整段粘贴到这里。支持空格、换行、逗号分隔，按顺序读取。",
      "placeholder.manual": "手动输入号码（自动清洗为 13 位）",
      "page.checking": "检查当前页面中...",
      "page.noTab": "无法读取当前标签页。",
      "page.supported": "当前是 forTUNE 页面，可以填入。",
      "page.unsupported": "请先打开 forTUNE / fortunemusic 的 serial 输入页。",
      "groups.count": "{groups} 组 · {count} 张",
      "groups.panelLabel": "未用分组（共 {groups} 组 · {count} 张 · 按导入顺序）",
      "groups.summary": "第 {n} 组（{size} 张）",
      "groups.next": " · 下一批将填入",
      "groups.empty": "没有未使用的号码。",
      "pool.empty": "没有符合条件的号码。",
      "msg.noSerials": "没有识别到 13 位英数字号码。",
      "msg.imported": "已按顺序加入 {added} 个号码，跳过重复 {duplicate} 个。",
      "msg.invalidSerial": "号码无效：需要 13 位英数字（A-Z、0-9）。",
      "msg.alreadyInPool": "{value} 已在号池中。",
      "msg.addedOne": "已加入号码：{value}。",
      "msg.batchPending": "当前批次还在待确认，请先标记成功/失败或释放待确认。",
      "msg.nothingToFill": "没有可填入的号码。",
      "msg.notEnoughInputs": "页面只找到 {count} 个输入框，未标记本批次。",
      "msg.filled": "已按顺序填入批次 #{n}，网页提交后请标记成功或失败。",
      "msg.marked": "批次 #{n} 已标记为{status}。",
      "msg.clearedUnused": "已清空未使用号码。",
      "msg.resetDone": "已清空全部数据。",
      "msg.released": "已把待确认号码按原顺序放回未使用队列。",
      "msg.noTab": "没有可用的当前标签页。",
      "msg.fillFailed": "页面填入失败。",
      "msg.extUpdated": "插件刚更新过，请按 F5 刷新当前网页以连接最新插件。",
      "msg.synced": "已从当前页面自动核对并标记 {count} 个已登録号码为成功。",
      "msg.autoStarted": "自动模式已启动，将按顺序自动填入、提交、继续注册。",
      "msg.autoStopped": "自动模式已停止。",
      "msg.autoNoUnused": "没有未使用的号码，无法启动自动模式。",
      "msg.autoPageError": "检测到页面报错（{error}），已立即暂停且不重试。",
      "msg.autoNoContinue": "找不到“继续注册”按钮，自动模式已暂停。",
      "msg.autoTimeout": "提交后未进入成功确认页，已标记本批失败并立即暂停（不自动重试）。",
      "msg.autoDone": "所有号码已处理完毕，自动模式停止。",
      "msg.autoNoInputs": "找不到输入框，自动模式停止。",
      "msg.autoFilled": "自动填入批次 #{n}，准备提交...",
      "msg.autoNoSubmit": "找不到提交按钮，自动模式停止。",
      "confirm.clearUnused": "确定清空所有未使用的号码吗？这个操作不能撤销。",
      "confirm.reset": "确定清空插件里的全部号码和批次记录吗？这个操作不能撤销。",
      "confirm.autoStart": "全自动模式会自动填入、提交并点击「继续注册」。\n网站可能判定为自动操作并限制账号，请自行承担风险。\n\n确定开始吗？"
    },
    en: {
      "status.unused": "Unused",
      "status.pending": "Pending",
      "status.success": "Success",
      "status.failed": "Failed",
      "status.duplicate": "Duplicate",
      "status.skipped": "Skipped",
      "stat.total": "Total",
      "stat.unused": "Unused",
      "stat.pending": "Pending",
      "stat.success": "Success",
      "stat.failed": "Failed",
      "filter.all": "All",
      "btn.export": "Export",
      "btn.import": "Add to pool",
      "btn.clearInput": "Clear input",
      "btn.manualAdd": "Add serial",
      "btn.fillNext": "Fill next 10",
      "btn.markSuccess": "Batch succeeded",
      "btn.markFailed": "Batch failed",
      "btn.retry": "Retry failed",
      "btn.release": "Release pending",
      "btn.clearUnused": "Delete unused serials",
      "btn.reset": "Delete all data",
      "btn.autoStart": "Start auto registration",
      "btn.autoStop": "Stop auto registration",
      "label.exportTitle": "Export backup",
      "label.statsAria": "Serial stats",
      "label.importBatch": "Bulk import serials",
      "label.currentBatch": "Current batch",
      "label.currentBatchPrefix": "Current batch: ",
      "label.groupsPreview": "Unused groups",
      "label.pool": "Serial pool",
      "label.filterAria": "Filter by status",
      "label.none": "None",
      "label.language": "Language",
      "placeholder.import": "Paste OCR text here. Spaces, line breaks and commas are fine; order is kept.",
      "placeholder.manual": "Type a serial (auto-cleaned to 13 chars)",
      "page.checking": "Checking current page...",
      "page.noTab": "Cannot read the current tab.",
      "page.supported": "forTUNE page detected. Ready to fill.",
      "page.unsupported": "Open a forTUNE / fortunemusic serial input page first.",
      "groups.count": "{groups} groups · {count} serials",
      "groups.panelLabel": "Unused groups ({groups} groups · {count} serials · import order)",
      "groups.summary": "Group {n} ({size})",
      "groups.next": " · next to fill",
      "groups.empty": "No unused serials.",
      "pool.empty": "No serials match this filter.",
      "msg.noSerials": "No 13-character alphanumeric serials found.",
      "msg.imported": "Added {added} serials in order, skipped {duplicate} duplicates.",
      "msg.invalidSerial": "Invalid serial: 13 alphanumeric characters (A-Z, 0-9) required.",
      "msg.alreadyInPool": "{value} is already in the pool.",
      "msg.addedOne": "Added {value}.",
      "msg.batchPending": "The current batch is still pending. Mark it success/failed or release it first.",
      "msg.nothingToFill": "No serials to fill.",
      "msg.notEnoughInputs": "Only {count} input fields found on the page; batch not recorded.",
      "msg.filled": "Filled batch #{n}. Submit on the site, then mark it success or failed.",
      "msg.marked": "Batch #{n} marked as {status}.",
      "msg.clearedUnused": "Unused serials deleted.",
      "msg.resetDone": "All data deleted.",
      "msg.released": "Pending serials returned to the unused queue in original order.",
      "msg.noTab": "No active tab available.",
      "msg.fillFailed": "Failed to fill the page.",
      "msg.extUpdated": "The extension was updated. Press F5 to reload this page.",
      "msg.synced": "Found {count} registered serials on this page and marked them as success.",
      "msg.autoStarted": "Auto mode started: fill, submit and continue in order.",
      "msg.autoStopped": "Auto mode stopped.",
      "msg.autoNoUnused": "No unused serials; cannot start auto mode.",
      "msg.autoPageError": "Page error detected ({error}). Stopped without retrying.",
      "msg.autoNoContinue": "\"Continue\" button not found. Auto mode stopped.",
      "msg.autoTimeout": "No confirmation page after submit. Batch marked failed and auto mode stopped (no retry).",
      "msg.autoDone": "All serials processed. Auto mode stopped.",
      "msg.autoNoInputs": "No input fields found. Auto mode stopped.",
      "msg.autoFilled": "Auto-filled batch #{n}, submitting...",
      "msg.autoNoSubmit": "Submit button not found. Auto mode stopped.",
      "confirm.clearUnused": "Delete all unused serials? This cannot be undone.",
      "confirm.reset": "Delete all serials and batch history in this extension? This cannot be undone.",
      "confirm.autoStart": "Auto mode fills, submits and clicks \"continue\" by itself.\nThe site may treat this as automated access and restrict your account. Use at your own risk.\n\nStart auto mode?"
    }
  };

  let lang = DEFAULT_LANG;

  const t = (key, vars = {}) => {
    const template = messages[lang][key] ?? messages[DEFAULT_LANG][key] ?? key;
    return template.replace(/\{(\w+)\}/g, (_match, name) => String(vars[name] ?? ""));
  };

  const statusText = (status) => t(`status.${status}`);

  const getLang = () => lang;

  const loadLang = async () => {
    try {
      const data = await chrome.storage.local.get(LANG_KEY);
      if (messages[data[LANG_KEY]]) lang = data[LANG_KEY];
    } catch (_error) {
      // Keep the default language when storage is unavailable.
    }
    return lang;
  };

  const setLang = async (next) => {
    if (!messages[next]) return;
    lang = next;
    await chrome.storage.local.set({ [LANG_KEY]: next });
  };

  const onLangChange = (callback) => {
    chrome.storage.onChanged.addListener((changes, area) => {
      const next = changes[LANG_KEY]?.newValue;
      if (area !== "local" || !messages[next] || next === lang) return;
      lang = next;
      callback(lang);
    });
  };

  // Static markup declares keys via data-i18n / data-i18n-placeholder / data-i18n-title / data-i18n-aria-label.
  const applyI18n = (root = document) => {
    for (const element of root.querySelectorAll("[data-i18n]")) {
      element.textContent = t(element.dataset.i18n);
    }
    for (const element of root.querySelectorAll("[data-i18n-placeholder]")) {
      element.placeholder = t(element.dataset.i18nPlaceholder);
    }
    for (const element of root.querySelectorAll("[data-i18n-title]")) {
      element.title = t(element.dataset.i18nTitle);
    }
    for (const element of root.querySelectorAll("[data-i18n-aria-label]")) {
      element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
    }
  };

  const buildLangSelect = (select) => {
    select.textContent = "";
    for (const [code, name] of Object.entries(LANGS)) {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = name;
      select.append(option);
    }
    select.value = lang;
  };

  window.FortuneSerialI18n = {
    LANGS,
    t,
    statusText,
    getLang,
    loadLang,
    setLang,
    onLangChange,
    applyI18n,
    buildLangSelect
  };
})();
