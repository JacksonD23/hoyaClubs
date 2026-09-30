const params = new URLSearchParams(window.location.search);
const clubId = params.get('id');
const loading = document.querySelector('#profile-loading');
const errorMessage = document.querySelector('#profile-error');
const profile = document.querySelector('#club-profile');
const difficultyColors = { 1: '#d50032', 2: '#e87542', 3: '#e3bd45', 4: '#91bd4a', 5: '#5fa343' };
const difficultyLabels = { 1: 'Very difficult', 2: 'Difficult', 3: 'Moderate', 4: 'Approachable', 5: 'Easy' };
const accessLabels = { open: 'General', application: 'Applied' };

function addDetail(list, label, value) {
  if (!value) return;
  const item = document.createElement('div');
  item.className = 'profile-detail-item';
  const term = document.createElement('dt');
  term.textContent = label;
  const description = document.createElement('dd');
  description.textContent = value;
  item.append(term, description);
  list.append(item);
}

function addDifficultyDetail(list, rating) {
  const item = document.createElement('div');
  item.className = 'profile-detail-item';
  const term = document.createElement('dt');
  term.textContent = 'Ease of Entry Rating';
  const description = document.createElement('dd');
  const row = document.createElement('span');
  row.className = 'profile-detail-rating';
  const meter = document.createElement('span');
  meter.className = 'difficulty-meter';
  meter.style.setProperty('--difficulty-color', difficultyColors[rating]);
  meter.setAttribute('role', 'img');
  meter.setAttribute('aria-label', `Ease of Entry Rating: ${rating} out of 5, ${difficultyLabels[rating]}`);
  for (let segment = 1; segment <= 5; segment += 1) {
    const bar = document.createElement('span');
    bar.className = segment <= rating ? 'difficulty-segment is-active' : 'difficulty-segment';
    meter.append(bar);
  }
  const label = document.createElement('span');
  label.className = 'profile-detail-rating-label';
  label.textContent = difficultyLabels[rating];
  row.append(meter, label);
  description.append(row);
  item.append(term, description);
  list.append(item);
}

function addApplicationSizeDetail(list, size) {
  if (!size) return;
  const item = document.createElement('div');
  item.className = 'profile-detail-item';
  const term = document.createElement('dt');
  term.textContent = 'Application size';
  const description = document.createElement('dd');
  const normalizedSize = String(size).trim().toLowerCase();
  const badgeClass = ['small', 'medium', 'large'].includes(normalizedSize) ? `application-size-${normalizedSize}` : 'application-size-other';
  const badge = document.createElement('span');
  badge.className = `application-size-badge ${badgeClass}`;
  badge.textContent = size;
  description.append(badge);
  item.append(term, description);
  list.append(item);
}

function addApplicationDeadlineDetail(list, dateValue) {
  if (!dateValue) return;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  if (!match) {
    addDetail(list, 'Application deadline', dateValue);
    return;
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const deadlineUtc = Date.UTC(year, month - 1, day);
  const parsed = new Date(deadlineUtc);
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    addDetail(list, 'Application deadline', dateValue);
    return;
  }

  const suffix = day % 100 >= 11 && day % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[day % 10] || 'th');
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(parsed);
  const displayDate = `${monthName} ${day}${suffix}, ${year}`;
  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const daysUntilDeadline = Math.round((deadlineUtc - todayUtc) / 86400000);
  const status = daysUntilDeadline < 0
    ? { label: 'Past due', className: 'deadline-past' }
    : daysUntilDeadline <= 3
      ? { label: 'Due soon', className: 'deadline-soon' }
      : { label: 'Still open', className: 'deadline-open' };

  const item = document.createElement('div');
  item.className = 'profile-detail-item';
  const term = document.createElement('dt');
  term.textContent = 'Application deadline';
  const description = document.createElement('dd');
  const row = document.createElement('span');
  row.className = 'deadline-detail';
  const date = document.createElement('span');
  date.textContent = displayDate;
  const badge = document.createElement('span');
  badge.className = `deadline-status ${status.className}`;
  badge.textContent = status.label;
  badge.setAttribute('role', 'status');
  row.append(date, badge);
  description.append(row);
  item.append(term, description);
  list.append(item);
}

