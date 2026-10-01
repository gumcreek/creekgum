async function loadPosts() {
  try {
    const response = await fetch('posts.json');
    if (!response.ok) throw new Error('Failed to load posts');

    const posts = await response.json();
    const container = document.getElementById('posts');

    if (!container) return;

    posts.forEach(post => {
      const item = document.createElement('a');
      item.className = 'post-item';
      item.href = post.url || '#';

      item.innerHTML = `
        <h3>${post.title}</h3>
        <p>${post.description || ''}</p>
        <div class="post-meta">${post.date || ''}</div>
      `;

      container.appendChild(item);
    });
  } catch (error) {
    console.error(error);
  }
}

loadPosts();
