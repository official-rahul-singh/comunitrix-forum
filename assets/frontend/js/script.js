import Swiper from "swiper";
import { Pagination, Autoplay } from "swiper/modules";
import flatpickr from "flatpickr";
import * as FilePond from "filepond";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import "filepond/dist/filepond.min.css";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";

const TAB_ORDER = {
  popular: ["backup", "recovery", "mac", "iphone", "windows"],
  latest: ["iphone", "windows", "mac", "recovery", "backup"],
  "most-answered": ["recovery", "backup", "windows", "mac", "iphone"],
  newest: ["windows", "iphone", "recovery", "mac", "backup"],
};

const TAB_COUNTS = {
  popular: {
    backup: "100+ Questions",
    recovery: "100+ Questions",
    mac: "100+ Questions",
    iphone: "100+ Questions",
    windows: "100+ Questions",
  },
  latest: {
    backup: "36 Questions",
    recovery: "42 Questions",
    mac: "28 Questions",
    iphone: "54 Questions",
    windows: "31 Questions",
  },
  "most-answered": {
    backup: "180+ Answers",
    recovery: "220+ Answers",
    mac: "95+ Answers",
    iphone: "140+ Answers",
    windows: "110+ Answers",
  },
  newest: {
    backup: "8 New",
    recovery: "12 New",
    mac: "5 New",
    iphone: "15 New",
    windows: "9 New",
  },
};

function applyGroupTab(tabName) {
  const grid = document.getElementById("groups-grid");
  if (!grid) return;

  const order = TAB_ORDER[tabName] || TAB_ORDER.popular;
  const counts = TAB_COUNTS[tabName] || TAB_COUNTS.popular;
  const cards = new Map(
    [...grid.querySelectorAll("[data-id]")].map((card) => [
      card.dataset.id,
      card,
    ]),
  );

  order.forEach((id) => {
    const card = cards.get(id);
    if (!card) return;
    grid.appendChild(card);
    const countEl = card.querySelector("[data-count]");
    if (countEl && counts[id]) countEl.textContent = counts[id];
  });
}

const DISCUSSION_TABS = new Set([
  "all",
  "open",
  "solved",
  "unanswered",
  "following",
]);

const discussionsSearchInput = document.querySelector(".discussions-search__input");

function applyDiscussionTab(tabName) {
  const area = document.querySelector(".question-area");
  if (!area) return;

  const activeTab =
    tabName ||
    document.querySelector('.tabs-scroll [role="tab"][aria-selected="true"]')
      ?.dataset.tab ||
    "all";
  const query = (discussionsSearchInput?.value || "").trim().toLowerCase();

  area.querySelectorAll("article.card").forEach((card) => {
    const status = card.dataset.status || "open";
    const following = card.dataset.following === "true";
    let show = true;

    if (activeTab === "solved") show = status === "solved";
    else if (activeTab === "unanswered") show = status === "unanswered";
    else if (activeTab === "open") show = status === "open" || status === "unanswered";
    else if (activeTab === "following") show = following;
    else show = true;

    if (show && query) {
      const text = card.textContent?.toLowerCase() || "";
      show = text.includes(query);
    }

    card.hidden = !show;
  });
}

discussionsSearchInput?.addEventListener("input", () => applyDiscussionTab());


document.querySelectorAll('[role="tablist"]').forEach((list) => {
  list.querySelectorAll('[role="tab"]').forEach((tab) => {
    tab.addEventListener("click", () => {
      list.querySelectorAll('[role="tab"]').forEach((t) => {
        t.setAttribute("aria-selected", "false");
      });
      tab.setAttribute("aria-selected", "true");

      const name = tab.dataset.tab;
      if (name in TAB_ORDER) applyGroupTab(name);
      if (DISCUSSION_TABS.has(name)) applyDiscussionTab(name);
    });
  });
});

