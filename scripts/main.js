const searchInput = document.querySelector('#club-search');
const searchShortcut = document.querySelector('#search-shortcut');
const filterButtons = [...document.querySelectorAll('.filter-chip')];
const clubGrid = document.querySelector('#club-grid');
const resultCount = document.querySelector('#result-count');
const allClubsCount = document.querySelector('#all-clubs-count');
const emptyState = document.querySelector('#empty-state');
const directoryError = document.querySelector('#directory-error');

let clubs = [];
let activeCategory = 'all';

if (navigator.platform.toUpperCase().includes('MAC')) searchShortcut.textContent = '⌘ K';

const difficultyColors = {
  1: '#d50032',
  2: '#e87542',
  3: '#e3bd45',
  4: '#91bd4a',
  5: '#5fa343'
};
const difficultyLabels = { 1: 'Very difficult', 2: 'Difficult', 3: 'Moderate', 4: 'Approachable', 5: 'Easy' };
const accessLabels = { open: 'General', application: 'Applied' };

function createDifficultyIndicator(value, compact = false) {
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;

  const row = makeElement('div', compact ? 'difficulty-row difficulty-row-compact' : 'difficulty-row');
  const meter = makeElement('span', 'difficulty-meter');
  meter.style.setProperty('--difficulty-color', difficultyColors[rating]);
  meter.setAttribute('role', 'img');
  meter.setAttribute('aria-label', `Entry difficulty: ${rating} out of 5, ${difficultyLabels[rating]}`);
  for (let segment = 1; segment <= 5; segment += 1) {
    meter.append(makeElement('span', segment <= rating ? 'difficulty-segment is-active' : 'difficulty-segment'));
  }
  row.append(meter, makeElement('span', 'difficulty-label', 'Ease of Entry Rating'));
  return row;
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function createClubCard(club) {
  const card = makeElement('a', 'club-card');
  card.href = `club.html?id=${encodeURIComponent(club.id)}`;
  card.dataset.id = club.id;
  card.dataset.tags = (club.tags || []).map((tag) => tag.toLowerCase().replaceAll(' ', '-')).join(' ');
  card.dataset.search = [club.name, club.organizationGroup, club.description, ...(club.tags || [])].filter(Boolean).join(' ').toLowerCase();

  const top = makeElement('div', 'card-top');
  const category = makeElement('span', 'category-label');
  category.append(makeElement('span'));
  category.append(document.createTextNode(` ${club.organizationGroup}`));
  top.append(category, makeElement('span', 'card-arrow', '↗'));

  const title = makeElement('h3', '', club.name);
  card.append(top, title);

  if (club.tags?.length) {
    const tags = makeElement('div', 'club-tags');
    club.tags.forEach((tag) => tags.append(makeElement('span', 'club-tag', tag)));
    card.append(tags);
  }

  const accessTypes = (club.accessTypes || []).filter((type) => accessLabels[type]);
  if (accessTypes.length) {
    const access = makeElement('div', 'club-access-chips');
    accessTypes.forEach((type) => access.append(makeElement('span', `access-chip access-${type}`, accessLabels[type])));
    card.append(access);
  }
  const difficulty = createDifficultyIndicator(club.entryDifficulty, true);
  if (difficulty) card.append(difficulty);

  const details = [club.timeCommitment, club.membership].filter(Boolean);
  if (details.length) {
    const meta = makeElement('div', 'club-meta');
    details.forEach((detail) => meta.append(makeElement('span', '', detail)));
    card.append(meta);
  }

  if (club.size || club.entryLabel) {
    const footer = makeElement('div', 'card-footer');
    if (club.size) footer.append(makeElement('span', 'size-indicator', club.size));
    if (club.entryLabel) {
      const entryClass = club.entryType === 'selective' ? 'entry-label entry-selective' : 'entry-label';
      footer.append(makeElement('span', entryClass, club.entryLabel));
    }
    card.append(footer);
  }
  return card;
}

function updateDirectory() {
  const query = searchInput.value.trim().toLowerCase();
  let visibleCount = 0;

  [...clubGrid.children].forEach((card) => {
    const matchesCategory = activeCategory === 'all' || card.dataset.tags.split(' ').includes(activeCategory);
    const matchesQuery = !query || card.dataset.search.includes(query);
    const visible = matchesCategory && matchesQuery;
    card.hidden = !visible;
    if (visible) visibleCount += 1;
  });

  resultCount.textContent = `${visibleCount} ${visibleCount === 1 ? 'club' : 'clubs'}`;
  emptyState.hidden = visibleCount !== 0;
}

function renderClubs(records) {
  clubs = records;
  clubGrid.replaceChildren(...clubs.map(createClubCard));
  clubGrid.setAttribute('aria-busy', 'false');
  allClubsCount.textContent = String(clubs.length).padStart(2, '0');
  updateDirectory();
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeCategory = button.dataset.filter;
    filterButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    updateDirectory();
  });
  button.setAttribute('aria-pressed', String(button.classList.contains('active')));
});

searchInput.addEventListener('input', updateDirectory);

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    searchInput.focus();
  }
  if (event.key === 'Escape' && document.activeElement === searchInput) {
    searchInput.value = '';
    updateDirectory();
    searchInput.blur();
  }
});

const mainNavLinks = [...document.querySelectorAll('.main-nav a[href^="#"]')];
const mainNav = document.querySelector('.main-nav');
const navSections = mainNavLinks
  .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
  .filter((item) => item.section);

function updateActiveNavigation() {
  const readingLine = window.scrollY + Math.max(120, window.innerHeight * 0.36);
  let activeItem = navSections[0];
  navSections.forEach((item) => {
    if (item.section.getBoundingClientRect().top + window.scrollY <= readingLine) activeItem = item;
  });

  navSections.forEach(({ link }) => {
    const isActive = link === activeItem?.link;
    link.classList.toggle('nav-active', isActive);
    if (isActive) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });

  if (activeItem && mainNav) {
    const navBounds = mainNav.getBoundingClientRect();
    const linkBounds = activeItem.link.getBoundingClientRect();
    mainNav.style.setProperty('--nav-underline-x', `${linkBounds.left - navBounds.left}px`);
    mainNav.style.setProperty('--nav-underline-width', `${linkBounds.width}px`);
  }
}

let navigationUpdateQueued = false;
window.addEventListener('scroll', () => {
  if (navigationUpdateQueued) return;
  navigationUpdateQueued = true;
  window.requestAnimationFrame(() => {
    updateActiveNavigation();
    navigationUpdateQueued = false;
  });
}, { passive: true });
window.addEventListener('resize', updateActiveNavigation);
mainNavLinks.forEach((link) => link.addEventListener('click', updateActiveNavigation));
updateActiveNavigation();

fetch('data/clubs.json')
  .then((response) => {
    if (!response.ok) throw new Error(`Could not load the club data (${response.status}).`);
    return response.json();
  })
  .then((records) => {
    if (!Array.isArray(records)) throw new Error('The club data file must contain a JSON array.');
    renderClubs(records);
  })
  .catch((error) => {
    clubGrid.setAttribute('aria-busy', 'false');
    resultCount.textContent = 'Club data unavailable';
    directoryError.hidden = false;
    directoryError.textContent = `${error.message} Open the site through a local web server, then check data/clubs.json.`;
  });
