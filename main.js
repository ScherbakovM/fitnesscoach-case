gsap.registerPlugin(
  Draggable,
  SplitText,
  DrawSVGPlugin,
  ScrollTrigger,
  ScrollSmoother,
  MorphSVGPlugin,
  InertiaPlugin,
);

function initServicesSlider() {
  const track = document.getElementById("sliderTrack");
  const wrapper = document.getElementById("sliderWrapper");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  if (!track || !wrapper || !prevBtn || !nextBtn) return;

  const cards = track.querySelectorAll(".services__card");

  if (!cards.length) return;

  let currentIndex = 0;
  let maxIndex = 0;
  let draggableInstance = null;
  let isAnimating = false;

  // Какая кнопка сейчас выполняет анимацию
  let animatingButton = null;

  let spacer = track.querySelector(".services__spacer");

  if (!spacer) {
    spacer = document.createElement("div");
    spacer.className = "services__spacer";
    spacer.style.flexShrink = "0";
    spacer.style.height = "1px";
    spacer.style.width = "0px";
    track.appendChild(spacer);
  }

  function getStep() {
    const card = cards[0];
    const gap = parseFloat(getComputedStyle(track).gap) || 0;

    return Math.round(card.offsetWidth + gap);
  }

  function adjustSpacer() {
    spacer.style.width = "0px";

    const step = getStep();

    if (!step) return;

    maxIndex = Math.max(cards.length - 1, 0);

    const wrapperWidth = wrapper.offsetWidth;

    const desiredContentWidth = wrapperWidth + maxIndex * step;

    let cardsWidth = 0;

    cards.forEach((card, i) => {
      cardsWidth += card.offsetWidth;

      if (i < cards.length - 1) {
        cardsWidth += parseFloat(getComputedStyle(track).gap) || 0;
      }
    });

    const diff = desiredContentWidth - cardsWidth;

    spacer.style.width = diff > 0 ? `${Math.round(diff)}px` : "0px";
  }

  function getMaxTranslate() {
    const trackWidth = track.scrollWidth;
    const wrapperWidth = wrapper.offsetWidth;

    return Math.min(0, -(trackWidth - wrapperWidth));
  }

  function getIndexX(index) {
    return -(index * getStep());
  }

  function updateButtons() {
    const prevDisabled = currentIndex <= 0 || animatingButton === "prev";

    const nextDisabled = currentIndex >= maxIndex || animatingButton === "next";

    prevBtn.classList.toggle("services__btn--disabled", prevDisabled);

    nextBtn.classList.toggle("services__btn--disabled", nextDisabled);

    // Настоящий disabled
    prevBtn.disabled = prevDisabled;
    nextBtn.disabled = nextDisabled;
  }

  function goToIndex(index, animate = true) {
    // Не даём запустить вторую анимацию
    if (animate && isAnimating) return;

    index = gsap.utils.clamp(0, maxIndex, index);

    const x = getIndexX(index);

    currentIndex = index;

    // Перемещение без анимации
    if (!animate) {
      gsap.killTweensOf(track);

      gsap.set(track, { x });

      isAnimating = false;
      animatingButton = null;

      updateButtons();

      return;
    }

    isAnimating = true;

    updateButtons();

    gsap.to(track, {
      x,

      duration: 0.6,

      ease: window.innerWidth < 768 ? "power4.out" : "back.out",

      overwrite: "auto",

      onComplete() {
        isAnimating = false;
        animatingButton = null;

        updateButtons();
      },

      onInterrupt() {
        isAnimating = false;
        animatingButton = null;

        updateButtons();
      },
    });
  }

  function createDraggable() {
    if (draggableInstance) {
      draggableInstance.kill();
      draggableInstance = null;
    }

    draggableInstance = Draggable.create(track, {
      type: "x",

      inertia: true,

      throwResistance: 1000,

      maxDuration: 0.5,

      minDuration: 0.3,

      bounds: {
        minX: getMaxTranslate(),
        maxX: 0,
      },

      edgeResistance: 0.1,

      snap: {
        x(value) {
          const step = getStep();

          const startX = getIndexX(currentIndex);

          const dragDistance = value - startX;

          const distanceThreshold = step * 0.5;

          let newIndex = currentIndex;

          if (Math.abs(dragDistance) > distanceThreshold) {
            newIndex = dragDistance < 0 ? currentIndex + 1 : currentIndex - 1;
          }

          newIndex = gsap.utils.clamp(0, maxIndex, newIndex);

          return getIndexX(newIndex);
        },
      },

      onDragStart() {
        isAnimating = false;
        animatingButton = null;

        gsap.killTweensOf(track);

        updateButtons();

        wrapper.style.cursor = "grabbing";
      },

      onDragEnd() {
        wrapper.style.cursor = "grab";
      },

      onThrowComplete() {
        const currentX = gsap.getProperty(track, "x");

        const step = getStep();

        const index = Math.round(-currentX / step);

        currentIndex = gsap.utils.clamp(0, maxIndex, index);

        isAnimating = false;
        animatingButton = null;

        updateButtons();
      },
    })[0];
  }

  function onPrevClick() {
    if (isAnimating) return;

    if (currentIndex > 0) {
      animatingButton = "prev";

      goToIndex(currentIndex - 1);
    }
  }

  function onNextClick() {
    if (isAnimating) return;

    if (currentIndex < maxIndex) {
      animatingButton = "next";

      goToIndex(currentIndex + 1);
    }
  }

  prevBtn.addEventListener("click", onPrevClick);

  nextBtn.addEventListener("click", onNextClick);

  let resizeTimeout;

  function onResize() {
    clearTimeout(resizeTimeout);

    resizeTimeout = setTimeout(() => {
      const prevIndex = currentIndex;

      isAnimating = false;
      animatingButton = null;

      gsap.killTweensOf(track);

      adjustSpacer();

      goToIndex(Math.min(prevIndex, maxIndex), false);

      createDraggable();
    }, 200);
  }

  window.addEventListener("resize", onResize);

  adjustSpacer();

  goToIndex(0, false);

  createDraggable();

  return () => {
    prevBtn.removeEventListener("click", onPrevClick);

    nextBtn.removeEventListener("click", onNextClick);

    window.removeEventListener("resize", onResize);

    draggableInstance?.kill();

    gsap.killTweensOf(track);

    clearTimeout(resizeTimeout);
  };
}

