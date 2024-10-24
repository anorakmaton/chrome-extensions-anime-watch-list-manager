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
        await getEpisodeData(title.textContent);
        observer.disconnect(); // 見つかったら監視を終了
        if (dbExists) {
            video.addEventListener('ended', async () => {
                console.log('動画の再生が終了しました');
                await updateEpisodeWatched();
                playNextPlayList();
                // ここで再生終了時に実行したい処理を記述します
            });
            video.addEventListener('play', () => {
                console.log('動画の再生が開始しました');
                // ここで再生開始時に実行したい処理を記述します
            });
            video.addEventListener('pause', () => {
                console.log('動画の再生が一時停止しました');
                // ここで一時停止時に実行したい処理を記述します
                logLastTime(episodeData.title, animeData.title);
            });
            video.addEventListener('seeked', () => {
                console.log('動画の再生位置を変更しました');
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
    await chrome.storage.local.get({ watchlist: [], droppedList: [] }, (result) => {
        watchlist = result.watchlist;
        watchlist.forEach(anime => {
            anime.episodes.forEach(episode => {
                if (episode.title === title) {
                    episodeData = episode;
                    episodeTitle = episode.title;
                    episode.duration = video.duration;
                    animeData = anime;
                    animeTitle = anime.title;
                    episodeData = episode;
                    dbExists = true;
                }
            });
        });

        chrome.storage.local.set({ watchlist: watchlist }); // データを更新
    });
    return true;
}

// エピソードデータを更新
const timeDiff = 10; // 10秒以上再生したら更新
function updateEpisodeTime(time) {
    if (time - episodeData.lastTime > timeDiff) {
        chrome.storage.local.get({ watchlist: [], playList: [] }, (result) => {
            const watchlist = result.watchlist;
            const playList = result.playList;
            episodeData.lastTime = time;
            watchlist.find(anime => anime.title === animeData.title).episodes.find(episode => episode.title === episodeData.title).lastTime = time;
            playList.find(episode => episode.title === episodeData.title).lastTime = time;

            chrome.storage.local.set({ watchlist: watchlist, playList: playList });
        });
    }
}

async function updateEpisodeWatched() {
    await chrome.storage.local.get({ watchlist: [], playList: [] }, async (result) => {
        const watchlist = result.watchlist;
        const playList = result.playList;
        watchlist.find(anime => anime.title === animeData.title).episodes.find(episode => episode.title === episodeData.title).watched = true;
        playList.find(episode => episode.title === episodeData.title).watched = true;
        await chrome.storage.local.set({ watchlist: watchlist, playList: playList });
    });
    console.log('エピソードを視聴済みに設定しました');
}

function logLastTime(episodeTitle, animeTitle) {
    chrome.storage.local.get({ watchlist: [], droppedList: [] }, (result) => {
        watchlist = result.watchlist;
        var episodeData;
        episodeData = watchlist.find(anime => anime.title === animeTitle).episodes.find(episode => episode.title === episodeTitle);
        const time = watchlist.find(anime => anime.title === animeData.title).episodes.find(episode => episode.title === episodeTitle).lastTime;
        console.log('time:', time);
    });
}

function playNextPlayList() {
    chrome.storage.local.get({ playList: [] }, (result) => {
        const playList = result.playList;
        if (playList.length > 0) {
            const nowIdx = playList.findIndex(episode => episode.title === episodeData.title);
            if (nowIdx === -1) {
                console.log('再生リストに現在のエピソードが見つかりません');
                return;
            }
            if (nowIdx === playList.length - 1) {
                console.log('再生リストの最後のエピソードが終了しました');
                return;
            }
            const nextVideo = playList[nowIdx + 1];
            // 現在のタブを更新
            console.log('次のエピソードを再生します');
            chrome.runtime.sendMessage({ action: "playNext", url: nextVideo.url });
        }
    });
}

