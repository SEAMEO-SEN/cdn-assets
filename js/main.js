var links = [].slice.call(document.querySelectorAll('.p-side-navigation__link, .p-side-navigation--raw-html li > a'));

links.forEach(function (link) {
  link.addEventListener('click', function () {
    var active = [].slice.call(document.querySelectorAll('.is-active, [aria-current]'));
    active.forEach(function (link) {
      link.classList.remove('is-active');
      link.removeAttribute('aria-current');
    });
    this.setAttribute('aria-current', 'page');
    this.blur();
  });
});

var expandedSidenavContainer = null;
var lastFocus = null;
var ignoreFocusChanges = false;
var focusAfterClose = null;

// Traps the focus within the currently expanded sidenav drawer
function trapFocus(event) {
  if (ignoreFocusChanges || !expandedSidenavContainer) return;
  // skip the focus trap if the sidenav is not in the expanded status (large screens)
  if (!expandedSidenavContainer.classList.contains('is-drawer-expanded')) return;
  var sidenavDrawer = expandedSidenavContainer.querySelector('.p-side-navigation__drawer');

  if (sidenavDrawer.contains(event.target)) {
    lastFocus = event.target;
  } else {
    focusFirstDescendant(sidenavDrawer);
    if (lastFocus == document.activeElement) {
      focusLastDescendant(sidenavDrawer);
    }
    lastFocus = document.activeElement;
  }
}

// Attempts to focus given element
function attemptFocus(child) {
  if (child.focus) {
    ignoreFocusChanges = true;
    child.focus();
    ignoreFocusChanges = false;
    return document.activeElement === child;
  }

  return false;
}

// Focuses first child element
function focusFirstDescendant(element) {
  for (var i = 0; i < element.childNodes.length; i++) {
    var child = element.childNodes[i];
    if (attemptFocus(child) || focusFirstDescendant(child)) {
      return true;
    }
  }
  return false;
}

// Focuses last child element
function focusLastDescendant(element) {
  for (var i = element.childNodes.length - 1; i >= 0; i--) {
    var child = element.childNodes[i];
    if (attemptFocus(child) || focusLastDescendant(child)) {
      return true;
    }
  }
  return false;
}

/**
  Toggles the expanded/collapsed classes on side navigation element.

  @param {HTMLElement} sideNavigation The side navigation element.
  @param {Boolean} show Whether to show or hide the drawer.
*/
function toggleDrawer(sideNavigation, show) {
  expandedSidenavContainer = show ? sideNavigation : null;
  const toggleButtonOutsideDrawer = sideNavigation.querySelector('.p-side-navigation__toggle, .js-drawer-toggle');
  const toggleButtonInsideDrawer = sideNavigation.querySelector('.p-side-navigation__toggle--in-drawer');

  if (sideNavigation) {
    if (show) {
      sideNavigation.classList.remove('is-drawer-collapsed');
      sideNavigation.classList.add('is-drawer-expanded');

      toggleButtonInsideDrawer.focus();
      toggleButtonOutsideDrawer.setAttribute('aria-expanded', true);
      toggleButtonInsideDrawer.setAttribute('aria-expanded', true);
      focusFirstDescendant(sideNavigation);
      focusAfterClose = toggleButtonOutsideDrawer;
      document.addEventListener('focus', trapFocus, true);
    } else {
      sideNavigation.classList.remove('is-drawer-expanded');
      sideNavigation.classList.add('is-drawer-collapsed');

      toggleButtonOutsideDrawer.focus();
      toggleButtonOutsideDrawer.setAttribute('aria-expanded', false);
      toggleButtonInsideDrawer.setAttribute('aria-expanded', false);
      if (focusAfterClose && focusAfterClose.focus) {
        focusAfterClose.focus();
      }
      document.removeEventListener('focus', trapFocus, true);
    }
  }
}

// throttle util (for window resize event)
var throttle = function (fn, delay) {
  var timer = null;
  return function () {
    var context = this,
      args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () {
      fn.apply(context, args);
    }, delay);
  };
};

/**
  Attaches event listeners for the side navigation toggles
  @param {HTMLElement} sideNavigation The side navigation element.
*/
function setupSideNavigation(sideNavigation) {
  var toggles = [].slice.call(sideNavigation.querySelectorAll('.js-drawer-toggle'));
  var drawerEl = sideNavigation.querySelector('.p-side-navigation__drawer');

  // hide navigation drawer on small screens
  sideNavigation.classList.add('is-drawer-hidden');

  // setup drawer element
  drawerEl.addEventListener('animationend', () => {
    if (!sideNavigation.classList.contains('is-drawer-expanded')) {
      sideNavigation.classList.add('is-drawer-hidden');
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      toggleDrawer(sideNavigation, false);
    }
  });

  // setup toggle buttons
  toggles.forEach(function (toggle) {
    toggle.addEventListener('click', function (event) {
      event.preventDefault();

      if (sideNavigation) {
        sideNavigation.classList.remove('is-drawer-hidden');
        toggleDrawer(sideNavigation, !sideNavigation.classList.contains('is-drawer-expanded'));
      }
    });
  });

  // hide side navigation drawer when screen is resized
  window.addEventListener(
    'resize',
    throttle(function () {
      toggles.forEach((toggle) => {
        return toggle.setAttribute('aria-expanded', false);
      });
      // remove expanded/collapsed class names to avoid unexpected animations
      sideNavigation.classList.remove('is-drawer-expanded');
      sideNavigation.classList.remove('is-drawer-collapsed');
      sideNavigation.classList.add('is-drawer-hidden');
    }, 10)
  );
}