// Клик вне меню хедера
function initClickOutsideMenu(burger, nav) {
  document.addEventListener("click", (event) => {
    const isClickInsideNav = nav.contains(event.target);
    const isClickOnBurger = burger.contains(event.target);

    if (
      !isClickInsideNav &&
      !isClickOnBurger &&
      nav.classList.contains("is-open")
    ) {
      burger.classList.remove("is-active");
      nav.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
    }
  });
}

//  Скрытие при ресайз
function initCloseMenuOnBreakpoint(burger, nav) {
  const mm = gsap.matchMedia();

  mm.add("(min-width: 1101px)", () => {
    if (nav.classList.contains("is-open")) {
      burger.classList.remove("is-active");
      nav.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
    }
  });
}

function initHeaderTextAnimation() {
  const cleanups = [];

  document.querySelectorAll(".header__li").forEach((item) => {
    const top = item.querySelector(".split__text--top");
    const bottom = item.querySelector(".split__text--bottom");

    if (!top || !bottom) {
      return;
    }

    const splitTop = SplitText.create(top, {
      type: "chars",
      charsClass: "char",
    });

    const splitBottom = SplitText.create(bottom, {
      type: "chars",
      charsClass: "char",
    });

    if (!splitTop || !splitBottom) {
      return;
    }

    let tl = gsap.timeline({
      paused: true,
    });

    tl.to(splitTop.chars, {
      y: -32,
      duration: 0.25,
    });

    tl.to(
      splitBottom.chars,
      {
        y: -32,
        duration: 0.25,
      },
      0,
    );

    item.addEventListener("mouseenter", () => {
      tl.play();
    });

    item.addEventListener("mouseleave", () => {
      gsap.set(splitTop.chars, {
        y: 0,
      });

      gsap.set(splitBottom.chars, {
        y: 0,
      });

      tl.progress(0).pause();
    });
  });
}

function initButtonJump(selector) {
  const cleanups = [];

  document.querySelectorAll(selector).forEach((button) => {
    const tl = gsap.timeline({ paused: true });

    tl.to(button, {
      y: -8,
      duration: 0.15,
      ease: "power2.out",
    }).to(button, {
      y: 0,
      duration: 0.15,
      ease: "back.out(2)",
    });

    const onEnter = () => {
      if (!tl.isActive()) {
        tl.restart();
      }
    };

    button.addEventListener("mouseenter", onEnter);

    cleanups.push(() => {
      button.removeEventListener("mouseenter", onEnter);
      tl.kill();
      gsap.set(button, { y: 0 });
    });
  });

  return () => cleanups.forEach((fn) => fn());
}

