/* ================================================
   BlogForChloe — Article Data, Rendering & Theme
   ================================================ */

// ── Article Metadata ─────────────────────────────
// To add a new article:
//   1. Write the article as a .md file in the articles/ folder
//   2. Add an entry here with slug, title, date, excerpt, file
// The full content lives in the .md file — no need to put it here.

var articles = {
  tech: [
    { slug: "build-static-blog",     title: "构建极简静态博客的思考与实践",       date: "2026-05-01", excerpt: "为什么我选择从零开始搭建一个静态博客，而不是使用现成的框架？本文记录了这个过程中的技术选型、设计考量与取舍……", file: "articles/build-static-blog.md" },
    { slug: "css-custom-properties", title: "深入理解 CSS 自定义属性",             date: "2026-04-18", excerpt: "CSS 自定义属性远不止是「CSS 变量」那么简单。它们在级联层面工作，拥有继承性和动态性，比预处理器变量强大得多……", file: "articles/css-custom-properties.md" },
    { slug: "typescript-patterns",   title: "TypeScript 日常开发中的实用模式",      date: "2026-03-30", excerpt: "辨析联合类型、模板字面量类型、类型守卫——这些 TypeScript 模式已经深深融入了我的日常开发工作流中……", file: "articles/typescript-patterns.md" },
    { slug: "rust-borrow-checker",   title: "借用一个下午，理解 Rust 的所有权模型",   date: "2026-02-15", excerpt: "Rust 的借用检查器让很多人望而却步。本文用具体的例子和思维模型，帮你建立对所有权和生命周期的直觉……", file: "articles/rust-borrow-checker.md" }
  ],
  book: [
    { slug: "pragmatic-programmer", title: "《程序员的修炼之道》—— 二十年后再读",     date: "2026-04-22", excerpt: "二十周年纪念版新增了不少内容，但最核心的洞见——正交性、曳光弹、知识组合——在今天依然闪耀着智慧的光芒……", file: "articles/pragmatic-programmer.md" },
    { slug: "sicp-notes",           title: "《计算机程序的构造与解释》阅读随想",       date: "2026-03-10", excerpt: "花了大半年时间慢慢读完了 SICP 的前三章。这本书改变了我对「抽象」这件事的理解方式……", file: "articles/sicp-notes.md" }
  ],
  life: [
    { slug: "home-office-setup", title: "打造一间能深度工作的书房",   date: "2026-05-05", excerpt: "物理环境对专注力的影响远超我们的想象。我花了三个月调整书房的布局、光线和声音，终于找到了适合长时间深度工作的状态……", file: "articles/home-office-setup.md" },
    { slug: "kyoto-travel",      title: "京都七日 —— 我的旅行手记", date: "2026-04-08", excerpt: "寺庙、茶室，以及我走过的最安静的街道。这是樱花季在京都七天的摄影笔记……", file: "articles/kyoto-travel.md" }
  ]
};

// ── Category Names ────────────────────────────────
var categoryNavNames   = { tech: "技术", book: "读书", life: "关于" };
var categoryPageTitles = { tech: "TECH", book: "BOOK", life: "关于" };

// ── About Page Content ────────────────────────────
var aboutParagraphs = [
  "这是我的个人网站，主要放置技术和读书方面的文章。",
  "如果你想联系我，我的邮箱是 zhangqinyutong@163.com 。"
];

// ── DOM References ────────────────────────────────
var pageTitle   = document.getElementById("page-title");
var articleList = document.getElementById("article-list");
var navLinks    = document.querySelectorAll(".nav-link");
var themeToggle = document.getElementById("theme-toggle");

