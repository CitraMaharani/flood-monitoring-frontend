(function (window) {
  const MODAL_ID = "app-modal";
  const TITLE_ID = "app-modal-title";
  const MESSAGE_ID = "app-modal-message";
  const OK_ID = "app-modal-ok";

  let onCloseCallback = null;

  function $(id) {
    return document.getElementById(id);
  }

  function open({ title, message, variant = "info", onClose } = {}) {
    const backdrop = $(MODAL_ID);
    const titleEl = $(TITLE_ID);
    const msgEl = $(MESSAGE_ID);

    if (!backdrop || !titleEl || !msgEl) return;

    titleEl.textContent = title || "";
    msgEl.textContent = message || "";
    backdrop.dataset.variant = variant;
    backdrop.style.display = "flex";

    onCloseCallback = typeof onClose === "function" ? onClose : null;
  }

  function close() {
    const backdrop = $(MODAL_ID);
    if (!backdrop) return;
    backdrop.style.display = "none";

    if (onCloseCallback) {
      const cb = onCloseCallback;
      onCloseCallback = null;
      cb();
    }
  }

  function init() {
    const backdrop = $(MODAL_ID);
    const okBtn = $(OK_ID);

    if (okBtn) {
      okBtn.addEventListener("click", close);
    }

    if (backdrop) {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) {
          close();
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", init);

  window.AppModal = {
    openError(message, options = {}) {
      open({
        title: options.title || "Terjadi kesalahan",
        message,
        variant: "error",
        onClose: options.onClose,
      });
    },
    openSuccess(message, options = {}) {
      open({
        title: options.title || "Berhasil",
        message,
        variant: "success",
        onClose: options.onClose,
      });
    },
    openInfo(message, options = {}) {
      open({
        title: options.title || "Info",
        message,
        variant: "info",
        onClose: options.onClose,
      });
    },
    close,
  };
})(window);
