(function (global) {
  function createPlayerAvatarController({ compressImage }) {
    let pendingBlob = null;

    function showLightbox(src) {
      const overlay = document.createElement("div");
      overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:pointer;";
      const img = document.createElement("img");
      img.src = src;
      img.style.cssText = "width:240px;height:240px;border-radius:50%;object-fit:cover;border:3px solid #444;box-shadow:0 0 40px rgba(0,0,0,0.6);";
      overlay.appendChild(img);
      overlay.addEventListener("click", () => overlay.remove());
      document.body.appendChild(overlay);
    }

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

    function setupListeners(wrapperId, inputId, previewId, placeholderId, cameraIconId) {
      // Foto → lightbox
      document.getElementById(previewId)?.addEventListener("click", () => {
        const preview = document.getElementById(previewId);
        if (preview?.src) showLightbox(preview.src);
      });
      // Placeholder → file picker
      document.getElementById(placeholderId)?.addEventListener("click", () => {
        document.getElementById(inputId)?.click();
      });
      // Ícono cámara → file picker (sin propagar al preview)
      document.getElementById(cameraIconId)?.addEventListener("click", (e) => {
        e.stopPropagation();
        document.getElementById(inputId)?.click();
      });
      // File input change → comprimir y mostrar preview
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
