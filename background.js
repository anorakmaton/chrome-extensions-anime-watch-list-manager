chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "playNext") {
        console.log('次のエピソードを再生します');
        chrome.tabs.update(sender.tab.id, { url: message.url });
    }
});

chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'popup') {
        console.log('ポップアップが開かれました');

        // ポートが切断されたときの処理
        port.onDisconnect.addListener(() => {
            console.log('ポップアップが閉じられました (バックグラウンド側)');
            updateAnimeData();
        });

        // ポートを通じたメッセージを処理する
        port.onMessage.addListener((message) => {
            console.log('ポップアップからのメッセージ: ', message);
        });
    }
});

function updateAnimeData() {
    chrome.storage.local.get({ watchlist: [], droppedList: [] }, (result) => {
        const watchlist = result.watchlist;
        const droppedList = result.droppedList;

        chrome.tabs.create({ url: 'https://www.nicovideo.jp/tag/2024%E7%A7%8B%E3%82%A2%E3%83%8B%E3%83%A1%E5%85%AC%E5%BC%8F?&sort=f&order=d&page=', active: false }).then(tab => {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['episode_scraper.js']
            }).then((result) => {
                console.log(result[0].result);
                chrome.tabs.remove(tab.id);
                const updatedAnimeList = result[0].result;
                const playList = watchlist.filter(anime => anime.status === 'watching').map(anime => anime.episodes).flat().filter(episode => console.log);
                chrome.storage.local.set({ watchlist: updatedAnimeList, playList: playList }, updateAll);
            });
        });

    });
}

// 未取得のエピソードを取得する
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateAnimeData') {
        chrome.storage.local.get({ watchlist: [], playList: [] }, (result) => {
            const watchlist = result.watchlist;
            
            chrome.tabs.create({ url: 'https://www.nicovideo.jp/tag/2024%E7%A7%8B%E3%82%A2%E3%83%8B%E3%83%A1%E5%85%AC%E5%BC%8F?&sort=f&order=d&page=', active: false }).then(tab => {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['episode_scraper.js']
                }).then((result) => {
                    chrome.tabs.remove(tab.id);
                    const [updatedAnimeList, playList] = result[0].result;
                    console.log(playList);
                    const updatedPlayList = watchlist.filter(anime => anime.status === 'watching').map(anime => anime.episodes).flat();
                    // 未取得のエピソードをプレイリストに追加
                    updatedPlayList.forEach(episode => {
                        if (!playList.includes(episode)) {
                            playList.unshift(episode);
                        }
                    });
                    chrome.storage.local.set({ watchlist: updatedAnimeList, playList: playList }).then(() => {
                        sendResponse('エピソードデータを更新しました');
                    });
                });
            });
        });
    }
    return true;
});