/* Tabs horizontal scroll arrows — show when tabs are cut off */
function updateTabsScroll(wrap, remeasure = true) {
  const scroller = wrap.querySelector(".tabs-scroll");
  const prevBtn = wrap.querySelector(".tabs-scroll-prev");
  const nextBtn = wrap.querySelector(".tabs-scroll-next");
  if (!scroller || !prevBtn || !nextBtn) return;

  const maxScroll = scroller.scrollWidth - scroller.clientWidth;
  const hasOverflow = maxScroll > 4;
  const atStart = scroller.scrollLeft <= 4;
  const atEnd = scroller.scrollLeft >= maxScroll - 4;
  const wasOverflow = wrap.classList.contains("has-overflow");

  /* Keep both arrow slots when overflowing so the row doesn’t jump */
  prevBtn.hidden = !hasOverflow;
  nextBtn.hidden = !hasOverflow;
  prevBtn.disabled = !hasOverflow || atStart;
  nextBtn.disabled = !hasOverflow || atEnd;

  wrap.classList.toggle("has-overflow", hasOverflow);
  wrap.classList.toggle("has-prev", hasOverflow && !atStart);
  wrap.classList.toggle("has-next", hasOverflow && !atEnd);

  /* Arrow show/hide changes scroller width — remeasure once */
  if (remeasure && wasOverflow !== hasOverflow) {
    requestAnimationFrame(() => updateTabsScroll(wrap, false));
  }
}

document.querySelectorAll("[data-tabs-scroll]").forEach((wrap) => {
  const scroller = wrap.querySelector(".tabs-scroll");
  const prevBtn = wrap.querySelector(".tabs-scroll-prev");
  const nextBtn = wrap.querySelector(".tabs-scroll-next");
  if (!scroller) return;

  const scrollByAmount = () => Math.max(120, Math.round(scroller.clientWidth * 0.6));

  prevBtn?.addEventListener("click", () => {
    scroller.scrollBy({ left: -scrollByAmount(), behavior: "smooth" });
  });
  nextBtn?.addEventListener("click", () => {
    scroller.scrollBy({ left: scrollByAmount(), behavior: "smooth" });
  });
  scroller.addEventListener("scroll", () => updateTabsScroll(wrap), { passive: true });
  window.addEventListener("resize", () => updateTabsScroll(wrap));

  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => updateTabsScroll(wrap)).observe(scroller);
  }

  updateTabsScroll(wrap);
});


function closeDropdown(dropdown) {
  const trigger = dropdown.querySelector(".dropdown-trigger");
  const menu = dropdown.querySelector(".dropdown-menu");
  if (!trigger || !menu) return;
  dropdown.classList.remove("is-open");
  trigger.setAttribute("aria-expanded", "false");
  menu.classList.add("hidden");
}

function openDropdown(dropdown) {
  const trigger = dropdown.querySelector(".dropdown-trigger");
  const menu = dropdown.querySelector(".dropdown-menu");
  if (!trigger || !menu) return;
  dropdown.classList.add("is-open");
  trigger.setAttribute("aria-expanded", "true");
  menu.classList.remove("hidden");
}

function closeAllDropdowns(except) {
  document.querySelectorAll(".dropdown.is-open").forEach((dropdown) => {
    if (dropdown !== except) closeDropdown(dropdown);
  });
}

document.querySelectorAll(".dropdown").forEach((dropdown) => {
  const trigger = dropdown.querySelector(".dropdown-trigger");
  const menu = dropdown.querySelector(".dropdown-menu");
  const label = dropdown.querySelector(".dropdown-label");
  const input = dropdown.querySelector(".dropdown-input");
  if (!trigger || !menu) return;

  const isAccordion = dropdown.classList.contains("dropdown-accordion");
  const isMobileSidebarAccordion = () =>
    isAccordion &&
    dropdown.closest(".home-sidebar") &&
    window.matchMedia("(width < 64rem)").matches;

  const toggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMobileSidebarAccordion()) {
      closeDropdown(dropdown);
      return;
    }
    const isOpen = dropdown.classList.contains("is-open");
    if (!isAccordion) closeAllDropdowns(dropdown);
    if (isOpen) closeDropdown(dropdown);
    else openDropdown(dropdown);
  };

  trigger.addEventListener("click", toggleDropdown);
  trigger.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") toggleDropdown(e);
  });

  if (isAccordion) {
    const split = dropdown.querySelector(".menu-item-split");
    split?.addEventListener("click", (e) => {
      if (e.target.closest(".menu-item-link")) return;
      if (e.target.closest(".dropdown-trigger")) return;
      toggleDropdown(e);
    });
  }

  if (!isAccordion) {
    menu.querySelectorAll("[data-value]").forEach((option) => {
      option.addEventListener("click", () => {
        menu.querySelectorAll("[data-value]").forEach((o) => {
          o.setAttribute("aria-selected", "false");
        });
        option.setAttribute("aria-selected", "true");
        if (label) label.textContent = option.textContent.trim();
        if (input) input.value = option.dataset.value;
        closeDropdown(dropdown);
      });
    });
  }
});

