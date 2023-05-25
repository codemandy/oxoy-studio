import throttle from 'lodash/throttle';
const leftCol = document.querySelector('.md\\:w-1\\/2:first-child');
const rightCol = document.querySelector('.md\\:w-1\\/2:last-child');

document.addEventListener('mousemove', throttle(function(event) {
  const mouseX = event.clientX;
  const windowCenter = window.innerWidth / 2;

  if (mouseX < windowCenter) {
    // mouse is on left side of screen, activate overflow-y-scroll on left column
    leftCol.style.overflowY = 'scroll';
    rightCol.style.overflowY = 'hidden';
  } else {
    // mouse is on right side of screen, activate overflow-y-scroll on right column
    leftCol.style.overflowY = 'hidden';
    rightCol.style.overflowY = 'scroll';
  }
}, 100));
