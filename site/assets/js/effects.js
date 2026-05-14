(function () {
  /* ── Helpers ── */
  function isDark() {
    return window.getEffectiveTheme() === "dark";
  }

  /* ── Charts ── */
  var chartInstances = [];

  var PALETTE_DARK = [
    "oklch(65% 0.18 52)",
    "oklch(72% 0.14 82)",
    "oklch(72% 0.16 150)",
    "oklch(72% 0.12 225)",
    "oklch(70% 0.12 275)",
    "oklch(68% 0.15 18)",
    "oklch(73% 0.13 115)",
    "oklch(70% 0.1 310)"
  ];

  var PALETTE_LIGHT = [
    "oklch(52% 0.16 48)",
    "oklch(51% 0.12 78)",
    "oklch(43% 0.14 150)",
    "oklch(42% 0.1 225)",
    "oklch(46% 0.1 275)",
    "oklch(48% 0.15 18)",
    "oklch(46% 0.12 115)",
    "oklch(46% 0.1 310)"
  ];

  function chartPalette() {
    return isDark() ? PALETTE_DARK : PALETTE_LIGHT;
  }

  function chartTextColor() {
    return getComputedStyle(document.documentElement).getPropertyValue("--text-secondary").trim() || (isDark() ? "oklch(70% 0.012 62)" : "oklch(43% 0.014 62)");
  }

  function withAlpha(color, alpha) {
    if (color.indexOf("oklch(") === 0) {
      return color.replace(")", " / " + alpha + ")");
    }
    return color;
  }

  function chartDefaults() {
    return {
      color: chartTextColor(),
      plugins: {
        legend: { labels: { color: chartTextColor(), font: { size: 11 } } },
      },
      scales: {
        x: { ticks: { color: chartTextColor() } },
        y: { ticks: { color: chartTextColor() } },
      },
    };
  }

  function initCharts() {
    if (typeof Chart === "undefined") return;

    var el = document.getElementById("chart-data");
    if (!el) return;
    var data;
    try { data = JSON.parse(el.textContent); } catch (e) { return; }

    Chart.defaults.color = chartTextColor();

    /* Specializations: horizontal bar */
    var specLabels = Object.keys(data.specializations).slice(0, 8);
    var specValues = specLabels.map(function (k) { return data.specializations[k]; });

    chartInstances.push(new Chart(document.getElementById("chart-specs"), {
      type: "bar",
      data: {
        labels: specLabels,
        datasets: [{
          data: specValues,
          backgroundColor: chartPalette().slice(0, specLabels.length),
          borderWidth: 0,
        }],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: chartTextColor(), stepSize: 1 }, grid: { display: false } },
          y: { ticks: { color: chartTextColor() }, grid: { display: false } },
        },
      },
    }));

    /* Frameworks: doughnut */
    var fwLabels = Object.keys(data.frameworks).slice(0, 8);
    var fwValues = fwLabels.map(function (k) { return data.frameworks[k]; });

    chartInstances.push(new Chart(document.getElementById("chart-frameworks"), {
      type: "doughnut",
      data: {
        labels: fwLabels,
        datasets: [{
          data: fwValues,
          backgroundColor: chartPalette().slice(0, fwLabels.length),
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "right", labels: { color: chartTextColor(), font: { size: 10 }, boxWidth: 12 } },
        },
      },
    }));

    /* Languages: horizontal bar */
    var langLabels = Object.keys(data.languages || {}).slice(0, 8);
    var langValues = langLabels.map(function (k) { return data.languages[k]; });

    if (langLabels.length) {
      chartInstances.push(new Chart(document.getElementById("chart-languages"), {
        type: "bar",
        data: {
          labels: langLabels,
          datasets: [{
            data: langValues,
            backgroundColor: chartPalette().slice(0, langLabels.length),
            borderWidth: 0,
          }],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: chartTextColor(), stepSize: 1 }, grid: { display: false } },
            y: { ticks: { color: chartTextColor() }, grid: { display: false } },
          },
        },
      }));
    }

    /* Availability: polar area */
    var availLabels = Object.keys(data.available_for);
    var availValues = availLabels.map(function (k) { return data.available_for[k]; });

    chartInstances.push(new Chart(document.getElementById("chart-available"), {
      type: "polarArea",
      data: {
        labels: availLabels,
        datasets: [{
          data: availValues,
          backgroundColor: chartPalette().slice(0, availLabels.length).map(function (c) { return withAlpha(c, 0.82); }),
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "right", labels: { color: chartTextColor(), font: { size: 10 }, boxWidth: 12 } },
        },
        scales: {
          r: { ticks: { display: false }, grid: { color: isDark() ? "oklch(98% 0.006 62 / 0.08)" : "oklch(20% 0.006 62 / 0.08)" } },
        },
      },
    }));
  }

  function updateChartColors() {
    var color = chartTextColor();
    var palette = chartPalette();
    chartInstances.forEach(function (c) {
      c.options.color = color;
      if (c.options.plugins && c.options.plugins.legend && c.options.plugins.legend.labels) {
        c.options.plugins.legend.labels.color = color;
      }
      if (c.options.scales) {
        ['x', 'y'].forEach(function (axis) {
          if (c.options.scales[axis] && c.options.scales[axis].ticks) {
            c.options.scales[axis].ticks.color = color;
          }
        });
        if (c.options.scales.r && c.options.scales.r.grid) {
          c.options.scales.r.grid.color = isDark() ? "oklch(98% 0.006 62 / 0.08)" : "oklch(20% 0.006 62 / 0.08)";
        }
      }
      /* Update segment colors to match theme */
      c.data.datasets.forEach(function (ds) {
        if (Array.isArray(ds.backgroundColor)) {
          var isPolar = c.config.type === "polarArea";
          ds.backgroundColor = palette.slice(0, ds.data.length).map(function (clr) {
            return isPolar ? withAlpha(clr, 0.82) : clr;
          });
        }
      });
      c.update("none");
    });
  }

  /* ── Theme reactivity ── */
  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      if (m.attributeName === "data-theme") {
        if (chartInstances.length) {
          Chart.defaults.color = chartTextColor();
          updateChartColors();
        }
      }
    });
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  /* ── Lazy-load charts when insights section enters viewport ── */
  function observeCharts() {
    var insightsSection = document.querySelector(".insights");
    if (!insightsSection || typeof IntersectionObserver === "undefined") {
      /* Fallback: init immediately if no IO support */
      initCharts();
      return;
    }
    var chartObserver = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        chartObserver.disconnect();
        initCharts();
      }
    }, { rootMargin: "200px" });
    chartObserver.observe(insightsSection);
  }

  /* ── Init ── */
  function init() {
    observeCharts();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(init, 50);
    });
  } else {
    setTimeout(init, 50);
  }
})();
