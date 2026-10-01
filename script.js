async function loadPosts() {
  try {
    const response = await fetch('posts.json');
    if (!response.ok) throw new Error('Failed to load posts');

    const posts = await response.json();
    const container = document.getElementById('posts');

    if (!container) return;

    posts.forEach(post => {
      const item = document.createElement('a');
      item.className = 'list-item';
      item.href = post.url || '#';

      item.innerHTML = `
        <div class="item-main">
          <span class="item-title">${post.title}</span>
          <span class="item-description">${post.description || ''}</span>
          <span class="post-meta">${post.date || ''}</span>
        </div>
      `;

      container.appendChild(item);
    });
  } catch (error) {
    console.error(error);
  }
}

loadPosts();
