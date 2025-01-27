$(document).ready(function () {
  let offersData = null;

  // Load JSON data
  $.getJSON("data/offers.json", function (data) {
    offersData = data;
    updateFormattedText();
    updateOffersTable();
    populateOperatorSelect();
  });

  function updateFormattedText() {
    let text = "";
    $.each(offersData.operators, function (key, operator) {
      text += `🟨${operator.name} All Offer:\n\n`;
      $.each(operator.packages, function (i, offer) {
        text += `👉${offer.volume} - ${offer.price}/-\n`;
      });
      text += `\n🟥উল্লেখ্য সকল অফারের মেয়াদ ${
        operator.packages[0]?.validity || "৩০দিন"
      }।\n`;
      text +=
        "-----------------------------------------------------------------------\n\n";
    });
    $("#formattedOffers").val(text);
  }

  function updateOffersTable() {
    const $tableBody = $("#offersTable tbody");
    $tableBody.empty();

    $.each(offersData.operators, function (key, operator) {
      $.each(operator.packages, function (i, offer) {
        const $row = $("<tr>");
        $row.append($("<td>").text(operator.name));
        $row.append($("<td>").text(offer.volume));
        $row.append($("<td>").text(offer.price));
        $row.append($("<td>").text(offer.validity));
        const $actions = $("<td>").addClass("action-buttons");
        $actions.append(
          $("<button>")
            .addClass("btn btn-sm btn-primary me-2")
            .html('<i class="bi bi-pencil"></i>')
            .click(function () {
              editOffer(key, i);
            })
        );
        $actions.append(
          $("<button>")
            .addClass("btn btn-sm btn-danger")
            .html('<i class="bi bi-trash"></i>')
            .click(function () {
              deleteOffer(key, i);
            })
        );
        $row.append($actions);
        $tableBody.append($row);
      });
    });
  }

  function populateOperatorSelect() {
    const $select = $("#editOperator");
    $select.empty();
    $.each(offersData.operators, function (key, operator) {
      $select.append($("<option>").val(key).text(operator.name));
    });
  }

  function editOffer(operatorKey, offerIndex) {
    const offer = offersData.operators[operatorKey].packages[offerIndex];
    $("#formTitle").text("Edit Offer");
    $("#editOfferId").val(JSON.stringify({ operatorKey, offerIndex }));
    $("#editOperator").val(operatorKey);
    $("#editData").val(offer.volume);
    $("#editPrice").val(offer.price);
    $("#editValidity").val(offer.validity);
    $("#offerForm").show();
  }

  function addNewOffer() {
    $("#formTitle").text("Add New Offer");
    $("#editOfferId").val("");
    $("#offerFormElement")[0].reset();
    $("#offerForm").show();
  }

  $("#offerFormElement").submit(function (e) {
    e.preventDefault();
    const editId = $("#editOfferId").val();
    const operatorKey = $("#editOperator").val();
    const newOffer = {
      volume: $("#editData").val(),
      price: $("#editPrice").val(),
      validity: $("#editValidity").val(),
    };

    if (editId) {
      const { offerIndex } = JSON.parse(editId);
      offersData.operators[operatorKey].packages[offerIndex] = newOffer;
    } else {
      if (!offersData.operators[operatorKey].packages) {
        offersData.operators[operatorKey].packages = [];
      }
      offersData.operators[operatorKey].packages.push(newOffer);
    }

    updateFormattedText();
    updateOffersTable();
    $("#offerForm").hide();
  });

  function deleteOffer(operatorKey, offerIndex) {
    if (confirm("Are you sure you want to delete this offer?")) {
      offersData.operators[operatorKey].packages.splice(offerIndex, 1);
      updateFormattedText();
      updateOffersTable();
    }
  }

  $("#saveJSON").click(function () {
    const jsonString = JSON.stringify(offersData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "offers.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  $("#formattedOffers").on("input", function () {
    const formattedText = $(this).val();
    try {
      const parsedData = parseFormattedText(formattedText);
      offersData.operators = parsedData;
      updateOffersTable();
    } catch (error) {
      console.error("Error parsing formatted text:", error);
      alert(
        "There was an error parsing the formatted text. Please check the format and try again."
      );
    }
  });

  function parseFormattedText(text) {
    const operators = {};
    let currentOperator = null;
    const lines = text.split("\n");

    for (let line of lines) {
      line = line.trim();
      if (line.startsWith("🟨")) {
        // New operator section
        const operatorName = line
          .replace("🟨", "")
          .replace(" All Offer:", "")
          .trim();
        currentOperator = {
          name: operatorName,
          packages: [],
        };
        operators[operatorName.toLowerCase().replace(/\s+/g, "")] =
          currentOperator;
      } else if (line.startsWith("👉") && currentOperator) {
        // Offer line
        const offerMatch = line.match(/👉(.+)\s-\s(.+)\/-(.*)/);
        if (offerMatch) {
          const [, data, price] = offerMatch;
          currentOperator.packages.push({
            volume: data.trim(),
            price: price.trim(),
            validity: "30 days",
          });
        }
      } else if (line.startsWith("🟥") && currentOperator) {
        // Validity line
        const validityMatch = line.match(/মেয়াদ\s(.+)।/);
        if (validityMatch) {
          const validity = validityMatch[1].trim();
          currentOperator.packages.forEach((pkg) => (pkg.validity = validity));
        }
      }
    }

    return operators;
  }

  $("#addNewOffer").click(addNewOffer);

  $("#cancelEdit").click(function () {
    $("#offerForm").hide();
  });
});