document.addEventListener("click", () => {
  document.querySelectorAll(".dropdown.is-open:not(.dropdown-accordion)").forEach(closeDropdown);
});

const LIKE_POP_PATH =
  "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z";

function spawnLikePops(btn) {
  btn.querySelector(".like-btn__pops")?.remove();

  const wrap = document.createElement("span");
  wrap.className = "like-btn__pops";
  wrap.setAttribute("aria-hidden", "true");

  for (let i = 1; i <= 9; i++) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", `like-btn__pop like-btn__pop--${i}`);
    svg.setAttribute("viewBox", "0 0 24 24");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", LIKE_POP_PATH);
    svg.appendChild(path);
    wrap.appendChild(svg);
  }

  btn.appendChild(wrap);
  setTimeout(() => wrap.remove(), 2000);
}

document.querySelectorAll("[data-like]").forEach((el) => {
  const icon = el.querySelector("[data-like-icon]");
  const countEl = el.querySelector("[data-like-count]");
  if (!icon || !countEl) return;

  const isDisabled = () =>
    el.matches(":disabled, [disabled], [aria-disabled='true']");

  const toggleLike = () => {
    if (isDisabled()) return;
    const liked = el.getAttribute("aria-pressed") === "true";
    const next = !liked;
    el.setAttribute("aria-pressed", String(next));
    icon.setAttribute("fill", next ? "currentColor" : "none");
    const n = parseInt(countEl.textContent.replace(/,/g, ""), 10);
    if (!Number.isNaN(n)) countEl.textContent = String(next ? n + 1 : n - 1);

    if (next) spawnLikePops(el);
  };

  el.addEventListener("click", toggleLike);
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleLike();
    }
  });
});

function buildUserCard(el) {
  if (el.querySelector(".user-card")) return;

  const name = el.dataset.name || "user";
  const initial = el.dataset.initial || name.charAt(0).toUpperCase();
  const avatar = el.dataset.avatar || "";
  const avatarBg = el.dataset.avatarBg || "#bbf7d0";
  const avatarColor = el.dataset.avatarColor || "#166534";
  const role = el.dataset.role || "Member";
  const joined = el.dataset.joined || "—";
  const seen = el.dataset.seen || "—";
  const messages = el.dataset.messages || "0";
  const reactions = el.dataset.reactions || "0";
  const points = el.dataset.points || "0";
  const profile = el.dataset.profile || "#member";

  const avatarHtml = avatar
    ? `<img src="${avatar}" alt="" />`
    : initial;

  const card = document.createElement("div");
  card.className = "user-card";
  card.setAttribute("role", "tooltip");
  card.innerHTML = `
    <div class="user-card__head">
      <a href="${profile}" class="user-card__avatar" style="background:${avatarBg};color:${avatarColor}">${avatarHtml}</a>
      <div class="user-card__meta">
        <a href="${profile}" class="user-card__name">${name}</a>
        <span class="user-card__badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          ${role}
        </span>
        <p class="user-card__detail">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          Joined: ${joined}
        </p>
        <p class="user-card__detail">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          Last seen: ${seen}
        </p>
      </div>
    </div>
    <div class="user-card__stats">
      <div class="user-card__stat">
        <span class="user-card__stat-text">
          <span class="user-card__stat-label">Messages</span>
          <span class="user-card__stat-value">${messages}</span>
        </span>
      </div>
      <div class="user-card__stat">
        <span class="user-card__stat-text">
          <span class="user-card__stat-label">Reaction score</span>
          <span class="user-card__stat-value">${reactions}</span>
        </span>
      </div>
      <div class="user-card__stat">
        <span class="user-card__stat-text">
          <span class="user-card__stat-label">Points</span>
          <span class="user-card__stat-value">${points}</span>
        </span>
      </div>
    </div>
  `;
  el.appendChild(card);
}

document.querySelectorAll("[data-user-card]").forEach(buildUserCard);

