async function episodeScraper(animeList, playList) {
    // console.log(animeList);
    // console.log(playList);
    const parser = new DOMParser();
    console.log('episodeScraper');
    const baseUrl = 'https://www.nicovideo.jp/tag/2024%E7%A7%8B%E3%82%A2%E3%83%8B%E3%83%A1%E5%85%AC%E5%BC%8F?&sort=f&order=d&page=';
    var pager = document.querySelector('.toolbar div.pager');
    var currentPage = pager.querySelector('a.pagerBtn.switchingBtn.active');
    var nextPage = currentPage.nextElementSibling;
    //var notFoundAnimeList = animeList;
    // すべてのページからエピソードを取得
    let cnt = 0;
    pageLoop: while (nextPage !== null || cnt < 500) {
        const response = await fetch(baseUrl + currentPage.textContent); 
        const text = await response.text();
        const doc = parser.parseFromString(text, 'text/html');
        const animeElements = doc.querySelectorAll('.contentBody.video.uad.videoList.videoList01 .videoListInner:not(.videoListSkeleton) li.item')
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

        for (const animeElement of animeElements) {
            let episodeTitle = animeElement.querySelector('.itemContent .itemTitle a').title;
            const episodeUrl = animeElement.querySelector('.itemContent .itemTitle a').href;
            const releaseDate = animeElement.querySelector('.videoList01Wrap .itemTime .video_uploaded .time').textContent.trim();
            const imageUrl = animeElement.querySelector('.videoList01Wrap .uadWrap .itemThumbBox .itemThumb .itemThumbWrap .thumb').src;
            const freeUntil = new Date(new Date(releaseDate).getTime() + 7 * 24 * 60 * 60 * 1000);
            const freeUntilString = freeUntil.toISOString();
            const paidIcon = animeElement.querySelector('.videoList01Wrap .iconPayment');
            const isPaid = paidIcon !== null;
            console.log(isPaid);
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
                    // エピソードが登録されていない場合
                    const shortTitle = episodeTitle.substring(anime.title.length).trim();
                    const episode = { ...episodeTemplate, animeTitle:anime.title, title: episodeTitle, shortTitle: shortTitle, isPaid: isPaid, url: episodeUrl, releaseDate: releaseDate, freeUntil: freeUntilString, imageUrl: imageUrl };
                    // 未視聴のエピソードをwatchlistとプレイリストに追加
                    anime.episodes.push(episode);
                    playList.unshift(episode);
                    console.log(`Added episode: ${episodeTitle}`);
                    // anime.episodesをリリース日でソート
                    anime.episodes.sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
                }
                else {
                    // すでに登録されているエピソードを更新
                    const episode = anime.episodes[episodeIndex];
                    const paidIcon = animeElement.querySelector('.videoList01Wrap .iconPayment');
                    const isPaid = paidIcon !== null;
                    episode.isPaid = isPaid;
                }
            
            }
            else {
                // 一致するアニメが見つからなかった場合
                console.log(`Not found anime: ${episodeTitle}`);
            }
        }

        pager = doc.querySelector('.toolbar div.pager');
        currentPage = pager.querySelector('a.pagerBtn.switchingBtn.active');
        nextPage = currentPage.nextElementSibling;
        if (nextPage === null) {
            break;
        }
        else {
            currentPage = nextPage;
        }
        cnt++;
    }
    // animeのプロパティを更新
    for (const anime of animeList) {
        anime.currentEpisode = anime.episodes.length;
        anime.totalEpisodes = anime.episodes.length;
    }
    // console.log(animeList);
    // console.log(playList);
    // console.log([animeList, playList]);
    
    await chrome.storage.local.set({ watchlist: animeList, playList: playList }).then(() => {
        //console.log(playList);
        sendResponse('エピソードデータを更新しました');
    });
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

async function returnAnimeList() {
    //chrome.storage.localからアニメのデータを取得

    let animeList = (await chrome.storage.local.get('watchlist'))['watchlist'];
    let playList = (await chrome.storage.local.get('playList'))['playList'];
    if (!animeList) {
        console.error('アニメリストが取得できませんでした');
    }
    if (!playList) {
        playList = [];
    }
    return await episodeScraper(animeList, playList);
}

returnAnimeList();