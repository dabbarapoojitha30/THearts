const table = document.getElementById('patientsTable')?.querySelector('tbody');
const searchInput = document.getElementById('searchId');
const searchBtn = document.getElementById('searchBtn');
const resetBtn = document.getElementById('resetBtn');

// ------------------- LOAD ALL PATIENTS -------------------
async function loadPatients() {
    if (!table) return;
    try {
        const res = await fetch('/patients');
        const data = await res.json();
        table.innerHTML = '';

        data.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.patient_id}</td>
                <td>${p.name}</td>
                <td>${p.age || ''}</td>
                <td>${p.location || ''}</td>
                <td>
                    <button class="btn btn-sm btn-primary editBtn">Edit</button>
                    <button class="btn btn-sm btn-danger deleteBtn">Delete</button>
                    <button class="btn btn-sm btn-success pdfBtn">PDF</button>
                </td>
            `;
            table.appendChild(tr);

            tr.querySelector('.editBtn').onclick = () => editPatient(p.patient_id);
            tr.querySelector('.deleteBtn').onclick = () => deletePatient(p.patient_id);
            tr.querySelector('.pdfBtn').onclick = () => generatePDF(p.patient_id, p.name);
        });
    } catch (err) {
        console.error("Error loading patients:", err);
    }
}

// Initial load
loadPatients();

// ------------------- EDIT -------------------
function editPatient(id) {
    window.location.href = `index.html?update=${id}`;
}

// ------------------- DELETE -------------------
async function deletePatient(id) {
    if (!confirm("Delete this patient?")) return;
    try {
        const res = await fetch(`/patients/${id}`, { method: 'DELETE' });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || "Delete failed");
        }
        alert("Patient deleted successfully");
        loadPatients();
    } catch (err) {
        alert("Delete error: " + err.message);
        console.error(err);
    }
}

async function generatePDF(id, name) {
    try {
        const res = await fetch(`/patients/${id}`);
        if (!res.ok) throw new Error("Patient fetch failed");
        const data = await res.json();

        const pdfRes = await fetch('/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!pdfRes.ok) throw new Error(await pdfRes.text());

        const tableBody = document.querySelector("#patientsTable tbody");
const searchInput = document.getElementById("searchId");
const searchBtn = document.getElementById("searchBtn");
const resetBtn = document.getElementById("resetBtn");

// ---------------- LOAD ALL PATIENTS ----------------
async function loadPatients(name = "") {
    const url = name 
        ? `/patients/search?name=${encodeURIComponent(name)}`
        : `/patients`;   // SAME endpoint admin uses

    try {
        const res = await fetch(url);
        const data = await res.json();

        tableBody.innerHTML = "";

        if (!Array.isArray(data) || data.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='5'>No records found</td></tr>";
            return;
        }

        data.forEach(p => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${p.patient_id}</td>
                <td>${p.name}</td>
                <td>${p.age || ""}</td>
                <td>${p.location || ""}</td>
                <td>
                    <button class="btn btn-sm btn-success pdfBtn">PDF</button>
                </td>
            `;
            tableBody.appendChild(tr);

            tr.querySelector(".pdfBtn").onclick = () => generatePDF(p.patient_id, p.name);
        });

    } catch (err) {
        console.error("Guest load error:", err);
        tableBody.innerHTML = "<tr><td colspan='5'>Error loading data</td></tr>";
    }
}

// ---------------- PDF ----------------
async function generatePDF(id, name) {
    try {
        const res = await fetch(`/patients/${id}`);
        const data = await res.json();

        const pdfRes = await fetch('/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

       const blob = await pdfRes.blob();
const url = URL.createObjectURL(blob);

const a = document.createElement('a');
a.href = url;
a.download = `${id}-${name.replace(/[^a-z0-9]/gi, '_')}.pdf`;

document.body.appendChild(a);
a.click();
a.remove();

URL.revokeObjectURL(url);

    } catch (err) {
        alert("PDF generation failed");
    }
}

// ---------------- SEARCH ----------------
if (searchBtn) {
    searchBtn.addEventListener("click", () => {
        const name = searchInput.value.trim();
        loadPatients(name);
    });
}

// ---------------- RESET ----------------
if (resetBtn) {
    resetBtn.addEventListener("click", () => {
        searchInput.value = "";
        loadPatients();
    });
}

// Initial load
loadPatients();
    } catch (err) {
        alert("PDF failed: " + err.message);
        console.error(err);
    }
}


// ------------------- SEARCH BY NAME -------------------
if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim().toLowerCase();
        if (!query) { alert("Enter Patient Name"); return; }

        let found = false;
        document.querySelectorAll('#patientsTable tbody tr').forEach(row => {
            const rowName = row.cells[1].innerText.toLowerCase();
            if (rowName.includes(query)) {
                row.style.display = '';
                row.classList.add('highlight');
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                found = true;
            } else {
                row.style.display = 'none';
                row.classList.remove('highlight');
            }
        });

        if (!found) alert("No matching patient found");
    });
}

// ------------------- RESET -------------------
if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        document.querySelectorAll('#patientsTable tbody tr').forEach(row => {
            row.style.display = '';
            row.classList.remove('highlight');
        });
        searchInput.value = '';
    });
}