function addAccessDetail(list, accessTypes) {
  const types = (accessTypes || []).filter((type) => accessLabels[type]);
  if (!types.length) return;
  const item = document.createElement('div');
  item.className = 'profile-detail-item';
  const term = document.createElement('dt');
  term.textContent = 'Membership';
  const description = document.createElement('dd');
  const pills = document.createElement('span');
  pills.className = 'profile-access-pills';
  types.forEach((type) => {
    const pill = document.createElement('span');
    pill.className = `access-chip access-${type}`;
    pill.textContent = accessLabels[type];
    pills.append(pill);
  });
  description.append(pills);
  item.append(term, description);
  list.append(item);
}

function renderProfile(club) {
  document.title = `${club.name} — HoyaClubs`;
  document.querySelector('#profile-group').textContent = club.organizationGroup || 'Georgetown student organization';
  document.querySelector('#profile-name').textContent = club.name;

  if (club.logo) {
    const logoPanel = document.querySelector('#club-logo-panel');
    const logo = document.querySelector('#club-logo');
    logo.src = club.logo;
    logo.alt = `${club.name} logo`;
    logoPanel.hidden = false;
  }

  const tags = document.querySelector('#profile-tags');
  (club.tags || []).forEach((tag) => {
    const chip = document.createElement('span');
    chip.className = 'profile-tag';
    chip.textContent = tag;
    tags.append(chip);
  });

  const difficulty = Number(club.entryDifficulty);

  document.querySelector('#profile-description').textContent = club.description || 'A club description has not been added yet. Know more? Share an update to help complete this profile.';

  const details = document.querySelector('#profile-details');
  addDetail(details, 'Time commitment', club.timeCommitment);
  addDetail(details, 'Membership', club.membership);
  addDetail(details, 'Approximate size', club.size);
  addDetail(details, 'How to join', club.entryLabel);
  addApplicationDeadlineDetail(details, club.applicationDeadline);
  addApplicationSizeDetail(details, club.applicationSize);
  addAccessDetail(details, club.accessTypes);
  if (Number.isInteger(difficulty) && difficulty >= 1 && difficulty <= 5) addDifficultyDetail(details, difficulty);
  addDetail(details, 'Typical meetings', club.meetingSchedule);
  addDetail(details, 'Last reviewed', club.lastReviewed);
  if (club.email) {
    const item = document.createElement('div');
    item.className = 'profile-detail-item';
    const term = document.createElement('dt');
    term.textContent = 'Email';
    const description = document.createElement('dd');
    const link = document.createElement('a');
    link.href = `mailto:${club.email}`;
    link.textContent = club.email;
    description.append(link);
    item.append(term, description);
    details.append(item);
  }
  if (club.website) {
    const item = document.createElement('div');
    item.className = 'profile-detail-item';
    const term = document.createElement('dt');
    term.textContent = 'Website';
    const description = document.createElement('dd');
    const link = document.createElement('a');
    link.href = club.website;
    link.textContent = 'Visit club website ↗';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    description.append(link);
    item.append(term, description);
    details.append(item);
  }
  if (!details.children.length) document.querySelector('.profile-details-panel').hidden = true;

  const questions = club.applicationQuestions || [];
  if (club.applicationProcess || questions.length || club.entryLabel) {
    const panel = document.querySelector('#application-panel');
    panel.hidden = false;
    document.querySelector('#application-process').textContent = club.applicationProcess || club.entryLabel || 'Joining details have not been added yet.';
    if (questions.length) {
      const questionList = document.querySelector('#application-questions');
      questionList.hidden = false;
      const list = questionList.querySelector('ul');
      questions.forEach((question) => {
        const item = document.createElement('li');
        item.textContent = question;
        list.append(item);
      });
    }
  }

  loading.hidden = true;
  profile.hidden = false;
}

fetch('data/clubs.json')
  .then((response) => {
    if (!response.ok) throw new Error('Could not load the club directory.');
    return response.json();
  })
  .then((clubs) => {
    const club = clubs.find((entry) => entry.id === clubId);
    if (!club) throw new Error('That club profile could not be found.');
    renderProfile(club);
  })
  .catch((error) => {
    loading.hidden = true;
    errorMessage.hidden = false;
    errorMessage.textContent = `${error.message} Return to the directory to browse available clubs.`;
  });