function positionUserCard(hoverEl) {
  const card = hoverEl.querySelector(":scope > .user-card");
  if (!card) return;

  hoverEl.classList.remove("user-hover--below", "user-hover--right");

  const trigger = hoverEl.getBoundingClientRect();
  const cardWidth = card.offsetWidth || 360;
  const cardHeight = card.offsetHeight;
  const gap = 12;
  const pad = 8;

  // Sticky header (z-index 200) covers the top of the viewport, so space above starts below it
  const header = document.querySelector(".site-header");
  const topLimit = header ? Math.max(header.getBoundingClientRect().bottom, 0) : 0;

  const spaceAbove = trigger.top - topLimit;
  const spaceBelow = window.innerHeight - trigger.bottom;
  const needed = cardHeight + gap + pad;

  if (spaceAbove < needed && spaceBelow > spaceAbove) {
    hoverEl.classList.add("user-hover--below");
  }

  if (trigger.left + cardWidth > window.innerWidth - pad) {
    hoverEl.classList.add("user-hover--right");
  }
}

const USER_CARD_SHOW_DELAY = 1000;

document.querySelectorAll(".user-hover").forEach((hoverEl) => {
  let showTimer;

  hoverEl.addEventListener("mouseenter", () => {
    clearTimeout(showTimer);
    showTimer = setTimeout(() => {
      positionUserCard(hoverEl);
      hoverEl.classList.add("is-open");
    }, USER_CARD_SHOW_DELAY);
  });

  hoverEl.addEventListener("mouseleave", () => {
    clearTimeout(showTimer);
    hoverEl.classList.remove("is-open");
  });

  hoverEl.addEventListener("focusin", () => positionUserCard(hoverEl));
});

const signupSwiperEl = document.querySelector(".signup-swiper");
if (signupSwiperEl) {
  new Swiper(signupSwiperEl, {
    modules: [Pagination, Autoplay],
    slidesPerView: 1,
    spaceBetween: 16,
    loop: true,
    autoplay: {
      delay: 4000,
      disableOnInteraction: false,
    },
    pagination: {
      el: ".signup-swiper-pagination",
      clickable: true,
      renderBullet(index, className) {
        return `<button type="button" class="${className} signup-swiper-bullet" aria-label="Slide ${index + 1}">${index + 1}</button>`;
      },
    },
  });
}

document.querySelectorAll(".password-toggle").forEach((btn) => {
  btn.addEventListener("click", () => {
    const field = btn.closest(".password-field");
    const input = field?.querySelector("input");
    if (!input) return;

    const showIcon = btn.querySelector(".password-icon-show");
    const hideIcon = btn.querySelector(".password-icon-hide");
    const isHidden = input.type === "password";

    input.type = isHidden ? "text" : "password";
    btn.setAttribute("aria-pressed", String(isHidden));
    btn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
    showIcon?.classList.toggle("hidden", isHidden);
    hideIcon?.classList.toggle("hidden", !isHidden);
  });
});

document.querySelectorAll("select.form-select").forEach((select) => {
  const syncSelectState = () => {
    const hasValue = select.value !== "";
    select.classList.toggle("is-selected", hasValue);
  };

  syncSelectState();
  select.addEventListener("change", syncSelectState);
});

document.querySelectorAll("[data-datepicker]").forEach((el) => {
  flatpickr(el, {
    wrap: true,
    dateFormat: "Y-m-d",
    allowInput: false,
    disableMobile: true,
  });
});

document.querySelectorAll("[data-copy]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const target = document.querySelector(btn.getAttribute("data-copy"));
    if (!target) return;

    const text = "value" in target ? target.value : target.textContent;
    try {
      await navigator.clipboard.writeText(String(text || "").trim());
      const label = btn.querySelector("[data-copy-label]");
      if (label) {
        const prev = label.textContent;
        label.textContent = "Copied";
        setTimeout(() => {
          label.textContent = prev;
        }, 1500);
      }
    } catch {
      /* clipboard blocked */
    }
  });
});

document.querySelectorAll("[data-file-input]").forEach((input) => {
  const nameEl = input
    .closest("label")
    ?.querySelector("[data-file-name]");
  if (!nameEl) return;

  input.addEventListener("change", () => {
    const file = input.files?.[0];
    nameEl.textContent = file ? file.name : "No file chosen";
    nameEl.classList.toggle("text-body", Boolean(file));
    nameEl.classList.toggle("text-body/45", !file);
  });
});

