chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "playNext") {
        console.log('次のエピソードを再生します');
        chrome.tabs.update(sender.tab.id, { url: message.url });
    }
});

// シーズンのアニメタイトルを初期化する
// chrome.runtime.onMessage.addListener(async (message) => {
//     if (message.action !== 'initAnimeData') return;
function initAnimeData(seasonData) {
    chrome.tabs.create({ url: seasonData.nicoDicUrl, active: false }).then(tab => {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['anime_title_scraper.js'] // TODO:anime_title_scraper.jsに変更
        }).then((result) => {
            chrome.tabs.remove(tab.id);
            console.log(result[0].result);
            const seasonAnimeData = result[0].result;
            chrome.storage.local.set({ [seasonData.seasonName]: seasonAnimeData});
        });
    });
};

// 未取得のエピソードを取得する
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    // TODO:変更したデータ形式に対応させる
    if (message.action === 'updateAnimeData') {
        const result = await chrome.storage.local.get('seasonData');
        const seasonAnimeData = result.seasonData[message.season];
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
                    // chrome.storage.local.get("config", (result) => {
                    //     let config = result.config;
                    //     if (config === undefined || config.updateDate === undefined) {
                    //         config = { updateDate: new Date().toLocaleString() };
                    //         console.log(config.updateDate);
                    //         chrome.storage.local.set({ "config": config });
                    //     }
                    //     else {
                    //         config.updateDate = new Date().toLocaleString;
                    //         chrome.storage.local.set({ config: config });
                    //     }
                    // });
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

                chrome.storage.local.set({ watchlist: watchlist, droppedList: droppedList, playList: playList });
            }
        });
    }
    return true;
});

//拡張機能がインストールされたときに実行される処理
chrome.runtime.onInstalled.addListener((details) => {
    // 現在の日時を取得
    const currentDate = new Date();
    let seasonYear = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;  // 1月が0のため+1

    // 現在のシーズンを決定
    let currentSeason;
    if (month >= 3 && month <= 5) {
        currentSeason = "春";
    } else if (month >= 6 && month <= 8) {
        currentSeason = "夏";
    } else if (month >= 9 && month <= 11) {
        currentSeason = "秋";
    } else {
        currentSeason = "冬";
        // 1月や2月なら前年をシーズンの年度とする
        if (month <= 2) {
            seasonYear -= 1;
        }
    }

    const currentAnimeSeason = `${seasonYear}年${currentSeason}アニメ`;
    const currentEncodedString = encodeURIComponent(currentAnimeSeason);
    const currentAnimeSeasonData = { 
        "seasonCode": String(seasonYear) + String(seasonCode[currentSeason]), 
        "seasonName": currentAnimeSeason, 
        "nicoVidUrl": nicoVidBaseURL + currentEncodedString, 
        "nicoDicUrl": nicoDicBaseURL + currentEncodedString 
    }

    // 次のシーズンを決定
    let nextSeason;
    let nextSeasonYear = seasonYear;
    if (currentSeason === "春") {
        nextSeason = "夏";
    } else if (currentSeason === "夏") {
        nextSeason = "秋";
    } else if (currentSeason === "秋") {
        nextSeason = "冬";
    } else {
        nextSeason = "春";
        nextSeasonYear += 1;  // 冬の次は春なので、年度が変わる
    }

    const nextAnimeSeason = `${nextSeasonYear}年${nextSeason}アニメ`;
    const nextEncodedString = encodeURIComponent(nextAnimeSeason);
    const nextAnimeSeasonData = { 
        "seasonCode": String(nextSeasonYear) + String(seasonCode[nextSeason]), 
        "seasonName": nextAnimeSeason, 
        "nicoVidUrl": nicoVidBaseURL + nextEncodedString, 
        "nicoDicUrl": nicoDicBaseURL + nextEncodedString 
    }
    console.log(currentAnimeSeasonData);
    console.log(nextAnimeSeasonData);
    const seasonData = {}
    seasonData[currentAnimeSeason] = currentAnimeSeasonData;
    seasonData[nextAnimeSeason] = nextAnimeSeasonData;
    //シーズン情報をストレージに保存
    chrome.storage.local.set({ season: currentAnimeSeason, currentAnimeSeason: currentAnimeSeason, seasonData: seasonData }, () => {
        initAnimeData(currentAnimeSeasonData);
    });
});

const nicoVidBaseURL = "https://www.nicovideo.jp/tag/";
const nicoDicBaseURL = 'https://dic.nicovideo.jp/a/';
const seasonCode = {
    "春": 1,
    "夏": 2,
    "秋": 3,
    "冬": 4
};

//TODO: 以前のデータを更新する
// mergedlist.forEach((anime) => {
//     if (isSimilar(anime.title, animetitle)) {
//         console.log(animetitle);
//     }
// });
// const watchlist = result.watchlist;
//         const droppedlist = result.droppedList;
//         const mergedlist = watchlist.concat(droppedlist);

//         mergedlist.sort((a, b) => {
//             if (a.title < b.title) return -1;
//             if (a.title > b.title) return 1;
//             return 0;
//         });
//         mergedlist.forEach((anime) => {
//             console.log(anime.title);
//         });
// importScripts('jquery-3.7.1.min.js');
// var xhr = new XMLHttpRequest();
// xhr.responseType  = "document";

// xhr.onload = function(e){
//     var dom = e.target.responseXML;
//     var blogs = dom.querySelectorAll('c-footerCp__container__overview__symbolImage');
//     console.log(blogs);

// };

// xhr.open("get", "https://ch.nicovideo.jp/spice-and-wolf");
// xhr.send();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action != 'getAnimeThumData') return;
    fetch(message.url)
        .then(function (res) {
            return res.text(); // フェッチしたデータを JSON 形式に変換
        })
        .then(async function (htmlString) {
            // chのアニメのサムネ画像を抽出
            const regex = /<div class="c-footerCp__container__overview__symbolImage">[\s\S]*?<img[^>]+src="([^"]+)"[^>]*>/;
            const match = regex.exec(htmlString);
            if (match) {
                const src = match[1];
                base64Image = await getImageBase64(src);
               
                sendResponse({imageSrc: src, imageBase64: base64Image});
            } else {
                console.log("指定の画像が見つかりませんでした");
                sendResponse({imagesrc: null, imageBase64: null});
            }
        })
        .catch(function (err) {
            console.error("エラー:", err);
        });
    return true;
});

// 画像をBase64形式で取得する関数
function fetchImageAsBase64(imageUrl) {
    return new Promise((resolve, reject) => {
        fetch(imageUrl)
            .then((response) => response.blob())
            .then((blob) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve(reader.result); // Base64 データ
                };
                reader.onerror = () => reject(new Error("Failed to read blob as Base64"));
                reader.readAsDataURL(blob);
            })
            .catch((error) => reject(error)); // エラーハンドリング
    });
}

// 画像をchrome.storage.localに保存する
async function getImageBase64(imageUrl) {
    try {
        const base64Image = await fetchImageAsBase64(imageUrl); // Promiseの結果を待つ
        return base64Image;
    } catch (error) {
        console.error("Error in getImageBase64:", error);
        return null; // エラーが発生した場合
    }
}