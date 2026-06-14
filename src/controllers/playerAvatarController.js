(function (global) {
  function createPlayerAvatarController({ compressImage }) {
    let pendingBlob = null;

    function initAvatar(player, previewId, placeholderId, inputId) {
      pendingBlob = null;
      const input = document.getElementById(inputId);
      const preview = document.getElementById(previewId);
      const placeholder = document.getElementById(placeholderId);
      if (input) input.value = "";
      if (preview && placeholder) {
        if (player?.photo_url) {
          preview.src = player.photo_url;
          preview.style.display = "";
          placeholder.style.display = "none";
        } else {
          preview.src = "";
          preview.style.display = "none";
          placeholder.style.display = "";
        }
      }
    }

    function setupListeners(wrapperId, inputId, previewId, placeholderId) {
      document.getElementById(wrapperId)?.addEventListener("click", () => {
        document.getElementById(inputId)?.click();
      });
      document.getElementById(inputId)?.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const blob = await compressImage(file, 256, 0.82);
        pendingBlob = blob;
        const url = URL.createObjectURL(blob);
        const preview = document.getElementById(previewId);
        const placeholder = document.getElementById(placeholderId);
        if (preview) { preview.src = url; preview.style.display = ""; }
        if (placeholder) placeholder.style.display = "none";
      });
    }

    function getPendingBlob() { return pendingBlob; }
    function clearPendingBlob() { pendingBlob = null; }

    return { initAvatar, setupListeners, getPendingBlob, clearPendingBlob };
  }

  global.createPlayerAvatarController = createPlayerAvatarController;
})(window);
