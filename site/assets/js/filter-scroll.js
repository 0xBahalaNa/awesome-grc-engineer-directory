(function () {
  var filters = document.querySelector(".filters");
  if (!filters) return;

  var lastScrollY = window.scrollY || 0;
  var ticking = false;
  var hideAfter = 260;
  var minDelta = 8;
  var toggleButtons = Array.from(filters.querySelectorAll("[data-filter-toggle]"));
  var storageKey = "grcFiltersCollapsed:" + window.location.pathname;
  var manuallyCollapsed = getStoredCollapsed();

  setCollapsed(manuallyCollapsed, false);

  function hasActiveControl() {
    return filters.contains(document.activeElement);
  }

  function getStoredCollapsed() {
    try {
      var stored = window.sessionStorage.getItem(storageKey);
      if (stored !== null) return stored === "true";
      return window.matchMedia("(max-width: 600px)").matches;
    } catch (error) {
      return window.matchMedia("(max-width: 600px)").matches;
    }
  }

  function storeCollapsed(collapsed) {
    try {
      window.sessionStorage.setItem(storageKey, collapsed ? "true" : "false");
    } catch (error) {
      return;
    }
  }

  function setHidden(hidden) {
    filters.classList.toggle("filters-hidden", hidden);
  }

  function setCollapsed(collapsed, persist) {
    manuallyCollapsed = collapsed;
    filters.classList.toggle("filters-collapsed", collapsed);
    setHidden(false);

    toggleButtons.forEach(function (button) {
      button.setAttribute("aria-expanded", collapsed ? "false" : "true");
    });

    if (persist) storeCollapsed(collapsed);
  }

  function updateFilterVisibility() {
    if (manuallyCollapsed) {
      setHidden(false);
      ticking = false;
      return;
    }

    var currentY = window.scrollY || 0;
    var delta = currentY - lastScrollY;
    var nearTop = currentY < hideAfter;

    if (nearTop || hasActiveControl() || filters.matches(":hover")) {
      setHidden(false);
    } else if (delta > minDelta) {
      setHidden(true);
    } else if (delta < -minDelta) {
      setHidden(false);
    }

    lastScrollY = currentY;
    ticking = false;
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateFilterVisibility);
  }

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", function () {
    lastScrollY = window.scrollY || 0;
    setHidden(false);
  });
  filters.addEventListener("focusin", function () {
    setHidden(false);
  });
  filters.addEventListener("pointerenter", function () {
    setHidden(false);
  });
  toggleButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      setCollapsed(!manuallyCollapsed, true);
    });
  });
})();