// ==================================================
//  Minimal Markdown → HTML Parser  (zero dependency)
// ==================================================
function parseMarkdown(src) {
  var lines = src.replace(/\r\n/g, "\n").split("\n");
  var html  = "";
  var i     = 0;
  var inCodeBlock = false;
  var codeBuf     = "";
  var codeLang    = "";
  var paraBuf     = [];

  function flushPara() {
    if (paraBuf.length === 0) return;
    html += "<p>" + paraBuf.join("\n") + "</p>\n";
    paraBuf = [];
  }

  function flushCode() {
    var langAttr = codeLang ? ' class="language-' + escapeHtml(codeLang) + '"' : "";
    html += "<pre><code" + langAttr + ">" + codeBuf.trim() + "</code></pre>\n";
    codeBuf  = "";
    codeLang = "";
  }

  function inlineProcess(text) {
    // Inline code (must run before bold/italic)
    text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
    // Bold + italic
    text = text.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
    // Bold
    text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    // Italic
    text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
    // Links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    return text;
  }

  while (i < lines.length) {
    var line = lines[i];

    // Code block toggle
    if (line.trim().substring(0, 3) === "```") {
      flushPara();
      if (inCodeBlock) {
        flushCode();
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeLang = line.trim().substring(3).trim();
      }
      i++;
      continue;
    }

    if (inCodeBlock) {
      codeBuf += (codeBuf ? "\n" : "") + line;
      i++;
      continue;
    }

    // Heading
    var hMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (hMatch) {
      flushPara();
      var level = hMatch[1].length;
      html += "<h" + level + ">" + inlineProcess(hMatch[2]) + "</h" + level + ">\n";
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,})\s*$/.test(line.trim())) {
      flushPara();
      html += "<hr>\n";
      i++;
      continue;
    }

    // Unordered list
    var ulMatch = line.match(/^(\s*)[-*+]\s+(.+)/);
    if (ulMatch) {
      flushPara();
      html += "<ul>\n<li>" + inlineProcess(ulMatch[2]) + "</li>\n";
      i++;
      while (i < lines.length) {
        var nextUl = lines[i].match(/^\s*[-*+]\s+(.+)/);
        if (nextUl) {
          html += "<li>" + inlineProcess(nextUl[1]) + "</li>\n";
          i++;
        } else {
          break;
        }
      }
      html += "</ul>\n";
      continue;
    }

    // Ordered list
    var olMatch = line.match(/^\d+\.\s+(.+)/);
    if (olMatch) {
      flushPara();
      html += "<ol>\n<li>" + inlineProcess(olMatch[1]) + "</li>\n";
      i++;
      while (i < lines.length) {
        var nextOl = lines[i].match(/^\d+\.\s+(.+)/);
        if (nextOl) {
          html += "<li>" + inlineProcess(nextOl[1]) + "</li>\n";
          i++;
        } else {
          break;
        }
      }
      html += "</ol>\n";
      continue;
    }

    // Blank line → paragraph boundary
    if (line.trim() === "") {
      flushPara();
      i++;
      continue;
    }

    // Regular text — accumulate into paragraph
    paraBuf.push(inlineProcess(line));
    i++;
  }

  flushPara();
  if (inCodeBlock) flushCode();
  return html;
}

// ==================================================
//  Routing
// ==================================================
function getRoute() {
  var raw = window.location.hash.replace("#", "");
  if (!raw) return { page: "home" };
  // Decode in case the browser percent-encodes non-ASCII characters in the hash
  try { raw = decodeURIComponent(raw); } catch(e) {}
  var hash = raw;
  var slashIdx = hash.indexOf("/");
  if (slashIdx > -1) {
    var cat = hash.substring(0, slashIdx);
    var slug = hash.substring(slashIdx + 1);
    if (categoryPageTitles[cat]) return { page: "article", category: cat, slug: slug };
  } else {
    if (categoryPageTitles[hash]) return { page: "category", category: hash };
  }
  return { page: "home" };
}

// ==================================================
//  Helpers
// ==================================================
function formatDate(dateStr) {
  var parts = dateStr.split("-");
  return parts[1] + "." + parts[2];
}