function initBtnTextAnimation() {
  const cleanups = [];

  document.querySelectorAll(".btn--primary").forEach((item) => {
    const top = item.querySelector(".btn__text--top");
    const bottom = item.querySelector(".btn__text--bottom");
    if (!top || !bottom) return;

    const splitTop = SplitText.create(top, {
      type: "words",
      wordsClass: "word",
    });
    const splitBottom = SplitText.create(bottom, {
      type: "words",
      wordsClass: "word",
    });

    gsap.set(splitTop.words, { y: 0 });
    gsap.set(splitBottom.words, { y: 27 });

    let tl = gsap.timeline({ paused: true });
    tl.to(splitTop.words, { y: -27, duration: 0.25 }, 0);
    tl.to(splitBottom.words, { y: 0, duration: 0.25 }, 0);

    const onEnter = () => tl.play();
    const onLeave = () => tl.progress(0).pause();

    item.addEventListener("mouseenter", onEnter);
    item.addEventListener("mouseleave", onLeave);

    cleanups.push(() => {
      item.removeEventListener("mouseenter", onEnter);
      item.removeEventListener("mouseleave", onLeave);
      tl.kill();
      splitTop.revert();
      splitBottom.revert();
    });
  });

  return () => cleanups.forEach((fn) => fn());
}

function initIconOnBtnAnimation() {
  const cleanups = [];

  document.querySelectorAll(".btn").forEach((item) => {
    const iconTop = item.querySelector(".btn__icon--top");
    const iconBottom = item.querySelector(".btn__icon--bottom");
    if (!iconTop || !iconBottom) return;

    gsap.set(iconTop, { yPercent: -100 });
    gsap.set(iconBottom, { yPercent: 0 });

    const tl = gsap.timeline({ paused: true });
    tl.to(iconTop, { yPercent: 0, duration: 0.25 }, 0);
    tl.to(iconBottom, { yPercent: 100, duration: 0.25 }, 0);

    const onEnter = () => tl.play();
    const onLeave = () => tl.progress(0).pause();

    item.addEventListener("mouseenter", onEnter);
    item.addEventListener("mouseleave", onLeave);

    cleanups.push(() => {
      item.removeEventListener("mouseenter", onEnter);
      item.removeEventListener("mouseleave", onLeave);
      tl.kill();
      gsap.set(iconTop, { yPercent: -100 });
      gsap.set(iconBottom, { yPercent: 0 });
    });
  });

  return () => cleanups.forEach((fn) => fn());
}

function initDrawButton(programBtn) {
  const customPath = document.getElementById("customPath");

  if (!programBtn || !customPath) return;

  const mm = gsap.matchMedia();

  mm.add("(min-width: 769px)", () => {
    gsap.set(customPath, {
      drawSVG: "0%",
    });

    const onEnter = () => {
      gsap.to(customPath, {
        drawSVG: "100%",
        duration: 1,
        ease: "power1.in",
      });
    };

    const onLeave = () => {
      gsap.to(customPath, {
        drawSVG: "0%",
        duration: 1,
        ease: "power1",
      });
    };

    programBtn.addEventListener("mouseenter", onEnter);
    programBtn.addEventListener("mouseleave", onLeave);

    return () => {
      programBtn.removeEventListener("mouseenter", onEnter);
      programBtn.removeEventListener("mouseleave", onLeave);

      gsap.set(customPath, {
        drawSVG: "0%",
      });
    };
  });

  return () => {
    mm.revert();
  };
}

function initNavigationScroll(smoother) {
  const navButtons = document.querySelectorAll(
    ".header__li, .header__burger__li",
  );

  const sectionMap = {
    Главная: ".hero",
    "Обо мне": ".whyme",
    Услуги: ".services",
    Контакты: ".contacts",
  };

  navButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const text = button.textContent.trim();
      const sectionSelector = sectionMap[text];

      if (sectionSelector) {
        e.preventDefault();
        const targetSection = document.querySelector(sectionSelector);
        if (targetSection) {
          const burger = document.querySelector(".header__burger");
          const nav = document.querySelector(".header__burger__menu");
          if (burger && nav) {
            burger.classList.remove("is-active");
            nav.classList.remove("is-open");
            burger.setAttribute("aria-expanded", "false");
          }

          smoother.scrollTo(targetSection, true);
        }
      }
    });
  });
}

const rotateServicesButton = gsap.to(".services__offer__button__svg", {
  rotate: 360,
  duration: 7,
  repeat: -1,
  ease: "linear",
  paused: true,
  overwrite: "auto",
});

