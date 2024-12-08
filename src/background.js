chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "playNext") {
        console.log('次のエピソードを再生します');
        chrome.tabs.update(sender.tab.id, { url: message.url });
    }
});

// シーズンのアニメタイトルを初期化する
chrome.runtime.onMessage.addListener(async (message) => {
    if (message.action !== 'initAnimeTitle') return;
    getAnimeTitleFromOffscreen(message);
});

// シーズンのアニメタイトルを更新する
chrome.runtime.onMessage.addListener(async (message) => {
    if (message.action === 'updateAnimeTitle') {
        getAnimeTitleFromOffscreen(message);
    }
});

// 未取得のエピソードを取得する
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === 'updateAnimeData') {
        getAnimeDataFromOffscreen(message);
    }
});

// 未取得のエピソードを取得する
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateSeason') {
        updateSeason().then((result) => {
            sendResponse(result);
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

    shouldShowPaidVideoValue = false;

    // まだ登録されていないシーズンを保存
    preSeasonData = await getLocal('seasonData');
    if (!Object.keys(preSeasonData).includes(currentAnimeSeason)) {
        preSeasonData[currentAnimeSeason] = currentAnimeSeasonData;
        await chrome.storage.local.set({ seasonData: preSeasonData });
        await getAnimeDataFromOffscreen({ seasonData: currentAnimeSeasonData, season: currentAnimeSeason });
    } else if (!Object.keys(preSeasonData).includes(nextAnimeSeason)) {
        preSeasonData = await getLocal('seasonData');
        preSeasonData[nextAnimeSeason] = nextAnimeSeasonData;
        await chrome.storage.local.set({ seasonData: preSeasonData });
        await getAnimeDataFromOffscreen({ seasonData: nextAnimeSeasonData, season: nextAnimeSeason });
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
    if (details.reason == 'update') {
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
        const seasonData = {}
        seasonData[currentAnimeSeason] = currentAnimeSeasonData;
        seasonData[nextAnimeSeason] = nextAnimeSeasonData;

        // 1年前までのシーズンを追加
        for (let i = 0; i < 3; i++) {
            let preSeason;
            let preSeasonYear = seasonYear;
            if (currentSeason === "春") {
                preSeason = "冬";
                preSeasonYear -= 1;
            } else if (currentSeason === "夏") {
                preSeason = "春";
            } else if (currentSeason === "秋") {
                preSeason = "夏";
            } else {
                preSeason = "秋";
            }
            const preAnimeSeason = `${preSeasonYear}年${preSeason}アニメ`;
            const preVidEncodedString = encodeURIComponent(`${preSeasonYear}${preSeason}アニメ公式`);
            const preDicEncodedString = encodeURIComponent(`${preSeasonYear}年${preSeason}アニメ`);
            const preAnimeSeasonData = {
                "seasonCode": String(preSeasonYear) + String(seasonCode[preSeason]),
                "seasonName": preAnimeSeason,
                "nicoVidUrl": nicoVidBaseURL + preVidEncodedString,
                "nicoDicUrl": nicoDicBaseURL + preDicEncodedString,
                "lastUpdateDate": new Date().toLocaleString()
            }
            seasonData[preAnimeSeason] = preAnimeSeasonData;
            currentSeason = preSeason;
            seasonYear = preSeasonYear;
        }
        
        shouldShowPaidVideoValue = false;
        //シーズン情報をストレージに保存
        chrome.storage.local.set({
            season: currentAnimeSeason,
            currentAnimeSeason: currentAnimeSeason,
            seasonData: seasonData,
            shouldShowPaidVideoValue: shouldShowPaidVideoValue
        }, () => {
            // ニコニコ辞書から指定したシーズンのアニメタイトルを取得する
            getAnimeTitleFromOffscreen({ seasonData: currentAnimeSeasonData, season: currentAnimeSeason });
        });
    }
    // else if (details.reason == 'update') {
    //     const result = await chrome.storage.local.get('season');
    //     const season = result['season'];
    //     //updateAnimeData({ action: 'updateAnimeData' , season: season});
    //     //chrome.runtime.sendMessage({ action: 'updateAnimeData' , season: season});
    // } //TODO: debug
});

const nicoVidBaseURL = "https://www.nicovideo.jp/tag/";
const nicoDicBaseURL = 'https://dic.nicovideo.jp/a/';
const seasonCode = {
    "春": 1,
    "夏": 2,
    "秋": 3,
    "冬": 4
};

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

async function getAnimeDataFromOffscreen(message) {
    const seasonAnimeData = await getLocal(message.season);
    const seasonData = await getLocal('seasonData');
    const currentSeasonData = seasonData[message.season];
    const baseUrl = currentSeasonData.nicoVidUrl;
    const response = await fetch(baseUrl);
    const htmlString = await response.text();
    const season = message.season;

    sendMessageToOffscreenDocument('getAnimeData', { baseUrl, season, seasonAnimeData, htmlString });
}

async function getAnimeTitleFromOffscreen(message) {
    const seasonData = await getLocal('seasonData');
    let oldAnimeTitles = await getLocal(message.season);
    
    if (oldAnimeTitles === undefined) {
        oldAnimeTitles = [];
    } else {
        oldAnimeTitles = Object.keys(oldAnimeTitles);
    }
    const currentSeasonData = seasonData[message.season];
    const baseUrl = currentSeasonData.nicoDicUrl;
    const response = await fetch(baseUrl);
    const htmlString = await response.text();
    sendMessageToOffscreenDocument('getAnimeTitle', { htmlString, season: message.season, oldAnimeTitles });
}
const OFFSCREEN_DOCUMENT_PATH = 'html/offscreen.html';

async function sendMessageToOffscreenDocument(type, data) {
    // Create an offscreen document if one doesn't exist yet
    if (!(await hasDocument())) {
        await chrome.offscreen.createDocument({
            url: OFFSCREEN_DOCUMENT_PATH,
            reasons: [chrome.offscreen.Reason.DOM_PARSER],
            justification: 'Parse DOM'
        });
    }
    // Now that we have an offscreen document, we can dispatch the
    // message.
    chrome.runtime.sendMessage({
        type,
        target: 'offscreen',
        data
    });
}

chrome.runtime.onMessage.addListener(handleMessages);

// This function performs basic filtering and error checking on messages before
// dispatching the message to a more specific message handler.
async function handleMessages(message) {
    // Return early if this message isn't meant for the background script
    if (message.target !== 'background') {
        return;
    }

    // Dispatch the message to an appropriate handler.
    switch (message.type) {
        case 'getAnimeDataResult':
            console.log('getAnimeDataResult');
            // 最終更新日を更新
            const seasonData = await getLocal('seasonData');
            const currentSeasonData = seasonData[message.data.season];
            currentSeasonData.lastUpdateDate = new Date().toLocaleString();
            await chrome.storage.local.set({ seasonData: seasonData });
            chrome.runtime.sendMessage({ action: 'syncComplete-Episode', newEpisodeCount: message.data.newEpisodeCount });
            handleGetAnimeDataResult(message.data);
            break;
        case 'getAnimeTitleResult':
            console.log('getAnimeTitleResult');
            chrome.runtime.sendMessage({ action: 'syncComplete-Title', newAnimeTitles: message.data.newAnimeTitles });
            handleGetAnimeTitleResult(message.data);
            break;
        default:
            console.warn(`Unexpected message type received: '${message.type}'.`);
    }
}

async function handleGetAnimeDataResult(data) {
    // 動画がまだないときfalseが返ってくるので終了する
    if (data.animeList === false) {
        return false;
    }

    // アニメデータを更新
    chrome.storage.local.set({ [data.season]: data.animeList });
    // オフスクリーンを閉じる
    closeOffscreenDocument();
}   

async function handleGetAnimeTitleResult(data) {
    const seasonAnimeData = await getLocal(data.season);

    // アニメデータがまだなければ初期化
    if (seasonAnimeData === undefined) {
        await chrome.storage.local.set({ [data.season]: data.titleList });
    }
    else {
        // アニメデータを更新
        const currentSeasonData = await getLocal(data.season);
        const currentAnimeTitles = Object.keys(currentSeasonData);
        const newAnimeTitles = Object.keys(data.titleList);
        const newAnimeData = {};
        newAnimeTitles.forEach((title) => {
            if (!currentAnimeTitles.includes(title)) {
                newAnimeData[title] = data.titleList[title];
            }
        });
        if (Object.keys(newAnimeData).length > 0) {
            console.log('新しいアニメが見つかりました');
            console.log(newAnimeData);
            await chrome.storage.local.set({ [data.season]: { ...currentSeasonData, ...newAnimeData } });
        }
    }
    getAnimeDataFromOffscreen({ season: data.season });
}

async function closeOffscreenDocument() {
    if (!(await hasDocument())) {
        return;
    }
    await chrome.offscreen.closeDocument();
}

async function hasDocument() {
    // Check all windows controlled by the service worker if one of them is the offscreen document
    const matchedClients = await clients.matchAll();
    for (const client of matchedClients) {
        if (client.url.endsWith(OFFSCREEN_DOCUMENT_PATH)) {
            return true;
        }
    }
    return false;
}