FilePond.registerPlugin(
  FilePondPluginFileValidateType,
  FilePondPluginImagePreview,
);

document.querySelectorAll("[data-upload-box]").forEach((box) => {
  const input = box.querySelector("[data-filepond]");
  const idle = box.querySelector("[data-upload-idle]");
  const browseBtn = box.querySelector("[data-upload-browse]");
  if (!input) return;

  const pond = FilePond.create(input, {
    allowMultiple: true,
    acceptedFileTypes: [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/svg+xml",
    ],
    labelIdle: " ",
    labelFileTypeNotAllowed: "Invalid file type",
    fileValidateTypeLabelExpectedTypes: "Expects PNG, JPG, WebP or SVG",
    imagePreviewHeight: 240,
    imagePreviewMinHeight: 200,
    imagePreviewMaxHeight: 320,
    imagePreviewTransparencyIndicator: null,
    styleItemPanelAspectRatio: "0.75",
    styleButtonRemoveItemPosition: "right top",
    credits: false,
  });

  const syncFiles = () => {
    const count = pond.getFiles().length;
    box.classList.toggle("has-files", count > 0);
    box.dataset.filesCount = String(count);
  };

  browseBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    pond.browse();
  });

  idle?.addEventListener("click", (e) => {
    if (e.target.closest("[data-upload-browse]")) return;
    pond.browse();
  });

  ["dragenter", "dragover"].forEach((evt) => {
    box.addEventListener(evt, (e) => {
      e.preventDefault();
      box.classList.add("is-dragover");
    });
  });

  ["dragleave", "drop"].forEach((evt) => {
    box.addEventListener(evt, (e) => {
      e.preventDefault();
      box.classList.remove("is-dragover");
    });
  });

  box.addEventListener("drop", (e) => {
    const files = e.dataTransfer?.files;
    if (!files?.length) return;
    pond.addFiles(files);
  });

  pond.on("addfile", syncFiles);
  pond.on("removefile", syncFiles);
  syncFiles();
});

document.querySelectorAll("[data-multi-select]").forEach((root) => {
  const trigger = root.querySelector("[data-multi-trigger]");
  const menu = root.querySelector("[data-multi-menu]");
  const chipsEl = root.querySelector("[data-multi-chips]");
  const placeholder = root.querySelector("[data-multi-placeholder]");
  const chevron = root.querySelector("[data-multi-chevron]");
  const options = [...root.querySelectorAll("[data-multi-option]")];
  if (!trigger || !menu || !chipsEl) return;

  const selected = new Set(
    options
      .filter((opt) => opt.getAttribute("aria-selected") === "true")
      .map((opt) => opt.dataset.value),
  );

  const renderChips = () => {
    chipsEl.innerHTML = "";
    options.forEach((opt) => {
      const value = opt.dataset.value;
      const label = opt.dataset.label || opt.textContent.trim();
      const isOn = selected.has(value);
      opt.setAttribute("aria-selected", String(isOn));
      if (!isOn) return;

      const chip = document.createElement("span");
      chip.className =
        "inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-body";
      chip.innerHTML = `${label}<button type="button" class="grid size-4 place-items-center rounded-full text-body/60 transition hover:bg-border hover:text-body" data-chip-remove data-value="${value}" aria-label="Remove ${label}"><svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>`;
      chipsEl.appendChild(chip);
    });

    placeholder?.classList.toggle("hidden", selected.size > 0);
  };

  const setOpen = (open) => {
    menu.classList.toggle("hidden", !open);
    trigger.setAttribute("aria-expanded", String(open));
    chevron?.classList.toggle("rotate-180", open);
  };

  trigger.addEventListener("click", (e) => {
    if (e.target.closest("[data-chip-remove]")) return;
    setOpen(menu.classList.contains("hidden"));
  });

  options.forEach((opt) => {
    opt.addEventListener("click", () => {
      const value = opt.dataset.value;
      if (selected.has(value)) selected.delete(value);
      else selected.add(value);
      renderChips();
    });
  });

  chipsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-chip-remove]");
    if (!btn) return;
    e.stopPropagation();
    selected.delete(btn.dataset.value);
    renderChips();
  });

  document.addEventListener("click", (e) => {
    if (!root.contains(e.target)) setOpen(false);
  });

  renderChips();
});

