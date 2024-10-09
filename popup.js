document.getElementById('addAnime').addEventListener('click', () => {
    let animeTitle = prompt('Enter anime title:');
    if (animeTitle) {
        chrome.storage.local.get({ watchlist: [] }, (result) => {
            let watchlist = result.watchlist;
            watchlist.push(animeTitle);
            chrome.storage.local.set({ watchlist: watchlist }, () => {
                // リストに反映
                let listItem = document.createElement('li');
                listItem.textContent = animeTitle;
                document.getElementById('watchlist').appendChild(listItem);
            });
        });
    }
});

// ページを開いたときにリストを表示
chrome.storage.local.get({ watchlist: [] }, (result) => {
    let watchlist = result.watchlist;
    watchlist.forEach(anime => {
        let listItem = document.createElement('li');
        listItem.textContent = anime;
        document.getElementById('watchlist').appendChild(listItem);
    });
});
