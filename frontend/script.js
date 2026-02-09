document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = "https://flood-monitoring-backend-production.up.railway.app/api";

  // ----------------- HELPERS -----------------

  const $ = (selector) => document.querySelector(selector);
  const getEl = (id) => document.getElementById(id);

  async function fetchJSON(url, options = {}) {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  function formatDateTimeID(dateStr) {
    const ts = new Date(dateStr);
    const tanggal = ts.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const jam = ts.toLocaleTimeString("id-ID");
    return { tanggal, jam };
  }

  function formatDateID(dateStr) {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function renderStatusLabel(level) {
    if (level <= 100) {
      return `<span class="status-label status-awas">AWAS</span>`;
    }
    if (level <= 200) {
      return `<span class="status-label status-waspada">WASPADA</span>`;
    }
    return `<span class="status-label status-aman">AMAN</span>`;
  }

  // ----------------- AUTH / ROLE HANDLER -----------------

  const authButton = getEl("auth-button");
  const welcomeText = getEl("welcome-text");
  const adminLabel = getEl("role-label-admin");
  const userLabel = getEl("role-label-user");

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");

  function setAdminMenus(currentRole) {
    document.querySelectorAll("[data-role='admin']").forEach((li) => {
      li.style.display = currentRole === "admin" ? "flex" : "none";
    });
  }

  if (token && role && username) {
    // Sudah login
    if (welcomeText) {
      welcomeText.textContent = `${username} (${role})`;
    }
    if (authButton) {
      authButton.textContent = "Logout";
      authButton.onclick = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("username");
        window.location.reload();
      };
    }

    if (role === "admin") {
      if (adminLabel) adminLabel.style.display = "inline-block";
      if (userLabel) userLabel.style.display = "none";
    } else {
      if (adminLabel) adminLabel.style.display = "none";
      if (userLabel) userLabel.style.display = "inline-block";
    }

    setAdminMenus(role);
  } else {
    // Guest / belum login
    if (welcomeText) welcomeText.textContent = "";
    if (authButton) {
      authButton.textContent = "Login";
      authButton.onclick = () => {
        window.location.href = "login.html";
      };
    }
    if (adminLabel) adminLabel.style.display = "none";
    if (userLabel) userLabel.style.display = "none";
    setAdminMenus(null);
  }

  // ----------------- MENU & CONTENT SECTIONS -----------------

  const SECTION_KEYS = ["data", "history", "diagram", "sensor", "qr"];

  const menuItems = {
    data: getEl("menu-data"),
    history: getEl("menu-history"),
    diagram: getEl("menu-diagram"),
    sensor: getEl("menu-sensor"),
    qr: getEl("menu-qr"),
  };

  const contentSections = {
    data: getEl("content-data"),
    history: getEl("content-history"),
    diagram: getEl("content-diagram"),
    sensor: getEl("content-sensor"),
    qr: getEl("content-qr"),
  };

  function showContent(selected) {
    SECTION_KEYS.forEach((key) => {
      const section = contentSections[key];
      const menu = menuItems[key];

      if (section) {
        section.style.display = key === selected ? "block" : "none";
      }
      if (menu) {
        menu.classList.toggle("active", key === selected);
      }
    });
  }

  // ----------------- REALTIME & TERBARU -----------------

  const latestTsEl = getEl("latest-timestamp");
  const latestLevelEl = getEl("latest-level");
  const latestStatusEl = getEl("latest-status");
  const himbauanP = $(".himbauan-box p");
  const statusBox = $(".status-box");
  const realtimeTbody = $("#realtime-table tbody");

  async function fetchLatest() {
    try {
      const data = await fetchJSON(`${API_BASE_URL}/water/latest`);
      const { tanggal, jam } = formatDateTimeID(data.timestamp);

      if (latestTsEl) latestTsEl.textContent = `${tanggal} ${jam}`;
      if (latestLevelEl) latestLevelEl.textContent = `${data.level} cm`;
      if (latestStatusEl) {
        latestStatusEl.innerHTML = renderStatusLabel(data.level);
      }

      // Status & himbauan (ada di section Diagram)
      if (!himbauanP || !statusBox) return;

      const status =
        data.status ||
        (data.level <= 100 ? "Awas" : data.level <= 200 ? "Waspada" : "Aman");

      if (status === "Awas") {
        himbauanP.textContent =
          "STATUS AWAS: Segera evakuasi ke tempat yang lebih tinggi dan ikuti arahan dari pihak berwenang.";
        statusBox.innerHTML = `
          <h4>Status Saat Ini</h4>
          <div style="padding: 12px; background: #dc3545; color: white; border-radius: 8px;">
            <strong>AWAS</strong> – Ketinggian air: ${data.level} cm
          </div>
        `;
      } else if (status === "Waspada") {
        himbauanP.textContent =
          "STATUS WASPADA: Tetap waspada. Pantau kondisi secara berkala dan persiapkan diri untuk kemungkinan banjir.";
        statusBox.innerHTML = `
          <h4>Status Saat Ini</h4>
          <div style="padding: 12px; background: #ffc107; color: black; border-radius: 8px;">
            <strong>WASPADA</strong> – Ketinggian air: ${data.level} cm
          </div>
        `;
      } else {
        himbauanP.textContent =
          "STATUS AMAN: Belum ada peningkatan debit air secara mencolok.";
        statusBox.innerHTML = `
          <h4>Status Saat Ini</h4>
          <div style="padding: 12px; background: #28a745; color: white; border-radius: 8px;">
            <strong>AMAN</strong> – Ketinggian air: ${data.level} cm
          </div>
        `;
      }
    } catch (err) {
      console.error("fetchLatest error:", err);
      if (latestStatusEl) {
        latestStatusEl.innerHTML =
          '<span style="color:red">Gagal mengambil data</span>';
      }
    }
  }

  async function fetchRealtimeList() {
    if (!realtimeTbody) return;

    try {
      const data = await fetchJSON(`${API_BASE_URL}/water`);

      if (!Array.isArray(data) || data.length === 0) {
        realtimeTbody.innerHTML =
          '<tr><td colspan="4">Belum ada data.</td></tr>';
        return;
      }

      realtimeTbody.innerHTML = data
        .map((item) => {
          const tgl = new Date(item.timestamp).toLocaleDateString("id-ID");
          const jam = new Date(item.timestamp).toLocaleTimeString("id-ID");
          return `
            <tr>
              <td>${item.level} cm</td>
              <td>${tgl}</td>
              <td>${jam}</td>
              <td>${renderStatusLabel(item.level)}</td>
            </tr>
          `;
        })
        .join("");
    } catch (err) {
      console.error("fetchRealtimeList error:", err);
      realtimeTbody.innerHTML =
        '<tr><td colspan="4">Gagal mengambil data.</td></tr>';
    }
  }

  // ----------------- HISTORY -----------------

  const bulanSelect = getEl("filter-bulan") || getEl("month-select");
  const tahunSelect = getEl("filter-tahun") || getEl("year-select");
  const historyTbody =
    getEl("history-table-body") || $("#history-table tbody");

  async function populateYears() {
    if (!tahunSelect) return;
    try {
      const years = await fetchJSON(`${API_BASE_URL}/water/years`);

      tahunSelect.innerHTML = '<option value="">Tahun</option>';
      years.forEach((y) => {
        const opt = document.createElement("option");
        opt.value = y;
        opt.textContent = y;
        tahunSelect.appendChild(opt);
      });
    } catch (err) {
      console.error("populateYears error:", err);
    }
  }

  async function fetchHistory() {
    if (!bulanSelect || !tahunSelect || !historyTbody) return;

    const month = bulanSelect.value;
    const year = tahunSelect.value;

    historyTbody.innerHTML =
      '<tr><td colspan="4">Memuat data...</td></tr>';

    let url = `${API_BASE_URL}/water/history`;

    if (month && year) {
      url += `?month=${month}&year=${year}`;
    } else if (month || year) {
      historyTbody.innerHTML = `
        <tr>
          <td colspan="4">
            Isi bulan dan tahun sekaligus untuk filter,
            atau kosongkan keduanya untuk melihat semua data.
          </td>
        </tr>`;
      return;
    }

    try {
      const data = await fetchJSON(url);

      if (!Array.isArray(data) || data.length === 0) {
        historyTbody.innerHTML =
          '<tr><td colspan="4">Tidak ada data.</td></tr>';
        return;
      }

      historyTbody.innerHTML = data
        .map((row) => {
          const tgl = formatDateID(row.date);
          return `
            <tr>
              <td>${tgl}</td>
              <td>${row.avg_distance} cm</td>
              <td>${row.min_distance} cm</td>
              <td>${row.max_distance} cm</td>

            </tr>
          `;
        })
        .join("");
    } catch (err) {
      console.error("fetchHistory error:", err);
      historyTbody.innerHTML =
        '<tr><td colspan="4">Error memuat data</td></tr>';
    }
  }

  if (bulanSelect) bulanSelect.addEventListener("change", fetchHistory);
  if (tahunSelect) tahunSelect.addEventListener("change", fetchHistory);

  // ----------------- DIAGRAM (CHART) -----------------

  let chartInstance = null;

  async function fetchWaterLevelData() {
    try {
      const data = await fetchJSON(`${API_BASE_URL}/water/history`);
      const labels = data.map((d) => formatDateID(d.date));
      const values = data.map((d) =>
        Number(Number(d.avg_distance).toFixed(2))
      );
      return { labels, values };
    } catch (err) {
      console.error("fetchWaterLevelData error:", err);
      return { labels: [], values: [] };
    }
  }

    async function initChart() {
    const canvas = getEl("waterLevelChart");
    if (!canvas) return;

    const { labels, values } = await fetchWaterLevelData();

    if (chartInstance) {
      chartInstance.destroy();
    }

    chartInstance = new Chart(canvas, {
      type: "bar", // DIUBAH dari 'line' ke 'bar'
      data: {
        labels,
        datasets: [
          {
            label: "Rata-rata Ketinggian Air per Hari (cm)",
            data: values,
            backgroundColor: "rgba(75, 192, 192, 0.6)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
            borderRadius: 6, // sudut rounded
            hoverBackgroundColor: "rgba(75, 192, 192, 0.8)"
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Ketinggian Air (cm)",
            },
          },
          x: {
            title: {
              display: true,
              text: "Tanggal",
            },
            ticks: {
              maxTicksLimit: 10,
            },
          },
        },
      },
    });
  }


  // ----------------- DAFTAR SENSOR -----------------

  const sensorTableBody = $("#sensor-table tbody");

  async function fetchSensorList() {
    if (!sensorTableBody) return;

    sensorTableBody.innerHTML =
      '<tr><td colspan="4">Memuat data sensor...</td></tr>';

    try {
      const token = localStorage.getItem("token");

      const data = await fetchJSON(`${API_BASE_URL}/sensors`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!Array.isArray(data) || data.length === 0) {
        sensorTableBody.innerHTML =
          '<tr><td colspan="4">Tidak ada data sensor.</td></tr>';
        return;
      }

      sensorTableBody.innerHTML = data
        .map(
          (s) => `
          <tr>
            <td>${s.id}</td>
            <td>${s.name}</td>
            <td>${s.location}</td>
            <td>${s.status}</td>
          </tr>
        `
        )
        .join("");
    } catch (err) {
      console.error("fetchSensorList error:", err);
      sensorTableBody.innerHTML =
        '<tr><td colspan="4">Gagal memuat data sensor.</td></tr>';
    }
  }

  // ----------------- QR DOWNLOAD -----------------

  const qrMenu = menuItems.qr;

  if (qrMenu) {
    qrMenu.addEventListener("click", () => {
      showContent("qr");

      const downloadBtn = getEl("download-qr");
      if (downloadBtn && !downloadBtn.dataset.listenerAdded) {
        downloadBtn.addEventListener("click", () => {
          const image = getEl("qr-image");
          if (!image) return;

          const link = document.createElement("a");
          link.href = image.src;
          link.download = "QR_Bot_Telegram.jpg";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });

        downloadBtn.dataset.listenerAdded = "true";
      }
    });
  }

  // ----------------- MENU CLICK HANDLERS -----------------

  if (menuItems.data) {
    menuItems.data.addEventListener("click", () => {
      showContent("data");
      fetchLatest();
      fetchRealtimeList();
    });
  }

  if (menuItems.history && bulanSelect && tahunSelect) {
    menuItems.history.addEventListener("click", () => {
      showContent("history");
      fetchHistory();
    });
  }

  if (menuItems.diagram) {
    menuItems.diagram.addEventListener("click", () => {
      showContent("diagram");
      initChart();
    });
  }

  if (menuItems.sensor) {
    menuItems.sensor.addEventListener("click", () => {
      showContent("sensor");
      fetchSensorList();
    });
  }

  // ----------------- INITIAL LOAD -----------------

  showContent("data");
  fetchLatest();
  fetchRealtimeList();
  populateYears();
  setInterval(fetchLatest, 10000);
});
