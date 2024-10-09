function populateUnwatchedAndExpiredPlaylists() {
    chrome.storage.local.get({ watchlist: [] }, (result) => {
        let watchlist = result.watchlist;
        let unwatchedHTML = '';
        let expiredHTML = '';
        let currentDate = new Date();

        watchlist.forEach(anime => {
            anime.episodes.forEach(episode => {
                let episodeHtml = `<div>${anime.title} - Episode ${episode.episode} <a href="${episode.url}">再生</a></div>`;
                //console.log(`!episode.watched: ${!episode.watched}, new Date(episode.freeUntil): ${new Date(episode.freeUntil)}, currentDate: ${currentDate}`);
                // 未視聴かつ無料公開中のエピソード
                if (!episode.watched && new Date(episode.freeUntil) >= currentDate) {
                    unwatchedHTML += episodeHtml;
                }

                // 未視聴かつ期限切れのエピソード
                if (!episode.watched && new Date(episode.freeUntil) < currentDate) {
                    expiredHTML += `<div>${anime.title} - Episode ${episode.episode} (期限切れ)</div>`;
                }
            });
        });

        document.getElementById('unwatched-playlist').innerHTML = unwatchedHTML;
        document.getElementById('expired-playlist').innerHTML = expiredHTML;
    });
}

function populateAnimeLists() {
    chrome.storage.local.get({ watchlist: [], droppedList: [] }, (result) => {
        let watchlist = result.watchlist;
        let droppedList = result.droppedList;
        console.log(watchlist);
        console.log(droppedList);
        let watchingHTML = '';
        let droppedHTML = '';

        // 視聴中アニメリスト
        watchlist.forEach(anime => {
            watchingHTML += `
                <div>
                    ${anime.title} 
                    <button class="moveToDroppedButton" value="${anime.title}">視聴切りに移動</button>
                </div>`;
        });

        // 視聴切りアニメリスト
        droppedList.forEach(anime => {
            droppedHTML += `
                <div>
                    ${anime.title} 
                    <button class="moveToWatchingButton" value="${anime.title}">視聴中に戻す</button>
                </div>`;
        });

        document.getElementById('watching-anime-list').innerHTML = watchingHTML;
        document.getElementById('dropped-anime-list').innerHTML = droppedHTML;
        const moveToDroppedButtons = document.querySelectorAll('.moveToDroppedButton');
        const moveToWatchingButtons = document.querySelectorAll('.moveToWatchingButton');
        moveToDroppedButtons.forEach(button => {
            button.addEventListener('click', function () {
                console.log('button.value:', button.value);
                moveToDropped(button.value); // クリックされたボタンを引数として渡す
            });
        });
        moveToWatchingButtons.forEach(button => {         
            button.addEventListener('click', function () {
                console.log('button.value:', button.value);
                moveToWatching(button.value); // クリックされたボタンを引数として渡す
            });
        });
        
    });
}

function moveToDropped(title) {
    chrome.storage.local.get({ watchlist: [], droppedList: [] }, (result) => {
        let watchlist = result.watchlist;
        let droppedList = result.droppedList;
        console.log(`watchlist: ${watchlist}, droppedList: ${droppedList}`);
        let anime = watchlist.find(a => a.title === title);
        if (anime) {
            watchlist = watchlist.filter(a => a.title !== title);
            droppedList.push(anime);
            chrome.storage.local.set({ watchlist: watchlist, droppedList: droppedList }, populateAnimeLists);
        }
    });
}

function moveToWatching(title) {
    chrome.storage.local.get({ watchlist: [], droppedList: [] }, (result) => {
        let watchlist = result.watchlist;
        let droppedList = result.droppedList;
        console.log(`watchlist: ${watchlist}, droppedList: ${droppedList}`);
        let anime = droppedList.find(a => a.title === title);
        if (anime) {
            droppedList = droppedList.filter(a => a.title !== title);
            watchlist.push(anime);
            chrome.storage.local.set({ watchlist: watchlist, droppedList: droppedList }, populateAnimeLists);
        }
    });
}



document.addEventListener('DOMContentLoaded', async function () {
    //jsonファイルを読み込む
    await fetch('watchlist.json')
    .then(response => response.json())
    .then(data => {
        // ローカルストレージにデータを保存
        chrome.storage.local.set({ watchlist: data, droppedList: [] }, () => {
            console.log("Watchlist saved");
        });
    });
    populateUnwatchedAndExpiredPlaylists();
    populateAnimeLists();
});