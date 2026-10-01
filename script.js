const text = document.getElementById('logan-text');

const letters = [];

const textContent = text.textContent;

text.textContent = '';

[...textContent].forEach((char, i) => {

  const tspan = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "tspan"
  );

  tspan.textContent = char;

  tspan.setAttribute(
    'dx',
    i === 0 ? '0' : '-18'
  );

  tspan.classList.add('logo-letter');

  text.appendChild(tspan);

  letters.push(tspan);

});

letters.forEach(letter => {

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
    }, 950);

  });

});
