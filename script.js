async function fetchPosts() {
  const response = await fetch('posts.json');
  if (!response.ok) {
    throw new Error(`Failed to load posts.json (${response.status})`);
  }
  return await response.json();
}

function renderPosts(posts, containerId, limit = null) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const writingPosts = posts.filter(post => !post.type || post.type === 'writing');
  const visiblePosts = limit ? writingPosts.slice(0, limit) : writingPosts;

  if (visiblePosts.length === 0) {
    container.innerHTML = '<p class="thought-meta">No posts yet.</p>';
    return;
  }

  visiblePosts.forEach(post => {
    const item = document.createElement('a');
    item.className = 'thought-item';
    item.href = post.url || '#';

    item.innerHTML = `
      <div class="thought-row">
        <span class="thought-title">${post.title || 'Untitled'}</span>
        <span class="thought-dots"></span>
        <span class="thought-meta">${post.date || ''}</span>
      </div>
    `;

    container.appendChild(item);
  });
}

async function initPosts() {
  try {
    const posts = await fetchPosts();
    renderPosts(posts, 'posts', 5);
    renderPosts(posts, 'all-posts');
  } catch (error) {
    console.error(error);

    const home = document.getElementById('posts');
    const all = document.getElementById('all-posts');

    if (home) home.innerHTML = '<p class="thought-meta">Could not load posts.</p>';
    if (all) all.innerHTML = '<p class="thought-meta">Could not load posts.</p>';
  }
}

window.addEventListener('DOMContentLoaded', initPosts);
