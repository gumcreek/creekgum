async function loadPosts() {
  try {
    const response = await fetch('posts.json');
    if (!response.ok) throw new Error('Failed to load posts');

    const posts = await response.json();
    const container = document.getElementById('posts');

    posts.forEach(post => {
      const item = document.createElement('a');
      item.className = 'list-item';
      item.href = post.url || '#';

      item.innerHTML = `
        <span class="item-title">${post.title}</span>
        <span class="item-description">${post.description || post.date}</span>
      `;

      container.appendChild(item);
    });
  } catch (error) {
    console.error(error);
  }
}

loadPosts();
