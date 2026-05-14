(function () {
  var searchInput = document.getElementById("search-input");
  if (!searchInput) return;

  var sortSelect = document.getElementById("sort-select");
  var filterOptionInput = document.querySelector(".filter-option-input");
  var cards = Array.from(document.querySelectorAll(".job-card"));
  var cardGrid = document.querySelector(".jobs-directory .card-grid");
  var chips = Array.from(document.querySelectorAll(".chip"));
  var clearBtn = document.getElementById("clear-filters");
  var countEl = document.getElementById("results-count");
  var noResults = document.getElementById("no-results");
  var summaryEl = document.getElementById("active-filters-summary");
  var pillsEl = document.getElementById("active-filter-pills");
  var presetButtons = Array.from(document.querySelectorAll(".filter-preset"));

  var FILTER_KEYS = ["specializations", "frameworks", "workModes", "jobTypes", "sources"];
  var DATA_KEYS = {
    specializations: "specializations",
    frameworks: "frameworks",
    workModes: "workModes",
    jobTypes: "jobTypes",
    sources: "sources"
  };

  var activeFilters = {};
  FILTER_KEYS.forEach(function (key) { activeFilters[key] = []; });

  var chipCache = {};
  chips.forEach(function (chip) {
    var group = chip.closest("[data-filter]");
    if (!group) return;
    chipCache[group.dataset.filter + ":" + chip.dataset.value] = chip;
  });

  var badgeCache = {};
  FILTER_KEYS.forEach(function (key) {
    var group = document.querySelector('.filter-group[data-group="' + key + '"]');
    if (group) badgeCache[key] = group.querySelector(".count-badge");
  });

  var cardData = cards.map(function (card) {
    var parsed = {};
    FILTER_KEYS.forEach(function (key) {
      parsed[key] = (card.dataset[DATA_KEYS[key]] || "").split(",").filter(Boolean);
    });
    parsed.title = card.dataset.title || "";
    parsed.company = card.dataset.company || "";
    parsed.location = card.dataset.location || "";
    parsed.posted = Date.parse(card.dataset.posted || "") || 0;
    parsed.allText = [
      parsed.title,
      parsed.company,
      parsed.location
    ].concat(FILTER_KEYS.map(function (key) { return parsed[key].join(" "); })).join(" ");
    return parsed;
  });

  var _skipUrlSync = false;

  var FADE_MS = 250;
  var pendingTimers = new Map();

  function getChip(filterKey, value) {
    return chipCache[filterKey + ":" + value] || null;
  }

  function hideCard(card) {
    if (card.classList.contains("hidden")) return;
    if (pendingTimers.has(card)) {
      clearTimeout(pendingTimers.get(card));
      pendingTimers.delete(card);
    }
    card.classList.add("fading");
    var timer = setTimeout(function () {
      card.classList.add("hidden");
      pendingTimers.delete(card);
    }, FADE_MS);
    pendingTimers.set(card, timer);
  }

  function showCard(card) {
    if (!card.classList.contains("hidden") && !card.classList.contains("fading")) return;
    if (pendingTimers.has(card)) {
      clearTimeout(pendingTimers.get(card));
      pendingTimers.delete(card);
    }
    card.classList.remove("hidden", "fading");
  }

  function updateSummary() {
    if (!summaryEl || !pillsEl) return;

    var pills = [];
    FILTER_KEYS.forEach(function (key) {
      activeFilters[key].forEach(function (value) {
        var chip = getChip(key, value);
        pills.push({
          key: key,
          value: value,
          label: chip ? chip.textContent : value
        });
      });
    });

    summaryEl.style.display = pills.length ? "" : "none";
    pillsEl.innerHTML = "";

    pills.forEach(function (pill) {
      var btn = document.createElement("button");
      btn.className = "active-filter-pill";
      btn.dataset.filterKey = pill.key;
      btn.dataset.filterValue = pill.value;
      btn.innerHTML = pill.label + ' <span class="pill-x">\u00d7</span>';
      pillsEl.appendChild(btn);
    });
  }

  function updateBadgeCounts() {
    FILTER_KEYS.forEach(function (key) {
      var badge = badgeCache[key];
      if (!badge) return;
      badge.textContent = activeFilters[key].length;
      badge.style.display = activeFilters[key].length ? "" : "none";
    });
  }

  function sortCards() {
    if (!cardGrid || !sortSelect) return;

    var mode = sortSelect.value || "newest";
    var indexed = cards.map(function (card, index) {
      return { card: card, data: cardData[index], index: index };
    });

    indexed.sort(function (a, b) {
      if (mode === "title") {
        return a.data.title.localeCompare(b.data.title) || a.index - b.index;
      }
      if (mode === "company") {
        return a.data.company.localeCompare(b.data.company) || a.data.title.localeCompare(b.data.title) || a.index - b.index;
      }
      return b.data.posted - a.data.posted || a.index - b.index;
    });

    indexed.forEach(function (item) {
      cardGrid.appendChild(item.card);
    });
  }

  function syncFiltersToUrl() {
    var params = new URLSearchParams();
    var query = searchInput.value.trim();
    if (query) params.set("q", query);
    if (sortSelect && sortSelect.value && sortSelect.value !== "newest") params.set("sort", sortSelect.value);
    Object.keys(activeFilters).forEach(function (key) {
      if (activeFilters[key].length) {
        params.set(key, activeFilters[key].join(","));
      }
    });
    history.replaceState(null, "", params.toString() ? "?" + params.toString() : window.location.pathname);
  }

  function restoreFiltersFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var query = params.get("q");
    if (query) searchInput.value = query;
    var sort = params.get("sort");
    if (sort && sortSelect) sortSelect.value = sort;

    FILTER_KEYS.forEach(function (key) {
      var value = params.get(key);
      if (!value) return;

      activeFilters[key] = value.split(",");
      activeFilters[key].forEach(function (item) {
        var chip = getChip(key, item);
        if (chip) {
          chip.classList.add("active");
          chip.setAttribute("aria-pressed", "true");
        }
      });

      var group = document.querySelector('.filter-group[data-group="' + key + '"]');
      if (group && activeFilters[key].length && !document.querySelector(".filter-group.open .chip.active")) {
        setOpenGroup(group);
      }
    });

    if (!document.querySelector(".filter-group.open")) {
      setOpenGroup(document.querySelector(".filter-group"));
    }

    _skipUrlSync = true;
    updateCards();
    _skipUrlSync = false;
  }

  function updateCards() {
    var query = (searchInput.value || "").toLowerCase().trim();
    var visible = 0;

    sortCards();

    cards.forEach(function (card, index) {
      var data = cardData[index];
      var show = true;

      if (query && data.allText.indexOf(query) === -1) show = false;

      for (var i = 0; show && i < FILTER_KEYS.length; i++) {
        var key = FILTER_KEYS[i];
        if (activeFilters[key].length) {
          var values = data[key];
          var hasMatch = activeFilters[key].some(function (value) {
            return values.indexOf(value) !== -1;
          });
          if (!hasMatch) show = false;
        }
      }

      if (show) {
        showCard(card);
        visible += 1;
      } else {
        hideCard(card);
      }
    });

    if (countEl) countEl.textContent = visible;
    if (noResults) noResults.style.display = visible === 0 ? "" : "none";
    if (!_skipUrlSync) syncFiltersToUrl();
    updateSummary();
    updateBadgeCounts();
    updatePresetStates();
  }

  var groupHeaders = Array.from(document.querySelectorAll(".filter-group-header"));
  var mobileTabs = createMobileTabs();

  function createMobileTabs() {
    var groups = document.querySelector(".filter-groups");
    if (!groups || !groupHeaders.length || document.querySelector(".filter-mobile-tabs")) return [];

    var tabs = document.createElement("div");
    tabs.className = "filter-mobile-tabs";
    tabs.setAttribute("aria-label", "Filter categories");

    groupHeaders.forEach(function (header) {
      var group = header.closest(".filter-group");
      if (!group) return;

      var label = header.querySelector("span") ? header.querySelector("span").textContent : header.textContent.trim();
      var tab = document.createElement("button");
      tab.type = "button";
      tab.className = "filter-mobile-tab";
      tab.dataset.group = group.dataset.group || "";
      tab.textContent = label;
      tab.addEventListener("click", function () {
        setOpenGroup(group);
      });
      tabs.appendChild(tab);
    });

    groups.parentNode.insertBefore(tabs, groups);
    return Array.from(tabs.querySelectorAll(".filter-mobile-tab"));
  }

  function syncWorkbenchTabs() {
    var openGroup = document.querySelector(".filter-group.open");
    if (!openGroup) return;

    mobileTabs.forEach(function (tab) {
      var isActive = tab.dataset.group === openGroup.dataset.group;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function filterOptionChips() {
    var query = filterOptionInput ? filterOptionInput.value.toLowerCase().trim() : "";
    var openGroup = document.querySelector(".filter-group.open");
    if (!openGroup) return;

    Array.from(openGroup.querySelectorAll(".chip")).forEach(function (chip) {
      chip.classList.toggle("option-hidden", Boolean(query) && chip.textContent.toLowerCase().indexOf(query) === -1);
    });
  }

  function setOpenGroup(group) {
    if (!group) return;
    document.querySelectorAll(".filter-group.open").forEach(function (openGroup) {
      if (openGroup !== group) {
        openGroup.classList.remove("open");
        var openHeader = openGroup.querySelector(".filter-group-header");
        if (openHeader) openHeader.setAttribute("aria-expanded", "false");
      }
    });
    group.classList.add("open");
    var header = group.querySelector(".filter-group-header");
    if (header) header.setAttribute("aria-expanded", "true");
    if (filterOptionInput) filterOptionInput.value = "";
    document.querySelectorAll(".chip.option-hidden").forEach(function (chip) {
      chip.classList.remove("option-hidden");
    });
    syncWorkbenchTabs();
  }

  document.querySelectorAll(".filter-group-header").forEach(function (header) {
    header.addEventListener("click", function () {
      var group = header.closest(".filter-group");
      setOpenGroup(group);
    });
  });

  if (filterOptionInput) {
    filterOptionInput.addEventListener("input", filterOptionChips);
  }

  function parsePresetValues(value) {
    return (value || "").split("|").map(function (item) {
      return item.trim().toLowerCase();
    }).filter(Boolean);
  }

  function syncChipState() {
    chips.forEach(function (chip) {
      var group = chip.closest("[data-filter]");
      if (!group) return;

      var key = group.dataset.filter;
      var isActive = activeFilters[key].indexOf(chip.dataset.value) !== -1;
      chip.classList.toggle("active", isActive);
      chip.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function applyPreset(preset) {
    searchInput.value = "";
    FILTER_KEYS.forEach(function (key) {
      activeFilters[key] = parsePresetValues(preset.dataset[key]);
    });
    syncChipState();

    var firstActiveKey = FILTER_KEYS.find(function (key) {
      return activeFilters[key].length > 0;
    });
    if (firstActiveKey) {
      setOpenGroup(document.querySelector('.filter-group[data-group="' + firstActiveKey + '"]'));
    }

    updateCards();
  }

  function updatePresetStates() {
    presetButtons.forEach(function (preset) {
      var hasPreset = false;
      var matches = true;

      FILTER_KEYS.forEach(function (key) {
        var values = parsePresetValues(preset.dataset[key]);
        if (values.length) hasPreset = true;

        values.forEach(function (value) {
          if (activeFilters[key].indexOf(value) === -1) matches = false;
        });
      });

      preset.classList.toggle("active", hasPreset && matches);
      preset.setAttribute("aria-pressed", hasPreset && matches ? "true" : "false");
    });
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var group = chip.closest("[data-filter]");
      if (!group) return;
      var key = group.dataset.filter;
      var value = chip.dataset.value;
      var isActive = chip.classList.toggle("active");

      chip.setAttribute("aria-pressed", isActive ? "true" : "false");

      if (isActive) {
        if (activeFilters[key].indexOf(value) === -1) activeFilters[key].push(value);
      } else {
        activeFilters[key] = activeFilters[key].filter(function (item) { return item !== value; });
      }

      updateCards();
    });
  });

  presetButtons.forEach(function (preset) {
    preset.addEventListener("click", function () {
      applyPreset(preset);
    });
  });

  pillsEl && pillsEl.addEventListener("click", function (event) {
    var pill = event.target.closest(".active-filter-pill");
    if (!pill) return;

    var key = pill.dataset.filterKey;
    var value = pill.dataset.filterValue;
    var chip = getChip(key, value);
    if (chip) {
      chip.classList.remove("active");
      chip.setAttribute("aria-pressed", "false");
    }
    activeFilters[key] = activeFilters[key].filter(function (item) { return item !== value; });
    updateCards();
  });

  clearBtn && clearBtn.addEventListener("click", function () {
    searchInput.value = "";
    FILTER_KEYS.forEach(function (key) { activeFilters[key] = []; });
    syncChipState();
    if (sortSelect) sortSelect.value = "newest";
    history.replaceState(null, "", window.location.pathname);
    updateCards();
  });

  searchInput.addEventListener("input", updateCards);
  sortSelect && sortSelect.addEventListener("change", updateCards);
  restoreFiltersFromUrl();
})();
