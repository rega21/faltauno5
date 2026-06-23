(function () {
  "use strict";

  const FORMATIONS = {
    f5: [[1], [2], [2]],
    f6: [[1], [2], [3]],
    f7: [[1], [3], [3]],
  };

  function sortPlayersIntoRows(players, formation) {
    const totalSlots = formation.reduce((s, r) => s + r[0], 0);
    const roster = players.slice(0, totalSlots);

    const scored = roster.map((p) => {
      const atk = Number(p.effectiveAttack ?? p.attack ?? 0);
      const def = Number(p.effectiveDefense ?? p.defense ?? 0);
      return { player: p, diff: atk - def };
    });

    scored.sort((a, b) => a.diff - b.diff);

    const rows = [];
    let idx = 0;
    for (const [count] of formation) {
      rows.push(scored.slice(idx, idx + count).map((s) => s.player));
      idx += count;
    }
    return rows;
  }

  function getInitials(name) {
    return (name || "?").charAt(0).toUpperCase();
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  function renderPlayerNode(player) {
    const displayName = player.nickname?.trim() || player.name || "?";
    const photoUrl = player.photo_url || "";

    let avatarHtml;
    if (photoUrl) {
      avatarHtml = `<img class="pitch-player-img" src="${escapeHtml(photoUrl)}" alt="" />`;
    } else {
      avatarHtml = `<div class="pitch-player-initials">${getInitials(displayName)}</div>`;
    }

    return `
      <div class="pitch-player">
        <div class="pitch-player-avatar">${avatarHtml}</div>
        <span class="pitch-player-name">${escapeHtml(displayName)}</span>
      </div>
    `;
  }

  function buildHalfRows(players, formation, half) {
    const rows = sortPlayersIntoRows(players, formation);
    if (half === "top") {
      return rows;
    }
    return [...rows].reverse();
  }

  function renderHalf(rows) {
    return rows.map((rowPlayers) => {
      const playersHtml = rowPlayers.map((p) => renderPlayerNode(p)).join("");
      return `<div class="pitch-row">${playersHtml}</div>`;
    }).join("");
  }

  function ensureModal() {
    let modal = document.getElementById("pitchModal");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "pitchModal";
    modal.className = "pitch-modal hidden";
    modal.innerHTML = `
      <div class="pitch-modal-backdrop"></div>
      <div class="pitch-modal-content">
        <div class="pitch-modal-header">
          <h3 class="pitch-modal-title">Formación</h3>
          <button class="pitch-modal-close" aria-label="Cerrar">&times;</button>
        </div>
        <div class="pitch-modal-body"></div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector(".pitch-modal-backdrop").addEventListener("click", close);
    modal.querySelector(".pitch-modal-close").addEventListener("click", close);
    return modal;
  }

  function openBoth(teams, format) {
    const modal = ensureModal();
    const formation = FORMATIONS[format] || FORMATIONS.f5;

    const teamARows = buildHalfRows(teams.a || [], formation, "top");
    const teamBRows = buildHalfRows(teams.b || [], formation, "bottom");

    const html = `
      <div class="pitch-field">
        <div class="pitch-markings">
          <div class="pitch-area pitch-area--top"></div>
          <div class="pitch-goal pitch-goal--top"></div>
          <div class="pitch-center-circle"></div>
          <div class="pitch-area pitch-area--bottom"></div>
          <div class="pitch-goal pitch-goal--bottom"></div>
        </div>
        <div class="pitch-half pitch-half--top" style="--team-color: #10b981">
          <div class="pitch-half-label" style="color: #10b981">Equipo A</div>
          ${renderHalf(teamARows)}
        </div>
        <div class="pitch-half pitch-half--bottom" style="--team-color: #3b82f6">
          ${renderHalf(teamBRows)}
          <div class="pitch-half-label" style="color: #3b82f6">Equipo B</div>
        </div>
      </div>
    `;

    modal.querySelector(".pitch-modal-body").innerHTML = html;
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function close() {
    const modal = document.getElementById("pitchModal");
    if (modal) {
      modal.classList.add("hidden");
      document.body.style.overflow = "";
    }
  }

  window.PitchView = { openBoth, close };
})();
