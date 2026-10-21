(() => {
  const { MAX_BATCH_SIZE } = window.FortuneSerialCore;
  const PANEL_ID = "__fortune_serial_filler_panel__";

  const isVisible = (element) => {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0" &&
      rect.width > 0 &&
      rect.height > 0
    );
  };

  const isFillableInput = (element) => {
    if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
      return false;
    }

    if (element.disabled || element.readOnly || !isVisible(element)) {
      return false;
    }

    if (element instanceof HTMLInputElement) {
      const type = (element.getAttribute("type") || "text").toLowerCase();
      const allowedTypes = new Set(["", "text", "search", "tel", "url", "password"]);
      if (!allowedTypes.has(type)) {
        return false;
      }
    }

    return !element.closest(`#${PANEL_ID}`);
  };

  const getLabelText = (input) => {
    const ariaLabel = input.getAttribute("aria-label");
    if (ariaLabel) return ariaLabel;

    const id = input.getAttribute("id");
    if (id) {
      const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
      if (label) return label.textContent || "";
    }

    return input.closest("label, li, div, section, form")?.textContent || "";
  };

  const findButtonByTexts = (keywords) => {
    const buttons = [...document.querySelectorAll("button, [role='button']")];
    return buttons.find((btn) => {
      if (btn.closest(`#${PANEL_ID}`)) return false;
      const text = btn.textContent || "";
      return keywords.some((kw) => text.includes(kw));
    });
  };

  const clickAddInputButton = async () => {
    const button = findButtonByTexts(["入力枠を追加", "追加"]);
    if (!button) return false;

    button.click();
    await new Promise((resolve) => setTimeout(resolve, 200));
    return true;
  };

  const findContinueButton = () => {
    return findButtonByTexts(["続けてシリアルナンバーを登録する", "続けて"]);
  };

  const findSubmitButton = () => {
    return findButtonByTexts(["登録", "申請", "送信"]);
  };

  const findSerialInputs = () => {
    const candidates = [...document.querySelectorAll("input, textarea")].filter(isFillableInput);
    const serialHints = ["serial", "シリアル", "ナンバー", "number"];

    const scored = candidates
      .map((input, index) => {
        const metadata = [
          input.name,
          input.id,
          input.placeholder,
          input.autocomplete,
          getLabelText(input)
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const score = serialHints.reduce((sum, hint) => {
          return sum + (metadata.includes(hint.toLowerCase()) ? 1 : 0);
        }, 0);

        return { input, index, score };
      })
      .sort((a, b) => b.score - a.score || a.index - b.index);

    const bestScore = scored[0]?.score || 0;
    if (bestScore === 0) {
      return [];
    }

    return scored
      .filter((item) => item.score === bestScore)
      .sort((a, b) => a.index - b.index)
      .map((item) => item.input);
  };

  const scanRegisteredSerialsOnPage = () => {
    const { SERIAL_RE, cleanSerial } = window.FortuneSerialCore;
    // Read the site only: the panel lists our own pool, so scanning it would mark every listed number as registered.
    const text = [...(document.body?.children || [])]
      .filter((el) => !el.id.startsWith("__fortune_serial_filler_"))
      .map((el) => el.innerText || "")
      .join("\n");
    const tokens = text.split(/[\s,，、;；/／:：()（）「」『』]+/);
    const found = new Set();
    for (const token of tokens) {
      const cleaned = cleanSerial(token);
      if (SERIAL_RE.test(cleaned)) {
        found.add(cleaned);
      }
    }
    return found;
  };

  const ERROR_KEYWORDS = [
    "エラー",
    "正しくありません",
    "無効",
    "登録できません",
    "使用済み",
    "既に使用",
    "既に登録",
    "入力内容をご確認",
    "もう一度ご入力",
    "該当するシリアル"
  ];

  const detectPageError = () => {
    const alertEl = document.querySelector(
      "[role='alert'], .error, .err, .alert-danger, .text-danger, [class*='error'], [class*='Error']"
    );
    if (alertEl && !alertEl.closest(`#${PANEL_ID}`) && isVisible(alertEl)) {
      const alertText = (alertEl.textContent || "").trim();
      if (alertText) return alertText.slice(0, 80);
    }

    const bodyText = document.body?.innerText || "";
    const matched = ERROR_KEYWORDS.find((kw) => bodyText.includes(kw));
    return matched || null;
  };

  const isConfirmationPage = () => Boolean(findContinueButton());
  const isInputPage = () => !isConfirmationPage() && findSerialInputs().length > 0;

  const setNativeValue = (element, value) => {
    const prototype = Object.getPrototypeOf(element);
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    if (descriptor?.set) {
      descriptor.set.call(element, value);
    } else {
      element.value = value;
    }
  };

  const fillInputs = async (serials) => {
    let inputs = findSerialInputs();
    const neededCount = Math.min(serials.length, MAX_BATCH_SIZE);

    while (inputs.length < neededCount) {
      const clicked = await clickAddInputButton();
      if (!clicked) break;
      inputs = findSerialInputs();
    }

    const fillCount = Math.min(inputs.length, serials.length, MAX_BATCH_SIZE);

    for (let index = 0; index < fillCount; index += 1) {
      const input = inputs[index];
      input.focus();
      setNativeValue(input, serials[index]);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      input.blur();
    }

    if (inputs[0]) {
      inputs[0].scrollIntoView({ behavior: "smooth", block: "center" });
    }

    return {
      fillCount,
      inputCount: inputs.length,
      url: window.location.href,
      title: document.title
    };
  };

  window.FortuneSerialDom = {
    PANEL_ID,
    findContinueButton,
    findSubmitButton,
    isConfirmationPage,
    isInputPage,
    detectPageError,
    scanRegisteredSerialsOnPage,
    fillInputs
  };
})();
