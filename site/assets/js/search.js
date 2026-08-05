(function () {
  var searchInput = document.getElementById("search-input");
  var sortSelect = document.getElementById("sort-select");
  var filterOptionInput = document.querySelector(".filter-option-input");
  var cards = Array.from(document.querySelectorAll(".engineer-card"));
  var cardGrid = document.querySelector(".directory .card-grid");
  var chips = Array.from(document.querySelectorAll(".chip"));
  var clearBtn = document.getElementById("clear-filters");
  var countEl = document.getElementById("results-count");
  var compactCountEl = document.querySelector("[data-compact-results]");
  var noResults = document.getElementById("no-results");
  var summaryEl = document.getElementById("active-filters-summary");
  var pillsEl = document.getElementById("active-filter-pills");
  var presetButtons = Array.from(document.querySelectorAll(".filter-preset"));

  var FILTER_KEYS = ["specializations", "frameworks", "languages", "available", "certifications"];
  var activeFilters = {};
  FILTER_KEYS.forEach(function (k) { activeFilters[k] = []; });

  /* --- Chip lookup cache: O(1) instead of querySelector per chip --- */
  var chipCache = {};
  chips.forEach(function (chip) {
    var group = chip.closest("[data-filter]");
    if (!group) return;
    var key = group.dataset.filter + ":" + chip.dataset.value;
    chipCache[key] = chip;
  });

  function getChip(filterKey, value) {
    return chipCache[filterKey + ":" + value] || null;
  }

  /* --- Badge element cache --- */
  var badgeCache = {};
  FILTER_KEYS.forEach(function (key) {
    var group = document.querySelector('.filter-group[data-group="' + key + '"]');
    if (group) badgeCache[key] = group.querySelector(".count-badge");
  });

  /* --- Pre-parse card data (avoids re-splitting on every filter) --- */
  var cardData = cards.map(function (card) {
    var parsed = {};
    FILTER_KEYS.forEach(function (k) {
      var attr = k === "available" ? "available" : k;
      parsed[k] = (card.dataset[attr] || "").split(",").filter(Boolean);
    });
    parsed.name = card.dataset.name || "";
    parsed.title = card.dataset.title || "";
    parsed.company = card.dataset.company || "";
    parsed.location = card.dataset.location || "";
    parsed.profileDepth = parseInt(card.dataset.profileDepth || "0", 10);
    parsed.hasAvailability = parsed.available.length > 0 ? 1 : 0;
    parsed.allText = [
      parsed.name,
      parsed.title,
      parsed.company,
      parsed.location
    ].concat(FILTER_KEYS.map(function (k) { return parsed[k].join(" "); })).join(" ");
    return parsed;
  });

  /* --- Debounce helper --- */
  function debounce(fn, delay) {
    var timer;
    return function() {
      clearTimeout(timer);
      timer = setTimeout(fn, delay);
    };
  }

  /* --- Phased filter transitions --- */
  var FADE_MS = 250;
  var pendingTimers = new Map();

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

  var _skipUrlSync = false;

  function sortCards() {
    if (!cardGrid || !sortSelect) return;

    var mode = sortSelect.value || "name";
    var indexed = cards.map(function (card, index) {
      return { card: card, data: cardData[index], index: index };
    });

    indexed.sort(function (a, b) {
      if (mode === "available") {
        if (b.data.hasAvailability !== a.data.hasAvailability) return b.data.hasAvailability - a.data.hasAvailability;
      } else if (mode === "profileDepth") {
        if (b.data.profileDepth !== a.data.profileDepth) return b.data.profileDepth - a.data.profileDepth;
      }

      return a.data.name.localeCompare(b.data.name) || a.index - b.index;
    });

    indexed.forEach(function (item) {
      cardGrid.appendChild(item.card);
    });
  }

  function updateCards() {
    var query = (searchInput.value || "").toLowerCase().trim();
    var visible = 0;

    sortCards();

    cards.forEach(function (card, i) {
      var data = cardData[i];
      var show = true;

      if (query && data.allText.indexOf(query) === -1) show = false;

      for (var fi = 0; show && fi < FILTER_KEYS.length; fi++) {
        var key = FILTER_KEYS[fi];
        if (activeFilters[key].length > 0) {
          var vals = data[key];
          var has = activeFilters[key].some(function (v) { return vals.indexOf(v) !== -1; });
          if (!has) show = false;
        }
      }

      if (show) { showCard(card); visible++; }
      else { hideCard(card); }
    });

    if (countEl) countEl.textContent = visible;
    if (compactCountEl) compactCountEl.textContent = visible;
    if (noResults) noResults.style.display = visible === 0 ? "" : "none";

    if (!_skipUrlSync) syncFiltersToUrl();
    updateSummary();
    updateBadgeCounts();
    updatePresetStates();
  }

  /* --- Filter workbench --- */
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

  groupHeaders.forEach(function (header) {
    header.addEventListener("click", function () {
      var group = header.closest(".filter-group");
      setOpenGroup(group);
    });
  });

  if (filterOptionInput) {
    filterOptionInput.addEventListener("input", filterOptionChips);
  }

  /* --- Active filter summary (event delegation + fragment batching) --- */
  function updateSummary() {
    if (!summaryEl || !pillsEl) return;
    var pills = [];
    FILTER_KEYS.forEach(function (key) {
      activeFilters[key].forEach(function (val) {
        var chip = getChip(key, val);
        var label = chip ? chip.textContent : val;
        pills.push({ key: key, value: val, label: label });
      });
    });

    var hasActive = pills.length > 0;
    summaryEl.style.display = hasActive ? "" : "none";

    var fragment = document.createDocumentFragment();
    pills.forEach(function (p) {
      var btn = document.createElement("button");
      btn.className = "active-filter-pill";
      btn.dataset.filterKey = p.key;
      btn.dataset.filterValue = p.value;
      btn.innerHTML = p.label + ' <span class="pill-x">\u00d7</span>';
      fragment.appendChild(btn);
    });
    pillsEl.innerHTML = "";
    pillsEl.appendChild(fragment);
  }

  /* Event delegation for pill clicks (single listener instead of per-pill) */
  if (pillsEl) {
    pillsEl.addEventListener("click", function (e) {
      var pill = e.target.closest(".active-filter-pill");
      if (!pill) return;
      var key = pill.dataset.filterKey;
      var value = pill.dataset.filterValue;
      var chip = getChip(key, value);
      if (chip) {
        chip.classList.remove("active");
        chip.setAttribute("aria-pressed", "false");
      }
      var idx = activeFilters[key].indexOf(value);
      if (idx !== -1) activeFilters[key].splice(idx, 1);
      updateCards();
    });
  }

  /* --- Badge counts on group headers --- */
  function updateBadgeCounts() {
    FILTER_KEYS.forEach(function (key) {
      var badge = badgeCache[key];
      if (!badge) return;
      var count = activeFilters[key].length;
      badge.textContent = count;
      badge.style.display = count > 0 ? "" : "none";
    });
  }

  /* --- URL-based filter persistence --- */
  function syncFiltersToUrl() {
    var params = new URLSearchParams();
    var query = searchInput.value.trim();
    if (query) params.set("q", query);
    if (sortSelect && sortSelect.value && sortSelect.value !== "name") params.set("sort", sortSelect.value);
    Object.keys(activeFilters).forEach(function(key) {
      if (activeFilters[key].length) {
        params.set(key, activeFilters[key].join(","));
      }
    });
    var newUrl = params.toString() ? "?" + params.toString() : window.location.pathname;
    history.replaceState(null, "", newUrl);
  }

  function restoreFiltersFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var q = params.get("q");
    if (q) searchInput.value = q;
    var sort = params.get("sort");
    if (sort && sortSelect) sortSelect.value = sort;
    FILTER_KEYS.forEach(function(key) {
      var val = params.get(key);
      if (val) {
        activeFilters[key] = val.split(",");
        activeFilters[key].forEach(function(v) {
          var chip = getChip(key, v);
          if (chip) {
            chip.classList.add("active");
            chip.setAttribute("aria-pressed", "true");
          }
        });
        // Auto-expand groups that have active filters
        var group = document.querySelector('.filter-group[data-group="' + key + '"]');
        if (group && activeFilters[key].length && !document.querySelector(".filter-group.open .chip.active")) {
          setOpenGroup(group);
        }
      }
    });
    if (!document.querySelector(".filter-group.open")) {
      setOpenGroup(document.querySelector(".filter-group"));
    }
    _skipUrlSync = true;
    updateCards();
    _skipUrlSync = false;
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

  /* --- Chip click with pop animation --- */
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var group = chip.closest("[data-filter]");
      if (!group) return;
      var filterKey = group.dataset.filter;
      var value = chip.dataset.value;

      var idx = activeFilters[filterKey].indexOf(value);
      if (idx !== -1) {
        activeFilters[filterKey].splice(idx, 1);
        chip.classList.remove("active");
        chip.setAttribute("aria-pressed", "false");
      } else {
        activeFilters[filterKey].push(value);
        chip.classList.add("active");
        chip.setAttribute("aria-pressed", "true");
      }

      // Pop animation
      chip.classList.add("pop");
      chip.addEventListener("animationend", function() {
        chip.classList.remove("pop");
      }, { once: true });

      updateCards();
    });
  });

  presetButtons.forEach(function (preset) {
    preset.addEventListener("click", function () {
      applyPreset(preset);
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", debounce(updateCards, 150));
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", updateCards);
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      searchInput.value = "";
      activeFilters.specializations = [];
      activeFilters.frameworks = [];
      activeFilters.languages = [];
      activeFilters.available = [];
      activeFilters.certifications = [];
      syncChipState();
      history.replaceState(null, "", window.location.pathname);
      updateCards();
    });
  }

  /* --- "/" keyboard shortcut to focus search --- */
  document.addEventListener("keydown", function (e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable) return;
    if (e.key === "/" && searchInput) {
      e.preventDefault();
      searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
      searchInput.focus();
    }
  });

  /* --- Restore filters from URL on load --- */
  restoreFiltersFromUrl();
})();
