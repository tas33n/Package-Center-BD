function showLoading() {
  $(".loading-overlay").show();
}

function hideLoading() {
  $(".loading-overlay").hide();
}

async function fetchOffers() {
  showLoading();
  try {
    const response = await fetch("data/offers.json");
    const data = await response.json();
    hideLoading();
    return data;
  } catch (error) {
    console.error("Error loading offers:", error);
    hideLoading();
    return null;
  }
}

function loadHotOffers(offers) {
  const hotOffersSlider = $("#hot-offers-slider");
  hotOffersSlider.empty();

  offers.highlightOffers.forEach((offer) => {
    const offerElement = $(`
            <div class="hot-offer-card">
                <h3>${offer.title}</h3>
                <p>${offer.data}</p>
                <p class="validity">Validity: ${offer.validity}</p>
                <div class="price">৳${offer.price}</div>
                <button class="buy-btn">Buy Now</button>
            </div>
        `);

    offerElement.on("click", function () {
      copyOfferToClipboard($(this));
    });

    offerElement.find(".buy-btn").on("click", (e) => {
      e.stopPropagation();
      const formattedInfo = formatOfferInfo(offerElement);
      copyOfferToClipboard(formattedInfo);
      const whatsappLink = generateWhatsAppLink(offerElement);
      window.open(whatsappLink, "_blank");
    });

    hotOffersSlider.append(offerElement);
  });
}

// Load operators
function loadOperators(operators) {
  const operatorsGrid = $("#operators-grid");
  operatorsGrid.empty();

  Object.entries(operators).forEach(([key, operator]) => {
    const operatorElement = $(`
            <div class="operator-card" data-operator="${key}">
                <img src="${operator.logo}" alt="${operator.name}">
                <h3>${operator.name}</h3>
            </div>
        `);

    operatorsGrid.append(operatorElement);
  });
}

function filterAndSortPackages(packages) {
  const searchTerm = $("#search-input").val().toLowerCase();
  const minPrice = Number.parseFloat($("#min-price").val()) || 0;
  const maxPrice =
    Number.parseFloat($("#max-price").val()) || Number.POSITIVE_INFINITY;
  const sortOption = $("#sort-select").val();

  const filteredPackages = packages.filter((pkg) => {
    const price = Number.parseFloat(pkg.price);
    return (
      (pkg.volume.toLowerCase().includes(searchTerm) ||
        pkg.type.toLowerCase().includes(searchTerm) ||
        price.toString().includes(searchTerm)) &&
      price >= minPrice &&
      price <= maxPrice
    );
  });

  if (sortOption === "price-low-high") {
    filteredPackages.sort(
      (a, b) => Number.parseFloat(a.price) - Number.parseFloat(b.price)
    );
  } else if (sortOption === "price-high-low") {
    filteredPackages.sort(
      (a, b) => Number.parseFloat(b.price) - Number.parseFloat(a.price)
    );
  }

  return filteredPackages;
}

function loadPackages(operator, type, packages, append = false) {
  const packagesGrid = $("#packages-grid");
  if (!append) {
    packagesGrid.empty();
    currentPage = 1;
  }

  const filteredAndSortedPackages = filterAndSortPackages(packages);

  filteredAndSortedPackages.forEach((pkg) => {
    const packageElement = $(`
            <div class="package-card">
                <h3>${pkg.volume}</h3>
                <p class="validity">Validity: ${pkg.validity}</p>
                <ul class="features">
                    ${pkg.features.map((f) => `<li>${f}</li>`).join("")}
                </ul>
                <div class="price">৳${pkg.price}</div>
                <button class="buy-btn">Buy Now</button>
            </div>
        `);

    packageElement.on("click", function () {
      copyOfferToClipboard($(this));
    });

    packageElement.find(".buy-btn").on("click", (e) => {
      e.stopPropagation();
      const formattedInfo = formatOfferInfo(packageElement);
      copyOfferToClipboard(formattedInfo);
      const whatsappLink = generateWhatsAppLink(packageElement);
      window.open(whatsappLink, "_blank");
    });

    packagesGrid.append(packageElement);
  });

  if (filteredAndSortedPackages.length === packagesPerPage) {
    packagesGrid.append('<button class="load-more-btn">Load More</button>');
  }
}

function initHotOffersSwiper() {
  new Swiper(".hot-offers-slider", {
    slidesPerView: "auto",
    spaceBetween: 16,
    freeMode: true,
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
  });
}

// Lazy load packages as user scrolls
function initLazyLoading(data) {
  const packagesSection = document.querySelector(".packages-section");
  const options = {
    root: null,
    rootMargin: "0px",
    threshold: 0.1,
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        loadMorePackages(data);
        observer.unobserve(entry.target);
      }
    });
  }, options);

  observer.observe(packagesSection);
}

