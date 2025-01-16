// Fetch festival data from JSON file
let festivalData = [];
fetch('./festivals.json')
  .then((response) => response.json())
  .then((data) => {
    festivalData = data;
    initializePage();
  })
  .catch((error) => console.error('Error loading festival data:', error));

// ========== GLOBAL STATE ==========
let currentPage = 1;
let festivalsPerPage = 6; // Changes based on viewport
let currentSearchTerm = "";
let filteredFestivals = [];

// ========== DOM ELEMENTS ==========
const searchInput = document.getElementById("searchInput");
const festivalList = document.getElementById("festivalList");
const paginationControls = document.getElementById("paginationControls");
const festivalModal = document.getElementById("festivalModal");
const closeModalBtn = document.getElementById("closeModal");
const modalBackBtn = document.getElementById("modalBackBtn");
const modalFestivalName = document.getElementById("modalFestivalName");
const modalMonth = document.getElementById("modalMonth");
const modalEthnicGroup = document.getElementById("modalEthnicGroup");
const modalLocation = document.getElementById("modalLocation");
const modalDescription = document.getElementById("modalDescription");
const modalImages = document.getElementById("modalImages");
const modalVideos = document.getElementById("modalVideos");

// ========== INITIALIZATION ==========
function initializePage() {
  // Load saved state from localStorage
  const savedSearch = localStorage.getItem("festivals_search") || "";
  const savedPage = localStorage.getItem("festivals_page") || "1";

  // Read from URL params (overrides localStorage)
  const urlParams = new URLSearchParams(window.location.search);

  currentSearchTerm = urlParams.get("search") || savedSearch;
  currentPage = parseInt(urlParams.get("page"), 10) || parseInt(savedPage, 10) || 1;

  if (!currentPage || currentPage < 1) currentPage = 1;

  // Update search input
  searchInput.value = currentSearchTerm;

  applySearchAndRender(currentSearchTerm, currentPage);

  // Event listeners
  setupEventListeners();
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
  searchInput.addEventListener("input", () => {
    currentSearchTerm = searchInput.value.toLowerCase();
    currentPage = 1;
    updateURLAndStorage();
    applySearchAndRender(currentSearchTerm, currentPage);
  });

  closeModalBtn.addEventListener("click", closeModal);
  modalBackBtn.addEventListener("click", closeModal);

  window.addEventListener("click", (event) => {
    if (event.target === festivalModal) closeModal();
  });

  window.addEventListener("resize", () => {
    renderFestivals();
  });
}

// ========== FILTERING + RENDERING ==========
function applySearchAndRender(searchTerm, page) {
  filteredFestivals = festivalData.filter((festival) => {
    const nameMatch = festival.name.toLowerCase().includes(searchTerm);
    const monthMatch = festival.month.toLowerCase().includes(searchTerm);
    const groupMatch = festival.ethnicGroup.toLowerCase().includes(searchTerm);
    return nameMatch || monthMatch || groupMatch;
  });

  currentPage = page;
  renderFestivals();
}

