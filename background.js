const url = 'https://www.nicovideo.jp/tag/2024%E7%A7%8B%E3%82%A2%E3%83%8B%E3%83%A1%E5%85%AC%E5%BC%8F?sort=f&order=d'
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "fetchData") {
        fetchData(url);
    }
});

async function fetchData(_url) {
    try {
        const response = await fetch(_url);
        
        const text = await response.text();
        console.log(text);
        // HTMLをpopup.jsに送信
        chrome.runtime.sendMessage({ action: "sendHTML", html: text });

    } catch (error) {
        console.error('Error fetching anime data:', error);
    }
}