import { api } from "./api.js";

// ── 상태 ──────────────────────────────────────────────────────────────────────
let tasks = [];
let statusFilter = "";
let pollTimer = null;
const POLL_INTERVAL_MS = 3000;

// ── 테마 ──────────────────────────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved ?? (prefersDark ? "dark" : "light");
  document.documentElement.classList.toggle("dark", theme === "dark");
  updateThemeIcon(theme === "dark");
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  updateThemeIcon(isDark);
}

function updateThemeIcon(isDark) {
  const btn = document.getElementById("theme-toggle");
  if (btn) btn.textContent = isDark ? "☀️" : "🌙";
}

// ── D-N 계산 ──────────────────────────────────────────────────────────────────
function formatDueAt(dueAt) {
  if (!dueAt) return "";
  const due = new Date(dueAt);
  const now = new Date();
  const diffDays = Math.floor((due - now) / 86400000);
  const hhmm = due.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
  if (diffDays > 0) return `D-${diffDays} ${hhmm}`;
  if (diffDays === 0) return `D-0 ${hhmm}`;
  return `D+${Math.abs(diffDays)} ${hhmm}`;
}

function isDueOverdue(dueAt) {
  if (!dueAt) return false;
  return new Date(dueAt) < new Date();
}

// ── 상태 배지 ─────────────────────────────────────────────────────────────────
const STATUS_LABEL = { todo: "할 일", in_progress: "진행 중", done: "완료" };
const STATUS_COLOR = {
  todo: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  done: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

// ── 렌더 ──────────────────────────────────────────────────────────────────────
function renderTasks() {
  const list = document.getElementById("task-list");
  if (!list) return;

  const filtered = statusFilter ? tasks.filter((t) => t.status === statusFilter) : tasks;

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="text-center py-16 text-slate-400 dark:text-slate-500">
        <p class="text-4xl mb-3">📭</p>
        <p class="text-sm">업무가 없습니다</p>
      </div>`;
    return;
  }

  list.innerHTML = filtered
    .map((task) => {
      const dueLabel = formatDueAt(task.due_at);
      const overdue = isDueOverdue(task.due_at);
      return `
      <div
        class="task-card group flex items-start justify-between gap-3 p-4 rounded-xl shadow-sm
               bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm
               border border-slate-200/60 dark:border-slate-700/60
               hover:shadow-md transition-shadow cursor-pointer"
        data-id="${task.id}"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <span class="text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[task.status]}">
              ${STATUS_LABEL[task.status]}
            </span>
            ${dueLabel ? `<span class="text-xs ${overdue ? "text-red-500 font-semibold" : "text-slate-400 dark:text-slate-500"}">${dueLabel}</span>` : ""}
          </div>
          <p class="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">${escapeHtml(task.title)}</p>
        </div>
        <button
          class="delete-btn flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center
                 rounded-lg text-slate-300 dark:text-slate-600
                 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20
                 opacity-0 group-hover:opacity-100 transition-all"
          data-id="${task.id}"
          data-title="${escapeHtml(task.title)}"
          aria-label="삭제"
        >🗑</button>
      </div>`;
    })
    .join("");

  // 카드 클릭 → 수정 모달 (삭제 버튼 제외)
  list.querySelectorAll(".task-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".delete-btn")) return;
      openEditModal(Number(card.dataset.id));
    });
  });

  // 삭제 버튼
  list.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openDeleteConfirm(Number(btn.dataset.id), btn.dataset.title);
    });
  });
}

// ── 데이터 fetch ──────────────────────────────────────────────────────────────
async function fetchTasks() {
  try {
    tasks = await api.listTasks(statusFilter);
    renderTasks();
  } catch (e) {
    console.error("목록 조회 실패:", e);
  }
}

function startPolling() {
  stopPolling();
  pollTimer = setInterval(fetchTasks, POLL_INTERVAL_MS);
}

function stopPolling() {
  if (pollTimer) clearInterval(pollTimer);
}

// ── 추가 폼 ───────────────────────────────────────────────────────────────────
function initAddForm() {
  const form = document.getElementById("add-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = form.title.value.trim();
    if (!title) return;

    const body = {
      title,
      status: form.status.value,
      ...(form.due_at.value && { due_at: new Date(form.due_at.value).toISOString() }),
    };

    try {
      await api.createTask(body);
      form.reset();
      form.status.value = "todo";
      await fetchTasks();
    } catch (e) {
      alert("추가 실패: " + e.message);
    }
  });
}

// ── 수정 모달 ─────────────────────────────────────────────────────────────────
async function openEditModal(id) {
  stopPolling();
  try {
    const task = await api.getTask(id);
    const modal = document.getElementById("edit-modal");
    const form = document.getElementById("edit-form");

    form.edit_title.value = task.title;
    form.edit_description.value = task.description ?? "";
    form.edit_status.value = task.status;
    form.edit_due_at.value = task.due_at
      ? new Date(task.due_at).toISOString().slice(0, 16)
      : "";
    form.dataset.id = id;

    modal.classList.remove("hidden");
    modal.classList.add("flex");
    form.edit_title.focus();
  } catch (e) {
    alert("불러오기 실패: " + e.message);
    startPolling();
  }
}

function closeEditModal() {
  const modal = document.getElementById("edit-modal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  startPolling();
}

function initEditModal() {
  const form = document.getElementById("edit-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = Number(form.dataset.id);
    const body = {
      title: form.edit_title.value.trim(),
      description: form.edit_description.value || null,
      status: form.edit_status.value,
      due_at: form.edit_due_at.value
        ? new Date(form.edit_due_at.value).toISOString()
        : null,
    };

    try {
      await api.updateTask(id, body);
      closeEditModal();
      await fetchTasks();
    } catch (e) {
      alert("수정 실패: " + e.message);
    }
  });

  document.getElementById("edit-cancel").addEventListener("click", closeEditModal);
  document.getElementById("edit-cancel-btn").addEventListener("click", closeEditModal);
  document.getElementById("edit-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeEditModal();
  });
}

// ── 삭제 확인 ─────────────────────────────────────────────────────────────────
function openDeleteConfirm(id, title) {
  const modal = document.getElementById("delete-modal");
  document.getElementById("delete-title").textContent = `"${title}"`;
  modal.dataset.id = id;
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeDeleteModal() {
  const modal = document.getElementById("delete-modal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function initDeleteModal() {
  document.getElementById("delete-confirm").addEventListener("click", async () => {
    const id = Number(document.getElementById("delete-modal").dataset.id);
    try {
      await api.deleteTask(id);
      closeDeleteModal();
      await fetchTasks();
    } catch (e) {
      alert("삭제 실패: " + e.message);
    }
  });

  document.getElementById("delete-cancel").addEventListener("click", closeDeleteModal);
}

// ── 필터 탭 ───────────────────────────────────────────────────────────────────
const FILTER_ACTIVE   = ["bg-indigo-500", "text-white", "font-semibold"];
const FILTER_INACTIVE = ["bg-slate-100", "dark:bg-slate-800", "text-slate-600", "dark:text-slate-400"];

function setFilterActive(activeBtn) {
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    const isActive = btn === activeBtn;
    btn.classList.remove(...FILTER_ACTIVE, ...FILTER_INACTIVE);
    btn.classList.add(...(isActive ? FILTER_ACTIVE : FILTER_INACTIVE));
  });
}

function initFilterTabs() {
  const buttons = document.querySelectorAll(".filter-btn");
  setFilterActive(buttons[0]);

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      statusFilter = btn.dataset.status;
      setFilterActive(btn);
      fetchTasks();
    });
  });
}

// ── 유틸 ──────────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── 진입점 ────────────────────────────────────────────────────────────────────
function init() {
  initTheme();
  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
  initAddForm();
  initEditModal();
  initDeleteModal();
  initFilterTabs();
  fetchTasks();
  startPolling();
}

document.addEventListener("DOMContentLoaded", init);