const signupForm = document.getElementById("signup-form");
const signupPassword = document.getElementById("signup-password");
const signupPasswordConfirm = document.getElementById(
  "signup-password-confirm",
);

function validateSignupPasswords() {
  if (!signupPassword || !signupPasswordConfirm) return true;

  if (
    signupPasswordConfirm.value &&
    signupPassword.value !== signupPasswordConfirm.value
  ) {
    signupPasswordConfirm.setCustomValidity("Passwords do not match");
    return false;
  }

  signupPasswordConfirm.setCustomValidity("");
  return true;
}

if (signupPassword && signupPasswordConfirm) {
  signupPassword.addEventListener("input", validateSignupPasswords);
  signupPasswordConfirm.addEventListener("input", validateSignupPasswords);
}

signupForm?.addEventListener("submit", (event) => {
  if (!validateSignupPasswords()) {
    event.preventDefault();
    signupPasswordConfirm?.reportValidity();
  }
});

/* Mobile header slide menu */
const headerSlide = document.querySelector(".header-slide");
const headerSlideOverlay = document.querySelector(".header-slide-overlay");
const toggleSlideBtns = document.querySelectorAll(".toggle-slide-btn");
const closeSlideBtns = document.querySelectorAll(".header-slide-close");

function setSearchBtnState(btn, isOpen) {
  btn.classList.toggle("is-active", isOpen);
  btn.setAttribute("aria-expanded", String(isOpen));
  btn.setAttribute("aria-label", isOpen ? "Close search" : "Open search");
  btn.querySelector(".search-btn-icon--open")?.classList.toggle("hidden", isOpen);
  btn.querySelector(".search-btn-icon--close")?.classList.toggle("hidden", !isOpen);
}

function closeMobileSearch() {
  document.querySelector(".search-bar")?.classList.remove("is-open");
  document.querySelectorAll(".search-btn").forEach((btn) => {
    setSearchBtnState(btn, false);
  });
}

function openHeaderSlide() {
  if (!headerSlide) return;
  closeMobileSearch();
  headerSlide.classList.add("is-open");
  headerSlideOverlay?.classList.add("is-open");
  document.body.classList.add("menu-open");
  toggleSlideBtns.forEach((btn) => btn.setAttribute("aria-expanded", "true"));
}

function closeHeaderSlide() {
  if (!headerSlide) return;
  headerSlide.classList.remove("is-open");
  headerSlideOverlay?.classList.remove("is-open");
  document.body.classList.remove("menu-open");
  toggleSlideBtns.forEach((btn) => btn.setAttribute("aria-expanded", "false"));
}

toggleSlideBtns.forEach((btn) => {
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-controls", "header-slide");
  btn.addEventListener("click", () => {
    if (headerSlide?.classList.contains("is-open")) closeHeaderSlide();
    else openHeaderSlide();
  });
});

closeSlideBtns.forEach((btn) => {
  btn.addEventListener("click", closeHeaderSlide);
});

headerSlideOverlay?.addEventListener("click", closeHeaderSlide);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeHeaderSlide();
});

window.addEventListener("resize", () => {
  if (window.matchMedia("(min-width: 80rem)").matches) closeHeaderSlide();
});

document.querySelectorAll(".openLogin").forEach((btn) => {
  btn.addEventListener("click", () => {
    window.location.href = "login-pg.html";
  });
});

document.querySelectorAll(".openSignup").forEach((btn) => {
  btn.addEventListener("click", () => {
    window.location.href = "signup-pg.html";
  });
});

document.querySelectorAll(".search-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const bar = document.querySelector(".search-bar");
    if (!bar) return;
    const willOpen = !bar.classList.contains("is-open");
    bar.classList.toggle("is-open", willOpen);
    setSearchBtnState(btn, willOpen);
    if (willOpen) {
      bar.querySelector("input")?.focus();
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMobileSearch();
});