function startRotateServicesButton() {
  const servicesBtn = document.querySelector(".services__offer__button");
  let mm = gsap.matchMedia();

  mm.add("(min-width: 768px)", () => {
    const handleMouseEnter = () => {
      rotateServicesButton.play();
    };

    const handleMouseLeave = () => {
      rotateServicesButton.pause();
    };

    servicesBtn.addEventListener("mouseenter", handleMouseEnter);
    servicesBtn.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      servicesBtn.removeEventListener("mouseenter", handleMouseEnter);
      servicesBtn.removeEventListener("mouseleave", handleMouseLeave);
    };
  });

  mm.add("(max-width: 767px)", () => {
    rotateServicesButton.play();

    return () => {
      rotateServicesButton.seek(0);
      rotateServicesButton.pause();
    };
  });
}

window.addEventListener("DOMContentLoaded", () => {
  const smoother = ScrollSmoother.create({
    smooth: 0.6,
    effects: true,
  });

  const pulseMorph = gsap.to(".header__logo__icon", {
    scale: 0.9,
    duration: 1,
    ease: "elastic.out(1,0.5)",
    paused: true,
  });

  const proxy = { p: 0 };

  const setProgress = gsap.quickTo(proxy, "p", {
    duration: 0.2,
    ease: "linear",
    onUpdate: () => pulseMorph.progress(proxy.p),
  });

  let scrollTimeout;

  ScrollTrigger.create({
    onUpdate: (self) => {
      const scrollY = self.scroll();
      const maxScroll = ScrollTrigger.maxScroll(window);

      if (scrollY <= 0 || scrollY >= maxScroll) {
        setProgress(0);
        return;
      }

      const v = Math.abs(self.getVelocity());
      const maxSpeed = 4000;
      const target = gsap.utils.clamp(0, 1, v / maxSpeed);
      setProgress(target);

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => setProgress(0), 150);
    },
  });

  const mainHeaderBtn = document.querySelector(".main__header__button");
  const headerLogo = document.querySelector(".header__logo");
  const aboutHeaderBtn = document.querySelector(".about__header__button");
  const servicesHeaderBtn = document.querySelector(".services__header__button");
  const contactsHeaderBtn = document.querySelectorAll(".contacts__button");
  const programBtn = document.querySelector(".btn--draw");

  const imageContainers = document.querySelectorAll(
    "[data-image-container-index]",
  );
  const imageViewer = document.querySelector(".cases__image__viewer");
  const viewerImage = document.querySelector(".cases__image__viewer-img");
  const viewerClose = document.querySelector(".cases__image__viewer-close");
  const questions = document.querySelectorAll(".question__preview");
  const burger = document.querySelector(".header__burger");
  const nav = document.querySelector(".header__burger__menu");
  let mm = gsap.matchMedia();

  initServicesSlider();
  initHeaderTextAnimation();
  initButtonJump(".contacts__link");
  initClickOutsideMenu(burger, nav);
  initCloseMenuOnBreakpoint(burger, nav);
  initNavigationScroll(smoother);
  startRotateServicesButton();

  //КЛИКИ ПО КНОПКАМ

  headerLogo.addEventListener("click", (e) => {
    e.preventDefault();
    smoother.scrollTo(".hero", true);
  });

  mainHeaderBtn.addEventListener("click", (e) => {
    e.preventDefault();
    smoother.scrollTo(".hero", true);
  });

  aboutHeaderBtn.addEventListener("click", (e) => {
    e.preventDefault();
    smoother.scrollTo(".whyme", true);
  });

  servicesHeaderBtn.addEventListener("click", (e) => {
    e.preventDefault();
    smoother.scrollTo(".services", true);
  });

  contactsHeaderBtn.forEach((element) => {
    element.addEventListener("click", (e) => {
      e.preventDefault();
      smoother.scrollTo(".contacts", true);
    });
  });

  programBtn.addEventListener("click", () => {
    smoother.scrollTo(".services", true);
  });

  questions.forEach((question) => {
    question.addEventListener("click", () => {
      const trueQuestion = question.closest(".question");

      if (trueQuestion.classList.contains("open")) {
        closeFAQ(trueQuestion);
      } else {
        openFAQ(trueQuestion);
      }
    });
  });

  burger.addEventListener("click", () => {
    burger.classList.toggle("is-active");
    nav.classList.toggle("is-open");
    const isOpen = nav.classList.contains("is-open");
    burger.setAttribute("aria-expanded", isOpen);
  });

  document.querySelectorAll(".header__li").forEach((item) => {
    item.addEventListener("click", () => {
      burger.classList.remove("is-active");
      nav.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
    });
  });

  mm.add("(min-width: 1100px)", () => {
    const cleanupJump = initButtonJump(".btn--primary");
    const cleanupText = initBtnTextAnimation();
    const cleanupIcon = initIconOnBtnAnimation();

    return () => {
      cleanupJump();
      cleanupText();
      cleanupIcon();
    };
  });

  initDrawButton(programBtn);
  scrolltrigerToCases();

  if (imageContainers.length && imageViewer && viewerImage && viewerClose) {
    function openImageViewer(imageSrc, imageAlt) {
      viewerImage.src = imageSrc;
      viewerImage.alt = imageAlt;

      imageViewer.classList.add("cases__image__viewer--active");
      smoother.paused(true);
    }

    function closeImageViewer() {
      imageViewer.classList.remove("cases__image__viewer--active");
      smoother.paused(false);

      setTimeout(() => {
        if (!imageViewer.classList.contains("cases__image__viewer--active")) {
          viewerImage.src = "";
        }
      }, 300);
    }

    imageContainers.forEach((container) => {
      container.addEventListener("click", () => {
        const image = container.querySelector(".case__img");
        if (!image) return;
        openImageViewer(image.src, image.alt);
      });
    });

    viewerClose.addEventListener("click", closeImageViewer);
    imageViewer.addEventListener("click", (event) => {
      if (event.target === imageViewer) {
        closeImageViewer();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        imageViewer.classList.contains("cases__image__viewer--active")
      ) {
        closeImageViewer();
      }
    });
  }
});

