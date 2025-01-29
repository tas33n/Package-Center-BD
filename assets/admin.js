$(document).ready(function () {
  let offersData = null;
  const offerModal = new bootstrap.Modal(document.getElementById("offerModal"));

  // Authentication check
  $.get("api/auth.php", function (response) {
    response = JSON.parse(response);
    if (response.status !== "authenticated") {
      requestAdminKey();
    } else {
      loadOffers();
    }
  });

  function requestAdminKey() {
    Swal.fire({
      title: "Admin Login",
      input: "password",
      inputLabel: "Enter Admin Key",
      showCancelButton: false,
      confirmButtonText: "Login",
      background: "#0f0f0f",
      color: "#0ff",
      preConfirm: (key) => {
        return $.post("auth.php", { key }).then((response) => {
          response = JSON.parse(response);
          if (response.status !== "success") {
            Swal.showValidationMessage(response.message);
          } else {
            loadOffers();
          }
        });
      },
    });
  }

  $("#generateText").click(function () {
    const formattedText = generateFormattedText();
    $("#formattedOutput").val(formattedText);
  });

  $("#copyText").click(function () {
    const textarea = document.getElementById("formattedOutput");
    textarea.select();
    document.execCommand("copy");

    $(textarea).addClass("copy-success");
    setTimeout(() => $(textarea).removeClass("copy-success"), 1000);

    const $btn = $(this);
    const originalHtml = $btn.html();
    $btn.html('<i class="bi bi-check"></i> Copied!');
    setTimeout(() => $btn.html(originalHtml), 2000);
  });

  // Auto-generate text when data is loaded
  const originalLoadOffers = loadOffers;
  loadOffers = function () {
    originalLoadOffers();
    setTimeout(() => $("#generateText").click(), 500);
  };

  function loadOffers() {
    $.getJSON("data/offers.json", function (data) {
      offersData = data;
      renderHighlightOffers();
      renderOperatorOffers();
      populateOperatorSelect();
    }).fail(function (jqXHR, textStatus, errorThrown) {
      Swal.fire({
        icon: "error",
        title: "Error Loading Data",
        text: "Failed to load offers data. Please try refreshing the page.",
        background: "#0f0f0f",
        color: "#0ff",
      });
    });
  }

  function renderHighlightOffers() {
    const $tableBody = $("#highlightOffersTable tbody");
    $tableBody.empty();

    offersData.highlightOffers.forEach((offer, index) => {
      const $row = $("<tr>");
      $row.append(
        $("<td>").text(offer.title),
        $("<td>").text(offer.data),
        $("<td>").text(offer.price),
        $("<td>").text(offer.validity),
        $("<td>").append(
          $("<div>")
            .addClass("btn-group")
            .append(
              $("<button>")
                .addClass("btn btn-sm btn-primary me-2")
                .html('<i class="bi bi-pencil"></i>')
                .click(() => openOfferModal("highlight", index)),
              $("<button>")
                .addClass("btn btn-sm btn-danger")
                .html('<i class="bi bi-trash"></i>')
                .click(() => deleteOffer("highlight", index))
            )
        )
      );
      $tableBody.append($row);
    });
  }

  function renderOperatorOffers() {
    const $operatorsSection = $("#operatorsSection");
    $operatorsSection.empty();

    Object.entries(offersData.operators).forEach(([key, operator]) => {
      const $section = $("<div>").addClass("section");
      $section.append(`
              <div class="d-flex justify-content-between align-items-center mb-3">
                  <h2 class="mb-0">${operator.name}</h2>
                  <button class="btn btn-success add-operator-offer" data-operator="${key}">
                      <i class="bi bi-plus-circle"></i> Add New Offer
                  </button>
              </div>
          `);

      const $table = $('<table class="table table-dark table-hover">');
      $table.append(`
              <thead>
                  <tr>
                      <th>Data</th>
                      <th>Price</th>
                      <th>Validity</th>
                      <th>Actions</th>
                  </tr>
              </thead>
          `);

      const $tbody = $("<tbody>");
      operator.packages.forEach((offer, index) => {
        const $row = $("<tr>");
        $row.append(
          $("<td>").text(offer.volume),
          $("<td>").text(offer.price),
          $("<td>").text(offer.validity),
          $("<td>").append(
            $("<div>")
              .addClass("btn-group")
              .append(
                $("<button>")
                  .addClass("btn btn-sm btn-primary me-2")
                  .html('<i class="bi bi-pencil"></i>')
                  .click(() => openOfferModal("operator", index, key)),
                $("<button>")
                  .addClass("btn btn-sm btn-danger")
                  .html('<i class="bi bi-trash"></i>')
                  .click(() => deleteOffer("operator", index, key))
              )
          )
        );
        $tbody.append($row);
      });

      $table.append($tbody);
      $section.append($table);
      $operatorsSection.append($section);
    });

    $(".add-operator-offer").click(function () {
      const operatorKey = $(this).data("operator");
      openOfferModal("operator", null, operatorKey);
    });
  }

  function populateOperatorSelect() {
    const $select = $("#editOperator");
    $select.empty();
    Object.entries(offersData.operators).forEach(([key, operator]) => {
      $select.append($("<option>").val(key).text(operator.name));
    });
  }

  function openOfferModal(type, index, operatorKey = null) {
    $("#editType").val(type);
    $("#editOfferId").val(index);
    $("#editOperator").val(operatorKey);

    const $titleField = $("#editTitle").parent();
    const $operatorField = $("#editOperator").parent();

    if (type === "highlight") {
      $titleField.show();
      $operatorField.hide();
      if (index !== null) {
        const offer = offersData.highlightOffers[index];
        $("#editTitle").val(offer.title);
        $("#editData").val(offer.data);
        $("#editPrice").val(offer.price);
        $("#editValidity").val(offer.validity);
        $("#offerModalLabel").text("Edit Highlight Offer");
      } else {
        $("#offerForm")[0].reset();
        $("#offerModalLabel").text("Add New Highlight Offer");
      }
    } else {
      $titleField.hide();
      $operatorField.show();
      if (index !== null) {
        const offer = offersData.operators[operatorKey].packages[index];
        $("#editData").val(offer.volume);
        $("#editPrice").val(offer.price);
        $("#editValidity").val(offer.validity);
        $("#offerModalLabel").text("Edit Operator Offer");
      } else {
        $("#offerForm")[0].reset();
        $("#editOperator").val(operatorKey);
        $("#offerModalLabel").text("Add New Operator Offer");
      }
    }

    offerModal.show();
  }

  function deleteOffer(type, index, operatorKey = null) {
    Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      background: "#0f0f0f",
      color: "#0ff",
    }).then((result) => {
      if (result.isConfirmed) {
        if (type === "highlight") {
          offersData.highlightOffers.splice(index, 1);
          renderHighlightOffers();
        } else {
          offersData.operators[operatorKey].packages.splice(index, 1);
          renderOperatorOffers();
        }
        saveJSON();
      }
    });
  }

  function validateOfferData(offerData) {
    const required = ["data", "price", "validity"];
    const missing = required.filter((field) => !offerData[field]);

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(", ")}`);
    }

    if (isNaN(parseFloat(offerData.price))) {
      throw new Error("Price must be a valid number");
    }

    return true;
  }

  $("#saveOfferBtn").click(function () {
    const type = $("#editType").val();
    const index = $("#editOfferId").val();
    const operatorKey = $("#editOperator").val();

    const newOffer = {
      data: $("#editData").val(),
      price: $("#editPrice").val(),
      validity: $("#editValidity").val(),
    };

    if (type === "highlight") {
      newOffer.title = $("#editTitle").val();
      if (!newOffer.title) {
        Swal.fire({
          icon: "error",
          title: "Validation Error",
          text: "Title is required for highlight offers",
          background: "#0f0f0f",
          color: "#0ff",
        });
        return;
      }
    }

    try {
      validateOfferData(newOffer);

      if (type === "highlight") {
        if (index !== "") {
          offersData.highlightOffers[index] = newOffer;
        } else {
          offersData.highlightOffers.push(newOffer);
        }
        renderHighlightOffers();
      } else {
        if (index !== "") {
          offersData.operators[operatorKey].packages[index] = {
            ...newOffer,
            volume: newOffer.data,
          };
        } else {
          offersData.operators[operatorKey].packages.push({
            ...newOffer,
            volume: newOffer.data,
          });
        }
        renderOperatorOffers();
      }

      saveJSON();
      offerModal.hide();

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Offer has been saved successfully",
        background: "#0f0f0f",
        color: "#0ff",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: error.message,
        background: "#0f0f0f",
        color: "#0ff",
      });
    }
  });

  function formatDate(date) {
    const options = { day: "2-digit", month: "2-digit", year: "2-digit" };
    return new Date(date).toLocaleDateString("en-GB", options);
  }

  function generateFormattedText() {
    const today = formatDate(new Date());
    let formattedText = `Todays - ${today}:\n\n`;

    const sortedOperators = Object.entries(offersData.operators).sort((a, b) =>
      a[1].name.localeCompare(b[1].name)
    );

    sortedOperators.forEach(([key, operator]) => {
      formattedText += `🟨${operator.name} All Offer:\n\n`;

      const dataOnly = operator.packages.filter((pkg) => !pkg.minutes);
      const minutesOnly = operator.packages.filter(
        (pkg) => pkg.minutes && !pkg.volume
      );
      const combo = operator.packages.filter(
        (pkg) => pkg.minutes && pkg.volume
      );

      dataOnly.forEach((pkg) => {
        formattedText += `👉${formatData(pkg.volume)} - ${formatPrice(
          pkg.price
        )}/-${pkg.family ? " (ফ্যামিলি প্যাক)" : ""}\n`;
      });

      if (dataOnly.length > 0 && (minutesOnly.length > 0 || combo.length > 0)) {
        formattedText += "\n";
      }

      minutesOnly.forEach((pkg) => {
        formattedText += `👉${formatMinutes(pkg.minutes)}মিনিট - ${formatPrice(
          pkg.price
        )}/-${pkg.family ? " (ফ্যামিলি প্যাক)" : ""}${
          pkg.validity !== "30" ? ` [মেয়াদ ${pkg.validity}দিন]` : ""
        }\n`;
      });

      if (minutesOnly.length > 0 && combo.length > 0) {
        formattedText += "\n";
      }

      combo.forEach((pkg) => {
        formattedText += `👉${formatData(pkg.volume)} + ${formatMinutes(
          pkg.minutes
        )}মিনিট - ${formatPrice(pkg.price)}/-${
          pkg.family ? " (ফ্যামিলি প্যাক)" : ""
        }${pkg.recharge ? ` (রিচার্জ ${pkg.recharge}/-)` : ""}\n`;
      });

      formattedText += "\n🟥উল্লেখ্য সকল অফারের মেয়াদ ৩০দিন।\n";
      formattedText +=
        "-----------------------------------------------------------------------\n\n";
    });

    return formattedText;
  }

  function updateFormattedText() {
    if ($("#formattedOutput").val()) {
      $("#generateText").click();
    }
  }

  function formatData(volume) {
    const data = parseFloat(volume);
    return data >= 1000 ? `${data / 1000}টিবি` : `${data}জিবি`;
  }

  function formatMinutes(minutes) {
    return minutes.toString();
  }

  function formatPrice(price) {
    return price.toString();
  }

  function saveJSON() {
    $.ajax({
      url: "api/update.php",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify(offersData),
      success: function (response) {
        if (response.status === "unauthenticated") {
          Swal.fire({
            icon: "error",
            title: "Update Failed",
            text: "Unauthenticated request. Please login again.",
            background: "#0f0f0f",
            color: "#0ff",
          });
        } else {
          $("#updateBackend")
            .removeClass("btn-warning")
            .addClass("btn-success")
            .html('<i class="bi bi-check-circle"></i> Updated')
            .prop("disabled", true);
          updateFormattedText();

          setTimeout(() => {
            $("#updateBackend")
              .removeClass("btn-success")
              .addClass("btn-warning")
              .html('<i class="bi bi-cloud-upload"></i> Update Backend')
              .prop("disabled", false);
          }, 2000);
        }
      },
      error: function (xhr, status, error) {
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: "Failed to update the backend. Please try again.",
          background: "#0f0f0f",
          color: "#0ff",
        });
      },
    });
  }

  $("#updateBackend").click(function () {
    saveJSON();
  });

  $("#addHighlightOffer").click(function () {
    openOfferModal("highlight", null);
  });

  $("#offerModal").on("hidden.bs.modal", function () {
    $("#offerForm")[0].reset();
  });
});

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