/* Discussions bottom sheet (mobile) */
const discussionsSheet = document.querySelector(".discussions-sheet");
const discussionsSheetOverlay = document.querySelector(".discussions-sheet-overlay");
const discussionsSheetBtns = document.querySelectorAll(".discussions-sheet-btn");
const discussionsSheetCloses = document.querySelectorAll(".discussions-sheet-close");

function openDiscussionsSheet() {
  if (!discussionsSheet) return;
  discussionsSheet.classList.add("is-open");
  discussionsSheetOverlay?.classList.add("is-open");
  document.body.classList.add("discussions-sheet-open");
  discussionsSheetBtns.forEach((btn) => btn.setAttribute("aria-expanded", "true"));
}

function closeDiscussionsSheet() {
  if (!discussionsSheet) return;
  discussionsSheet.classList.remove("is-open");
  discussionsSheetOverlay?.classList.remove("is-open");
  document.body.classList.remove("discussions-sheet-open");
  discussionsSheetBtns.forEach((btn) => btn.setAttribute("aria-expanded", "false"));
}

discussionsSheetBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (discussionsSheet?.classList.contains("is-open")) closeDiscussionsSheet();
    else openDiscussionsSheet();
  });
});

discussionsSheetCloses.forEach((btn) => {
  btn.addEventListener("click", closeDiscussionsSheet);
});

discussionsSheetOverlay?.addEventListener("click", closeDiscussionsSheet);

discussionsSheet?.querySelectorAll("a[href]").forEach((link) => {
  link.addEventListener("click", () => {
    if (window.matchMedia("(width < 64rem)").matches) closeDiscussionsSheet();
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeDiscussionsSheet();
});

window.addEventListener("resize", () => {
  if (window.matchMedia("(width >= 64rem)").matches) closeDiscussionsSheet();
});

/* Members page — filter by name */
const membersSearchInput = document.querySelector(".members-search__input");
const membersCountEl = document.querySelector("[data-members-count]");
const memberItems = document.querySelectorAll(".members-list > .col-md-6");

function filterMembers() {
  if (!memberItems.length) return;

  const query = (membersSearchInput?.value || "").trim().toLowerCase();
  let visible = 0;

  memberItems.forEach((item) => {
    const name =
      item.querySelector(".member-card__name")?.textContent?.trim().toLowerCase() ||
      "";
    const match = !query || name.includes(query);
    item.hidden = !match;
    if (match) visible += 1;
  });

  if (membersCountEl) membersCountEl.textContent = String(visible);
}

membersSearchInput?.addEventListener("input", filterMembers);

/* Categories page — filter by name / subcategories */
const categoriesSearchInput = document.querySelector(".categories-search__input");
const categoriesCountEl = document.querySelector("[data-categories-count]");
const categoryItems = document.querySelectorAll(".categories-list > .category-card");

function filterCategories() {
  if (!categoryItems.length) return;

  const query = (categoriesSearchInput?.value || "").trim().toLowerCase();
  let visible = 0;

  categoryItems.forEach((card) => {
    const title =
      card.querySelector(".category-card__title")?.textContent?.trim().toLowerCase() ||
      "";
    const desc =
      card.querySelector(".category-card__desc")?.textContent?.trim().toLowerCase() ||
      "";
    const subs = Array.from(card.querySelectorAll(".category-card__sub-title"))
      .map((el) => el.textContent?.trim().toLowerCase() || "")
      .join(" ");
    const match = !query || title.includes(query) || desc.includes(query) || subs.includes(query);
    card.hidden = !match;
    if (match) visible += 1;
  });

  if (categoriesCountEl) categoriesCountEl.textContent = String(visible);
}

categoriesSearchInput?.addEventListener("input", filterCategories);

/* Tags page — filter by tag name */
const tagsSearchInput = document.querySelector(".tags-search__input");
const tagsCountEl = document.querySelector("[data-tags-count]");
const tagItems = document.querySelectorAll(".tags-list > .tag-card");

function filterTags() {
  if (!tagItems.length) return;

  const query = (tagsSearchInput?.value || "").trim().toLowerCase();
  let visible = 0;

  tagItems.forEach((card) => {
    const name =
      card.querySelector(".tag-card__name")?.textContent?.trim().toLowerCase() ||
      "";
    const match = !query || name.includes(query);
    card.hidden = !match;
    if (match) visible += 1;
  });

  if (tagsCountEl) tagsCountEl.textContent = String(visible);
}

tagsSearchInput?.addEventListener("input", filterTags);

function scrollToTarget(selector) {
  const target = document.querySelector(selector);
  if (!target) return;

  const header = document.querySelector(".site-header");
  const offset = header ? header.getBoundingClientRect().height + 8 : 8;
  const top = target.getBoundingClientRect().top + window.scrollY - offset;

  window.scrollTo({ top, behavior: "smooth" });
}

document.querySelectorAll("[data-scroll-to]").forEach((el) => {
  const go = () => {
    const selector = el.getAttribute("data-scroll-to");
    if (selector) scrollToTarget(selector);
  };

  el.addEventListener("click", go);
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      go();
    }
  });
});

