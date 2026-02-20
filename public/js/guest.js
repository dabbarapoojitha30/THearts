// ================== WAIT UNTIL DOM LOADS ==================
document.addEventListener("DOMContentLoaded", () => {

    const tableBody = document.querySelector("#patientsTable tbody");
    const searchInput = document.getElementById("searchId");
    const searchBtn = document.getElementById("searchBtn");
    const resetBtn = document.getElementById("resetBtn");

    // ---------------- LOAD PATIENTS ----------------
    async function loadPatients(name = "") {

        const url = name
            ? `/patients/search?name=${encodeURIComponent(name)}`
            : `/patients`;

        try {
            const res = await fetch(url);

            if (!res.ok) {
                throw new Error("Network response not ok");
            }

            const data = await res.json();

            tableBody.innerHTML = "";

            if (!Array.isArray(data) || data.length === 0) {
                tableBody.innerHTML =
                    "<tr><td colspan='5' style='text-align:center;'>No records found</td></tr>";
                return;
            }

            data.forEach(p => {

                const tr = document.createElement("tr");

                tr.innerHTML = `
                    <td>${p.patient_id}</td>
                    <td>${p.name}</td>
                    <td>${p.age ?? ""}</td>
                    <td>${p.location ?? ""}</td>
                    <td>
                        <button class="btn btn-sm btn-success pdfBtn">
                            PDF
                        </button>
                    </td>
                `;

                tableBody.appendChild(tr);

                // PDF button click
                const pdfBtn = tr.querySelector(".pdfBtn");
                pdfBtn.addEventListener("click", () => {
                    generatePDF(p.patient_id, p.name);
                });
            });

        } catch (err) {
            console.error("Guest load error:", err);
            tableBody.innerHTML =
                "<tr><td colspan='5' style='text-align:center;'>Error loading data</td></tr>";
        }
    }

    // ---------------- GENERATE PDF ----------------
    async function generatePDF(id, name) {

        try {
            const res = await fetch(`/patients/${id}`);

            if (!res.ok) {
                throw new Error("Failed to fetch patient data");
            }

            const data = await res.json();

            const pdfRes = await fetch("/generate-pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if (!pdfRes.ok) {
                throw new Error("PDF generation failed");
            }

            const blob = await pdfRes.blob();
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download =
                `${id}-${name.replace(/[^a-z0-9]/gi, "_")}.pdf`;

            document.body.appendChild(a);
            a.click();
            a.remove();

            URL.revokeObjectURL(url);

        } catch (err) {
            console.error(err);
            alert("PDF generation failed");
        }
    }

    // ---------------- SEARCH BUTTON ----------------
    if (searchBtn) {
        searchBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const name = searchInput.value.trim();
            loadPatients(name);
        });
    }

    // ---------------- RESET BUTTON ----------------
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            searchInput.value = "";
            loadPatients();
        });
    }

    // ---------------- INITIAL LOAD ----------------
    loadPatients();

});