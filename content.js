// let videoElement = document.querySelector('video');
// if (videoElement) {
//     videoElement.addEventListener('ended', () => {
//         // 次の動画を取得し、ページ遷移
//         chrome.runtime.sendMessage({ action: "playNext" });
//     });
// }

const animeTemplate = {
    title: '',
    animeIdx: 0,
    currentEpisode: 0,
    imageUrl: '',
    episodeUrl: '',
    status: 'watching',
    episodes: []
}

console.log('Content script loaded!');

function scrapeAnimeDataProcess() {
    // ページのリストを取得
    const pageList = [];
    const pager = document.querySelector("body > div.BaseLayout > div.BaseLayout-container > div.BaseLayout-contents > div.container.columns.column700-300 > div > div.column.main > div:nth-child(2) > div.toolbar > div.pager")
    const pages = pager.querySelectorAll('a');
    pages.forEach(page => {
        if (!isNaN(page.textContent)) {
            isActive = page.classList.contains('active');
            pageList.push([page.textContent, page.href, isActive]);
        }
    });

    const anmeList = parseAnimeData();
    // animeListを
    //const watchlist = [];
    chrome.storage.local.get({ watchlist: [] }, (result) => {
        watchlist = result.watchlist;
        
        //const newWatchlist = watchlist.concat(animeList);
        //chrome.storage.local.set({ watchlist: newWatchlist });
    });
}

// HTMLを解析して必要なデータを抽出する関数
function parseAnimeData() {
    const animeList = [];
    // アニメのリストを取得
    const animeCards = document.querySelectorAll('.videoListInner:not(.videoListSkeleton) li.item');
    // 有料会員限定のアニメを除外
    const freeAnimeCards = Array.from(animeCards).filter(card => {
        return !card.querySelector('.iconPayment');
    });
    console.log(freeAnimeCards);
    freeAnimeCards.forEach(card => {
        const uploadDate = card.querySelector('.videoList01Wrap .itemTime .video_uploaded .time').textContent.trim();
        const imageUrl = card.querySelector('.videoList01Wrap .uadWrap .itemThumbBox .itemThumb .itemThumbWrap .thumb').src; 
        const episodetitle = card.querySelector('.itemContent .itemTitle a').textContent.trim();
        const title = episodetitle.split(' ')[0];
        console.log(title);
        // const episodeUrl = card.querySelector('.itemContent .itemTitle a').href;
        // console.log(uploadDate, imageUrl, title, episodeUrl);
        
        //animeList.push({ title, currentEpisode, imageUrl });
    });

    return animeList;
}

//scrapeAnimeDataProcess();
