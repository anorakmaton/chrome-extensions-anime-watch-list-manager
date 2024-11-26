console.log('Content script loaded!');
var episodeData;
var animeData;
var video;
var animeTitle;
var episodeTitle;
var watchlist = [];
var dbExists = false;
// MutationObserverを使って動的に生成された要素を監視
const observer = new MutationObserver(async (mutationsList, observer) => {
    video = document.querySelector("div > video");
    const title = document.querySelector('div.d_flex.flex-d_column.gap_base h1');
    if (video && title) {
        observer.disconnect(); // 見つかったら監視を終了
        dbExists = await getEpisodeData(title.textContent);
        console.log('dbExists:', dbExists);
        
        if (dbExists) {
            video.addEventListener('ended', async () => {
                //console.log('動画の再生が終了しました');
                const autoPlayEnabled = await chrome.storage.local.get('autoPlayEnabled');
                if (autoPlayEnabled) { // 自動再生がONのとき
                    await playNextPlayList();
                    console.log('次の動画を再生');
                }
                await updateEpisodeWatched()
                // ここで再生終了時に実行したい処理を記述します
            });
            video.addEventListener('play', () => {
                //console.log('動画の再生が開始しました');
                // ここで再生開始時に実行したい処理を記述します
            });
            video.addEventListener('pause', () => {
                //console.log('動画の再生が一時停止しました');
                // ここで一時停止時に実行したい処理を記述します
                //logLastTime(episodeData.title, animeData.title);
            });
            video.addEventListener('seeked', () => {
                //console.log('動画の再生位置を変更しました');
                // ここで再生位置変更時に実行したい処理を記述します
            });
            video.addEventListener('timeupdate', () => {
                updateEpisodeTime(video.currentTime);
                // ここで再生時間更新時に実行したい処理を記述します
            });
        }
    }
});

observer.observe(document.body, { childList: true, subtree: true });

// エピソードデータを取得
async function getEpisodeData(title) {
    const season = await getLocal('season');
    chrome.storage.local.get({ [season]: [], shouldShowPaidVideoValue: [] }, async (result) => {
        const seasonData = result[season];
        const seasonAnimeArray = Object.values(seasonData);
        seasonAnimeArray.forEach(anime => {
            anime.episodes.forEach(episode => {
                if (episode.title === title) {
                    episodeData = episode;
                    episodeTitle = episode.title;
                    episode.duration = video.duration;
                    animeData = anime;
                    animeTitle = anime.title;
                    episodeData = episode;
                    chrome.storage.local.set({ watchlist: watchlist }); // データを更新
                    return true;
                }
            });
        });
        return false;
    });
    return true;
}

// エピソードデータを更新
const timeDiff = 10; // 10秒以上再生したら更新
async function updateEpisodeTime(time) {
    if (time - episodeData.lastTime > timeDiff) {
        const season = await getLocal('season');
        chrome.storage.local.get({ [season]: [], shouldShowPaidVideoValue: [] }, async (result) => {
            const seasonData = result[season];
            const seasonAnimeArray = Object.values(seasonData);
            episodeData.lastTime = time;
            seasonAnimeArray.find(anime => anime.title === animeData.title).episodes.find(episode => episode.title === episodeData.title).lastTime = time;
            chrome.storage.local.set({ [season]: seasonData });
        });
    }
}

async function updateEpisodeWatched() {
    const season = await getLocal('season');
    chrome.storage.local.get({ [season]: [], shouldShowPaidVideoValue: [] }, async (result) => {
        const seasonData = result[season];
        const seasonAnimeArray = Object.values(seasonData);
        seasonAnimeArray.find(anime => anime.title === animeData.title).episodes.find(episode => episode.title === episodeData.title).watched = true;
        
        await chrome.storage.local.set({ [season]: seasonData });
    });
    console.log('エピソードを視聴済みに設定しました');
}

// function logLastTime(episodeTitle, animeTitle) {
//     chrome.storage.local.get({ watchlist: [], droppedList: [] }, (result) => {
//         watchlist = result.watchlist;
//         var episodeData;
//         episodeData = watchlist.find(anime => anime.title === animeTitle).episodes.find(episode => episode.title === episodeTitle);
//         const time = watchlist.find(anime => anime.title === animeData.title).episodes.find(episode => episode.title === episodeTitle).lastTime;
//         console.log('time:', time);
//     });
// }

async function playNextPlayList() {
    const season = await getLocal('season');
    chrome.storage.local.get({ [season]: [], shouldShowPaidVideoValue: [] }, (result) => {
        const seasonAnimeData = result[season];
        const seasonAnimeArray = Object.values(seasonAnimeData);
        const shouldShowPaidVideoValue = result.shouldShowPaidVideoValue;
        let playList = [];
        seasonAnimeArray.forEach((anime) => {
            anime.episodes.forEach((episode) => {
                if (shouldShowPaidVideoValue === false ) {
                    if (!episode.isPaid) {
                        if (!episode.watched) {
                            playList.push(episode);
                        }
                    }
                } else {
                    if (!episode.watched) {
                        playList.push(episode);
                    }
                }  
            });
        });
        playList.sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
   
        if (playList.length > 0) {
            console.log(playList);
            console.log(episodeData.title);
            const nowIdx = playList.findIndex(episode => episode.title === episodeData.title);
            if (nowIdx === -1) {
                console.log('再生リストに現在のエピソードが見つかりません');
                return;
            }
            if (nowIdx === playList.length - 1) {
                console.log('再生リストの最後のエピソードが終了しました');
                return;
            }
            for (let i = nowIdx + 1; i < playList.length; i++) {
                // 有料動画を表示しない設定の場合、有料動画はスキップ
                if (shouldShowPaidVideoValue === false && playList[i].isPaid) {
                    //console.log('次のエピソードは有料動画です');
                    continue;
                }
                if (!playList[i].watched) {
                    console.log('次のエピソードを再生します');
                    chrome.runtime.sendMessage({ action: "playNext", url: playList[i].url });
                    return;
                }
            }
            // const nextVideo = playList[nowIdx + 1];
            // // 現在のタブを更新
            // console.log('次のエピソードを再生します');
            // chrome.runtime.sendMessage({ action: "playNext", url: nextVideo.url });
        }
    });
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