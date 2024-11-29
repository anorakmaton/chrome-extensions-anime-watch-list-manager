var season = '';
var currentSeasonData;

async function updateAll() {
    showPlayList();
    populateAnimeLists();
    await updateRanking();
    showRanking();
}

function updateShow() {
    showPlayList();
    populateAnimeLists();
}

async function showPlayList() {
    const season = await getLocal('season');
    // TODO:変更したデータ形式に対応させる
    chrome.storage.local.get([season, 'shouldShowPaidVideoValue'], (result) => {
        const currentAnimeSeasonData = result[season];
        const currentAnimeSeasonArray = Object.values(currentAnimeSeasonData);
        const shouldShowPaidVideoValue = result.shouldShowPaidVideoValue;
        const unwatchedList = document.getElementById('unwatched-episode');
        const watchedList = document.getElementById('watched-episode');
        var playList = [];
        unwatchedList.innerHTML = ''; // 以前の内容をクリア
        watchedList.innerHTML = ''; // 以前の内容をクリア
        let currentDate = new Date();
        let data_episode_idx = 0;
        if (currentAnimeSeasonArray.length > 0) {
            // アニメタイトルの配列からすべてのエピソードをプレイリストに追加
            currentAnimeSeasonArray.forEach((anime) => {
                if (anime.status === 'dropped') {
                    return;
                }
                else {
                    anime.episodes.forEach((episode) => {
                        playList.push(episode);
                    });
                }
            });

            // 投稿日が古い順に並び替え
            playList.sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
            playList.forEach(episode => {
                // 有料配信の場合は表示しない
                //console.log(`episode.title: ${episode.title}, episode.isPaid: ${episode.isPaid}`); HACK: showPlayList: episodeを表示
                if (shouldShowPaidVideoValue === false && episode.isPaid) {
                    return;
                }
                // 未視聴のエピソード
                if (!episode.watched) {
                    const animeCard = createEpisodeCard(episode, data_episode_idx, season, true);
                    unwatchedList.appendChild(animeCard);
                    data_episode_idx++;
                }
                // 視聴済みかつ無料公開中のエピソード
                else if (episode.watched && new Date(episode.freeUntil) >= currentDate) {
                    const animeCard = createEpisodeCard(episode, data_episode_idx, season, true);
                    watchedList.appendChild(animeCard);
                    data_episode_idx++;
                }
                else {
                    //console.log(`episode.title: ${episode.title}, episode.freeUntil: ${episode.freeUntil}`); HACK: episodeを表示
                }
            });
        }
    });
}

// 視聴中アニメリストと視聴切りアニメリストを更新する関数
async function populateAnimeLists() {
    result = await chrome.storage.local.get('season');
    const season = result.season;
    // TODO:変更したデータ形式に対応させる
    chrome.storage.local.get(season, (result) => {
        let currentAnimeSeasonData = result[season];
        let currentAnimeSeasonArray = Object.values(currentAnimeSeasonData);
        const watchlist = [];
        const droppedList = [];
        // currentAnimeSeasonArrayからwatchlist,droppedListを作成する
        currentAnimeSeasonArray.forEach((anime) => {
            if (anime.status == 'watching') {
                watchlist.push(anime);
            } else {
                droppedList.push(anime);
            }
        });

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
            const animeCard = createAnimeCard(anime, season);
            watchingAnimeListContainer.appendChild(animeCard);
            idx++;
        });

        // 視聴切りアニメリスト
        droppedList.forEach(anime => {
            const animeCard = createAnimeCard(anime, season);
            droppedAnimeListContainer.appendChild(animeCard);
            idx++;
        });

        //watchingAnimeList = document.querySelectorAll('#watching-anime-list > div');
        // 以前のクラス名を復元
        // if (watchingAnimeList.length !== 0 && Object.keys(ClassNameList).length > 0) {
        //     watchingAnimeList.forEach((div) => {
        //         const idx = div.getAttribute('data-anime-index');
        //         const animeCard = div.querySelector('.anime-card');
        //         const episodeList = div.querySelector('.list-content.episode-list');

        //         animeCard.className = ClassNameList[idx].animeCardClassName;
        //         episodeList.className = ClassNameList[idx].episodeListClassName;
        //     });
        // }

        // droppedAnimeList = document.querySelectorAll('#dropped-anime-list > div');
        // if (droppedAnimeList.length !== 0 && Object.keys(ClassNameList).length > 0) {
        //     droppedAnimeList.forEach((div) => {
        //         const idx = div.getAttribute('data-anime-index');
        //         const animeCard = div.querySelector('.anime-card');
        //         const episodeList = div.querySelector('.list-content.episode-list');
        //         animeCard.className = ClassNameList[idx].animeCardClassName;
        //         episodeList.className = ClassNameList[idx].episodeListClassName;
        //     });
        // }

        // const moveToDroppedButtons = document.querySelectorAll('.moveToDroppedButton');
        // const moveToWatchingButtons = document.querySelectorAll('.moveToWatchingButton');
        // moveToDroppedButtons.forEach(button => {
        //     button.addEventListener('click', function () {
        //         console.log('button.value:', button.value);
        //         moveToDropped(button.value); // クリックされたボタンを引数として渡す
        //     });
        // });
        // moveToWatchingButtons.forEach(button => {
        //     button.addEventListener('click', function () {
        //         console.log('button.value:', button.value);
        //         moveToWatching(button.value); // クリックされたボタンを引数として渡す
        //     });
        // });

    });
}