function scrolltrigerToCases() {
  const cases = document.querySelector(".cases");
  if (!cases) return;
  const mm = gsap.matchMedia();
  mm.add("(min-width: 1380px)", () => {
    gsap.set([".case--one", ".case--two", ".case--five", ".case--six"], {
      y: 50,
    });

    gsap.to([".case--one", ".case--two", ".case--five", ".case--six"], {
      y: 0,

      scrollTrigger: {
        trigger: cases,
        start: "top 80%",
        end: "center center",
        scrub: true,
      },
    });

    gsap.fromTo(
      [".case--three", ".case--four"],

      {
        y: 0,
      },

      {
        y: 50,

        scrollTrigger: {
          trigger: cases,
          start: "top 30%",
          end: "bottom center",
          scrub: true,
        },
      },
    );
  });

  mm.add("(min-width: 769px) and (max-width: 1379px)", () => {
    gsap.set([".case--one", ".case--two", ".case--three"], {
      y: 50,
    });

    gsap.to([".case--one", ".case--two", ".case--three"], {
      y: 0,

      scrollTrigger: {
        trigger: cases,
        start: "top 80%",
        end: "center center",
        scrub: true,
      },
    });

    gsap.fromTo(
      [".case--four", ".case--five", ".case--six"],

      {
        y: 0,
      },

      {
        y: 50,

        scrollTrigger: {
          trigger: cases,
          start: "top 30%",
          end: "bottom center",
          scrub: true,
        },
      },
    );
  });

  mm.add("(max-width: 768px)", () => {
    gsap.set([".case--one", ".case--two", ".case--three", ".case--four"], {
      y: 0,
    });
  });
}

function openFAQ(question) {
  let tl = gsap.timeline();
  const questionText = question.querySelector(".question__text");
  const questionButton = question.querySelector(".question__button");
  const questionButtonPlus = questionButton.querySelector(
    ".question__button--plus",
  );
  const questionButtonMinus = questionButton.querySelector(
    ".question__button--minus",
  );

  tl.to(questionText, {
    height: "auto",
    opacity: 1,
    duration: 0.2,
    ease: "linear",
    onComlete: () => {
      question.classList.add("open");
    },
  })
    .to(
      questionButtonPlus,
      {
        scale: 0,
        duration: 0.1,
      },
      "<",
    )
    .to(
      questionButtonMinus,
      {
        scale: 1,
        duration: 0.1,
      },
      "<",
    );
}

function closeFAQ(question) {
  let tl = gsap.timeline();
  const questionText = question.querySelector(".question__text");
  const questionButton = question.querySelector(".question__button");
  const questionButtonPlus = questionButton.querySelector(
    ".question__button--plus",
  );
  const questionButtonMinus = questionButton.querySelector(
    ".question__button--minus",
  );

  tl.to(questionText, {
    height: "0",
    opacity: 0,
    duration: 0.2,
    ease: "linear",
    onComlete: () => {
      question.classList.remove("open");
    },
  })
    .to(
      questionButtonPlus,
      {
        scale: 1,
        duration: 0.1,
      },
      "<",
    )
    .to(
      questionButtonMinus,
      {
        scale: 0,
        duration: 0.1,
      },
      "<",
    );
}
