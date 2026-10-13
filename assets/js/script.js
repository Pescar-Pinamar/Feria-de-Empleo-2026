document.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('siteHeader');
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');

  const HIDE_AFTER = 4;
  let lastScrollY = window.scrollY;
  let ticking = false;

  function updateHeader() {
    const currentScrollY = window.scrollY;

    header.classList.toggle('is-scrolled', currentScrollY > 8);

    if (currentScrollY <= HIDE_AFTER) {
      header.classList.remove('is-hidden');
    } else if (currentScrollY > lastScrollY) {
      // Bajando
      header.classList.add('is-hidden');
    } else if (currentScrollY < lastScrollY) {
      // Subiendo
      header.classList.remove('is-hidden');
    }

    lastScrollY = currentScrollY;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }, { passive: true });


  function closeMenu() {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menú');
    mainNav.classList.remove('is-open');
    header.classList.remove('menu-open');
  }

  function openMenu() {
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Cerrar menú');
    mainNav.classList.add('is-open');
    header.classList.add('menu-open');
  }

  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    isOpen ? closeMenu() : openMenu();
  });

  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });


  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeMenu();
  });


  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });


  const revealEls = document.querySelectorAll('.reveal');

  if (revealEls.length) {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach((el) => revealObserver.observe(el));
  }


  const marquee = document.querySelector('.marquee');
  const track = document.getElementById('marqueeTrack');

  if (marquee && track) {
    const AUTO_SPEED = 40;      
    const MAX_VELOCITY = 2500;  
    const reduceMotion = false; 

  
    while (track.scrollWidth < marquee.offsetWidth && track.children.length) {
      Array.from(track.children).forEach((el) => track.appendChild(el.cloneNode(true)));
    }
    Array.from(track.children).forEach((el) => track.appendChild(el.cloneNode(true)));
    track.classList.add('is-ready');


    let x = 0;            
    let half = 0;         
    let dragging = false;
    let hovering = false; 
    let velocity = 0;     
    let lastPointerX = 0;
    let lastPointerT = 0;

    const measure = () => { half = track.scrollWidth / 2; };
    measure();
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(track);
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);

    const wrap = () => {
      if (!half) return;
      x = x % half;
      if (x > 0) x -= half;
    };

    let prev = performance.now();
    const frame = (now) => {
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;

      if (!dragging) {
        if (Math.abs(velocity) > 1) {
          x += velocity * dt;
          velocity *= Math.pow(0.04, dt);   
        } else if (!hovering && !reduceMotion) {
          x -= AUTO_SPEED * dt;
        }
      }

      wrap();
      track.style.translate = x + 'px 0';
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);

  
    marquee.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true;
      velocity = 0;
      lastPointerX = e.clientX;
      lastPointerT = performance.now();
      marquee.classList.add('is-dragging');
      marquee.setPointerCapture(e.pointerId);
    });

    marquee.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const now = performance.now();
      const dx = e.clientX - lastPointerX;
      const dt = (now - lastPointerT) / 1000;
      x += dx;
      if (dt > 0) {
        const v = dx / dt;
        velocity = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, v));
      }
      lastPointerX = e.clientX;
      lastPointerT = now;
    });

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      marquee.classList.remove('is-dragging');
    
      if (performance.now() - lastPointerT > 80) velocity = 0;
    };
    marquee.addEventListener('pointerup', endDrag);
    marquee.addEventListener('pointercancel', endDrag);


    marquee.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hovering = true; });
    marquee.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hovering = false; });
  }

  const standCards = document.querySelectorAll('.stand-card');
  const standsMobile = window.matchMedia('(max-width: 640px)');

  function setStandState(card, open, moveFocus) {
    const front = card.querySelector('.stand-front');
    const back = card.querySelector('.stand-back');
    const openBtn = card.querySelector('.stand-open');
    const closeBtn = card.querySelector('.stand-close');

    card.classList.toggle('is-flipped', open);
    openBtn.setAttribute('aria-expanded', String(open));
    front.inert = open && !standsMobile.matches;
    back.inert = !open;
    back.setAttribute('aria-hidden', String(!open));
    front.setAttribute('aria-hidden', String(open && !standsMobile.matches));

    if (moveFocus) (open ? closeBtn : openBtn).focus({ preventScroll: true });
  }

  function closeAllStands(except) {
    standCards.forEach((c) => {
      if (c !== except && c.classList.contains('is-flipped')) setStandState(c, false, false);
    });
  }

  standCards.forEach((card) => {
    card.querySelector('.stand-open').addEventListener('click', () => {
      if (standsMobile.matches) {
        if (card.classList.contains('is-flipped')) { setStandState(card, false, false); return; }
        closeAllStands(card);
        setStandState(card, true, false);
        setTimeout(() => card.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 380);
        return;
      }
      closeAllStands(card);
      setStandState(card, true, true);
    });
    card.querySelector('.stand-close').addEventListener('click', () => {
      setStandState(card, false, true);
    });
  });

  standsMobile.addEventListener('change', () => {
    standCards.forEach((c) => setStandState(c, false, false));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    standCards.forEach((c) => {
      if (c.classList.contains('is-flipped')) setStandState(c, false, true);
    });
  });
});
