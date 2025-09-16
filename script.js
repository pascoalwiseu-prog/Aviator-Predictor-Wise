async function uploadCSV() {
  const input = document.getElementById("csvInput");
  if (!input.files.length) {
    alert("Selecione um arquivo primeiro!");
    return;
  }

  const formData = new FormData();
  formData.append("file", input.files[0]);

  const res = await fetch("/api/upload", { method: "POST", body: formData });
  const data = await res.json();

  const out = document.getElementById("output");
  out.innerHTML = "<h2>Rodadas</h2>";

  let table = "<table><tr><th>ID</th><th>Odd</th><th>Time</th></tr>";
  data.rounds.forEach(r => {
    table += `<tr><td>${r.id}</td><td>${r.odd}</td><td>${r.time}</td></tr>`;
  });
  table += "</table>";

  out.innerHTML += table;
}