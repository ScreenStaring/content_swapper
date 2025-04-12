const githubAvatarURL = (profileId) => `https://avatars.githubusercontent.com/u/${profileId}` ;

function applyReplacements() {
  chrome.storage.sync.get(['sites'], (data) => {
    const sites = data.sites || [];
    const currentUrl = window.location.href;

    sites.forEach((site) => {
      if (site.url && (new RegExp(site.url)).test(currentUrl)) {
        site.imageSettings.forEach((setting) => {
          if (!setting.disabled && setting.url) {
            let selector = setting.selector;
            if (site.type === 'github' && setting.profileId) {
              const avatar = githubAvatarURL(setting.profileId);
              selector = `img[src^="${avatar}"]`;
            }

            if (selector) {
              const elements = document.querySelectorAll(selector);

              elements.forEach((el) => {
                if (el.tagName === 'IMG') {
                  el.src = setting.url;
                } else {
                  el.style.backgroundImage = `url(${setting.url})`;
                }
              });
            }
          }
        });

        site.textSettings.forEach((setting) => {
          if (!setting.disabled && setting.search && setting.replacement) {
            const walker = document.createTreeWalker(
              document.body,
              NodeFilter.SHOW_TEXT,
              {
                acceptNode: (node) => {
                  return node.parentElement.tagName !== 'SCRIPT' &&
                    node.parentElement.tagName !== 'STYLE'
                    ? NodeFilter.FILTER_ACCEPT
                    : NodeFilter.FILTER_REJECT;
                },
              }
            );

            const nodes = [];
            let node;
            while ((node = walker.nextNode())) {
              nodes.push(node);
            }

            nodes.forEach((textNode) => {
              if (textNode.nodeValue.includes(setting.search)) {
                textNode.nodeValue = textNode.nodeValue.replace(
                  new RegExp(setting.search, 'g'),
                  setting.replacement
                );
              }
            });
          }
        });
      }
    });
  });
}

// Run replacements on initial load
applyReplacements();

// Set up MutationObserver to handle dynamic DOM changes
const observer = new MutationObserver((mutations) => {
  // Throttle to avoid excessive calls
  let timeout;
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    applyReplacements();
  }, 100);
});

// Observe changes to the body and its subtree
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Handle Turbo-specific events
document.addEventListener('turbo:load', () => {
  applyReplacements();
});

// Ensure replacements persist on Turbo frame updates
document.addEventListener('turbo:render', () => {
  applyReplacements();
});
