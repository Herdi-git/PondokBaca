// Header solid background on scroll
const header = document.getElementById('siteHeader');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 10);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Mobile menu toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
});
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Scrollspy: highlight active nav link
const sections = ['home', 'activity', 'books', 'contact']
  .map(id => document.getElementById(id))
  .filter(Boolean);
const navByHash = {};
document.querySelectorAll('[data-nav]').forEach(a => {
  navByHash[a.getAttribute('href')] = a;
});
const spy = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      Object.values(navByHash).forEach(a => a.classList.remove('active'));
      const link = navByHash['#' + entry.target.id];
      if (link) link.classList.add('active');
    }
  });
}, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
sections.forEach(sec => spy.observe(sec));

// Book filter
const chips = document.querySelectorAll('.filter-chip');
const cards = document.querySelectorAll('.book-card');
chips.forEach(chip => {
  chip.addEventListener('click', () => {
    chips.forEach(c => { c.classList.remove('active'); c.setAttribute('aria-selected', 'false'); });
    chip.classList.add('active');
    chip.setAttribute('aria-selected', 'true');
    const filter = chip.dataset.filter;
    cards.forEach(card => {
      const show = filter === 'all' || card.dataset.category === filter;
      card.style.display = show ? '' : 'none';
    });
  });
});

// Public comments are stored in Supabase after admin approval.
const supabaseUrl = 'https://sargevvemoyzbgisxufo.supabase.co';
const supabaseAnonKey = 'sb_publishable_0GduBfN3xkTyyr_zTpyxJQ_oYTU5iEs';
const supabaseConfigured = !supabaseUrl.includes('PROJECT_ID') && !supabaseAnonKey.includes('SUPABASE_ANON_KEY_ANDA');
const commentsList = document.getElementById('commentsList');

const loadComments = async () => {
  if (!supabaseConfigured || !commentsList) return;

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/comments?select=name,message,created_at&status=eq.approved&order=created_at.desc`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`
      }
    });

    if (!response.ok) throw new Error('Could not load comments');
    const comments = await response.json();
    commentsList.replaceChildren();

    if (!comments.length) {
      commentsList.innerHTML = '<p class="comments-empty">Belum ada komentar yang ditampilkan.</p>';
      return;
    }

    comments.forEach(comment => {
      const article = document.createElement('article');
      article.className = 'comment-card';

      const name = document.createElement('h3');
      name.textContent = comment.name;
      const message = document.createElement('p');
      message.textContent = comment.message;
      article.append(name, message);
      commentsList.append(article);
    });
  } catch (error) {
    commentsList.innerHTML = '<p class="comments-empty">Komentar belum dapat dimuat.</p>';
  }
};

const saveComment = async (data) => {
  if (!supabaseConfigured) return false;

  const response = await fetch(`${supabaseUrl}/rest/v1/comments`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({ name: data.name, message: data.message, status: 'pending' })
  });

  if (!response.ok) throw new Error('Could not save comment');
  return true;
};

// Contact form via Formspree and Supabase.
const form = document.getElementById('contactForm');
const note = document.getElementById('formNote');
if (form) form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!form.checkValidity()) {
    note.textContent = 'Mohon lengkapi nama, email, dan pesan terlebih dahulu.';
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Mengirim...';
  note.textContent = '';

  try {
    const formData = new FormData(form);
    const response = await fetch(form.action, {
      method: 'POST',
      body: formData,
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) throw new Error('Formspree request failed');

    let commentSaved = false;
    try {
      commentSaved = await saveComment({
        name: formData.get('name'),
        message: formData.get('message')
      });
    } catch (error) {
      commentSaved = false;
    }

    note.textContent = commentSaved
      ? 'Pesan berhasil dikirim. Komentar menunggu persetujuan admin.'
      : 'Pesan email berhasil dikirim, tetapi komentar belum tersimpan.';
    form.reset();
    await loadComments();
  } catch (error) {
    note.textContent = 'Pesan belum terkirim. Silakan coba lagi.';
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Kirim Pesan';
  }
});

loadComments();