document.querySelectorAll(".btn-fill, .btn-secondary").forEach((button) => {
  let circle = button.querySelector(".btn__ripple");
  if (!circle) {
    circle = document.createElement("span");
    circle.className = "btn__ripple";
    circle.setAttribute("aria-hidden", "true");
    button.prepend(circle);
  }

  const updatePosition = (event) => {
    const rect = button.getBoundingClientRect();
    circle.style.left = `${event.clientX - rect.left}px`;
    circle.style.top = `${event.clientY - rect.top}px`;
  };

  button.addEventListener("pointerenter", updatePosition);
  button.addEventListener("pointermove", updatePosition);
  button.addEventListener("focus", () => {
    circle.style.left = `${button.offsetWidth / 2}px`;
    circle.style.top = `${button.offsetHeight / 2}px`;
  });
});

function setProfileTab(target) {
  if (!target) return;

  document.querySelectorAll("[data-profile-tab]").forEach((btn) => {
    const on = btn.getAttribute("data-profile-tab") === target;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-selected", String(on));
  });

  document.querySelectorAll("[data-profile-panel]").forEach((panel) => {
    const on = panel.getAttribute("data-profile-panel") === target;
    panel.classList.toggle("hidden", !on);
    panel.hidden = !on;
  });
}

function setActivityTab(target) {
  if (!target) return;

  document.querySelectorAll("[data-activity-tab]").forEach((btn) => {
    const on = btn.getAttribute("data-activity-tab") === target;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-selected", String(on));
  });

  document.querySelectorAll("[data-activity-panel]").forEach((panel) => {
    const on = panel.getAttribute("data-activity-panel") === target;
    panel.classList.toggle("hidden", !on);
    panel.hidden = !on;
  });
}

document.querySelectorAll("[data-profile-tab]").forEach((tab) => {
  tab.addEventListener("click", () => {
    setProfileTab(tab.getAttribute("data-profile-tab"));
  });
});

document.querySelectorAll("[data-activity-tab]").forEach((tab) => {
  tab.addEventListener("click", () => {
    setActivityTab(tab.getAttribute("data-activity-tab"));
  });
});

document.querySelectorAll("[data-goto-activity]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-goto-activity");
    if (!target) return;
    setProfileTab("activity");
    setActivityTab(target);
  });
});

const forgetForm = document.getElementById("forget-password-form");
const forgetFormView = document.getElementById("forget-form-view");
const forgetSuccessView = document.getElementById("forget-success-view");
const forgetSuccessEmail = document.getElementById("forget-success-email");
const forgetResendBtn = document.getElementById("forget-resend-btn");

function showForgetSuccess(email) {
  if (!forgetFormView || !forgetSuccessView) return;
  if (forgetSuccessEmail) forgetSuccessEmail.textContent = email;
  forgetFormView.classList.add("hidden");
  forgetFormView.hidden = true;
  forgetSuccessView.classList.remove("hidden");
  forgetSuccessView.hidden = false;
}

forgetForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const emailInput = forgetForm.querySelector("#forget-email");
  const email = emailInput?.value?.trim();
  if (!email || !emailInput.checkValidity()) {
    emailInput?.reportValidity();
    return;
  }
  showForgetSuccess(email);
});

forgetResendBtn?.addEventListener("click", () => {
  if (!forgetFormView || !forgetSuccessView) return;
  forgetSuccessView.classList.add("hidden");
  forgetSuccessView.hidden = true;
  forgetFormView.classList.remove("hidden");
  forgetFormView.hidden = false;
  forgetForm?.querySelector("#forget-email")?.focus();
});

