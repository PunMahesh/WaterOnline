function generateSampleData(count = 500) {
  const data = [];
  for (let i = 0; i < count; i++) {
    // Generate realistic water quality data
    const potable = Math.random() > 0.6; // ~40% potable
    data.push({
      ph: potable
        ? 6.5 + Math.random() * 2 + Math.random() * 0.5 // 6.5-9.0 for potable
        : 4 + Math.random() * 7, // 4-11 for non-potable
      hardness: 50 + Math.random() * 250,
      solids: 300 + Math.random() * 35000,
      chloramines: Math.random() * 15,
      sulfate: Math.random() * 400,
      conductivity: 200 + Math.random() * 600,
      organic_carbon: Math.random() * 25,
      trihalomethanes: Math.random() * 120,
      turbidity: Math.random() * 8,
      potability: potable ? 1 : 0,
    });
  }
  return data;
}

// Initialize dashboard
async function initDashboard() {
  try {
    // Try to fetch real data first, fallback to sample data
    let data;
    try {
      const response = await fetch("/api/water-data");
      data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("Invalid data format");
      }
    } catch (error) {
      console.log("Using sample data for demonstration");
      data = generateSampleData(1000);
    }

    document.getElementById("loadingIndicator").style.display = "none";
    updateStatistics(data);
    createCharts(data);
  } catch (error) {
    document.getElementById("loadingIndicator").innerHTML =
      '<div class="error">Error loading data. Using sample data for demonstration.</div>';
    setTimeout(() => {
      const data = generateSampleData(1000);
      document.getElementById("loadingIndicator").style.display = "none";
      updateStatistics(data);
      createCharts(data);
    }, 1000);
  }
}

function updateStatistics(data) {
  const total = data.length;
  const potable = data.filter((d) => d.potability === 1).length;
  const nonPotable = total - potable;
  const avgPH = (data.reduce((sum, d) => sum + (d.ph || 0), 0) / total).toFixed(
    2
  );

  document.getElementById("totalSamples").textContent = total.toLocaleString();
  document.getElementById("potableSamples").textContent =
    potable.toLocaleString();
  document.getElementById("nonPotableSamples").textContent =
    nonPotable.toLocaleString();
  document.getElementById("avgPH").textContent = avgPH;
}

