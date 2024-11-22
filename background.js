chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "playNext") {
        console.log('次のエピソードを再生します');
        chrome.tabs.update(sender.tab.id, { url: message.url });
    }
});

// シーズンのアニメタイトルを初期化する
chrome.runtime.onMessage.addListener(async (message) => {
    if (message.action !== 'initAnimeData') return;
    initAnimeData(message);
});

/**
 * ニコニコ辞書から指定したシーズンのアニメタイトルを取得して保存する
 * @param {*} message 
 * @param {*} message.seasonData 
 * @param {*} message.season 
 */
async function initAnimeData(message) {
    console.log('message: ');
    console.log(message);
    chrome.tabs.create({ url: message.seasonData.nicoDicUrl, active: false }).then(tab => {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['anime_title_scraper.js']
        }).then((result) => {
            chrome.tabs.remove(tab.id);
            console.log(result[0].result);
            const seasonAnimeData = result[0].result;
            chrome.storage.local.set({ [message.seasonData.seasonName]: seasonAnimeData }, () => {
                updateAnimeData({ action: 'updateAnimeData', season: message.season });
            });
        });
    });
};

// 未取得のエピソードを取得する
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === 'updateAnimeData') {
        updateAnimeData(message);
    }
});

/**
 * ニコニコ動画からまだ取得していない動画の情報を取得して保存します。
 * @param {object} message オブジェクト
 * @param {string} message.action 'updateAnimeData'
 * @param {string} message.season 動画情報を取得するシーズンの名前 例:'2024年秋アニメ'
 * @returns {bool} 
 */
async function updateAnimeData(message) {
    if (message.action === 'updateAnimeData') {
        console.log('updateAnimeData');

        console.log(message);
        const seasonAnimeData = await getLocal('seasonData');
        console.log(seasonAnimeData);
        const targetUrl = seasonAnimeData[message.season].nicoVidUrl + '?&sort=f&order=d&page=';

        chrome.storage.local.get(message.season, (result) => {
            const animeData = result[message.season];
            chrome.tabs.create({ url: targetUrl, active: false }).then(tab => {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['episode_scraper.js']
                }).then((result) => {
                    chrome.tabs.remove(tab.id);

                    // 動画がまだないときfalseが返ってくるので終了する
                    if (!result[0].result) {
                        return false;
                    }

                    // 最終更新日を更新
                    chrome.storage.local.get("seasonData", (result) => {
                        let seasonData = result.seasonData;
                        let currentSeasonData = seasonData[message.season];
                        if (currentSeasonData.lastUpdateDate === undefined || currentSeasonData.lastUpdateDate === undefined) {
                            currentSeasonData.lastUpdateDate = new Date().toLocaleDateString();
                            chrome.storage.local.set({ seasonData: seasonData });
                        }
                        else {
                            currentSeasonData.lastUpdateDate = new Date().toLocaleString;
                            chrome.storage.local.set({ seasonData: seasonData });
                        }
                    });
                });
            });
        });
    }
    return true;
};

// 未取得のエピソードを取得する
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateSeason') {
        updateSeason().then((result) => {
            sendResponse(result);
            console.log(result);
        });
        
        return true;
    }
});

/**
 * 現在時刻から現在のシーズンと次のシーズンを取得して保存する
 * 
 */
async function updateSeason() {
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
    const currentVidEncodedString = encodeURIComponent(`${seasonYear}${currentSeason}アニメ公式`);
    const currentDicEncodedString = encodeURIComponent(`${seasonYear}年${currentSeason}アニメ`);
    const currentAnimeSeasonData = {
        "seasonCode": String(seasonYear) + String(seasonCode[currentSeason]),
        "seasonName": currentAnimeSeason,
        "nicoVidUrl": nicoVidBaseURL + currentVidEncodedString,
        "nicoDicUrl": nicoDicBaseURL + currentDicEncodedString,
        "lastUpdateDate": new Date().toLocaleString()
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
    const nextVidEncodedString = encodeURIComponent(`${nextSeasonYear}${nextSeason}アニメ公式`);
    const nextDicEncodedString = encodeURIComponent(`${nextSeasonYear}年${nextSeason}アニメ`);
    const nextAnimeSeasonData = {
        "seasonCode": String(nextSeasonYear) + String(seasonCode[nextSeason]),
        "seasonName": nextAnimeSeason,
        "nicoVidUrl": nicoVidBaseURL + nextVidEncodedString,
        "nicoDicUrl": nicoDicBaseURL + nextDicEncodedString,
        "lastUpdateDate": new Date().toLocaleString()
    }
    console.log(currentAnimeSeasonData);
    console.log(nextAnimeSeasonData);

    shouldShowPaidVideoValue = false;

    // まだ登録されていないシーズンを保存
    preSeasonData = await getLocal('seasonData');
    console.log(preSeasonData);
    if (!Object.keys(preSeasonData).includes(currentAnimeSeason)) {
        preSeasonData[currentAnimeSeason] = currentAnimeSeasonData;
        await chrome.storage.local.set({seasonData: preSeasonData});
        console.log(currentAnimeSeasonData);
        console.log(currentAnimeSeason);
        await initAnimeData({ seasonData: currentAnimeSeasonData, season: currentAnimeSeason });
    } else if (!Object.keys(preSeasonData).includes(nextAnimeSeason)) {
        preSeasonData = await getLocal('seasonData');
        preSeasonData[nextAnimeSeason] = nextAnimeSeasonData;
        await chrome.storage.local.set({seasonData: preSeasonData});
        console.log(nextAnimeSeasonData);
        console.log(nextAnimeSeason);
        await initAnimeData({ seasonData: nextAnimeSeasonData, season: nextAnimeSeason });
    }
    return [[currentAnimeSeason, Object.keys(preSeasonData).includes(currentAnimeSeason)], [nextAnimeSeason, Object.keys(preSeasonData).includes(nextAnimeSeason)]]
}
// 視聴切りタイトルを更新
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === 'moveToDropped') {
        const title = message.title;
        const season = await getLocal('season');
        const currentSeasonData = await getLocal(season);
        const targetAnimeData = currentSeasonData[title];
        targetAnimeData.status = "dropped";
        chrome.storage.local.set({ [season]: currentSeasonData });
    }
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === 'moveToWatching') {
        const title = message.title;
        const season = await getLocal('season');
        const currentSeasonData = await getLocal(season);
        const targetAnimeData = currentSeasonData[title];
        targetAnimeData.status = "watching";
        chrome.storage.local.set({ [season]: currentSeasonData });
    }
});

