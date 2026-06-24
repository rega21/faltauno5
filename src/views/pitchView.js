(function () {
  "use strict";

  const FORMATIONS = {
    f5: [[1], [2], [2]],
    f6: [[1], [2], [3]],
    f7: [[1], [3], [3]],
  };

  const manualOrder = { a: null, b: null };

  function sortPlayersIntoRows(players, formation, team) {
    const totalSlots = formation.reduce((s, r) => s + r[0], 0);
    let roster;

    if (team && manualOrder[team]) {
      const orderIds = manualOrder[team];
      const byId = {};
      players.forEach((p) => { byId[String(p.id)] = p; });
      roster = orderIds.map((id) => byId[String(id)]).filter(Boolean).slice(0, totalSlots);
    } else {
      roster = players.slice(0, totalSlots);
      const scored = roster.map((p) => {
        const atk = Number(p.effectiveAttack ?? p.attack ?? 0);
        const def = Number(p.effectiveDefense ?? p.defense ?? 0);
        return { player: p, diff: atk - def };
      });
      scored.sort((a, b) => a.diff - b.diff);
      roster = scored.map((s) => s.player);
    }

    const rows = [];
    let idx = 0;
    for (const [count] of formation) {
      rows.push(roster.slice(idx, idx + count));
      idx += count;
    }
    return rows;
  }

  function getOrderedIds(players, formation) {
    const totalSlots = formation.reduce((s, r) => s + r[0], 0);
    const roster = players.slice(0, totalSlots);
    const scored = roster.map((p) => {
      const atk = Number(p.effectiveAttack ?? p.attack ?? 0);
      const def = Number(p.effectiveDefense ?? p.defense ?? 0);
      return { player: p, diff: atk - def };
    });
    scored.sort((a, b) => a.diff - b.diff);
    return scored.map((s) => String(s.player.id));
  }

  function getInitials(name) {
    return (name || "?").charAt(0).toUpperCase();
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  function renderPlayerNode(player, team) {
    const displayName = player.nickname?.trim() || player.name || "?";
    const photoUrl = player.photo_url || "";
    const playerId = player.id || "";

    let avatarHtml;
    if (photoUrl) {
      avatarHtml = `<img class="pitch-player-img" src="${escapeHtml(photoUrl)}" alt="" />`;
    } else {
      avatarHtml = `<div class="pitch-player-initials">${getInitials(displayName)}</div>`;
    }

    return `
      <div class="pitch-player" data-team="${team || ""}" data-player-id="${playerId}">
        <div class="pitch-player-avatar">${avatarHtml}</div>
        <span class="pitch-player-name">${escapeHtml(displayName)}</span>
      </div>
    `;
  }

  function buildHalfRows(players, formation, half, team) {
    const rows = sortPlayersIntoRows(players, formation, team);
    if (half === "top") {
      return rows;
    }
    return [...rows].reverse();
  }

  function renderHalf(rows, team) {
    return rows.map((rowPlayers) => {
      const playersHtml = rowPlayers.map((p) => renderPlayerNode(p, team)).join("");
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

    const teamARows = buildHalfRows(teams.a || [], formation, "top", "a");
    const teamBRows = buildHalfRows(teams.b || [], formation, "bottom", "b");

    const html = `
      <div class="pitch-field">
        <div class="pitch-markings">
          <div class="pitch-area pitch-area--top"></div>
          <div class="pitch-goal pitch-goal--top"></div>
          <div class="pitch-center-circle"></div>
          <div class="pitch-area pitch-area--bottom"></div>
          <div class="pitch-goal pitch-goal--bottom"></div>
        </div>
        <div class="pitch-half pitch-half--top" style="--team-color: #f97316">
          <div class="pitch-half-label" style="color: #f97316">Equipo A</div>
          ${renderHalf(teamARows, "a")}
        </div>
        <div class="pitch-half pitch-half--bottom" style="--team-color: #3b82f6">
          ${renderHalf(teamBRows, "b")}
          <div class="pitch-half-label" style="color: #3b82f6">Equipo B</div>
        </div>
      </div>
    `;

    modal.querySelector(".pitch-modal-body").innerHTML = html;
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  let pitchSwapSelection = null;

  function renderInline(containerId, teams, format, onSwap) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const formation = FORMATIONS[format] || FORMATIONS.f5;
    const teamARows = buildHalfRows(teams.a || [], formation, "top", "a");
    const teamBRows = buildHalfRows(teams.b || [], formation, "bottom", "b");

    container.innerHTML = `
      <div class="pitch-field${onSwap ? " pitch-field--swappable" : ""}">
        <div class="pitch-markings">
          <div class="pitch-area pitch-area--top"></div>
          <div class="pitch-goal pitch-goal--top"></div>
          <div class="pitch-center-circle"></div>
          <div class="pitch-area pitch-area--bottom"></div>
          <div class="pitch-goal pitch-goal--bottom"></div>
        </div>
        <div class="pitch-half pitch-half--top" style="--team-color: #f97316">
          <div class="pitch-half-label" style="color: #f97316">Equipo A</div>
          ${renderHalf(teamARows, "a")}
        </div>
        <div class="pitch-half pitch-half--bottom" style="--team-color: #3b82f6">
          ${renderHalf(teamBRows, "b")}
          <div class="pitch-half-label" style="color: #3b82f6">Equipo B</div>
        </div>
      </div>
    `;

    if (onSwap) setupPitchSwap(container, teams, format, onSwap);
  }

  function setupPitchSwap(container, teams, format, onSwap) {
    pitchSwapSelection = null;

    function onSwapRender() {
      renderInline(container.id, teams, format, onSwap);
    }

    container.querySelectorAll(".pitch-player[data-team]").forEach((el) => {
      el.addEventListener("click", () => {
        const team = el.dataset.team;
        const playerId = el.dataset.playerId;

        if (!pitchSwapSelection) {
          pitchSwapSelection = { team, playerId, el };
          el.classList.add("pitch-swap-selected");
          return;
        }

        if (pitchSwapSelection.el === el) {
          el.classList.remove("pitch-swap-selected");
          pitchSwapSelection = null;
          return;
        }

        if (pitchSwapSelection.team === team) {
          const selId = pitchSwapSelection.playerId;
          const rectFrom = pitchSwapSelection.el.getBoundingClientRect();
          const rectTo = el.getBoundingClientRect();

          pitchSwapSelection.el.classList.remove("pitch-swap-selected");
          pitchSwapSelection = null;

          const order = manualOrder[team] || getOrderedIds(teams[team] || [], FORMATIONS[format] || FORMATIONS.f5);
          const iA = order.indexOf(String(selId));
          const iB = order.indexOf(String(playerId));
          if (iA >= 0 && iB >= 0) {
            [order[iA], order[iB]] = [order[iB], order[iA]];
            manualOrder[team] = order;
            onSwapRender();

            requestAnimationFrame(() => {
              const ct = document.getElementById("inlinePitch");
              if (!ct) return;
              const nA = ct.querySelector(`[data-player-id="${selId}"]`);
              const nB = ct.querySelector(`[data-player-id="${playerId}"]`);
              if (!nA || !nB) return;
              const nrA = nA.getBoundingClientRect();
              const nrB = nB.getBoundingClientRect();
              nA.style.transition = "none";
              nB.style.transition = "none";
              nA.style.transform = `translate(${rectFrom.left - nrA.left}px, ${rectFrom.top - nrA.top}px)`;
              nB.style.transform = `translate(${rectTo.left - nrB.left}px, ${rectTo.top - nrB.top}px)`;
              requestAnimationFrame(() => {
                nA.style.transition = "transform 0.7s ease";
                nB.style.transition = "transform 0.7s ease";
                nA.style.transform = "";
                nB.style.transform = "";
              });
            });
          }
          return;
        }

        const firstIsA = pitchSwapSelection.team === "a";
        const idA = firstIsA ? pitchSwapSelection.playerId : playerId;
        const idB = firstIsA ? playerId : pitchSwapSelection.playerId;
        const rectFromA = (firstIsA ? pitchSwapSelection.el : el).getBoundingClientRect();
        const rectFromB = (firstIsA ? el : pitchSwapSelection.el).getBoundingClientRect();

        const idxA = (teams.a || []).findIndex((p) => String(p.id) === String(idA));
        const idxB = (teams.b || []).findIndex((p) => String(p.id) === String(idB));

        pitchSwapSelection.el.classList.remove("pitch-swap-selected");
        pitchSwapSelection = null;

        if (idxA < 0 || idxB < 0) return;
        manualOrder.a = null;
        manualOrder.b = null;
        onSwap(idxA, idxB);

        requestAnimationFrame(() => {
          const ct = document.getElementById("inlinePitch");
          if (!ct) return;
          const newA = ct.querySelector(`[data-player-id="${idA}"]`);
          const newB = ct.querySelector(`[data-player-id="${idB}"]`);
          if (!newA || !newB) return;

          const nrA = newA.getBoundingClientRect();
          const nrB = newB.getBoundingClientRect();

          newA.style.transition = "none";
          newB.style.transition = "none";
          newA.style.transform = `translate(${rectFromA.left - nrA.left}px, ${rectFromA.top - nrA.top}px)`;
          newB.style.transform = `translate(${rectFromB.left - nrB.left}px, ${rectFromB.top - nrB.top}px)`;

          requestAnimationFrame(() => {
            newA.style.transition = "transform 0.7s ease";
            newB.style.transition = "transform 0.7s ease";
            newA.style.transform = "";
            newB.style.transform = "";
          });
        });
      });
    });
  }

  function close() {
    const modal = document.getElementById("pitchModal");
    if (modal) {
      modal.classList.add("hidden");
      document.body.style.overflow = "";
    }
  }

  function resetManualOrder() {
    manualOrder.a = null;
    manualOrder.b = null;
  }

  window.PitchView = { openBoth, close, renderInline, resetManualOrder };
})();
