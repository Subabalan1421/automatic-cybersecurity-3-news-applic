// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.error('Service worker registration failed:', err);
    });
  });
}

const STORAGE_KEY = 'cyberglow_digest_data';
const RSS_API = 'https://api.rss2json.com/v1/api.json?rss_url=https://feeds.feedburner.com/TheHackersNews';

// Fallback Exam Data (Top 3)
const DEFAULT_EXAMS = [
  { title: "SAT 2026: Registration & Upcoming Test Windows", link: "https://satsuite.collegeboard.org/" },
  { title: "CUET UG / PG 2026: Official Counseling & Dates", link: "https://exams.nta.ac.in/CUET-UG/" },
  { title: "NTA NEET UG 2026: Registration Updates & Policies", link: "https://exams.nta.ac.in/NEET/" }
];

// UI Elements
const statusBadge = document.getElementById('status-badge');
const greetingText = document.getElementById('greeting-text');
const currentDateEl = document.getElementById('current-date');
const cyberNewsList = document.getElementById('cyber-news-list');
const examsList = document.getElementById('exams-list');
const lastSyncEl = document.getElementById('last-sync-time');

// Set Date & Dynamic Greeting
function updateDateTime() {
  const now = new Date();
  const hour = now.getHours();
  let greeting = "Good morning";
  if (hour >= 12 && hour < 17) greeting = "Good afternoon";
  else if (hour >= 17) greeting = "Good evening";

  greetingText.textContent = `${greeting} • Daily Update`;
  currentDateEl.textContent = now.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Update Network Status Badge
function updateOnlineStatus() {
  if (navigator.onLine) {
    statusBadge.textContent = '🟢 Online';
    statusBadge.className = 'text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-500/20 text-emerald-200 border border-emerald-400/30';
  } else {
    statusBadge.textContent = '🟡 Offline (Cached)';
    statusBadge.className = 'text-xs px-2.5 py-1 rounded-full font-medium bg-amber-500/20 text-amber-200 border border-amber-400/30';
  }
}

// Render News (Top 3)
function renderData(data) {
  if (!data || !data.news) return;

  // Render Top 3 News Items
  cyberNewsList.innerHTML = data.news.slice(0, 3).map(item => `
    <article class="p-3 rounded-xl border border-slate-100 hover:border-brand-200 bg-slate-50/50 transition">
      <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="block">
        <h4 class="text-xs font-bold text-brand-800 leading-snug hover:underline">${item.title}</h4>
        <p class="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">${item.description}</p>
      </a>
    </article>
  `).join('');

  // Render Top 3 Exam Items
  const exams = data.exams || DEFAULT_EXAMS;
  examsList.innerHTML = exams.slice(0, 3).map(item => `
    <li class="flex items-start gap-2">
      <span class="text-brand-600 font-bold text-xs leading-none">•</span>
      <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="text-slate-700 hover:text-brand-700 hover:underline leading-tight">
        ${item.title}
      </a>
    </li>
  `).join('');

  if (data.timestamp) {
    lastSyncEl.textContent = `Last updated: ${new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
}

// Fetch Fresh Data from Network
async function fetchFreshData() {
  if (!navigator.onLine) return;

  try {
    const res = await fetch(RSS_API);
    if (!res.ok) throw new Error('Network error');
    const result = await res.json();

    const formattedNews = (result.items || []).slice(0, 3).map(item => {
      // Clean HTML tags from description snippet
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = item.description;
      const cleanDesc = tempDiv.textContent || tempDiv.innerText || '';

      return {
        title: item.title,
        link: item.link,
        description: cleanDesc.slice(0, 140) + '...'
      };
    });

    const payload = {
      timestamp: Date.now(),
      news: formattedNews,
      exams: DEFAULT_EXAMS
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    renderData(payload);
  } catch (err) {
    console.warn('Could not fetch new data, using cached data.', err);
  }
}

// Load Cached Data First, then Sync
function init() {
  updateDateTime();
  updateOnlineStatus();

  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    renderData(JSON.parse(cached));
  }

  if (navigator.onLine) {
    fetchFreshData();
  }
}

// Event Listeners for Auto-Update on Reconnect
window.addEventListener('online', () => {
  updateOnlineStatus();
  fetchFreshData();
});

window.addEventListener('offline', () => {
  updateOnlineStatus();
});

init();