//拡張機能がインストールされたときに実行される処理
chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason == 'install') {
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
        const currentVidEncodedString = encodeURIComponent(`${seasonYear}${currentSeason}アニメ公式`);
        const currentDicEncodedString = encodeURIComponent(`${seasonYear}年${currentSeason}アニメ`);
        const currentAnimeSeasonData = {
            "seasonCode": String(seasonYear) + String(seasonCode[currentSeason]),
            "seasonName": currentAnimeSeason,
            "nicoVidUrl": nicoVidBaseURL + currentVidEncodedString,
            "nicoDicUrl": nicoDicBaseURL + currentDicEncodedString,
            "lastUpdateDate": new Date().toLocaleString()
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
        const nextVidEncodedString = encodeURIComponent(`${nextSeasonYear}${nextSeason}アニメ公式`);
        const nextDicEncodedString = encodeURIComponent(`${nextSeasonYear}年${nextSeason}アニメ`);
        const nextAnimeSeasonData = {
            "seasonCode": String(nextSeasonYear) + String(seasonCode[nextSeason]),
            "seasonName": nextAnimeSeason,
            "nicoVidUrl": nicoVidBaseURL + nextVidEncodedString,
            "nicoDicUrl": nicoDicBaseURL + nextDicEncodedString,
            "lastUpdateDate": new Date().toLocaleString()
        }
        console.log(currentAnimeSeasonData);
        console.log(nextAnimeSeasonData);
        const seasonData = {}
        seasonData[currentAnimeSeason] = currentAnimeSeasonData;
        seasonData[nextAnimeSeason] = nextAnimeSeasonData;

        shouldShowPaidVideoValue = false;
        //シーズン情報をストレージに保存
        chrome.storage.local.set({
            season: currentAnimeSeason,
            currentAnimeSeason: currentAnimeSeason,
            seasonData: seasonData,
            shouldShowPaidVideoValue: shouldShowPaidVideoValue
        }, () => {
            // ニコニコ辞書から指定したシーズンのアニメタイトルを取得する
            initAnimeData({ seasonData: currentAnimeSeasonData, season: currentAnimeSeason });
        });
    }
    else if (details.reason == 'update') {
        const result = await chrome.storage.local.get('season');
        const season = result['season'];
        //updateAnimeData({ action: 'updateAnimeData' , season: season});
        //chrome.runtime.sendMessage({ action: 'updateAnimeData' , season: season});
    }
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
    if (message.action !== 'getAnimeThumData') return;

    (async () => {
        try {
            const response = await fetch(message.url);
            const htmlString = await response.text();

            // 正規表現の定義
            const TITLE_REGEX = /<h1 class="channel_name"><a href="[^"]+">(.+?)<\/a><\/h1>/;
            const THUM_REGEX = /<div class="c-footerCp__container__overview__symbolImage">[\s\S]*?<img[^>]+src="([^"]+)"[^>]*>/;

            // タイトルの抽出
            const titleMatch = TITLE_REGEX.exec(htmlString);
            const animeTitle = titleMatch ? titleMatch[1] : null;

            if (!animeTitle) {
                console.log('アニメのタイトルが見つかりませんでした');
            }

            // サムネイル画像の抽出
            const thumMatch = THUM_REGEX.exec(htmlString);

            if (thumMatch) {
                const src = thumMatch[1];
                const base64Image = await getImageBase64(src);

                sendResponse({
                    imageSrc: src,
                    imageBase64: base64Image,
                    animeTitle: animeTitle,
                });
            } else {
                console.log('指定の画像が見つかりませんでした');
                sendResponse({
                    imageSrc: null,
                    imageBase64: null,
                    animeTitle: animeTitle,
                });
            }
        } catch (error) {
            console.error('エラー:', error);
            sendResponse({
                error: error.message,
                imageSrc: null,
                imageBase64: null,
                animeTitle: null,
            });
        }
    })();

    return true; // 非同期応答を待つために必要
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

async function getLocal(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(key, (result) => {
            if (chrome.runtime.lastError) {
                // エラーが発生した場合は reject で処理
                reject(chrome.runtime.lastError);
            } else {
                // 値を返す
                resolve(result[key]);
            }
        });
    });
}