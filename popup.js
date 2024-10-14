function updateAll() {
    updatePlaylist();
    populateAnimeLists();
}

function updatePlaylist() {
    chrome.storage.local.get({ watchlist: [] }, (result) => {
        let watchlist = result.watchlist;
        const unwatchedList = document.getElementById('unwatched-episode');
        const watchedList = document.getElementById('watched-episode');
        //const expiredList = document.getElementById('expired-episode');
        unwatchedList.innerHTML = ''; // 以前の内容をクリア
        watchedList.innerHTML = ''; // 以前の内容をクリア
        //expiredList.innerHTML = ''; // 以前の内容をクリア
        let currentDate = new Date();
        let data_episode_idx = 0;
        
        if (watchlist.length === 0 || watchlist === undefined) return;
        watchlist.forEach(anime => {
            if (Object.keys(anime.episodes).length === 0) return
            let episode_idx = 0;
            
            Object.keys(anime.episodes).forEach(episode => {
                //console.log(`!episode.watched: ${!episode.watched}, new Date(episode.freeUntil): ${new Date(episode.freeUntil)}, currentDate: ${currentDate}`);
                // 未視聴のエピソード
                if (!episode.watched) {
                    const animeCard = createEpisodeCard(anime, episode_idx, data_episode_idx);
                    unwatchedList.appendChild(animeCard);
                    data_episode_idx++;
                }

                // 視聴済みかつ無料公開中のエピソード
                if (episode.watched && new Date(episode.freeUntil) >= currentDate) {
                    const animeCard = createEpisodeCard(anime, episode_idx, data_episode_idx);
                    watchedList.appendChild(animeCard);
                    data_episode_idx++;
                }

                episode_idx++;
            });

        });
    });
}

