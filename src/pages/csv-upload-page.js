const API_BASE = 'http://localhost:8000';
const API_KEY = window.MATHVISION_API_KEY || 'dev-key';

function apiHeaders(extra = {}) {
  return { 'X-API-Key': API_KEY, ...extra };
}

export function createCsvUploadContent() {
  return `
    <!-- Upload Panel -->
    <section class="shell-card mb-4">
      <div class="shell-card__header">
        <div>
          <p class="panel-label">File Upload</p>
          <h3 class="panel-title">Upload CSV Files</h3>
        </div>
      </div>
      <div id="drop-zone" class="border border-2 border-dashed rounded p-5 text-center mb-3"
           style="cursor:pointer; border-color: var(--bs-border-color, #dee2e6);">
        <i class="bi bi-cloud-upload fs-1 text-muted"></i>
        <p class="mt-2 mb-1 text-muted">Drag &amp; drop CSV files here, or click to browse</p>
        <p class="text-muted small">Accepted: .csv — Max 50 MB per file</p>
        <input id="file-input" type="file" accept=".csv" multiple class="d-none">
      </div>
      <div id="file-preview" class="d-none">
        <p class="panel-label mb-1">Selected file</p>
        <p id="preview-meta" class="small text-muted mb-2"></p>
        <div class="table-responsive">
          <table class="table table-sm table-bordered" id="preview-table">
            <thead id="preview-thead"></thead>
            <tbody id="preview-tbody"></tbody>
          </table>
        </div>
      </div>
      <div class="mt-3">
        <button id="upload-btn" class="btn btn-primary d-none">
          <i class="bi bi-upload me-2"></i>Upload Selected Files
        </button>
        <div id="upload-status" class="mt-2"></div>
      </div>
    </section>

    <!-- File Manager -->
    <section class="shell-card mb-4">
      <div class="shell-card__header">
        <div>
          <p class="panel-label">File Manager</p>
          <h3 class="panel-title">Uploaded Files</h3>
        </div>
        <button id="refresh-files-btn" class="btn btn-sm btn-outline-secondary">
          <i class="bi bi-arrow-clockwise me-1"></i>Refresh
        </button>
      </div>
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th>Filename</th>
              <th>Type</th>
              <th>Size</th>
              <th>Uploaded At</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="files-tbody">
            <tr><td colspan="5" class="text-center text-muted py-4">Loading files…</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Processing Panel -->
    <section class="shell-card">
      <div class="shell-card__header">
        <div>
          <p class="panel-label">Analytics Engine</p>
          <h3 class="panel-title">Run Analytics</h3>
        </div>
      </div>
      <div class="mb-4">
        <button id="run-analytics-btn" class="btn btn-success">
          <i class="bi bi-play-circle me-2"></i>Run Analytics
        </button>
      </div>

      <!-- Step indicator -->
      <div id="job-panel" class="d-none">
        <p class="panel-label mb-3">Job Status</p>
        <div class="d-flex gap-3 flex-wrap mb-4" id="step-indicator">
          ${['queued', 'preprocessing', 'analytics', 'complete'].map(s => `
            <div class="step-item d-flex align-items-center gap-2" data-step="${s}">
              <span class="step-dot rounded-circle d-inline-block" style="width:12px;height:12px;background:#dee2e6;"></span>
              <span class="text-capitalize small">${s}</span>
            </div>`).join('')}
          <div class="step-item d-flex align-items-center gap-2" data-step="failed">
            <span class="step-dot rounded-circle d-inline-block" style="width:12px;height:12px;background:#dee2e6;"></span>
            <span class="small">Failed</span>
          </div>
        </div>

        <div id="job-error-panel" class="d-none alert alert-danger">
          <strong>Job failed</strong>
          <pre id="job-error-text" class="mt-2 mb-2 small" style="white-space:pre-wrap;"></pre>
          <button id="retry-btn" class="btn btn-sm btn-danger">
            <i class="bi bi-arrow-repeat me-1"></i>Retry
          </button>
        </div>

        <div id="job-complete-panel" class="d-none">
          <p class="text-success mb-1"><i class="bi bi-check-circle me-1"></i>Completed at <span id="completed-at"></span></p>
          <p class="panel-label mt-3 mb-2">Output Files</p>
          <div id="output-links"></div>
        </div>
      </div>
    </section>
  `;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function setStepActive(status) {
  document.querySelectorAll('#step-indicator .step-item').forEach(item => {
    const dot = item.querySelector('.step-dot');
    const step = item.dataset.step;
    if (step === status) {
      dot.style.background = status === 'failed' ? '#dc3545' : status === 'complete' ? '#198754' : '#0d6efd';
    } else {
      dot.style.background = '#dee2e6';
    }
  });
}

function showPreview(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const lines = e.target.result.split('\n').filter(l => l.trim());
    const rows = lines.slice(0, 6).map(l => l.split(','));
    const headers = rows[0] || [];
    const dataRows = rows.slice(1, 6);

    document.getElementById('preview-meta').textContent =
      `${file.name} — ${formatBytes(file.size)}`;
    document.getElementById('preview-thead').innerHTML =
      `<tr>${headers.map(h => `<th>${h.trim()}</th>`).join('')}</tr>`;
    document.getElementById('preview-tbody').innerHTML =
      dataRows.map(r => `<tr>${r.map(c => `<td>${c.trim()}</td>`).join('')}</tr>`).join('');
    document.getElementById('file-preview').classList.remove('d-none');
  };
  reader.readAsText(file);
}

