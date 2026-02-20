const tableBody = document.querySelector("#patientsTable tbody");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resetBtn = document.getElementById("resetBtn");
const patientDetailsDiv = document.getElementById("patientDetails");
const detailsPre = document.getElementById("detailsPre");

// ---------------- HELPER ----------------
function formatDate(dateStr){
    if(!dateStr) return '';
    const d = new Date(dateStr);
    if(isNaN(d)) return '';
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

// ---------------- LOAD PATIENTS ----------------
async function loadPatients(name="") {
    const url = name ? `/patients/search?name=${encodeURIComponent(name)}` : '/patients/all';
    try {
        const res = await fetch(url);
        console.log("Fetch URL:", url, "Status:", res.status);
        const data = await res.json();
        console.log("Data received:", data);

        tableBody.innerHTML = "";
        if (!Array.isArray(data) || data.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='5'>No records found</td></tr>";
            return;
        }

        data.forEach(p => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${p.patient_id || ''}</td>
                <td>${p.name || ''}</td>
                <td>${p.age || ''}</td>
                <td>${p.location || ''}</td>
                <td><button onclick="viewPatient('${p.patient_id}')">View</button></td>
            `;
            tableBody.appendChild(tr);
        });

    } catch(err) {
        console.error("Error fetching patients:", err);
        tableBody.innerHTML = "<tr><td colspan='5'>Error loading data</td></tr>";
    }
}

// ---------------- VIEW PATIENT ----------------
async function viewPatient(id){
    try{
        const res = await fetch(`/patients/${encodeURIComponent(id)}`);
        if(!res.ok) throw new Error("Patient not found");
        const data = await res.json();

        let html = `
Patient ID: ${data.patient_id || ''}
Name: ${data.name || ''}
DOB: ${formatDate(data.dob)}
Age: ${data.age || ''}
Sex: ${data.sex || ''}
Weight: ${data.weight || ''} kg
Location: ${data.location || ''}
Phone 1: ${data.phone1 || ''}
Phone 2: ${data.phone2 || ''}
Diagnosis: ${data.diagnosis || ''}
Situs & Looping: ${data.situs_loop || ''}
Systemic Veins: ${data.systemic_veins || ''}
Pulmonary Veins: ${data.pulmonary_veins || ''}
Atria: ${data.atria || ''}
Atrial Septum: ${data.atrial_septum || ''}
AV Valves: ${data.av_valves || ''}
Ventricles: ${data.ventricles || ''}
Ventricular Septum: ${data.ventricular_septum || ''}
Outflow Tracts: ${data.outflow_tracts || ''}
Pulmonary Arteries: ${data.pulmonary_arteries || ''}
Aortic Arch: ${data.aortic_arch || ''}
Others: ${data.others_field || ''}
Impression: ${data.impression || ''}
Review Date: ${formatDate(data.review_date)}
        `;

        detailsPre.innerText = html;
        patientDetailsDiv.classList.remove("d-none");
        window.scrollTo(0, patientDetailsDiv.offsetTop);

    } catch(err){
        alert(err.message);
    }
}

// ---------------- CLOSE DETAILS ----------------
function closeDetails(){
    patientDetailsDiv.classList.add("d-none");
    detailsPre.innerText = '';
}

// ---------------- SEARCH & RESET ----------------
searchBtn.addEventListener("click", () => loadPatients(searchInput.value.trim()));
resetBtn.addEventListener("click", () => {
    searchInput.value = "";
    loadPatients();
});

// ---------------- INITIAL LOAD ----------------
loadPatients();
