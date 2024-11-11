chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "playNext") {
        console.log('次のエピソードを再生します');
        chrome.tabs.update(sender.tab.id, { url: message.url });
    }
});

// 未取得のエピソードを取得する
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateAnimeData') {
        chrome.storage.local.get({ watchlist: [], playList: [] }, (result) => {
            const watchlist = result.watchlist;
            console.log("updateAnimeData");
            chrome.tabs.create({ url: 'https://www.nicovideo.jp/tag/2024%E7%A7%8B%E3%82%A2%E3%83%8B%E3%83%A1%E5%85%AC%E5%BC%8F?&sort=f&order=d&page=', active: false }).then(tab => {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['episode_scraper.js']
                }).then((result) => {
                    chrome.tabs.remove(tab.id);
                    console.log(result[0].result);
                    // 最終更新日を更新
                    chrome.storage.local.get("config", (result) => {
                        let config = result.config;
                        if (config === undefined || config.updateDate === undefined) {
                            config = { updateDate: new Date().toLocaleString() };
                            console.log(config.updateDate);
                            chrome.storage.local.set({ "config": config });
                        }
                        else {
                            config.updateDate = new Date().toLocaleString;
                            chrome.storage.local.set({ config: config });
                        }
                    });
                    //const updatedPlayList = watchlist.filter(anime => anime.status === 'watching').map(anime => anime.episodes).flat();
                    // 未取得のエピソードをプレイリストに追加
                    // updatedPlayList.forEach(episode => {
                    //     if (!playList.includes(episode)) {
                    //         playList.unshift(episode);
                    //     }
                    // });
                });
            });
        });
    }
    return true;
});

// 視聴切りタイトルを更新
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'moveToDropped') {
        const title = message.title;
        chrome.storage.local.get({ watchlist: [], droppedList: [], playList: [] }, (result) => {
            let watchlist = result.watchlist;
            let droppedList = result.droppedList;
            let playList = result.playList;
            //console.log(`watchlist: ${watchlist}, droppedList: ${droppedList}`);
            let anime = watchlist.find(a => a.title === title);
            if (anime) {
                watchlist = watchlist.filter(a => a.title !== title);
                anime.status = "dropped";
                droppedList.push(anime);
                console.log(playList);
                playList = playList.filter(episode => episode.animeTitle !== title);
                // プレイリストをソート
                playList.sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
                console.log(playList);
                
                chrome.storage.local.set({ watchlist: watchlist, droppedList: droppedList, playList: playList });
            }
        });
    }
    return true;
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'moveToWatching') {
        const title = message.title;
        chrome.storage.local.get({ watchlist: [], droppedList: [], playList: [] }, (result) => {
            let watchlist = result.watchlist;
            let droppedList = result.droppedList;
            let playList = result.playList;
    
            let anime = droppedList.find(a => a.title === title);
            if (anime) {
                droppedList = droppedList.filter(a => a.title !== title);
                anime.status = "watching";
                watchlist.push(anime);
                console.log(playList);
                playList = playList.concat(anime.episodes);
                console.log(anime.episodes);
                // プレイリストをソート
                playList.sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
                console.log(playList);
                
                chrome.storage.local.set({ watchlist: watchlist, droppedList: droppedList, playList: playList });
            }
        });
    }
    return true;
});