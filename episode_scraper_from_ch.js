async function episodeScraper(animeList, playList) {
    // console.log(animeList);
    // console.log(playList);

    const episodeElements = document.querySelectorAll('g-video-inside-SS');
    episodeElements.forEach((element) => {
        const episodeLeft = element.querySelector('div.g-video-left');
        const episodeRight = element.querySelector('div.g-video-right');

        const episodeTitle = episodeRight.querySelector('a.g-video-link');
        const 
    });
    // すべてのページからエピソードを取得
    const episodeTemplate = {
        animeTitle: '', 
        title: '',
        shortTitle: '', // アニメタイトルを除いたエピソードタイトル
        episodeNumber: 0,
        isPaid: false,
        url: '',
        duration: 0,
        lastTime: 0,
        imageUrl: '',
        releaseDate: '',
        freeUntil: '',
        watched: false,
        status: ''
    }

    // for (const animeElement of animeElements) {
    //     let episodeTitle = animeElement.querySelector('.itemContent .itemTitle a').title;
    //     const episodeUrl = animeElement.querySelector('.itemContent .itemTitle a').href;
    //     const releaseDate = animeElement.querySelector('.videoList01Wrap .itemTime .video_uploaded .time').textContent.trim();
    //     const imageUrl = animeElement.querySelector('.videoList01Wrap .uadWrap .itemThumbBox .itemThumb .itemThumbWrap .thumb').src;
    //     const freeUntil = new Date(new Date(releaseDate).getTime() + 7 * 24 * 60 * 60 * 1000);
    //     const freeUntilString = freeUntil.toISOString();
    //     const paidIcon = animeElement.querySelector('.videoList01Wrap .iconPayment');
    //     const isPaid = paidIcon !== null;
    //     //console.log("[MyScript]", isPaid);
    //     const matchingKeys = Object.keys(animeList).filter((key) => {
    //         const shortEpisodeTitle = episodeTitle.substring(0, key.length);
    //         return isSimilar(key, shortEpisodeTitle);     
    //     });
    //     const anime = animeList[matchingKeys];
    //     if (anime) {
    //         //console.log("[MyScript] animeTitle: " + episodeTitle + "matchingKeys: " + matchingKeys);
    //     }
    //     else {
    //         console.log("[MyScript] not found title: ",episodeTitle);
    //     }
    //     //console.log("[MyScript] matchingKeys: ", matchingKeys)
    //     // notFoundAnimeList = notFoundAnimeList.filter(a => {
    //     //     const shortEpisodeTitle = episodeTitle.substring(0, a.title.length);
    //     //     return !isSimilar(a.title, shortEpisodeTitle);
    //     // });
    //     if (anime) {
    //         // すでにエピソードが登録されているか確認
    //         const episodeIndex = anime.episodes.findIndex(e => e.title === episodeTitle);
    //         if (episodeIndex === -1) {
    //             // エピソードが登録されていない場合
    //             const shortTitle = episodeTitle.substring(anime.title.length).trim();
    //             const episode = { ...episodeTemplate, animeTitle:anime.title, title: episodeTitle, shortTitle: shortTitle, isPaid: isPaid, url: episodeUrl, releaseDate: releaseDate, freeUntil: freeUntilString, imageUrl: imageUrl };
    //             // 未視聴のエピソードをwatchlistとプレイリストに追加
    //             anime.episodes.push(episode);
    //             playList.unshift(episode);
    //             //console.log("[MyScript]", `Added episode: ${episodeTitle}`);
    //             // anime.episodesをリリース日でソート
    //             anime.episodes.sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
    //         }
    //         else {
    //             // すでに登録されているエピソードを更新
    //             const episode = anime.episodes[episodeIndex];
    //             const paidIcon = animeElement.querySelector('.videoList01Wrap .iconPayment');
    //             const isPaid = paidIcon !== null;
    //             episode.isPaid = isPaid;
    //         }
    //         // サムネイルをダウンロードする
            
    //     }
    //     else {
    //         // 一致するアニメが見つからなかった場合
    //         console.log(`Not found anime: ${episodeTitle}`);
    //     }
    // }

    // // animeのプロパティを更新
    // for (const anime of Array.from(animeList)) {
    //     anime.currentEpisode = anime.episodes.length;
    //     anime.totalEpisodes = anime.episodes.length;
    // }
   
    // // playListを投稿日でソート
    // Array.from(playList).sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
    
    // // await chrome.storage.local.set({ watchlist: animeList, playList: playList }).then(() => {
    // //     //console.log(playList);
    // //     sendResponse('エピソードデータを更新しました');
    // // });
    return true;
}

// レーベンシュタイン距離を計算する関数
function levenshteinDistance(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const dp = Array.from(Array(len1 + 1), () => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) dp[i][0] = i;
    for (let j = 0; j <= len2; j++) dp[0][j] = j;

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,    // 削除
                dp[i][j - 1] + 1,    // 挿入
                dp[i - 1][j - 1] + cost  // 置換
            );
        }
    }
    return dp[len1][len2];
}

// 一致率を計算する関数
function similarityRate(str1, str2) {
    const maxLength = Math.max(str1.length, str2.length);
    const distance = levenshteinDistance(str1, str2);
    return (1 - distance / maxLength);  // 1に近いほど一致
}

// 一致率が一定以上なら一致とみなす
function isSimilar(str1, str2, threshold = 0.8) {
    const rate = similarityRate(str1, str2);
    return rate >= threshold;
}

async function fetchAndStoreImage(imageUrl, storageKey) {
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        // 画像データをBase64形式に変換
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = function () {
            const base64data = reader.result;
            
            
            // chrome.storageに画像データを保存
            chrome.storage.local.set({ [storageKey]: base64data }, () => {
                console.log("Image saved to chrome.storage with key:", storageKey);
            });
        };
    } catch (error) {
        console.error("Failed to fetch and store image:", error);
    }
}


async function returnAnimeList() {
    //chrome.storage.localからアニメのデータを取得
    let result = (await chrome.storage.local.get(['season', 'seasonData']));
    const season = result.season;
    const seasonData = result.seasonData[season];

    result = (await chrome.storage.local.get(season));
    const animeList = result[season];
    console.log(animeList);
    let playList;
    if (!animeList) {
        console.error('アニメリストが取得できませんでした');
    }
    if (!playList) {
        playList = [];
    }
    return await episodeScraper(animeList, playList);
}

returnAnimeList();