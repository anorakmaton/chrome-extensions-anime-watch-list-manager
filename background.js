let watchlist = ['https://videosite.com/anime1', 'https://videosite.com/anime2'];
let currentIndex = 0;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "playNext") {
        currentIndex++;
        if (currentIndex < watchlist.length) {
            chrome.tabs.update(sender.tab.id, { url: watchlist[currentIndex] });
        }
    }
});