function createCharts(data) {
  // Potability Distribution Pie Chart
  const potableCount = data.filter((d) => d.potability === 1).length;
  const nonPotableCount = data.length - potableCount;

  new Chart(document.getElementById("potabilityChart"), {
    type: "doughnut",
    data: {
      labels: ["Potable", "Non-Potable"],
      datasets: [
        {
          data: [potableCount, nonPotableCount],
          backgroundColor: ["#27ae60", "#e74c3c"],
          borderWidth: 0,
          hoverOffset: 10,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 20,
            usePointStyle: true,
          },
        },
      },
    },
  });

  // pH Distribution Histogram
  const phValues = data
    .map((d) => d.ph)
    .filter((ph) => ph !== null && ph !== undefined);
  const phBins = Array.from({ length: 14 }, (_, i) => i + 1);
  const phCounts = phBins.map(
    (bin) => phValues.filter((ph) => ph >= bin && ph < bin + 1).length
  );

  new Chart(document.getElementById("phDistributionChart"), {
    type: "bar",
    data: {
      labels: phBins.map((bin) => `${bin}-${bin + 1}`),
      datasets: [
        {
          label: "Sample Count",
          data: phCounts,
          backgroundColor: "rgba(52, 152, 219, 0.8)",
          borderColor: "rgba(52, 152, 219, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true },
      },
      plugins: {
        legend: { display: false },
      },
    },
  });

  // Quality Metrics Radar Chart
  const avgMetrics = {
    ph: data.reduce((sum, d) => sum + (d.ph || 0), 0) / data.length,
    hardness: data.reduce((sum, d) => sum + (d.hardness || 0), 0) / data.length,
    solids: data.reduce((sum, d) => sum + (d.solids || 0), 0) / data.length,
    chloramines:
      data.reduce((sum, d) => sum + (d.chloramines || 0), 0) / data.length,
    sulfate: data.reduce((sum, d) => sum + (d.sulfate || 0), 0) / data.length,
    conductivity:
      data.reduce((sum, d) => sum + (d.conductivity || 0), 0) / data.length,
  };

  new Chart(document.getElementById("qualityMetricsChart"), {
    type: "radar",
    data: {
      labels: [
        "pH",
        "Hardness",
        "Solids",
        "Chloramines",
        "Sulfate",
        "Conductivity",
      ],
      datasets: [
        {
          label: "Average Values",
          data: [
            avgMetrics.ph * 10, // Scale for visibility
            avgMetrics.hardness / 10,
            avgMetrics.solids / 1000,
            avgMetrics.chloramines * 10,
            avgMetrics.sulfate / 10,
            avgMetrics.conductivity / 100,
          ],
          backgroundColor: "rgba(155, 89, 182, 0.2)",
          borderColor: "rgba(155, 89, 182, 1)",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
    },
  });

  // pH Levels by Sample (your original chart)
  const sampleData = data.slice(0, 100); // Show first 100 samples
  new Chart(document.getElementById("phChart"), {
    type: "bar",
    data: {
      labels: sampleData.map((_, i) => `Sample ${i + 1}`),
      datasets: [
        {
          label: "pH Levels",
          data: sampleData.map((d) => d.ph),
          backgroundColor: sampleData.map((d) =>
            d.potability ? "#27ae60" : "#e74c3c"
          ),
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true },
        x: { display: false },
      },
    },
  });

  // Hardness Distribution
  const hardnessValues = data
    .map((d) => d.hardness)
    .filter((h) => h !== null && h !== undefined);
  const hardnessBins = [0, 50, 100, 150, 200, 250, 300];
  const hardnessCounts = hardnessBins
    .slice(0, -1)
    .map(
      (bin, i) =>
        hardnessValues.filter((h) => h >= bin && h < hardnessBins[i + 1]).length
    );

  new Chart(document.getElementById("hardnessChart"), {
    type: "bar",
    data: {
      labels: hardnessBins
        .slice(0, -1)
        .map((bin, i) => `${bin}-${hardnessBins[i + 1]}`),
      datasets: [
        {
          label: "Sample Count",
          data: hardnessCounts,
          backgroundColor: "rgba(230, 126, 34, 0.8)",
          borderColor: "rgba(230, 126, 34, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true },
      },
      plugins: {
        legend: { display: false },
      },
    },
  });

  // Potable vs Non-Potable Comparison
  const potableData = data.filter((d) => d.potability === 1);
  const nonPotableData = data.filter((d) => d.potability === 0);

  const potableAvg = {
    ph:
      potableData.reduce((sum, d) => sum + (d.ph || 0), 0) / potableData.length,
    hardness:
      potableData.reduce((sum, d) => sum + (d.hardness || 0), 0) /
      potableData.length,
    chloramines:
      potableData.reduce((sum, d) => sum + (d.chloramines || 0), 0) /
      potableData.length,
    sulfate:
      potableData.reduce((sum, d) => sum + (d.sulfate || 0), 0) /
      potableData.length,
  };

  const nonPotableAvg = {
    ph:
      nonPotableData.reduce((sum, d) => sum + (d.ph || 0), 0) /
      nonPotableData.length,
    hardness:
      nonPotableData.reduce((sum, d) => sum + (d.hardness || 0), 0) /
      nonPotableData.length,
    chloramines:
      nonPotableData.reduce((sum, d) => sum + (d.chloramines || 0), 0) /
      nonPotableData.length,
    sulfate:
      nonPotableData.reduce((sum, d) => sum + (d.sulfate || 0), 0) /
      nonPotableData.length,
  };

  new Chart(document.getElementById("comparisonChart"), {
    type: "bar",
    data: {
      labels: ["pH", "Hardness", "Chloramines", "Sulfate"],
      datasets: [
        {
          label: "Potable Water",
          data: [
            potableAvg.ph,
            potableAvg.hardness / 10,
            potableAvg.chloramines,
            potableAvg.sulfate / 10,
          ],
          backgroundColor: "rgba(39, 174, 96, 0.8)",
          borderColor: "rgba(39, 174, 96, 1)",
          borderWidth: 1,
        },
        {
          label: "Non-Potable Water",
          data: [
            nonPotableAvg.ph,
            nonPotableAvg.hardness / 10,
            nonPotableAvg.chloramines,
            nonPotableAvg.sulfate / 10,
          ],
          backgroundColor: "rgba(231, 76, 60, 0.8)",
          borderColor: "rgba(231, 76, 60, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true },
      },
      plugins: {
        legend: {
          position: "top",
        },
      },
    },
  });
}

// Initialize dashboard when page loads
document.addEventListener("DOMContentLoaded", initDashboard);
