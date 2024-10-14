console.log('Content script loaded!');
const parser = new DOMParser();

animeTemplate = {
    title: '',
    officialPageUrl: '',
    currentEpisode: 0,
    totalEpisodes: 0,
    imageUrl: '',
    status: 'watching',
    episodes: []
}

const baseAnimeOfficialListUrl = 'https://ch.nicovideo.jp/search/2024%E5%B9%B410%E6%9C%88%E6%9C%9F?type=channel&mode=s&sort=c&order=d&page='

// アニメのデータをchrome.storage.localに保存
async function initAnimeData() {
    const animeList = await getAnimeTitleList();
    const animeDataList = [];
    for (const anime of animeList) { 
        const animeData = { ...animeTemplate, title: anime.title, officialPageUrl: anime.url, imageUrl: anime.imageUrl };  
        animeDataList.push(animeData);
    }
 
    await chrome.storage.local.set({ watchlist: animeDataList, droppedlist: [] });
    return animeDataList;
}

async function getAnimeTitleList() {
    // ページのリストを取得
    const animeOfficialListDocument = await createPageDocument(baseAnimeOfficialListUrl);
    const pageList = [];
    const pager = animeOfficialListDocument.querySelector('li.pages');
    const options = pager.querySelectorAll('option');
    options.forEach(option => {
        pageList.push([baseAnimeOfficialListUrl + option.value]);
    });
    // すべてのページからアニメのタイトルを取得
    const animeList = [];
    for (const page of pageList) {
        const animeOfficialListDocument = await createPageDocument(page);
        const animeOfficialElements = animeOfficialListDocument.querySelectorAll("ul.items li.item")
        animeOfficialElements.forEach(animeOfficialElement => {
            const title = animeOfficialElement.querySelector('span > div.channel_info > a').title;
            const url = animeOfficialElement.querySelector('span > div.channel_info > a').href;
            const imageUrl = animeOfficialElement.querySelector('span > a > img').src;
            animeList.push({ title, url, imageUrl });
        });
    }

    return animeList;
}

async function createPageDocument(_url) {
    try {
        const response = await fetch(_url);
        const text = await response.text();
        const doc = parser.parseFromString(text, 'text/html');
        return doc;
    } catch (error) {
        console.error('Error fetching anime data:', error);
    }
}

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     if (message.action === "initAnimeData") {
//         initAnimeData();
//     }
// });

initAnimeData();