function renderFestivals() {
  updateFestivalsPerPage();

  festivalList.innerHTML = "";

  const totalPages = Math.ceil(filteredFestivals.length / festivalsPerPage);

  if (currentPage > totalPages && totalPages > 0) {
    currentPage = totalPages;
  } else if (totalPages === 0) {
    currentPage = 1;
  }

  const startIndex = (currentPage - 1) * festivalsPerPage;
  const endIndex = startIndex + festivalsPerPage;
  const festivalsToShow = filteredFestivals.slice(startIndex, endIndex);

  festivalsToShow.forEach((festival) => {
    const card = document.createElement("div");
    card.className = "festival-card";
    card.innerHTML = `
      <h2>${festival.name}</h2>
      <p><strong>Month:</strong> ${festival.month}</p>
      <p><strong>Group:</strong> ${festival.ethnicGroup}</p>
    `;
    card.addEventListener("click", () => openModal(festival));
    festivalList.appendChild(card);
  });

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  paginationControls.innerHTML = "";

  if (totalPages <= 1) return;

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Prev";
  prevBtn.className = "page-button" + (currentPage === 1 ? " disabled" : "");
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      updateURLAndStorage();
      renderFestivals();
    }
  });
  paginationControls.appendChild(prevBtn);

  const pages = getPaginationRange(currentPage, totalPages, 2);
  pages.forEach((p) => {
    if (p === "...") {
      const ellipsis = document.createElement("button");
      ellipsis.textContent = "...";
      ellipsis.className = "ellipsis page-button";
      ellipsis.disabled = true;
      paginationControls.appendChild(ellipsis);
    } else {
      const pageBtn = document.createElement("button");
      pageBtn.textContent = p;
      pageBtn.className = "page-button" + (p === currentPage ? " active" : "");
      pageBtn.addEventListener("click", () => {
        currentPage = p;
        updateURLAndStorage();
        renderFestivals();
      });
      paginationControls.appendChild(pageBtn);
    }
  });

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.className = "page-button" + (currentPage === totalPages ? " disabled" : "");
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      updateURLAndStorage();
      renderFestivals();
    }
  });
  paginationControls.appendChild(nextBtn);
}

function updateFestivalsPerPage() {
  const width = window.innerWidth;
  if (width < 768) {
    festivalsPerPage = 6;
  } else if (width < 1024) {
    festivalsPerPage = 9;
  } else {
    festivalsPerPage = 12;
  }
}

function getPaginationRange(current, total, delta = 2) {
  const pages = [];
  const c = Math.max(1, Math.min(current, total));
  pages.push(1);
  if (c - delta > 2) pages.push("...");
  for (let i = Math.max(2, c - delta); i <= Math.min(total - 1, c + delta); i++) {
    pages.push(i);
  }
  if (c + delta < total - 1) pages.push("...");
  if (total > 1) pages.push(total);
  return pages;
}

// ========== MODAL LOGIC ==========
function openModal(festival) {
  modalFestivalName.textContent = festival.name;
  modalMonth.textContent = festival.month || "N/A";
  modalEthnicGroup.textContent = festival.ethnicGroup || "N/A";
  modalLocation.textContent = festival.location || "N/A";

  // Process nested description
  modalDescription.innerHTML = processDescription(festival.description);

  modalImages.innerHTML = "";
  if (festival.images && festival.images.length > 0) {
    festival.images.forEach((imgSrc) => {
      const img = document.createElement("img");
      img.src = imgSrc;
      img.alt = festival.name;
      modalImages.appendChild(img);
    });
  }

  modalVideos.innerHTML = "";
  if (festival.videos && festival.videos.length > 0) {
    festival.videos.forEach((vidSrc) => {
      const video = document.createElement("video");
      video.controls = true;
      const source = document.createElement("source");
      source.src = vidSrc;
      source.type = "video/mp4";
      video.appendChild(source);
      modalVideos.appendChild(video);
    });
  }

  festivalModal.style.display = "block";
}

function processDescription(description) {
  if (!description || typeof description !== "object") {
    return "No description available.";
  }

  let formattedDescription = "";

  for (const [key, value] of Object.entries(description)) {
    formattedDescription += `<h3>${capitalizeFirstLetter(key.replace(/([A-Z])/g, ' $1'))}</h3>`;
    
    if (Array.isArray(value)) {
      formattedDescription += "<ul>";
      value.forEach((item) => {
        formattedDescription += `<li>${item}</li>`;
      });
      formattedDescription += "</ul>";
    } else {
      formattedDescription += `<p>${value}</p>`;
    }
  }

  return formattedDescription;
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}


function closeModal() {
  festivalModal.style.display = "none";
}

// ========== UTILITY ==========
function updateURLAndStorage() {
  localStorage.setItem("festivals_search", currentSearchTerm);
  localStorage.setItem("festivals_page", currentPage.toString());

  const url = new URL(window.location);
  url.searchParams.set("search", currentSearchTerm);
  url.searchParams.set("page", currentPage);
  window.history.replaceState({}, "", url.toString());
}
