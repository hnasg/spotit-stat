// ===== script.js =====
// Charge data/hina.json une seule fois et alimente le tableau, les graphiques et les albums

let morceaux = [];

const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre"
];

async function chargerMorceaux() {
  const reponse = await fetch("data/hina.json");
  morceaux = await reponse.json();

  afficherMorceaux(morceaux);
  construireGraphiques(morceaux);
  afficherAlbums(morceaux);
}

function echapper(texte) {
  const div = document.createElement("div");
  div.textContent = texte ?? "";
  return div.innerHTML;
}

function formaterDuree(ms) {
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = String(totalSec % 60).padStart(2, "0");
  return `${min}:${sec}`;
}

function formaterDate(dateStr, precision) {
  if (!dateStr) return "";
  const parties = dateStr.split("-");
  if (precision === "day" && parties.length === 3) {
    return `${parseInt(parties[2], 10)} ${MOIS[parseInt(parties[1], 10) - 1]} ${parties[0]}`;
  }
  if (precision === "month" && parties.length >= 2) {
    return `${MOIS[parseInt(parties[1], 10) - 1]} ${parties[0]}`;
  }
  return parties[0];
}

function afficherMorceaux(liste) {
  const corps = document.getElementById("songsBody");
  corps.innerHTML = "";

  liste.forEach((morceau) => {
    const artistes = (morceau.artists || []).map(a => a.name).join(", ");
    const album = morceau.album ? morceau.album.name : "";

    const ligne = document.createElement("tr");
    ligne.innerHTML = `
      <td>${echapper(morceau.name)}</td>
      <td>${echapper(artistes)}</td>
      <td>${echapper(album)}</td>
      <td class="text-end pe-3">
        <button class="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target="#detailModal" data-id="${morceau.id}">
          <i class="bi bi-info-circle"></i> Détails
        </button>
      </td>
    `;
    corps.appendChild(ligne);
  });
}

function afficherAlbums(liste) {
  const conteneur = document.getElementById("albumsContainer");
  conteneur.innerHTML = "";

  const albumsVus = new Map();
  liste.forEach(m => {
    if (m.album && !albumsVus.has(m.album.id)) {
      albumsVus.set(m.album.id, {
        album: m.album,
        artiste: m.artists && m.artists[0] ? m.artists[0].name : ""
      });
    }
  });

  const topAlbums = Array.from(albumsVus.values())
    .sort((a, b) => (b.album.popularity || 0) - (a.album.popularity || 0))
    .slice(0, 6);

  topAlbums.forEach(({ album, artiste }) => {
    const image = album.images && album.images.length ? album.images[album.images.length - 1].url : "";

    const carte = document.createElement("div");
    carte.className = "col";
    carte.innerHTML = `
      <div class="card h-100">
        <div class="ratio ratio-1x1 bg-light">
          ${image ? `<img src="${image}" alt="${echapper(album.name)}" class="w-100 h-100" style="object-fit:cover;">` : ""}
        </div>
        <div class="card-body p-2 d-flex flex-column">
          <span class="fw-semibold lh-sm">${echapper(album.name)}</span>
          <span class="small">${echapper(artiste)}</span>
          <span class="small text-muted mt-auto">${formaterDate(album.release_date, album.release_date_precision)}</span>
          <div class="d-flex gap-2 mt-2">
            <span class="badge rounded-pill bg-primary">${album.total_tracks} titres</span>
            <span class="badge rounded-pill bg-success">${album.popularity}/100</span>
          </div>
        </div>
      </div>
    `;
    conteneur.appendChild(carte);
  });
}

document.addEventListener("click", (e) => {
  const bouton = e.target.closest("[data-bs-target='#detailModal']");
  if (!bouton) return;

  const morceau = morceaux.find(m => m.id === bouton.dataset.id);
  if (!morceau) return;

  const artistes = morceau.artists || [];
  const nomsArtistes = artistes.map(a => a.name).join(", ");
  const album = morceau.album || {};
  const pochette = album.images && album.images.length ? album.images[album.images.length - 1].url : "";

  document.getElementById("detailCover").src = pochette;
  document.getElementById("detailCover").alt = album.name || "";
  document.getElementById("detailAlbumNom").textContent = album.name || "";
  document.getElementById("detailAlbumMeta").textContent =
    `${formaterDate(album.release_date, album.release_date_precision)} • ${album.total_tracks ?? 0} titres`;
  document.getElementById("detailAlbumPop").textContent = `Popularité : ${album.popularity ?? 0}/100`;

  document.getElementById("detailTitreArtiste").textContent = `${morceau.name} - ${nomsArtistes}`;

  document.getElementById("detailAudio").src = morceau.preview_url || "";

  document.getElementById("detailDuree").textContent = formaterDuree(morceau.duration_ms);

  const popMorceau = morceau.popularity ?? 0;
  document.getElementById("detailPopBar").style.width = `${popMorceau}%`;
  document.getElementById("detailPop").textContent = `${popMorceau}/100`;

  document.getElementById("detailNumero").textContent = morceau.track_number ?? "";
  document.getElementById("detailExplicit").textContent = morceau.explicit ? "Oui" : "Non";

  document.getElementById("detailArtistes").innerHTML = artistes.map(a => {
    const avatar = a.images && a.images.length ? a.images[0].url : "";
    const followers = a.followers && a.followers.total ? a.followers.total.toLocaleString("fr-FR") : "0";
    return `
      <div class="d-flex align-items-center gap-2 mb-2">
        ${avatar ? `<img src="${avatar}" alt="${echapper(a.name)}" class="rounded-circle" width="40" height="40" style="object-fit:cover;">` : ""}
        <div>
          <div class="fw-semibold">${echapper(a.name)}</div>
          <div class="small text-muted">Popularité : ${a.popularity ?? 0}/100 — Followers : ${followers}</div>
        </div>
      </div>
    `;
  }).join("");

  const genresUniques = [...new Set(artistes.flatMap(a => a.genres || []))];
  document.getElementById("detailGenres").innerHTML = genresUniques.length
    ? genresUniques.map(g => `<span class="badge bg-dark me-1">${echapper(g)}</span>`).join("")
    : `<span class="text-muted small">Aucun genre renseigné</span>`;

  document.getElementById("detailLienDeezer").href = `https://www.deezer.com/track/${morceau.id}`;
});

document.getElementById("detailModal").addEventListener("hidden.bs.modal", () => {
  document.getElementById("detailAudio").pause();
});

document.getElementById("search").addEventListener("input", (e) => {
  const terme = e.target.value.toLowerCase();
  const filtres = morceaux.filter(m => {
    const artistes = (m.artists || []).map(a => a.name).join(" ").toLowerCase();
    const album = m.album ? m.album.name.toLowerCase() : "";
    return m.name.toLowerCase().includes(terme) || artistes.includes(terme) || album.includes(terme);
  });
  afficherMorceaux(filtres);
});

chargerMorceaux();
