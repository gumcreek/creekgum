window.addEventListener('DOMContentLoaded', () => {
  const svg = document.getElementById('logo');

  if (svg) {
    const word = 'LOGAN';
    const spacing = 210;
    const startX = 380;

    word.split('').forEach((char, index) => {
      const letter = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'text'
      );

      letter.textContent = char;
      letter.setAttribute('x', startX + index * spacing);
      letter.setAttribute('y', '420');
      letter.setAttribute('class', 'logo-letter');

      svg.appendChild(letter);

      let animating = false;

      letter.addEventListener('mouseenter', () => {
        if (animating) return;

        animating = true;

        letter.animate(
          [
            { transform: 'translateY(0px) scaleY(1) scaleX(1)' },
            { transform: 'translateY(-24px) scaleY(1.05) scaleX(0.99)' },
            { transform: 'translateY(6px) scaleY(0.985) scaleX(1.01)' },
            { transform: 'translateY(-8px) scaleY(1.01) scaleX(0.995)' },
            { transform: 'translateY(0px) scaleY(1) scaleX(1)' }
          ],
          {
            duration: 1800,
            easing: 'cubic-bezier(.22,.8,.24,1)'
          }
        );

        setTimeout(() => {
          animating = false;
        }, 1700);
      });
    });
  }

  loadPosts();
});

async function loadPosts() {
  try {
    const response = await fetch('posts.json');

    if (!response.ok) {
      throw new Error('Could not load posts.json');
    }

    const posts = await response.json();
    const container = document.getElementById('posts');

    if (!container) return;

    posts.forEach(post => {
      const article = document.createElement('article');
      article.className = 'post';

      article.innerHTML = `
        <h3>
          <a href="#">${post.title}</a>
        </h3>
        <div class="meta">${post.date}</div>
        <div class="tags">
          ${post.tags.map(tag => `<a class="tag" href="#">#${tag}</a>`).join('')}
        </div>
      `;

      container.appendChild(article);
    });
  } catch (error) {
    console.error(error);

    const container = document.getElementById('posts');
    if (container) {
      container.innerHTML = `<p>Could not load posts.</p>`;
    }
  }
}
