window.addEventListener('load', ()=>{

  /***************************************/
  /*                                     */
  /*           DOM and Globals           */
  /*                                     */
  /***************************************/
  let menuToggle = document.getElementById('menuToggle');
  let navToggleMargin = window.getComputedStyle(menuToggle).height.slice(0, -2);

  let slideContainer = document.getElementById('slideContainer');
  let slideContainerHeight = window.getComputedStyle(slideContainer).height.slice(0, -2);

  let docRoot = document.querySelector(':root');

  // swipe logic
  let sliding = false;
  let swipeStart = {x: 0, y: 0};
  let swipeMove = {x: 0, y: 0};

  
  /***************************************/
  /*                                     */
  /*           Event Listeners           */
  /*                                     */
  /***************************************/
  document.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('touchstart', handleTouchStart, {passive:false});
  document.addEventListener('touchend', handleTouchEnd);
  document.addEventListener('touchmove', handleTouchMove, {passive:false});

  
  /********************************************/
  /*                                          */
  /*           Touch Event Handlers           */
  /*                                          */
  /********************************************/
  function handleTouchMove(e) {
    e.preventDefault();
    swipeMove.x = e.touches[0].clientX;
    swipeMove.y = e.touches[0].clientY;

    let target = e.changedTouches[0].target;

    // swipe logic
    // first check for sliding status. if sliding, update the menu position right away
    if (sliding) {
      let currentY = e.changedTouches[0].clientY;
      // translateY takes into account the height of the menu and the nav bar and adjusts by clientY
      // it also sets the maximum adjustment to the full height of the menu + nav bar
      slideContainer.style.transform = `translateY(${Math.min((-606 - navToggleMargin) + currentY, 0)}px)`;
      return;
    }

    // first check for mostly-x swipes; those are either input changes, or they can be ignored
    let swipeCheck = checkForSwipe();
    if (target.tagName == 'INPUT') {
      // the user is changing an input; no movement, but process their input change right away
      sliding = false;
      handleInputChange(target);
    } else if (Math.abs(swipeCheck.x) <= 100 && Math.abs(swipeCheck.y) >= 35) {
      // here, if the user has swiped mostly in the Y direction and not the X direction,
      // toggle menu visibility (unless the user is swiping in a direction that requires no movement)
      if ((slideContainer.classList.contains('offscreen') && swipeCheck.y < 0) || 
          (slideContainer.classList.contains('onscreen') && swipeCheck.y > 0)) {
        // the user is swiping up while the menu is hidden or down while it's onscreen; no movement
        return;
      }
      sliding = true;
    }
  }

  function handleTouchStart(e) {
    let target = e.changedTouches[0].target;

    swipeStart.x = e.touches[0].clientX;
    swipeStart.y = e.touches[0].clientY;
    
    // if a touch starts on either the menuToggle element or its internal paragraph, toggle the menu
    if (target.id == 'menuToggle' || (target.tagName == 'P' && target.innerText == 'Controls')) {
      toggleMenu(e);
    }
  }

  function handleTouchEnd(e) {
    let lastY = e.changedTouches[0].clientY;
    let target = e.changedTouches[0].target;

    // handle changes to inputs and buttons first
    if (target.tagName == 'INPUT') {
      handleInputChange(target);
      return;
    }
    if (target.tagName == 'BUTTON') {
      handleResetButtonPress(target);
      return;
    }

    // handle the end of a swipe
    let swipeCheck = checkForSwipe();

    // if the user is swiping up by a given amount, or if their swipe ends most of the way
    // up the screen, move the input menu offscreen
    if ((sliding && (lastY < innerHeight / 3 || swipeCheck.y < -45)) ||
        (sliding && swipeCheck.y >= 45)) {
      slideContainer.style.removeProperty('transform');
      toggleMenu(e);
    }
    sliding = false;
  }

  /********************************************/
  /*                                          */
  /*           Mouse Event Handlers           */
  /*                                          */
  /********************************************/
  // handle mousemove events
  function handleMouseMove(e) {
    let target = e.target;
    let buttons = e.buttons;
    
    if (target.tagName == 'INPUT' && buttons == 1) {
      // the user is changing an input; no movement, but process their input change right away
      handleInputChange(target);
    }
  }

  // handle mousedown events
  function handleMouseDown(e) {
    let target = e.target;

    // handle changes to inputs and buttons first, then menu toggling
    // we can reuse the mouse up logic here, but we do want to listen for both
    handleMouseUp(e);

    if (target.id == 'menuToggle' || (target.tagName == 'P' && target.innerText == 'Controls')) {
      toggleMenu(e);
      return;
    }
  }

  // handle mouseup events
  function handleMouseUp(e) {
    let target = e.target;

    // handle changes to inputs and buttons first, then menu toggling
    if (target.tagName == 'INPUT') {
      handleInputChange(target);
      return;
    }
    if (target.tagName == 'BUTTON') {
      handleResetButtonPress(target);
      return;
    }

  }

  /*************************************************/
  /*                                               */
  /*           Input and Button Handlers           */
  /*                                               */
  /*************************************************/
  // handler for clicking any "Reset to Default" button
  function handleResetButtonPress(element) {
    let siblingInputs = element.parentElement.querySelectorAll('input');
    for (let i = 0; i < siblingInputs.length; i++ ) {
      let input = siblingInputs[i];
      input.value = input.getAttribute('data-default-value');
      handleInputChange(input);
    }
  }

  // handler for changes to input[range] elements
  function handleInputChange(element) {
    let cssVar = element.getAttribute('data-css-var');
    let styleValue = element.value;
    if (cssVar == '--flame-flicker-strength') { styleValue += '%'; }
    docRoot.style.setProperty(cssVar, styleValue);
  }

  /****************************************/
  /*                                      */
  /*           Helper Functions           */
  /*                                      */
  /****************************************/
  // a helper function to check for valid swipes.
  function checkForSwipe() {
    let swipeYDelta = swipeMove.y - swipeStart.y;
    let swipeXDelta = swipeStart.x - swipeMove.x;
    return {x: swipeXDelta, y: swipeYDelta}; // return swipeY deltas otherwise
  }

  // helper function for accurately toggling class. slightly more reliable than classList.toggle(),
  // since this always performs the contains() check first, as opposed to naively changing every time
  function toggleMenu(e) {
    e.preventDefault();
    if (slideContainer.classList.contains('offscreen')) {
      slideContainer.classList.add('onscreen');
      slideContainer.classList.remove('offscreen');
    } else {
      slideContainer.classList.add('offscreen');
      slideContainer.classList.remove('onscreen');
    }
  }
});