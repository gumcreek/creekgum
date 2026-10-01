async function loadAllPosts() {
  try {
    const response = await fetch('posts.json');
    if (!response.ok) throw new Error('Failed to load posts');

    const posts = await response.json();
    const container = document.getElementById('all-posts');

    if (!container) return;

    const writingPosts = posts.filter(post => post.type === 'writing');

    writingPosts.forEach(post => {
      const item = document.createElement('a');
      item.className = 'thought-item';
      item.href = post.url || '#';

      item.innerHTML = `
        <span class="thought-title">${post.title}</span>
        <span class="thought-meta">${post.date || ''}</span>
      `;

      container.appendChild(item);
    });
  } catch (error) {
    console.error(error);
  }
}

loadAllPosts();