function escapeHtml(str) {
  var div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function findArticleMeta(category, slug) {
  var list = articles[category] || [];
  for (var i = 0; i < list.length; i++) {
    if (list[i].slug === slug) return list[i];
  }
  return null;
}

// ==================================================
//  Render: Home Page
// ==================================================
function getAllArticles() {
  var all = [];
  Object.keys(articles).forEach(function (cat) {
    articles[cat].forEach(function (a) {
      all.push({ slug: a.slug, title: a.title, date: a.date, excerpt: a.excerpt, category: cat });
    });
  });
  all.sort(function (a, b) { return b.date.localeCompare(a.date); });
  return all;
}

function renderHome() {
  var all = getAllArticles();
  pageTitle.textContent = "";
  pageTitle.style.display = "none";

  var html = "";
  all.forEach(function (a) {
    html +=
      '<div class="home-article">' +
      '<a class="home-article-title" href="#' + a.category + "/" + a.slug + '">' + escapeHtml(a.title) + "</a>" +
      '<p class="home-article-excerpt">' + escapeHtml(a.excerpt) + "</p>" +
      '<span class="home-article-meta">' + categoryNavNames[a.category] + " · " + formatDate(a.date) + "</span>" +
      "</div>";
  });
  articleList.innerHTML = html;
}

// ==================================================
//  Render: Category Page
// ==================================================
function groupByYear(items) {
  var groups = {};
  items.forEach(function (item) {
    var year = item.date.substring(0, 4);
    if (!groups[year]) groups[year] = [];
    groups[year].push(item);
  });
  return Object.keys(groups).sort(function (a, b) { return b - a; }).map(function (year) {
    return { year: year, articles: groups[year] };
  });
}

function renderCategory(category) {
  pageTitle.style.display = "";
  pageTitle.textContent = categoryPageTitles[category];
  var items = articles[category] || [];
  var yearGroups = groupByYear(items);
  var html = "";

  yearGroups.forEach(function (group) {
    html += '<div class="year-group"><div class="year-label">' + group.year + "</div>";
    group.articles.forEach(function (a) {
      html +=
        '<div class="article-row">' +
        '<a class="article-title" href="#' + category + "/" + a.slug + '">' + escapeHtml(a.title) + "</a>" +
        '<span class="article-dots"></span>' +
        '<span class="article-date">' + formatDate(a.date) + "</span>" +
        "</div>";
    });
    html += "</div>";
  });
  articleList.innerHTML = html;
}

// ==================================================
//  Render: About Page
// ==================================================
function renderAbout() {
  pageTitle.style.display = "";
  pageTitle.textContent = categoryPageTitles["life"];

  var html = '<div class="about-content">';
  aboutParagraphs.forEach(function (p) {
    var linked = p.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<a href="mailto:$1">$1</a>');
    html += "<p>" + linked + "</p>";
  });
  html += "</div>";
  articleList.innerHTML = html;
}

// ==================================================
//  Render: Article Detail  (fetches .md, parses it)
// ==================================================
function renderArticle(category, slug) {
  if (category === "life") { renderAbout(); return; }

  var meta = findArticleMeta(category, slug);
  if (!meta) { renderHome(); return; }

  pageTitle.style.display = "none";
  document.title = meta.title + " — ChloeQYT";

  // Show loading placeholder
  articleList.innerHTML =
    '<div class="article-detail">' +
    '<a class="article-back" href="#' + category + '">← 返回 ' + categoryPageTitles[category] + "</a>" +
    '<h1 class="article-detail-title">' + escapeHtml(meta.title) + "</h1>" +
    '<div class="article-detail-meta">' + categoryPageTitles[category] + " · " + formatDate(meta.date) + "</div>" +
    '<div class="article-detail-body"><p>加载中……</p></div>' +
    "</div>";

  // Fetch the .md file and render
  var xhr = new XMLHttpRequest();
  xhr.open("GET", meta.file, true);
  xhr.onload = function () {
    if (xhr.status >= 200 && xhr.status < 300) {
      var mdHTML = parseMarkdown(xhr.responseText);
      // Strip the first <h1> from markdown — the JS title already serves that role
      mdHTML = mdHTML.replace(/<h1>[^<]*<\/h1>\n?/, "");
      articleList.innerHTML =
        '<div class="article-detail">' +
        '<a class="article-back" href="#' + category + '">← 返回 ' + categoryPageTitles[category] + "</a>" +
        '<h1 class="article-detail-title">' + escapeHtml(meta.title) + "</h1>" +
        '<div class="article-detail-meta">' + categoryPageTitles[category] + " · " + formatDate(meta.date) + "</div>" +
        '<div class="article-detail-body">' + mdHTML + "</div>" +
        "</div>";
    } else {
      articleList.querySelector(".article-detail-body").innerHTML = "<p>文章加载失败。</p>";
    }
  };
  xhr.onerror = function () {
    articleList.querySelector(".article-detail-body").innerHTML = "<p>文章加载失败。</p>";
  };
  xhr.send();
}

// ==================================================
//  Navigation & Theme
// ==================================================
function updateNavActive(category) {
  navLinks.forEach(function (link) {
    var c = link.getAttribute("data-category");
    link.classList.toggle("active", category && c === category);
  });
}

function updatePage() {
  var route = getRoute();

  if (route.page === "home") {
    updateNavActive(null);
    document.title = "ChloeQYT";
    renderHome();
  } else if (route.page === "article") {
    updateNavActive(route.category);
    renderArticle(route.category, route.slug);
  } else if (route.category === "life") {
    updateNavActive("life");
    document.title = "关于 — ChloeQYT";
    renderAbout();
  } else {
    updateNavActive(route.category);
    document.title = categoryPageTitles[route.category] + " — ChloeQYT";
    renderCategory(route.category);
  }
}

// ── Theme ─────────────────────────────────────────
var THEME_KEY = "blogforchloe-theme";

function getTheme() {
  var s = localStorage.getItem(THEME_KEY);
  return (s === "light" || s === "dark") ? s : "dark";
}

function applyTheme(t) { document.documentElement.setAttribute("data-theme", t); }

function toggleTheme() {
  var next = getTheme() === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

// ── Init ──────────────────────────────────────────
function init() {
  applyTheme(getTheme());
  themeToggle.addEventListener("click", toggleTheme);
  window.addEventListener("hashchange", updatePage);
  updatePage();
}

init();