let currentPage = 1;
const packagesPerPage = 10;

function loadMorePackages(data) {
  const operator = $(".operator-card.active").data("operator") || "robi";
  const type = $(".btn-filter.active").data("type") || "all";
  const allPackages = data.operators[operator].packages;
  const filteredPackages = allPackages.filter(
    (pkg) => type === "all" || pkg.type === type
  );

  const startIndex = (currentPage - 1) * packagesPerPage;
  const endIndex = startIndex + packagesPerPage;
  const packagesToLoad = filteredPackages.slice(startIndex, endIndex);

  loadPackages(operator, type, packagesToLoad, true);
  currentPage++;

  if (endIndex >= filteredPackages.length) {
    // All packages have been loaded
    $(".load-more-btn").hide();
  }
}

async function initializePage() {
  const data = await fetchOffers();
  if (!data) return;

  loadHotOffers(data);
  loadOperators(data.operators);
  loadPackages(
    "robi",
    "all",
    data.operators.robi.packages.slice(0, packagesPerPage)
  );

  initHotOffersSwiper();
  initLazyLoading(data);

  $(document).on("click", ".operator-card", function () {
    const operator = $(this).data("operator");
    $(".operator-card").removeClass("active");
    $(this).addClass("active");
    loadPackages(
      operator,
      $(".btn-filter.active").data("type"),
      data.operators[operator].packages
    );
  });

  // Handle filter buttons
  $(".btn-filter").click(function () {
    $(".btn-filter").removeClass("active");
    $(this).addClass("active");
    const type = $(this).data("type");
    const operator = $(".operator-card.active").data("operator") || "robi";
    loadPackages(operator, type, data.operators[operator].packages);
  });

  $(document).on("click", ".load-more-btn", () => loadMorePackages(data));

  $("#search-input, #min-price, #max-price, #sort-select").on(
    "input change",
    () => {
      const operator = $(".operator-card.active").data("operator") || "robi";
      const type = $(".btn-filter.active").data("type") || "all";
      loadPackages(operator, type, data.operators[operator].packages);
    }
  );
}

// Start the application
$(document).ready(() => {
  initializePage();
});

function copyOfferToClipboard(offer) {
  let offerContent;
  if (typeof offer === "string") {
    offerContent = offer;
  } else {
    offerContent = formatOfferInfo(offer);
  }

  navigator.clipboard
    .writeText(offerContent)
    .then(() => {
      showToast("Offer details copied to clipboard!");
    })
    .catch((err) => {
      console.error("Failed to copy: ", err);
      showToast("Failed to copy offer details.");
    });
}

function showToast(message) {
  const toast = $('<div class="toast">' + message + "</div>");
  $("body").append(toast);
  setTimeout(() => {
    toast.addClass("show");
    setTimeout(() => {
      toast.removeClass("show");
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }, 100);
}

function formatOfferInfo(offerElement) {
  const title = offerElement.find("h3").text().trim();
  const volume = title.split(" ")[0];
  const price = offerElement.find(".price").text().trim();
  const validity = offerElement.find(".validity").text().trim();
  const operator = $(".operator-card.active").find("h3").text().trim();
  const features = offerElement
    .find(".features li")
    .map(function () {
      return $(this).text().trim();
    })
    .get()
    .join("\n");

  return `Offer Details:
Volume: ${volume}
Price: ${price}
Operator: ${operator}
${validity}
Features:
${features}`;
}

function generateWhatsAppLink(offerElement) {
  const title = offerElement.find("h3").text().trim();
  const volume = title;
  const price = offerElement.find(".price").text().trim();
  const operator = $(".operator-card.active").find("h3").text().trim();
  const message = encodeURIComponent(
    `I'm interested in the ${operator} offer: ${volume} at ${price}`
  );
  return `https://wa.me/+8801309222016?text=${message}`;
}

// my credit
function createMadeWithLoveMessage() {
  const footer = document.createElement("footer");
  footer.className = "text-center p-3";
  footer.style.cssText = `
      width: 100%;
      opacity: 0;
      transition: opacity 0.5s ease;
  `;

  const link = document.createElement("a");
  link.target = "_blank";
  link.href = "https://github.com/tas33n";
  link.style.textDecoration = "none";
  link.style.color = "#333";
  link.innerHTML = 'Made with <span style="color: #ff4f4f;">♥</span> by tas33n';
  footer.appendChild(link);
  document.body.appendChild(footer);

  setTimeout(() => {
    footer.style.opacity = "1";
  }, 3000);
}

document.addEventListener("DOMContentLoaded", createMadeWithLoveMessage);