// アニメのランキングを表示する関数
async function showRanking() {
    const season = await getLocal('season');
    chrome.storage.local.get(season, (result) => {
        const currentAnimeSeasonData = result[season];
        const currentAnimeSeasonArray = Object.values(currentAnimeSeasonData);
        // 平均視聴回数でソート
        currentAnimeSeasonArray.sort((a, b) => b.averageViewCount - a.averageViewCount);
        const rankingAnimeListContainer = document.getElementById('anime-ranking');
        rankingAnimeListContainer.innerHTML = ''; // 以前の内容をクリア
        let idx = 0;
        currentAnimeSeasonArray.forEach(anime => {
            const animeCard = createAnimeCard(anime, season);
            rankingAnimeListContainer.appendChild(animeCard);
            idx++;
        });
    });
}

// アニメのランキングを更新する関数
async function updateRanking() {
    const season = await getLocal('season');
    await chrome.storage.local.get(season, async (result) => {
        const currentAnimeSeasonData = result[season];
        const currentAnimeSeasonArray = Object.values(currentAnimeSeasonData);
        let idx = 0;
        currentAnimeSeasonArray.forEach(anime => {
            let viewCountSum = 0;
            let episodeCount = 0;
            let viewCountAverage = 0;
            anime.episodes.forEach(episode => {
                // エピソードが公開されてから1週間以上かつ再生回数が1以上のエピソードの再生回数を合計
                if (new Date(episode.releaseDate) < new Date() - 7 * 24 * 60 * 60 * 1000 && episode.viewCount > 0) {
                    viewCountSum += episode.viewCount;
                    episodeCount++;
                }
            });
            if (episodeCount > 0) {
                viewCountAverage = viewCountSum / episodeCount;
                anime.averageViewCount = viewCountAverage;
            }
        });
        await chrome.storage.local.set({ [season]: currentAnimeSeasonData });
    });
}




