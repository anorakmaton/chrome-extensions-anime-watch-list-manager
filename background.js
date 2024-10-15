chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "playNext") {
        console.log('次のエピソードを再生します');
        chrome.tabs.update(sender.tab.id, { url: message.url });
    }
});

