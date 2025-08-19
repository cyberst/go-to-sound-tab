// Load WebExtension polyfill in MV3 service worker (classic worker) or MV2 background
try { importScripts('browser-polyfill.min.js'); } catch (e) { /* ignore if not available */ }
// Fallback to chrome.* if browser.* is not available
const globalScope = typeof self !== 'undefined' ? self : globalThis;
if (typeof globalScope.browser === 'undefined' && typeof globalScope.chrome !== 'undefined') {
    globalScope.browser = globalScope.chrome;
}

// Support both MV3 and MV2 action APIs
const actionApi = globalScope.browser && (globalScope.browser.action || globalScope.browser.browserAction);
if (actionApi && actionApi.onClicked) {
    actionApi.onClicked.addListener(goToSoundTab);
}

function goToSoundTab() {
    browser.windows.getLastFocused({ populate: true }).then(currentWindow => {
        if (!goToSoundTabInWindow(currentWindow, true)) {
            browser.windows.getAll({ populate: true }).then(allWindows => {
                const otherWindows = allWindows.filter(w => w.id !== currentWindow.id);
                const foundInOther = otherWindows.some(w => goToSoundTabInWindow(w, false));
                if (!foundInOther) {
                    goToSoundTabInWindow(currentWindow, false);
                }
            });
        }
    });
}

function goToSoundTabInWindow(win, isCurrentWindow) {
    let audibleTabs = win.tabs.filter(tab => tab.audible);
    if (isCurrentWindow) {
        const currentTab = win.tabs.find(tab => tab.active);
        if (currentTab) {
            audibleTabs = audibleTabs.filter(tab => tab.index > currentTab.index);
        }
    }
    if (audibleTabs.length > 0) {
        browser.tabs.update(audibleTabs[0].id, { active: true });
        if (!isCurrentWindow) {
            setTimeout(() => browser.windows.update(win.id, { focused: true }), 150);
        }
        return true;
    }
    return false;
}
