/**
 * MARIFAH - Animation Controller
 * Smooth scroll reveals and interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  initParallax();
  initTypewriter();
  initImageHover();
  initButtonRipple();
});

/**
 * Parallax effect on scroll
 */
function initParallax() {
  const parallaxElements = document.querySelectorAll('.img-parallax, .hero__image');

  if (!parallaxElements.length) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrolled = window.pageYOffset;

        parallaxElements.forEach(el => {
          const speed = el.dataset.parallaxSpeed || 0.3;
          const rect = el.getBoundingClientRect();

          // Only animate if element is in viewport
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            const yPos = -(scrolled * speed);
            el.style.transform = `translate3d(0, ${yPos}px, 0)`;
          }
        });

        ticking = false;
      });

      ticking = true;
    }
  });
}

/**
 * Typewriter effect for text
 */
function initTypewriter() {
  const typewriters = document.querySelectorAll('.typewriter-text');

  typewriters.forEach(el => {
    const text = el.textContent;
    const speed = parseInt(el.dataset.speed) || 50;

    el.textContent = '';
    el.style.visibility = 'visible';

    let i = 0;
    function type() {
      if (i < text.length) {
        el.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      }
    }

    // Start typing when element is visible
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          type();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    observer.observe(el);
  });
}

/**
 * Enhanced image hover effects
 */
function initImageHover() {
  const hoverElements = document.querySelectorAll('.hover-3d');

  hoverElements.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;

      el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
    });
  });
}

/**
 * Button ripple effect
 */
function initButtonRipple() {
  const buttons = document.querySelectorAll('.btn-ripple, .btn');

  buttons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ripple = document.createElement('span');
      ripple.className = 'ripple-effect';
      ripple.style.cssText = `
        position: absolute;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        pointer-events: none;
        transform: scale(0);
        animation: ripple 0.6s linear;
        left: ${x}px;
        top: ${y}px;
      `;

      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    });
  });

  // Add ripple keyframes if not exists
  if (!document.getElementById('ripple-styles')) {
    const style = document.createElement('style');
    style.id = 'ripple-styles';
    style.textContent = `
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Counter animation
 */
function animateCounter(element, target, duration = 2000) {
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const current = Math.round(start + (target - start) * easeOutQuart);

    element.textContent = current;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/**
 * Staggered reveal for list items
 */
function staggerReveal(container, itemSelector, delayStep = 100) {
  const items = container.querySelectorAll(itemSelector);

  items.forEach((item, index) => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(20px)';
    item.style.transition = 'all 0.5s ease';
    item.style.transitionDelay = `${index * delayStep}ms`;
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        items.forEach(item => {
          item.style.opacity = '1';
          item.style.transform = 'translateY(0)';
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  observer.observe(container);
}

/**
 * Smooth scroll to element
 */
function scrollToElement(element, offset = 80) {
  const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;

  window.scrollTo({
    top: targetPosition,
    behavior: 'smooth'
  });
}

/**
 * Magnetic button effect (optional, for special buttons)
 */
function initMagneticButtons() {
  const magneticButtons = document.querySelectorAll('.btn-magnetic');

  magneticButtons.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0, 0)';
    });
  });
}

// Export functions for use in other scripts
window.animations = {
  animateCounter,
  staggerReveal,
  scrollToElement,
  initMagneticButtons
};
