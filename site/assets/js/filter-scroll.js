(function () {
  var filters = document.querySelector(".filters");
  if (!filters) return;

  var lastScrollY = window.scrollY || 0;
  var ticking = false;
  var hideAfter = 260;
  var minDelta = 8;

  function hasActiveControl() {
    return filters.contains(document.activeElement);
  }

  function setHidden(hidden) {
    filters.classList.toggle("filters-hidden", hidden);
  }

  function updateFilterVisibility() {
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
})();
