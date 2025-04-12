document.addEventListener('DOMContentLoaded', () => {
  const sitesContainer = document.getElementById('sites');
  const addSiteButton = document.getElementById('addSite');
  const addGitHubSiteButton = document.getElementById('addGitHubSite');
  const saveButton = document.getElementById('save');
  const saveContainer = document.getElementById('saveContainer');
  let sites = [];

  // Load saved settings
  chrome.storage.sync.get(['sites'], (data) => {
    sites = data.sites || [];
    renderSites();
  });

  // Add new regular site
  addSiteButton.addEventListener('click', () => {
    updateSitesFromInputs();
    sites.unshift({ url: '', imageSettings: [], textSettings: [], type: 'regular' });
    renderSites();
  });

  // Add new GitHub site
  addGitHubSiteButton.addEventListener('click', () => {
    updateSitesFromInputs();
    sites.unshift({ url: 'https://github.com', imageSettings: [], textSettings: [], type: 'github' });
    renderSites();
  });

  saveButton.addEventListener('click', () => {
    updateSitesFromInputs();
    chrome.storage.sync.set({ sites }, () => {
      // Success: no alert
      // FIXME: errors!
    });
  });

  // Update sites array from current input values
  function updateSitesFromInputs() {
    const siteNodes = sitesContainer.querySelectorAll('.site');
    const updatedSites = [];
    siteNodes.forEach((siteNode, siteIndex) => {
      const site = sites[siteIndex] || {
        url: '',
        imageSettings: [],
        textSettings: [],
        type: siteNode.dataset.type || 'regular'
      };
      const urlInput = siteNode.querySelector(`#site-url-${siteIndex}`);
      if (urlInput) {
        site.url = urlInput.value;
      }
      site.imageSettings = site.imageSettings || [];
      const imageReplacements = siteNode.querySelectorAll(`#image-replacements-${siteIndex} .replacement`);
      site.imageSettings.length = imageReplacements.length;
      imageReplacements.forEach((_, settingIndex) => {
        const selectorInput = siteNode.querySelector(`#image-selector-${siteIndex}-${settingIndex}`);
        const profileIdInput = siteNode.querySelector(`#image-profile-id-${siteIndex}-${settingIndex}`);
        const urlInput = siteNode.querySelector(`#image-url-${siteIndex}-${settingIndex}`);
        const disabledInput = siteNode.querySelector(`#image-disabled-${siteIndex}-${settingIndex}`);
        if (urlInput && disabledInput) {
          site.imageSettings[settingIndex] = site.imageSettings[settingIndex] || {};
          if (site.type === 'github' && profileIdInput) {
            site.imageSettings[settingIndex].profileId = profileIdInput.value;
            if (!profileIdInput.classList.contains('d-none')) {
              delete site.imageSettings[settingIndex].selector;
            }
          }
          if (site.type === 'github' && selectorInput) {
            site.imageSettings[settingIndex].selector = selectorInput.value;
            if (!selectorInput.classList.contains('d-none')) {
              delete site.imageSettings[settingIndex].profileId;
            }
          } else if (selectorInput) {
            site.imageSettings[settingIndex].selector = selectorInput.value;
          }
          site.imageSettings[settingIndex].url = urlInput.value;
          site.imageSettings[settingIndex].disabled = disabledInput.checked;
        }
      });
      site.textSettings = site.textSettings || [];
      const textReplacements = siteNode.querySelectorAll(`#text-replacements-${siteIndex} .replacement`);
      site.textSettings.length = textReplacements.length;
      textReplacements.forEach((_, settingIndex) => {
        const searchInput = siteNode.querySelector(`#text-search-${siteIndex}-${settingIndex}`);
        const replacementInput = siteNode.querySelector(`#text-replacement-${siteIndex}-${settingIndex}`);
        const disabledInput = siteNode.querySelector(`#text-disabled-${siteIndex}-${settingIndex}`);
        if (searchInput && replacementInput && disabledInput) {
          site.textSettings[settingIndex] = site.textSettings[settingIndex] || {};
          site.textSettings[settingIndex].search = searchInput.value;
          site.textSettings[settingIndex].replacement = replacementInput.value;
          site.textSettings[settingIndex].disabled = disabledInput.checked;
        }
      });
      updatedSites.push(site);
    });
    sites = updatedSites;
  }

  // Render all sites
  function renderSites() {
    const siteTemplate = document.getElementById('site-template').innerHTML;
    const githubSiteTemplate = document.getElementById('github-site-template').innerHTML;
    const imageReplacementTemplate = document.getElementById('image-replacement-template').innerHTML;
    const githubImageReplacementTemplate = document.getElementById('github-image-replacement-template').innerHTML;
    const textReplacementTemplate = document.getElementById('text-replacement-template').innerHTML;

    sitesContainer.innerHTML = '';
    if (sites.length === 0) {
      sites.push({ url: '', imageSettings: [], textSettings: [], type: 'regular' });
    }

    sites.forEach((site, siteIndex) => {
      // Render site
      const template = site.type === 'github' ? githubSiteTemplate : siteTemplate;
      const siteHtml = template.replace(/{siteIndex}/g, siteIndex);
      sitesContainer.insertAdjacentHTML('beforeend', siteHtml);

      // Set site URL value
      const urlInput = document.getElementById(`site-url-${siteIndex}`);
      if (urlInput) {
        urlInput.value = site.url || '';
      }

      // Render image replacements
      const imageReplacementsDiv = document.getElementById(`image-replacements-${siteIndex}`);
      if (imageReplacementsDiv) {
        imageReplacementsDiv.innerHTML = '';
        site.imageSettings.forEach((setting, settingIndex) => {
          let replacementHtml;
          if (site.type === 'github') {
            replacementHtml = githubImageReplacementTemplate
              .replace(/{siteIndex}/g, siteIndex)
              .replace(/{replacementIndex}/g, settingIndex);
          } else {
            replacementHtml = imageReplacementTemplate
              .replace(/{siteIndex}/g, siteIndex)
              .replace(/{replacementIndex}/g, settingIndex);
          }
          imageReplacementsDiv.insertAdjacentHTML('beforeend', replacementHtml);

          // Set image replacement values
          const selectorInput = document.getElementById(`image-selector-${siteIndex}-${settingIndex}`);
          const profileIdInput = document.getElementById(`image-profile-id-${siteIndex}-${settingIndex}`);
          const profileIdRadio = document.getElementById(`image-profile-id-radio-${siteIndex}-${settingIndex}`);
          const selectorRadio = document.getElementById(`image-selector-radio-${siteIndex}-${settingIndex}`);
          const urlInput = document.getElementById(`image-url-${siteIndex}-${settingIndex}`);
          const disabledInput = document.getElementById(`image-disabled-${siteIndex}-${settingIndex}`);
          if (urlInput && disabledInput) {
            if (site.type === 'github' && profileIdInput && selectorInput && profileIdRadio && selectorRadio) {
              const useProfileId = setting.profileId !== undefined;
              profileIdRadio.checked = useProfileId;
              selectorRadio.checked = !useProfileId;
              profileIdInput.classList.toggle('d-none', !useProfileId);
              selectorInput.classList.toggle('d-none', useProfileId);
              profileIdInput.value = setting.profileId || '';
              selectorInput.value = setting.selector || '';
              profileIdInput.disabled = disabledInput.checked;
              selectorInput.disabled = disabledInput.checked;

              profileIdRadio.addEventListener('change', () => {
                profileIdInput.classList.remove('d-none');
                selectorInput.classList.add('d-none');
              });
              selectorRadio.addEventListener('change', () => {
                profileIdInput.classList.add('d-none');
                selectorInput.classList.remove('d-none');
              });
            } else if (selectorInput) {
              selectorInput.value = setting.selector || '';
              selectorInput.disabled = disabledInput.checked;
            }
            urlInput.value = setting.url || '';
            urlInput.disabled = disabledInput.checked;
            disabledInput.checked = setting.disabled || false;

            disabledInput.addEventListener('change', () => {
              if (selectorInput) selectorInput.disabled = disabledInput.checked;
              if (profileIdInput) profileIdInput.disabled = disabledInput.checked;
              urlInput.disabled = disabledInput.checked;
            });
          }
        });
      }

      // Render text replacements
      const textReplacementsDiv = document.getElementById(`text-replacements-${siteIndex}`);
      if (textReplacementsDiv) {
        textReplacementsDiv.innerHTML = '';
        site.textSettings.forEach((setting, settingIndex) => {
          const replacementHtml = textReplacementTemplate
            .replace(/{siteIndex}/g, siteIndex)
            .replace(/{replacementIndex}/g, settingIndex);
          textReplacementsDiv.insertAdjacentHTML('beforeend', replacementHtml);

          const searchInput = document.getElementById(`text-search-${siteIndex}-${settingIndex}`);
          const replacementInput = document.getElementById(`text-replacement-${siteIndex}-${settingIndex}`);
          const disabledInput = document.getElementById(`text-disabled-${siteIndex}-${settingIndex}`);
          if (searchInput && replacementInput && disabledInput) {
            searchInput.value = setting.search || '';
            replacementInput.value = setting.replacement || '';
            disabledInput.checked = setting.disabled || false;
            searchInput.disabled = disabledInput.checked;
            replacementInput.disabled = disabledInput.checked;

            disabledInput.addEventListener('change', () => {
              searchInput.disabled = disabledInput.checked;
              replacementInput.disabled = disabledInput.checked;
            });
          }
        });
      }

      // Attach event listeners
      const siteNode = sitesContainer.querySelectorAll('.site')[siteIndex];
      if (siteNode) {
        const deleteSiteBtn = siteNode.querySelector('.js-delete-site');
        if (deleteSiteBtn) {
          deleteSiteBtn.removeEventListener('click', deleteSiteBtn._listener); // Remove previous listener if any
          const listener = () => removeSite(siteIndex);
          deleteSiteBtn._listener = listener;
          deleteSiteBtn.addEventListener('click', listener);
        }
        const addImageReplacementBtn = siteNode.querySelector(`#image-replacements-${siteIndex} + .mb-3 .add-replacement-btn`);
        if (addImageReplacementBtn) {
          addImageReplacementBtn.addEventListener('click', () => addImageSetting(siteIndex));
        }
        const addTextReplacementBtn = siteNode.querySelector(`#text-replacements-${siteIndex} + .mb-3 .add-replacement-btn`);
        if (addTextReplacementBtn) {
          addTextReplacementBtn.addEventListener('click', () => addTextSetting(siteIndex));
        }
        siteNode.querySelectorAll(`#image-replacements-${siteIndex} .btn-danger`).forEach((btn, settingIndex) => {
          btn.removeEventListener('click', btn._listener);
          const listener = () => removeImageSetting(siteIndex, settingIndex);
          btn._listener = listener;
          btn.addEventListener('click', listener);
        });
        siteNode.querySelectorAll(`#text-replacements-${siteIndex} .btn-danger`).forEach((btn, settingIndex) => {
          btn.removeEventListener('click', btn._listener);
          const listener = () => removeTextSetting(siteIndex, settingIndex);
          btn._listener = listener;
          btn.addEventListener('click', listener);
        });
      }
    });

    saveContainer.style.display = sites.length > 0 ? 'block' : 'none';
  }

  // Add image setting
  function addImageSetting(siteIndex) {
    updateSitesFromInputs();
    const newSetting = sites[siteIndex].type === 'github'
      ? { profileId: '', url: '', disabled: false }
      : { selector: '', url: '', disabled: false };
    sites[siteIndex].imageSettings.push(newSetting);
    renderSites();
  }

  // Add text setting
  function addTextSetting(siteIndex) {
    updateSitesFromInputs();
    sites[siteIndex].textSettings.push({ search: '', replacement: '', disabled: false });
    renderSites();
  }

  // Remove image setting
  function removeImageSetting(siteIndex, settingIndex) {
    updateSitesFromInputs();
    sites[siteIndex].imageSettings.splice(settingIndex, 1);
    renderSites();
  }

  // Remove text setting
  function removeTextSetting(siteIndex, settingIndex) {
    updateSitesFromInputs();
    sites[siteIndex].textSettings.splice(settingIndex, 1);
    renderSites();
  }

  // Remove a site
  function removeSite(siteIndex) {
    updateSitesFromInputs();
    sites.splice(siteIndex, 1);
    renderSites();
  }
});
