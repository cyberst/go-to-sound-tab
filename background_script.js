browser.browserAction.onClicked.addListener(GoToSoundTab);

function GoToSoundTab() {
    browser.windows.getLastFocused({populate:true}).then(currentWindow => {
        if(!GoToSoundTabInWindow(currentWindow, true))
        {
            browser.windows.getAll({populate:true}).then(allWindows => {
                if(!(allWindows.filter(window => window.id !== currentWindow.id)
                .some(window => GoToSoundTabInWindow(window, false))))
                {
                    GoToSoundTabInWindow(currentWindow, false);
                }
            })
        }
    })
}
function GoToSoundTabInWindow(window, isCurrentWindow){
    audibleTabs = window.tabs.filter(tab => tab.audible);
    if(isCurrentWindow){
        currentTab = window.tabs.find(tab => tab.active);
        audibleTabs = audibleTabs.filter(tab => tab.index > currentTab.index);    
    }
    if(audibleTabs.length > 0){
        browser.tabs.update(audibleTabs[0].id,{active:true})
        if(!isCurrentWindow){
            setTimeout(() => 
                browser.windows.update(window.id, {focused:true})
            , 150);
        }
        return true;
    }
    else{
        return false;
    }
}
