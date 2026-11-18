const STORAGE_KEY = "ikigoAdmissionsPrototype_v1";
const DEFAULT_DATA = {
  school: {
    name: "The Suite School Rwanda",
    description: "A welcoming place to learn, grow and build a strong foundation for the future.",
    fee: 10000
  },
  applications: []
};
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
const money = value => `${new Intl.NumberFormat("en-RW", { maximumFractionDigits: 0 }).format(Number(value) || 0)} RWF`;

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && saved.school && Array.isArray(saved.applications)) {
      return {
        school: { ...DEFAULT_DATA.school, ...saved.school },
        applications: saved.applications
      };
    }
  } catch (error) {
    console.warn("Could not read saved school admissions data.", error);
  }
  return structuredClone(DEFAULT_DATA);
}
let state = loadData();

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function setView(name) {
  $$(".view").forEach(view => view.classList.toggle("hidden", view.id !== `${name}-view`));
  $$(".nav-button").forEach(button => button.classList.toggle("active", button.dataset.view === name));
  if (name === "track") renderParentApplications();
  if (name === "admin") renderAdmin();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.add("hidden"), 3000);
}
function updateSchoolPage() {
  $("#brand-name").textContent = state.school.name;
  $("#footer-school-name").textContent = state.school.name;
  $("#school-description").textContent = state.school.description;
  $("#registration-fee").innerHTML = `${new Intl.NumberFormat("en-RW", { maximumFractionDigits: 0 }).format(Number(state.school.fee) || 0)} <span>RWF</span>`;
  document.title = `${state.school.name} | School admissions`;
}
function statusClass(status) {
  return {
    Submitted: "status-submitted",
    Reviewing: "status-reviewing",
    Accepted: "status-accepted",
    "Not accepted": "status-not-accepted"
  }[status] || "status-submitted";
}
function normalizeSearchTerm(value) {
  return String(value ?? "").trim().toLowerCase();
}
function matchesApplicationSearch(application, term) {
  if (!term) return true;
  const haystack = [
    application.learnerName,
    application.guardianName,
    application.grade,
    application.phone,
    application.email,
    application.status,
    application.id
  ].join(" ").toLowerCase();
  return haystack.includes(term);
}
function renderParentApplications() {
  const applications = [...state.applications].reverse();
  const search = normalizeSearchTerm($("#parent-search").value);
  const visibleApplications = applications.filter(application => matchesApplicationSearch(application, search));
  $("#parent-applications").innerHTML = visibleApplications.map(application => `
    <article class="card application-card">
      <div class="application-main">
        <h3>${escapeHtml(application.learnerName)}</h3>
        <p>Application ${escapeHtml(application.id.slice(0, 8).toUpperCase())} · Submitted ${new Date(application.submittedAt).toLocaleDateString()}</p>
        <div class="application-meta"><span>Class: ${escapeHtml(application.grade)}</span><span>Guardian: ${escapeHtml(application.guardianName)}</span><span>Contact: ${escapeHtml(application.phone)}</span></div>
      </div>
      <span class="status ${statusClass(application.status)}">${escapeHtml(application.status)}</span>
    </article>
  `).join("");
  $("#parent-empty").classList.toggle("hidden", visibleApplications.length > 0 || search.length > 0);
  if (search && !visibleApplications.length) {
    $("#parent-applications").innerHTML = `<article class="card empty-card empty-inline"><span class="empty-icon">✳</span><h3>No matches found</h3><p>Try another learner, guardian, class or status.</p></article>`;
  }
}
function renderAdmin() {
  const applications = [...state.applications].reverse();
  const pending = state.applications.filter(application => ["Submitted", "Reviewing"].includes(application.status)).length;
  const accepted = state.applications.filter(application => application.status === "Accepted").length;
  $("#metric-total").textContent = state.applications.length;
  $("#metric-pending").textContent = pending;
  $("#metric-accepted").textContent = accepted;

  const filter = $("#status-filter").value;
  const search = normalizeSearchTerm($("#office-search").value);
  const filtered = applications.filter(application => {
    const matchesFilter = filter === "all" || application.status === filter;
    const matchesSearch = matchesApplicationSearch(application, search);
    return matchesFilter && matchesSearch;
  });
  $("#office-applications").innerHTML = filtered.map(application => `
    <article class="office-application">
      <div class="office-person"><strong>${escapeHtml(application.learnerName)}</strong><small>${escapeHtml(application.guardianName)}</small></div>
      <div class="office-detail"><span>CLASS · CONTACT</span>${escapeHtml(application.grade)} · ${escapeHtml(application.phone)}</div>
      <div class="office-detail"><span>DOCUMENTS · FEE REF.</span>${escapeHtml(application.reportCardName)} / ${escapeHtml(application.registrationLetterName)} · ${escapeHtml(application.paymentReference || "No ref.")}</div>
      <div class="office-actions">
        ${application.status !== "Reviewing" && application.status !== "Accepted" && application.status !== "Not accepted" ? `<button class="mini-button" data-decision="Reviewing" data-id="${escapeHtml(application.id)}">Review</button>` : ""}
        ${application.status !== "Accepted" ? `<button class="mini-button accept" data-decision="Accepted" data-id="${escapeHtml(application.id)}">Accept</button>` : ""}
        ${application.status !== "Not accepted" ? `<button class="mini-button decline" data-decision="Not accepted" data-id="${escapeHtml(application.id)}">Decline</button>` : ""}
        <span class="status ${statusClass(application.status)}">${escapeHtml(application.status)}</span>
      </div>
    </article>
  `).join("");
  $("#office-empty").classList.toggle("hidden", filtered.length > 0);
  if (!filtered.length) {
    $("#office-applications").innerHTML = `<article class="card empty-card empty-inline"><span class="empty-icon">✳</span><h3>No matching applications</h3><p>Adjust the filter or search to find a record.</p></article>`;
  }

  const settings = $("#settings-form");
  settings.elements.schoolName.value = state.school.name;
  settings.elements.fee.value = state.school.fee;
  settings.elements.description.value = state.school.description;
}
function submitApplication(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const reportCard = form.elements.reportCard.files[0];
  const registrationLetter = form.elements.registrationLetter.files[0];
  const maxFileSize = 10 * 1024 * 1024;
  const error = $("#application-error");
  error.classList.add("hidden");
  error.textContent = "";
  if (!reportCard || !registrationLetter) {
    error.textContent = "Select both a report card and a registration letter.";
    error.classList.remove("hidden");
    return;
  }
  if (reportCard.size > maxFileSize || registrationLetter.size > maxFileSize) {
    error.textContent = "Each document must be smaller than 10 MB.";
    error.classList.remove("hidden");
    return;
  }
  const application = {
    id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    learnerName: String(data.get("learnerName")).trim(),
    dateOfBirth: String(data.get("dateOfBirth")),
    grade: String(data.get("grade")),
    guardianName: String(data.get("guardianName")).trim(),
    phone: String(data.get("phone")).trim(),
    email: String(data.get("email")).trim(),
    reportCardName: reportCard.name,
    registrationLetterName: registrationLetter.name,
    paymentReference: String(data.get("paymentReference")).trim(),
    status: "Submitted",
    submittedAt: new Date().toISOString()
  };
  state.applications.push(application);
  saveData();
  form.reset();
  showToast("Application saved in this browser.");
  setView("track");
}
function saveSchoolSettings(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const fee = Number(data.get("fee"));
  if (!Number.isFinite(fee) || fee < 0) {
    showToast("Enter a valid registration fee.");
    return;
  }
  state.school = {
    name: String(data.get("schoolName")).trim(),
    fee,
    description: String(data.get("description")).trim()
  };
  saveData();
  updateSchoolPage();
  const success = $("#settings-success");
  success.classList.remove("hidden");
  setTimeout(() => success.classList.add("hidden"), 3000);
}
function updateApplicationStatus(id, status) {
  const application = state.applications.find(item => item.id === id);
  if (!application) return;
  application.status = status;
  saveData();
  renderAdmin();
  showToast(`Application marked ${status.toLowerCase()}.`);
}

$$("[data-view]").forEach(button => button.addEventListener("click", () => setView(button.dataset.view)));
$$("[data-view='apply']").forEach(button => button.addEventListener("click", () => setView("apply")));
$("#application-form").addEventListener("submit", submitApplication);
$("#settings-form").addEventListener("submit", saveSchoolSettings);
$("#status-filter").addEventListener("change", renderAdmin);
$("#office-search").addEventListener("input", renderAdmin);
$("#parent-search").addEventListener("input", renderParentApplications);
$("#office-applications").addEventListener("click", event => {
  const button = event.target.closest("[data-decision]");
  if (button) updateApplicationStatus(button.dataset.id, button.dataset.decision);
});
$("#current-year").textContent = new Date().getFullYear();
updateSchoolPage();
renderParentApplications();
renderAdmin();
