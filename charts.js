// ===== charts.js =====
// Graphiques de la page "musique d'hina" (Chart.js), calculés à partir des morceaux de data/hina.json

let chartArtistesInstance = null;
let chartGenresInstance = null;

const couleursGenres = [
  "#f48fa0", "#6fb3e0", "#f4d06b", "#7cc7bb",
  "#b39ddb", "#f3a45c", "#82c785", "#bdbdbd",
  "#e57373", "#90caf9", "#fff176", "#a5d6a7"
];

function construireGraphiques(morceaux) {
  // ---- Top 10 des artistes (nombre de morceaux où l'artiste est l'artiste principal) ----
  const comptesArtistes = {};
  morceaux.forEach(m => {
    const nom = m.artists && m.artists[0] ? m.artists[0].name : "Inconnu";
    comptesArtistes[nom] = (comptesArtistes[nom] || 0) + 1;
  });
  const top10Artistes = Object.entries(comptesArtistes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (chartArtistesInstance) chartArtistesInstance.destroy();
  chartArtistesInstance = new Chart(document.getElementById("chartArtistes"), {
    type: "bar",
    data: {
      labels: top10Artistes.map(([nom]) => nom),
      datasets: [{
        data: top10Artistes.map(([, n]) => n),
        backgroundColor: "#9ec5e8",
        borderColor: "#7fb0dd",
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      aspectRatio: 1.4,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
          title: { display: true, text: "Nombre de morceaux" }
        }
      }
    }
  });

  // ---- Distribution des genres (genre principal de l'artiste principal) ----
  const comptesGenres = {};
  morceaux.forEach(m => {
    const genre = m.artists && m.artists[0] && m.artists[0].genres && m.artists[0].genres.length
      ? m.artists[0].genres[0]
      : "Autres";
    comptesGenres[genre] = (comptesGenres[genre] || 0) + 1;
  });
  const genresTries = Object.entries(comptesGenres).sort((a, b) => b[1] - a[1]);

  if (chartGenresInstance) chartGenresInstance.destroy();
  chartGenresInstance = new Chart(document.getElementById("chartGenres"), {
    type: "pie",
    data: {
      labels: genresTries.map(([genre]) => genre),
      datasets: [{
        data: genresTries.map(([, n]) => n),
        backgroundColor: couleursGenres
      }]
    },
    options: {
      responsive: true,
      aspectRatio: 1.4,
      plugins: {
        legend: {
          position: "right",
          labels: { boxWidth: 14, font: { size: 11 } }
        }
      }
    }
  });
}