// ── file manager ─────────────────────────────────────────────────────────────

async function loadFiles() {
  const tbody = document.getElementById('files-tbody');
  try {
    const res = await fetch(`${API_BASE}/files`, { headers: apiHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const files = await res.json();
    if (!files.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No files uploaded yet.</td></tr>';
      return;
    }
    tbody.innerHTML = files.map(f => `
      <tr>
        <td><i class="bi bi-file-earmark-spreadsheet me-2 text-success"></i>${f.filename}</td>
        <td><span class="badge bg-secondary">${f.file_type}</span></td>
        <td>${formatBytes(f.size_bytes)}</td>
        <td>${new Date(f.uploaded_at).toLocaleString()}</td>
        <td>
          <button class="btn btn-sm btn-outline-danger delete-btn" data-filename="${f.filename}">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>`).join('');

    tbody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteFile(btn.dataset.filename));
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">Failed to load files: ${err.message}</td></tr>`;
  }
}

async function deleteFile(filename) {
  if (!confirm(`Delete ${filename}?`)) return;
  try {
    const res = await fetch(`${API_BASE}/files/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
      headers: apiHeaders()
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await loadFiles();
  } catch (err) {
    alert(`Delete failed: ${err.message}`);
  }
}

// ── upload ────────────────────────────────────────────────────────────────────

async function uploadFiles(files) {
  const statusEl = document.getElementById('upload-status');
  statusEl.innerHTML = '<span class="text-muted small"><i class="bi bi-hourglass-split me-1"></i>Uploading…</span>';

  const formData = new FormData();
  Array.from(files).forEach(f => formData.append('files', f));

  try {
    const res = await fetch(`${API_BASE}/files/upload`, {
      method: 'POST',
      headers: apiHeaders(),
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

    const names = data.uploaded.map(f => f.filename).join(', ');
    statusEl.innerHTML = `<span class="text-success small"><i class="bi bi-check-circle me-1"></i>Uploaded: ${names}</span>`;
    await loadFiles();
  } catch (err) {
    statusEl.innerHTML = `<span class="text-danger small"><i class="bi bi-x-circle me-1"></i>Upload failed: ${err.message}</span>`;
  }
}

// ── job polling ───────────────────────────────────────────────────────────────

function startPolling(jobId) {
  const jobPanel = document.getElementById('job-panel');
  const errorPanel = document.getElementById('job-error-panel');
  const completePanel = document.getElementById('job-complete-panel');
  jobPanel.classList.remove('d-none');
  errorPanel.classList.add('d-none');
  completePanel.classList.add('d-none');

  const intervalId = setInterval(async () => {
    try {
      const res = await fetch(`${API_BASE}/jobs/${jobId}`, { headers: apiHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const job = await res.json();

      setStepActive(job.status);

      if (job.status === 'failed') {
        clearInterval(intervalId);
        errorPanel.classList.remove('d-none');
        document.getElementById('job-error-text').textContent = job.error || 'Unknown error';
        document.getElementById('retry-btn').onclick = () => runAnalytics();
      } else if (job.status === 'complete') {
        clearInterval(intervalId);
        completePanel.classList.remove('d-none');
        document.getElementById('completed-at').textContent =
          new Date(job.completed_at).toLocaleString();
        const linksEl = document.getElementById('output-links');
        linksEl.innerHTML = (job.output_files || []).map(f =>
          `<a href="${API_BASE}/results/${encodeURIComponent(f)}" download="${f}"
              class="btn btn-sm btn-outline-success me-2 mb-2" headers="${JSON.stringify(apiHeaders())}">
            <i class="bi bi-download me-1"></i>${f}
          </a>`
        ).join('');
      }
    } catch (err) {
      clearInterval(intervalId);
      setStepActive('failed');
      document.getElementById('job-error-panel').classList.remove('d-none');
      document.getElementById('job-error-text').textContent = err.message;
    }
  }, 5000);
}

async function runAnalytics() {
  const btn = document.getElementById('run-analytics-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Starting…';

  try {
    const res = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: apiHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({})
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

    setStepActive('queued');
    startPolling(data.job_id);
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-play-circle me-2"></i>Run Analytics';
    alert(`Failed to start job: ${err.message}`);
  }
}

// ── init ──────────────────────────────────────────────────────────────────────

export function init() {
  // Load existing files
  loadFiles();

  // Refresh button
  document.getElementById('refresh-files-btn').addEventListener('click', loadFiles);

  // File picker
  const fileInput = document.getElementById('file-input');
  const dropZone = document.getElementById('drop-zone');
  const uploadBtn = document.getElementById('upload-btn');

  let selectedFiles = null;

  function handleFiles(files) {
    if (!files || !files.length) return;
    selectedFiles = files;
    showPreview(files[0]);
    uploadBtn.classList.remove('d-none');
  }

  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => handleFiles(fileInput.files));

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#0d6efd';
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = '';
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '';
    handleFiles(e.dataTransfer.files);
  });

  uploadBtn.addEventListener('click', () => {
    if (selectedFiles) uploadFiles(selectedFiles);
  });

  // Run analytics
  document.getElementById('run-analytics-btn').addEventListener('click', runAnalytics);
}