// アニメカードを作成する関数
function createAnimeCard(anime, season) {
    const div = document.createElement('div');
    const url = anime.officialPageUrl;
    div.setAttribute('data-anime-index', url);
    {
        const episodeList = document.createElement('div');
        episodeList.className = 'list-content episode-list';
        {
            let episode_idx = 0;
            // エピソードをURLの番号から投稿日順にソート
            anime.episodes.sort((a, b) => {
                const getNumber = (url) => {
                    const match = url.match(/so(\d+)/);
                    return match ? parseInt(match[1], 10) : 0; // 数字を取得し、整数に変換
                };
        
                return getNumber(a.url) - getNumber(b.url); // 数字で比較
            });
            anime.episodes.forEach((episode) => {
                const episodeCard = createEpisodeCard(episode, episode_idx, season, false);
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
                if (anime.imageBase64) {
                    const img = document.createElement('img');
                    img.src = anime.imageBase64; // 画像を設定
                    img.alt = anime.title;
                
                    imgDiv.appendChild(img);
                } else {
                    // 画像がない場合、タイトルを代わりに表示
                    const titleDiv = document.createElement('div');
                    titleDiv.textContent = anime.title;
                    titleDiv.style.display = 'flex';
                    titleDiv.style.alignItems = 'center';
                    titleDiv.style.justifyContent = 'center';
                    titleDiv.style.borderRadius = '5px'; // スタイルを画像と揃える
                    titleDiv.style.marginRight = '10px';
                    titleDiv.style.width = '160px';
                    titleDiv.style.height = '90px';
                    titleDiv.style.backgroundColor = '#f0f0f0'; // 背景色を設定
                    titleDiv.style.color = '#333'; // 文字色を設定
                    titleDiv.style.fontSize = '14px';
                    titleDiv.style.textAlign = 'center';
                
                    imgDiv.appendChild(titleDiv);
                }
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
function createEpisodeCard(episode, idx, season, isPlayList) {
    const div = document.createElement('div');
    div.setAttribute('data-episode-index', idx);
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
                img.src = episode.imageUrl; // デフォルト画像を設定
                img.alt = episode.title;

                const overlayIcon = document.createElement('div');
                overlayIcon.className = 'overlay-icon';

                // 有料配信の場合は有料であることを表示
                if (episode.isPaid) {
                    const paid = document.createElement('span');
                    paid.className = 'iconPayment';
                    paid.textContent = '有料';
                    imgDiv.appendChild(paid);
                }
                imgDiv.appendChild(img);
                imgDiv.appendChild(overlayIcon);
            }

            const mainDiv = document.createElement('div');
            mainDiv.className = 'episode-info';
            {
                // 有料配信の場合は有料であることを表示
                if (episode.isPaid) {
                    const paid = document.createElement('span');
                    paid.className = 'iconPayment';
                    paid.textContent = '有料';
                    mainDiv.appendChild(paid);
                }

                const title = document.createElement('h2');
                title.textContent = episode.title;

                const shortTitle = document.createElement('h2');
                shortTitle.textContent = episode.shortTitle;
                shortTitle.className = 'short-title';

                const dateDiv = document.createElement('div');
                dateDiv.className = 'release-until-date';
                {
                    const releseDate = document.createElement('span');
                    releseDate.className = 'release-date';
                    // 公開日をyyyy/mm/dd/ hh:mm形式に変換
                    const date = new Date(episode.releaseDate);
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
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
                    if (timeDiff < 0) {
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
                    //dateDiv.appendChild(status);
        
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
                    playButton.title = '再生';
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
                    watchedButton.value = episode.title;
                    watchedButton.title = '視聴済みにする';
                    watchedButton.addEventListener('click', async function () {
                        const season = await getLocal('season');
                        chrome.storage.local.get(season, (result) => {
                            let currentSeasonData = result[season];
                            currentSeasonData[episode.animeTitle].episodes.find(e => e.title === unwatchedButton.value).watched = true;
                            chrome.storage.local.set({ [season]: currentSeasonData }, showPlayList);
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
                    unwatchedButton.value = episode.title;
                    unwatchedButton.title = '未視聴にする';
                    unwatchedButton.addEventListener('click', async function () {
                        const season = await getLocal('season');
                        chrome.storage.local.get(season, (result) => {
                            let currentSeasonData = result[season];
                            currentSeasonData[episode.animeTitle].episodes.find(e => e.title === unwatchedButton.value).watched = false;
                            chrome.storage.local.set({ [season]: currentSeasonData }, showPlayList);
                        });
                    });
                    {
                        const unwatchedIcon = document.createElement('i');
                        unwatchedIcon.className = 'fas fa-times';

                        unwatchedButton.appendChild(unwatchedIcon);
                    }

                    const primeVideoButton = document.createElement('button');
                    primeVideoButton.className = 'episode-button primeVideoButton';
                    primeVideoButton.title = 'Prime Videoで視聴';
                    primeVideoButton.addEventListener('click', function () {
                        const primeVideoUrl = 'https://www.amazon.co.jp/s?k=' + episode.animeTitle + '&i=instant-video';
                        chrome.tabs.create({ url: primeVideoUrl });
                    });
                    {
                        const primeVideoIcon = document.createElement('img');
                        primeVideoIcon.className = 'primeVideoIcon';
                        primeVideoIcon.src = '../images/prime-icon-custom.png';

                        primeVideoButton.appendChild(primeVideoIcon);
                    }

                    const moveToDroppedButton = document.createElement('button');
                    //moveToDroppedButton.textContent = '視聴切り';
                    moveToDroppedButton.className = 'episode-button moveToDroppedButton';
                    moveToDroppedButton.value = episode.animeTitle;
                    moveToDroppedButton.title = '視聴切りにする';
                    moveToDroppedButton.addEventListener('click', async function () {
                        const seasonData = await getLocal(season);
                        seasonData[episode.animeTitle].status = 'dropped';
                        console.log(`seasonData[episode.animeTitle].status: ${seasonData[episode.animeTitle].status}`);
                        chrome.storage.local.set({ [season]: seasonData }, updateShow());
                    });
                    {
                        const moveToDroppedIcon = document.createElement('img');
                        moveToDroppedIcon.className = 'episode-button moveToDroppedIcon';
                        moveToDroppedIcon.src = '../images/download-icon.png';

                        moveToDroppedButton.appendChild(moveToDroppedIcon);
                    }

                    buttonsDiv.appendChild(playButton);
                    buttonsDiv.appendChild(watchedButton);
                    buttonsDiv.appendChild(unwatchedButton);
                    buttonsDiv.appendChild(primeVideoButton);
                    if (isPlayList) { // プレイリストの場合のみ視聴切りボタンを表示
                        buttonsDiv.appendChild(moveToDroppedButton);
                    }
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
    // TODO:変更したデータ形式に対応させる
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
    // TODO:変更したデータ形式に対応させる
    chrome.runtime.sendMessage({ action: 'moveToDropped', title: title });
}

function moveToWatching(title) {
    // TODO:変更したデータ形式に対応させる
    chrome.runtime.sendMessage({ action: 'moveToWatching', title: title });
    
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
        //updateAll();
        toggleList(listId);
    });
});

document.addEventListener('DOMContentLoaded', async function () {
    // 拡張機能の最新バージョンを確認
    checkForUpdates();
    
    // 表示するシーズンを取得する
    result = await chrome.storage.local.get('season');
    const season = result['season'];

    // 拡張機能の設定画面を開く
    const settingButton = document.getElementById('setting-button');
    settingButton.addEventListener('click', function () {
        chrome.runtime.openOptionsPage();
    });

    // 手動更新ボタン
    const syncButton = document.getElementById('sync-button');
    syncButton.addEventListener('click', function () {
        console.log('sync button')
        chrome.runtime.sendMessage({ action: 'updateAnimeTitle', season: season });
    })
    const autoPlaySwitch = document.getElementById("autoPlaySwitch");

    // スイッチの状態を取得してチェック状態に反映
    chrome.storage.sync.get("autoPlayEnabled", (data) => {
        autoPlaySwitch.checked = data.autoPlayEnabled || false;
    });

    // 最終更新日を表示
    const latestUpdateDate = document.getElementById('latest-update-date');
    chrome.storage.local.get("seasonData", (result) => {
        let seasonData = result.seasonData;
        let currentSeasonData = seasonData[season];
        if (currentSeasonData.lastUpdateDate !== undefined || currentSeasonData.lastUpdateDate !== undefined) {
            latestUpdateDate.textContent = '最終更新日：' + currentSeasonData.lastUpdateDate;
        }
    });

    // スイッチの変更時に状態を保存
    autoPlaySwitch.addEventListener("change", () => {
        chrome.storage.sync.set({ autoPlayEnabled: autoPlaySwitch.checked });
        console.log(autoPlaySwitch.checked);
    });

    var needsUpdate = false;
    await chrome.storage.local.get("seasonData", (result) => { // TODO:変更したデータ形式に対応させる
        let seasonData = result.seasonData;
        let currentSeasonData = seasonData[season];

        if (currentSeasonData.lastUpdateDate === undefined || currentSeasonData.lastUpdateDate === undefined) {
            currentSeasonData.lastUpdateDate = new Date().toLocaleString();
            chrome.storage.local.set({ seasonData: seasonData });
        }
        else {
            const currentDate = new Date();
            const updateDate = new Date(currentSeasonData.lastUpdateDate);
            const diff = currentDate - updateDate;
            console.log(`diff: ${diff}`);
            if (diff < 1000 * 60 * 60 * 24) { // 1日以上経過していない場合は更新しない
            //if (diff < 1000) {
                needsUpdate = false;
            } else {
                needsUpdate = true;
                currentSeasonData.lastUpdateDate = new Date().toLocaleString();
                chrome.storage.local.set({ seasonData: seasonData });
            }
        }
    });

    const unwatchedList = document.getElementById('unwatched-episode');
    new Sortable(unwatchedList, {
        animation: 150,
        onEnd: function (evt) {
            console.log(evt.oldIndex, evt.newIndex);
            chrome.storage.local.get({ watchlist: [] }, (result) => { // TODO:変更したデータ形式に対応させる
                let watchlist = result.watchlist;
                let playList = watchlist.filter(anime => anime.status === 'watching').map(anime => anime.episodes).flat();
                const item = playList[evt.oldIndex];
                playList.splice(evt.oldIndex, 1);
                playList.splice(evt.newIndex, 0, item);
                chrome.storage.local.set({ playList: playList });
            });
        }
    });
    
    chrome.storage.local.get(season, (result) => { // TODO:変更したデータ形式に対応させる
        const currentSeasonData = result[season];
        const currentSeasonArray = Object.values(currentSeasonData);
        //ローカルストレージにデータがない時はアニメリストを初期化
        if (currentSeasonArray.length === 0 && currentSeasonArray.length === 0) {
            console.log("No data in local storage");
            chrome.runtime.sendMessage({ action: 'initAnimeTitle', season: season});
        }
        else {
            console.log(`needsUpdate: ${needsUpdate}`);
            //needsUpdate = true; // テスト用
            if (needsUpdate) {
                console.log("Needs update");
                chrome.runtime.sendMessage({ action: 'updateAnimeData' , season: season}); // TODO:変更したデータ形式に対応させる
            }
        }
    });
    //showPlayList(season);
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


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updatePlayList") {
        updatePlaylist();
    }
});
// storageのデータが更新されたとき
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
        // 差分を取得
        showPlayList();
        populateAnimeLists();
        console.log("storage changed");
    }
});


//https://www.amazon.co.jp/s?k=%E3%83%80%E3%83%B3%E3%83%80%E3%83%80%E3%83%B3&i=instant-video
//https://www.amazon.co.jp/gp/video/detail/0RA4Z9670CMEWDNUIVG372RS1Y/ref=atv_dp_btf_el_prime_sd_tv_resume_t1BDAAAAAA0wr0?autoplay=1&t=60
//https://www.amazon.co.jp/gp/video/detail/0TUBBQQPYCOGYV2PP4I24Q7A28/ref=atv_dp_btf_el_prime_sd_tv_play_t1BDAAAAAA0wr0?autoplay=1&t=0

// chrome.storage.localから画像を取得して表示する
function loadImageFromStorage(season, key, imgElementId) {
    chrome.storage.local.get([season], (result) => {
        if (chrome.runtime.lastError) {
            console.error("Error loading image:", chrome.runtime.lastError.message);
        } else if (result[season]) {
            const imgElement = document.getElementById(imgElementId);
            imgElement.src = result[season][key].imageBase64; // Base64 データを画像に設定
        } else {
            console.log("No image found in storage.");
        }
    });
}

async function checkForUpdates() {
    try {
        const response = await fetch(GITHUB_API_URL);
        if (!response.ok) {
            console.error("Failed to fetch release information");
            return;
        }

        const releaseData = await response.json();
        const latestVersion = releaseData.tag_name.replace(/^v/, ""); // "v1.0.0" → "1.0.0"
        console.log(`Current Version: ${CURRENT_VERSION}`);
        console.log(`Latest Version: ${latestVersion}`);

        if (isNewerVersion(latestVersion, CURRENT_VERSION)) {
            console.log("New version available");
            if (confirm("新しいバージョンが公開されています。ダウンロードページを開きますか？")) {
                window.open(RELEASE_PAGE_URL, "_blank");
            }
        } else {
            console.log("You are using the latest version");
        }
    } catch (error) {
        console.error("Error checking for updates:", error);
    }
}

function isNewerVersion(latest, current) {
    const latestParts = latest.split(".").map(Number);
    const currentParts = current.split(".").map(Number);

    for (let i = 0; i < latestParts.length; i++) {
        if (latestParts[i] > (currentParts[i] || 0)) {
            return true;
        } else if (latestParts[i] < (currentParts[i] || 0)) {
            return false;
        }
    }
    return false;
}

const GITHUB_API_URL = "https://api.github.com/repos/anorakmaton/chrome-extensions-anime-watch-list-manager/releases/latest";
const CURRENT_VERSION = chrome.runtime.getManifest().version; // 現在のバージョン
const RELEASE_PAGE_URL = "https://github.com/anorakmaton/chrome-extensions-anime-watch-list-manager/releases/latest";


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