function populateAnimeLists() {
    chrome.storage.local.get({ watchlist: [], droppedList: [] }, (result) => {
        let watchlist = result.watchlist;
        let droppedList = result.droppedList;
        const watchingAnimeListContainer = document.getElementById('watching-anime-list');
        const droppedAnimeListContainer = document.getElementById('dropped-anime-list');
        let watchingAnimeList = document.querySelectorAll('#watching-anime-list > div');
        let droppedAnimeList = document.querySelectorAll('#dropped-anime-list > div');
        var ClassNameList = {};

        if (watchingAnimeList.length !== 0) {
            watchingAnimeList.forEach(div => {
                // div内の2つの要素のクラス名を保持しておく
                const idx = div.getAttribute('data-anime-index');
                ClassNameList[String(idx)] = { animeCardClassName: div.querySelector('.anime-card').className, episodeListClassName: div.querySelector('.list-content.episode-list').className };
            });
        }
        if (droppedAnimeList.length !== 0) {
            droppedAnimeList.forEach(div => {
                // div内の2つの要素のクラス名を保持しておく
                const idx = div.getAttribute('data-anime-index');
                ClassNameList[String(idx)] = { animeCardClassName: div.querySelector('.anime-card').className, episodeListClassName: div.querySelector('.list-content.episode-list').className };
            });
        }
        // 以前の内容をクリア
        watchingAnimeListContainer.innerHTML = '';
        droppedAnimeListContainer.innerHTML = '';

        // 視聴中アニメリスト
        let idx = 0;
        watchlist.forEach(anime => {
            const animeCard = createAnimeCard(anime);
            watchingAnimeListContainer.appendChild(animeCard);
            idx++;
        });

        // 視聴切りアニメリスト
        droppedList.forEach(anime => {
            const animeCard = createAnimeCard(anime);
            droppedAnimeListContainer.appendChild(animeCard);
            idx++;
        });

        watchingAnimeList = document.querySelectorAll('#watching-anime-list > div');
        // 以前のクラス名を復元
        if (watchingAnimeList.length !== 0 && Object.keys(ClassNameList).length > 0) {
            watchingAnimeList.forEach((div) => {
                const idx = div.getAttribute('data-anime-index');
                const animeCard = div.querySelector('.anime-card');
                const episodeList = div.querySelector('.list-content.episode-list');

                animeCard.className = ClassNameList[idx].animeCardClassName;
                episodeList.className = ClassNameList[idx].episodeListClassName;
            });
        }

        droppedAnimeList = document.querySelectorAll('#dropped-anime-list > div');
        if (droppedAnimeList.length !== 0 && Object.keys(ClassNameList).length > 0) {
            droppedAnimeList.forEach((div) => {
                const idx = div.getAttribute('data-anime-index');
                const animeCard = div.querySelector('.anime-card');
                const episodeList = div.querySelector('.list-content.episode-list');
                animeCard.className = ClassNameList[idx].animeCardClassName;
                episodeList.className = ClassNameList[idx].episodeListClassName;
            });
        }

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

// アニメカードを作成する関数
function createAnimeCard(anime) {
    const div = document.createElement('div');
    const url = anime.officialPageUrl;
    div.setAttribute('data-anime-index', url);
    {
        const episodeList = document.createElement('div');
        episodeList.className = 'list-content episode-list';
        {
            let episode_idx = 0;
        
            Object.keys(anime.episodes).forEach((episode) => {
                const episodeCard = createEpisodeCard(anime, episode_idx, episode_idx + 1);
                episodeList.appendChild(episodeCard);
                episode_idx++;
            });
        }

        const animeCard = document.createElement('div');
        animeCard.className = 'anime-card';
        {
            const imgDiv = document.createElement('div');
            imgDiv.className = 'thumbnail';
            {
                const img = document.createElement('img');
                img.src = anime.imageUrl || ""; // デフォルト画像を設定
                img.alt = anime.title;

                imgDiv.appendChild(img);
            }

            const mainDiv = document.createElement('div');
            mainDiv.className = 'anime-info';
            {
                const title = document.createElement('h2');
                title.textContent = anime.title;

                const currentEpisode = document.createElement('span');
                currentEpisode.className = 'current-episode';
                currentEpisode.textContent = `現在の最新話: ${anime.currentEpisode}話`;
                const buttonsDiv = document.createElement('div');
                buttonsDiv.className = 'anime-buttons';
                {
                    const moveToWatchingButton = document.createElement('button');
                    moveToWatchingButton.textContent = '視聴中に移動';
                    moveToWatchingButton.className = 'anime-button moveToWatchingButton';
                    moveToWatchingButton.value = anime.title;
                    moveToWatchingButton.addEventListener('click', function () {
                        moveToWatching(moveToWatchingButton.value); // クリックされたボタンを引数として渡す
                    });
                    {
                        const moveToWatchingIcon = document.createElement('i');
                        moveToWatchingIcon.className = 'fas fa-arrow-circle-right';

                        moveToWatchingButton.appendChild(moveToWatchingIcon);
                    }
                    moveToWatchingButton.addEventListener('click', function () {
                        moveToWatching(moveToWatchingButton.value); // クリックされたボタンを引数として渡す
                    });

                    const moveToDroppedButton = document.createElement('button');
                    moveToDroppedButton.textContent = '視聴切りに移動';
                    moveToDroppedButton.className = 'anime-button moveToDroppedButton';
                    moveToDroppedButton.value = anime.title;
                    {
                        const moveToDroppedIcon = document.createElement('i');
                        moveToDroppedIcon.className = 'fas fa-arrow-circle-left';

                        moveToDroppedButton.appendChild(moveToDroppedIcon);
                    }
                    moveToDroppedButton.addEventListener('click', function () {
                        moveToDropped(moveToDroppedButton.value); // クリックされたボタンを引数として渡す
                    });
                    buttonsDiv.appendChild(moveToWatchingButton);
                    buttonsDiv.appendChild(moveToDroppedButton);
                }

                mainDiv.appendChild(title);
                mainDiv.appendChild(currentEpisode);
                mainDiv.appendChild(buttonsDiv);
            }

            const toggleButton = document.createElement('button');
            toggleButton.className = 'anime-episode-toggle-btn';

            const toggleIcon = document.createElement('i');
            toggleIcon.className = 'fas fa-chevron-down';
            toggleButton.appendChild(toggleIcon);

            toggleButton.addEventListener('click', function () {
                // anime-cardのborder-radiusを変更
                if (animeCard.classList.contains('anime-card-top-rounded')) {
                    animeCard.classList.remove('anime-card-top-rounded');
                } else {
                    animeCard.classList.add('anime-card-top-rounded');
                }
                // リストの表示/非表示を切り替える
                if (episodeList.classList.contains('open')) {
                    episodeList.classList.remove('open');
                    toggleButton.classList.remove('active');
                } else {
                    episodeList.classList.add('open');
                    toggleButton.classList.add('active');
                }
                // アイコンの向きを変更
                if (toggleIcon.classList.contains('fa-chevron-down')) {
                    toggleIcon.classList.remove('fa-chevron-down');
                    toggleIcon.classList.add('fa-chevron-up');
                } else {
                    toggleIcon.classList.remove('fa-chevron-up');
                    toggleIcon.classList.add('fa-chevron-down');
                }
            });


            animeCard.appendChild(imgDiv);
            animeCard.appendChild(mainDiv);
            animeCard.appendChild(toggleButton);
        }

        div.appendChild(animeCard);
        div.appendChild(episodeList);
    }

    return div;
}

// エピソードカードを作成する関数
function createEpisodeCard(anime, episode_idx, idx) {
    const div = document.createElement('div');
    div.setAttribute('data-episode-index', idx);
    const episode = anime.episodes[episode_idx];
    {
        const episodeCard = document.createElement('div');
        episodeCard.className = 'episode-card';
        if (episode.watched) {
            episodeCard.classList.add('watched');
        }
        {
            const imgDiv = document.createElement('div');
            imgDiv.className = 'thumbnail';
            {
                const img = document.createElement('img');
                img.src = episode.imageUrl || "https://example.com/default.jpg"; // デフォルト画像を設定
                img.alt = episode.title;

                imgDiv.appendChild(img);
            }

            const mainDiv = document.createElement('div');
            mainDiv.className = 'episode-info';
            {
                const title = document.createElement('h2');
                title.textContent = episode.title;

                const shortTitle = document.createElement('h2');
                shortTitle.textContent = episode.shortTitle;
                console.log(`episode.shortTitle: ${episode.shortTitle}`);
                shortTitle.className = 'short-title';

                const dateDiv = document.createElement('div');
                dateDiv.className = 'release-until-date';
                {
                    const releseDate = document.createElement('span');
                    releseDate.className = 'release-date';
                    // 公開日をyyyy/mm/dd/ hh:mm形式に変換
                    const date = new Date(episode.releaseDate);
                    const month = date.getMonth() + 1;
                    const day = date.getDate();
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    releseDate.textContent = `${date.getFullYear()}/${month}/${day} ${hours}:${minutes} 公開`;
                    // 現在の日付を取得
                    const currentDate = new Date();
                    const sevenDaysAfterRelease = date;
                    sevenDaysAfterRelease.setDate(date.getDate() + 7);
                    const timeDiff = sevenDaysAfterRelease - currentDate;
                    const remainingDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                    const freeUntil = document.createElement('span');
                    freeUntil.className = 'free-until';
                    // releaseDateから7日後までの残り日数を計算
                    
                    freeUntil.textContent = "あと" + remainingDays + "日"; // 無料公開期間を追加
                    // 残り日数が2日未満かつ未視聴の場合は赤色にする
                    if (remainingDays < 2 && !episode.watched) {
                        freeUntil.style.color = 'red';
                        episodeCard.classList.add('expired', 'unwatched');
                    }
                    // 期間が終了している場合
                    if (remainingDays < 0) {
                        freeUntil.textContent = "終了";
                    }

                    const status = document.createElement('span');
                    status.className = 'episode-status';
                    status.textContent = episode.watched ? '視聴済み' : '未視聴';
                    if (episode.watched) {
                        status.style.color = 'green';
                    } else {
                        status.style.color = 'red';
                    }

                    dateDiv.appendChild(releseDate);
                    dateDiv.appendChild(freeUntil);
                    dateDiv.appendChild(status);
                }

                const episodeNumber = document.createElement('span');
                episodeNumber.className = 'episode-number';
                episodeNumber.textContent = `第${episode.episodeNumber}話`;
                episodeNumber.style.display = 'none';

                const buttonsDiv = document.createElement('div');
                buttonsDiv.className = 'episode-buttons';
                {
                    const playButton = document.createElement('button');
                    //playButton.textContent = '再生';
                    playButton.className = 'episode-button playButton';
                    playButton.value = episode.url;
                    playButton.addEventListener('click', function () {
                        console.log('button.value:', playButton.value);
                        chrome.tabs.create({ url: playButton.value });
                    });
                    {
                        const playIcon = document.createElement('i');
                        playIcon.className = 'fas fa-play';

                        playButton.appendChild(playIcon);
                    }

                    const watchedButton = document.createElement('button');
                    //watchedButton.textContent = '視聴済み';
                    watchedButton.className = 'episode-button watchedButton';
                    watchedButton.value = episode.episodeNumber;
                    watchedButton.addEventListener('click', function () {
                        chrome.storage.local.get({ watchlist: [] }, (result) => {
                            let watchlist = result.watchlist;
                            let _anime = watchlist.find(a => a.title === anime.title);
                            if (_anime) {
                                let _episode = _anime.episodes.find(e => e.episodeNumber == watchedButton.value);
                                if (_episode) {
                                    _episode.watched = true;
                                    chrome.storage.local.set({ watchlist: watchlist }, updateAll);
                                }
                            }
                        });
                    });
                    {
                        const watchedIcon = document.createElement('i');
                        watchedIcon.className = 'fas fa-check';

                        watchedButton.appendChild(watchedIcon);
                    }

                    const unwatchedButton = document.createElement('button');
                    //unwatchedButton.textContent = '未視聴';
                    unwatchedButton.className = 'episode-button unwatchedButton';
                    unwatchedButton.value = episode.episodeNumber;
                    unwatchedButton.addEventListener('click', function () {
                        chrome.storage.local.get({ watchlist: [] }, (result) => {
                            let watchlist = result.watchlist;
                            let _anime = watchlist.find(a => a.title === anime.title);
                            if (_anime) {
                                let _episode = _anime.episodes.find(e => e.episodeNumber == unwatchedButton.value);
                                if (_episode) {
                                    _episode.watched = false;
                                    chrome.storage.local.set({ watchlist: watchlist }, updateAll);
                                }
                            }
                        });
                    });
                    {
                        const unwatchedIcon = document.createElement('i');
                        unwatchedIcon.className = 'fas fa-times';

                        unwatchedButton.appendChild(unwatchedIcon);
                    }

                    buttonsDiv.appendChild(playButton);
                    buttonsDiv.appendChild(watchedButton);
                    buttonsDiv.appendChild(unwatchedButton);
                }

                mainDiv.appendChild(title);
                mainDiv.appendChild(shortTitle);
                mainDiv.appendChild(dateDiv);
                mainDiv.appendChild(episodeNumber);
                mainDiv.appendChild(buttonsDiv);
            }

            episodeCard.appendChild(imgDiv);
            episodeCard.appendChild(mainDiv);
        }

        div.appendChild(episodeCard);
    }

    return div;
}

function moveToWatched(title) {
    chrome.storage.local.get({ watchlist: [] }, (result) => {
        let watchlist = result.watchlist;
        let anime = watchlist.find(a => a.title === title);
        if (anime) {
            let _episode = anime.episodes.find(e => e.episodeNumber == episodeNumber);
            if (_episode) {
                _episode.watched = true;
                console.log(`episode.watched: ${_episode.watched}`);
                chrome.storage.local.set({ watchlist: watchlist }, updateAll);
            }
        }
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
            anime.status = "dropped";
            droppedList.push(anime);
            chrome.storage.local.set({ watchlist: watchlist, droppedList: droppedList }, updateAll);
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
            anime.status = "watching";
            watchlist.push(anime);
            chrome.storage.local.set({ watchlist: watchlist, droppedList: droppedList }, updateAll);
        }
    });
}

function toggleList(listId) {
    const content = document.getElementById(listId);
    const button = content.previousElementSibling; // トグルボタンを取得

    // リストの表示/非表示を切り替える
    if (content.classList.contains('open')) {
        content.classList.remove('open');
        button.classList.remove('active');
    } else {
        content.classList.add('open');
        button.classList.add('active');
    }
}

// リストの表示/非表示切り替えボタンを設定
const toggleButtons = document.querySelectorAll('.toggle-btn');
toggleButtons.forEach(button => {
    button.addEventListener('click', function () {
        // ボタンのvalue属性を取得
        const listId = button.name;
        updatePlaylist();
        toggleList(listId);
    });
});

document.addEventListener('DOMContentLoaded', async function () {
    //jsonファイルを読み込む
    // await fetch('watchlist.json')
    //     .then(response => response.json())
    //     .then(data => {
    //         // ローカルストレージにデータを保存
    //         chrome.storage.local.set({ watchlist: data, droppedList: [] }, () => {
    //             updatePlaylist();
    //             populateAnimeLists();
    //         });
    //     });
    //ローカルストレージにデータがない時はアニメリストを初期化
    chrome.storage.local.get({ watchlist: [], droppedList: [] }, (result) => {
        const watchlist = result.watchlist;
        const droppedList = result.droppedList;
        if (watchlist.length === 0 && droppedList.length === 0) {//
            console.log("No data in local storage");
            chrome.tabs.create({ url: 'https://blog.nicovideo.jp/niconews/230372.html', active: false }).then(tab => {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content_anime_official_page.js']
                }).then((result) => {
                    chrome.tabs.remove(tab.id);
                    const animeList = result[0].result;
                    const animeUrlList = result[0].result.map(anime => anime.officialPageUrl);
                    
                    chrome.tabs.create({ url: 'https://www.nicovideo.jp/tag/2024%E7%A7%8B%E3%82%A2%E3%83%8B%E3%83%A1%E5%85%AC%E5%BC%8F?&sort=f&order=d&page=', active: false }).then(tab => {
                        chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            files: ['episode_scraper.js']
                        }).then((result) => {
                            console.log(result[0].result);
                            chrome.tabs.remove(tab.id);
                            const updatedAnimeList = result[0].result;
                            chrome.storage.local.set({ watchlist: updatedAnimeList }, updateAll);
                        });
                    });
                    
                    updateAll();
                });
            });
        }
        else {
            chrome.tabs.create({ url: 'https://www.nicovideo.jp/tag/2024%E7%A7%8B%E3%82%A2%E3%83%8B%E3%83%A1%E5%85%AC%E5%BC%8F?&sort=f&order=d&page=', active: false }).then(tab => {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['episode_scraper.js']
                }).then((result) => {
                    console.log(result[0].result);
                    chrome.tabs.remove(tab.id);
                    const updatedAnimeList = result[0].result;
                    chrome.storage.local.set({ watchlist: updatedAnimeList }, updateAll);
                });
            });
        }
    });
    updateAll();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "sendHTML") {
        const parser = new DOMParser();
        const doc = parser.parseFromString(message.html, 'text/html');
        const animeList = parseAnimeData(doc);
        const newWindow = window.open();
        newWindow.document.write(message.html);
    }
});

// 拡張機能がインストールされたときに実行される処理
chrome.runtime.onInstalled.addListener(() => {
    //jsonファイルを読み込む
    fetch('watchlist.json')
        .then(response => response.json())
        .then(data => {
            //ローカルストレージにデータを保存
            // chrome.storage.local.set({ watchlist: data, droppedList: [] }, () => {
            //     console.log("Watchlist saved");
            // });
        });
});