/**
  Attaches event listeners for all the side navigations in the document.
  @param {String} sideNavigationSelector The CSS selector matching side navigation elements.
*/
function setupSideNavigations(sideNavigationSelector) {
  // Setup all side navigations on the page.
  var sideNavigations = [].slice.call(document.querySelectorAll(sideNavigationSelector));

  sideNavigations.forEach(setupSideNavigation);
}

setupSideNavigations('.p-side-navigation, [class*="p-side-navigation--"]');

// Setup expand toggles for all side navigations on the page.

function setupSideNavigationExpandToggle(toggle) {
  const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
  if (!isExpanded) {
    toggle.setAttribute('aria-expanded', isExpanded);
  }
  const item = toggle.closest('.p-side-navigation__item');
  const link = item.querySelector('.p-side-navigation__link');
  const nestedList = item.querySelector('.p-side-navigation__list');
  if (!link?.hasAttribute('aria-expanded')) {
    link.setAttribute('aria-expanded', isExpanded);
  }
  if (!nestedList?.hasAttribute('aria-expanded')) {
    nestedList.setAttribute('aria-expanded', isExpanded);
  }
}

function handleExpandToggle(event) {
  const item = event.currentTarget.closest('.p-side-navigation__item');
  const button = item.querySelector('.p-side-navigation__expand, .p-side-navigation__accordion-button');
  const link = item.querySelector('.p-side-navigation__link');
  const nestedList = item.querySelector('.p-side-navigation__list');

  [button, link, nestedList].forEach((el) => {
    el.setAttribute('aria-expanded', el.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
  });
}

function setupSideNavigationExpands() {
  var expandToggles = document.querySelectorAll('.p-side-navigation__expand, .p-side-navigation__accordion-button');
  expandToggles.forEach((toggle) => {
    setupSideNavigationExpandToggle(toggle);
    toggle.addEventListener('click', (e) => {
      handleExpandToggle(e);
    });
  });
}

setupSideNavigationExpands();

(function () {
  var keys = {
    left: 'ArrowLeft',
    right: 'ArrowRight',
  };

  var direction = {
    ArrowLeft: -1,
    ArrowRight: 1,
  };

  /**
    Attaches a number of events that each trigger
    the reveal of the chosen tab content
    @param {Array} tabs an array of tabs within a container
  */
  function attachEvents(tabs) {
    tabs.forEach(function (tab, index) {
      tab.addEventListener('keyup', function (e) {
        if (e.code === keys.left || e.code === keys.right) {
          switchTabOnArrowPress(e, tabs);
        }
      });

      tab.addEventListener('click', function (e) {
        e.preventDefault();
        setActiveTab(tab, tabs);
      });

      tab.addEventListener('focus', function () {
        setActiveTab(tab, tabs);
      });

      tab.index = index;
    });
  }

  /**
    Determine which tab to show when an arrow key is pressed
    @param {KeyboardEvent} event
    @param {Array} tabs an array of tabs within a container
  */
  function switchTabOnArrowPress(event, tabs) {
    var pressed = event.code;

    if (direction[pressed]) {
      var target = event.target;
      if (target.index !== undefined) {
        if (tabs[target.index + direction[pressed]]) {
          tabs[target.index + direction[pressed]].focus();
        } else if (pressed === keys.left) {
          tabs[tabs.length - 1].focus();
        } else if (pressed === keys.right) {
          tabs[0].focus();
        }
      }
    }
  }

  /**
    Cycles through an array of tab elements and ensures 
    only the target tab and its content are selected
    @param {HTMLElement} tab the tab whose content will be shown
    @param {Array} tabs an array of tabs within a container
  */
  function setActiveTab(tab, tabs) {
    tabs.forEach(function (tabElement) {
      var tabContent = document.getElementById(tabElement.getAttribute('aria-controls'));

      if (tabElement === tab) {
        tabElement.setAttribute('aria-selected', true);
        tabContent.removeAttribute('hidden');
      } else {
        tabElement.setAttribute('aria-selected', false);
        tabContent.setAttribute('hidden', true);
      }
    });
  }

  /**
    Attaches events to tab links within a given parent element,
    and sets the active tab if the current hash matches the id
    of an element controlled by a tab link
    @param {String} selector class name of the element 
    containing the tabs we want to attach events to
  */
  function initTabs(selector) {
    var tabContainers = [].slice.call(document.querySelectorAll(selector));

    tabContainers.forEach(function (tabContainer) {
      var tabs = [].slice.call(tabContainer.querySelectorAll('[aria-controls]'));
      attachEvents(tabs);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initTabs('[role="tablist"]');
  });
})();
