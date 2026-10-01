const svg = document.getElementById('logo');

const word = 'LOGAN';

const spacing = 250;

const startX = 420;

word.split('').forEach((char, index) => {

  const letter = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'text'
  );

  letter.textContent = char;

  letter.setAttribute('x', startX + index * spacing);

  letter.setAttribute('y', '360');

  letter.setAttribute('class', 'logo-letter');

  svg.appendChild(letter);

  let animating = false;

  letter.addEventListener('mouseenter', () => {

    if (animating) return;

    animating = true;

    letter.animate(
      [
        {
          transform: 'translateY(0px) scaleY(1)'
        },

        {
          transform: 'translateY(-26px) scaleY(1.06)'
        },

        {
          transform: 'translateY(10px) scaleY(0.97)'
        },

        {
          transform: 'translateY(-8px) scaleY(1.015)'
        },

        {
          transform: 'translateY(0px) scaleY(1)'
        }
      ],
      {
        duration: 1450,
        easing: 'cubic-bezier(.16,1,.3,1)'
      }
    );

    setTimeout(() => {
      animating = false;
    }, 1450);

  });

});

async function loadPosts() {

  const response = await fetch('posts.json');

  const posts = await response.json();

  const container = document.getElementById('posts');

  posts.forEach(post => {

    const article = document.createElement('article');

    article.className = 'post';

    article.innerHTML = `
      <h3>
        <a href="#">
          ${post.title}
        </a>
      </h3>

      <div class="meta">
        ${post.date}
      </div>

      <div class="tags">
        ${post.tags.map(tag =>
          `<a class="tag" href="#">#${tag}</a>`
        ).join('')}
      </div>
    `;

    container.appendChild(article);

  });

}

loadPosts();
