async function episodeScraper(animeList) {
    const parser = new DOMParser();
    console.log('episodeScraper');
    const baseUrl = 'https://www.nicovideo.jp/tag/2024%E7%A7%8B%E3%82%A2%E3%83%8B%E3%83%A1%E5%85%AC%E5%BC%8F?&sort=f&order=d&page=';
    const pager = document.querySelector('.toolbar div.pager');
    const pages = pager.querySelectorAll('a');
    const pageList = [];
    pages.forEach(page => {
        if (!isNaN(page.textContent)) {
            pageList.push([baseUrl + page.textContent]);
        }
    });
    //var notFoundAnimeList = animeList;
    // すべてのページからエピソードを取得
    pageLoop: for (const page of pageList) {
        const response = await fetch(page);
        const text = await response.text();
        const doc = parser.parseFromString(text, 'text/html');
        const animeElements = doc.querySelectorAll('.contentBody.video.uad.videoList.videoList01 .videoListInner:not(.videoListSkeleton) li.item')
        const episodeTemplate = {
            title: '',
            shortTitle: '',
            episodeNumber: 0,
            url: '',
            imageUrl: '',
            releaseDate: '',
            freeUntil: '',
            watched: false
        }

        for (const animeElement of animeElements) {
            let episodeTitle = animeElement.querySelector('.itemContent .itemTitle a').textContent.trim();
            const episodeUrl = animeElement.querySelector('.itemContent .itemTitle a').href;
            const releaseDate = animeElement.querySelector('.videoList01Wrap .itemTime .video_uploaded .time').textContent.trim();
            const imageUrl = animeElement.querySelector('.videoList01Wrap .uadWrap .itemThumbBox .itemThumb .itemThumbWrap .thumb').src;
            const freeUntil = new Date(new Date(releaseDate).getTime() + 7 * 24 * 60 * 60 * 1000);
            
            const anime = animeList.find(a => {
                const shortEpisodeTitle = episodeTitle.substring(0, a.title.length);
                return isSimilar(a.title, shortEpisodeTitle);
            });
            
            // notFoundAnimeList = notFoundAnimeList.filter(a => {
            //     const shortEpisodeTitle = episodeTitle.substring(0, a.title.length);
            //     return !isSimilar(a.title, shortEpisodeTitle);
            // });
            if (anime) {
                // すでにエピソードが登録されているか確認
                const episodeIndex = anime.episodes.findIndex(e => e.title === episodeTitle);
                if (episodeIndex === -1) {
                    const shortTitle = episodeTitle.substring(anime.title.length).trim();
                    const episode = { ...episodeTemplate, title: episodeTitle, shortTitle: shortTitle, url: episodeUrl, releaseDate: releaseDate, freeUntil: freeUntil, imageUrl: imageUrl };
                    anime.episodes.unshift(episode);
                    console.log(`Added episode: ${episodeTitle}`);
                }
                else {
                    // すでに登録されているエピソードまできたら終了
                    break pageLoop;
                }
            }
            else {
                // 一致するアニメが見つからなかった場合
                console.log(`Not found anime: ${episodeTitle}`);
            }
        }
    }
    // animeのプロパティを更新
    for (const anime of animeList) {
        anime.currentEpisode = anime.episodes.length;
        anime.totalEpisodes = anime.episodes.length;
    }

    return animeList;
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

async function returnAnimeList() {
    //chrome.storage.localからアニメのデータを取得
    let animeList = [];
    animeList = (await chrome.storage.local.get('watchlist'))['watchlist'];
    return await episodeScraper(animeList);
}

returnAnimeList();