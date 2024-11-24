//url = 'https://dic.nicovideo.jp/a/2024%E5%B9%B4%E7%A7%8B%E3%82%A2%E3%83%8B%E3%83%A1';
console.log('content loaded');
animeTemplate = {
    title: '',
    officialPageUrl: '',
    currentEpisode: 0,
    totalEpisodes: 0,
    imageUrl: '',
    status: 'watching',
    episodes: [],
    imageBase64: null,
    averageViewCount: 0,
}
function sendMessageAsync(message) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve(response);
            }
        });
    });
}

async function getAnimeData(season) {
    const h3list = document.querySelectorAll('h3')

    const animeContainerList = [];
    // 指定するh2のテキスト内容
    const targetH2Text = "作品一覧";
    // 対象のh2タグを探す
    const h2Elements = Array.from(document.querySelectorAll('h2'));
    const targetH2 = h2Elements.find(h2 => h2.textContent.trim() === targetH2Text);
    if (targetH2) {
        // 次の要素を取得
        let nextElement = targetH2.nextElementSibling;
        // 次のh2が見つかるまでループ
        while (nextElement && nextElement.tagName !== 'H2') {
            if (nextElement.tagName === 'UL') {
                animeContainerList.push(nextElement); // ulタグを収集
            }
            nextElement = nextElement.nextElementSibling; // 次の要素へ
        }
        // 結果を表示
        console.log(animeContainerList);
    } else {
        console.log("指定したh2タグが見つかりません");
    }
    
    const animeList = {};
    const promises = []; // 非同期処理を管理する Promise のリスト
    animeContainerList.forEach((ul) => { 
        Array.from(ul.querySelectorAll('li')).forEach((li) => {
            var animeTitle = Array.from(li.childNodes).map(node => node.textContent).join('')
            animeTitle = animeTitle.trim(); // 前後の空白と改行を削除
            animeTitle = animeTitle.replace(/\[\d+\]/g, ""); // [1]などの脚注を削除
            var channelUrl = '';
            var imageUrl = '';
            //console.log(mergedlist);
            nicoChImg = li.querySelector('img');
            if (nicoChImg) { 
                const chLinkArray = Array.from(li.querySelectorAll('a')).filter(link => 
                        link.hasAttribute('target') && link.hasAttribute('style')
                );
                if (chLinkArray.length > 0) { 
                    const chLink = chLinkArray[0]; // 最初の要素を取得 
                    channelUrl = chLink.getAttribute('href'); 
                    const promise = sendMessageAsync({ action: "getAnimeThumData", url: channelUrl }).then((response) => {
                        imageUrl = response.imageSrc;
                        imageBase64 = response.imageBase64;
                        animeTitle = response.animeTitle;
                        const animeData = { 
                            ...animeTemplate, 
                            title: animeTitle, 
                            officialPageUrl: channelUrl, 
                            imageUrl: imageUrl,
                            imageBase64: imageBase64,
                        };
                        animeList[animeTitle] = animeData;
                    });
                    
                    promises.push(promise); // Promise をリストに追加
                } 
            } else { 
                const animeData = { 
                    ...animeTemplate, 
                    title: animeTitle, 
                };
                animeList[animeTitle] = animeData;
                console.log('chLink要素が見つかりませんでした');
            }
        })
    });
    // すべての非同期処理が終わるのを待つ
    await Promise.all(promises);
    console.log(animeList);
    return animeList;
}

async function initAnimeData(season) {
    // result = await chrome.storage.local.get('seasonData')
    // seasonData = result.seasonData;
    // const currentAnimeSeasonData = seasonData[season];

    h3list = document.querySelectorAll('h3')

    const animeContainerList = [];
    h3list.forEach((h3) => { animeContainerList.push(h3.nextElementSibling)});

    const animeList = {};
    const promises = [];
    animeContainerList.forEach((ul) => { 
        Array.from(ul.querySelectorAll('li')).forEach((li) => {
            var animetitle = Array.from(li.childNodes).map(node => node.textContent).join('')
            animetitle = animetitle.trim(); // 前後の空白と改行を削除
            animetitle = animetitle.replace(/\[\d+\]/g, ""); // [1]などの脚注を削除
            var channelUrl = '';
            var imageUrl = '';
            //console.log(mergedlist);
            nicoChImg = li.querySelector('img');
            if (nicoChImg) {  // ニコニコにチャンネルが存在する時
                const chLinkArray = Array.from(li.querySelectorAll('a')).filter(link => 
                        link.hasAttribute('target') && link.hasAttribute('style')
                );
                if (chLinkArray.length > 0) { 
                    const chLink = chLinkArray[0]; // 最初の要素を取得 
                    channelUrl = chLink.getAttribute('href'); 
                    // チャンネルページからアニメタイトルを取得する
                    const promise = sendMessageAsync({ action: 'getAnimeTitle', url: channelUrl}).then((response) => {
                        animeTitle = response.animeTitle;
                        const animeData = { ...animeTemplate, title: animetitle, officialPageUrl: channelUrl, imageUrl: imageUrl };
                        console.log(animeData);
                        animeList[animetitle] = animeData;
                    });
                    //console.log('href attribute:', hrefValue);
                    promises.push(promise);
                } else { 
                    console.log('chLink要素が見つかりませんでした');
                }
            }
        })
    });
    // すべての非同期処理が終わるのを待つ
    await Promise.all(promises);
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
function isSimilar(str1, str2, threshold = 0.7) {
    const rate = similarityRate(str1, str2);
    return rate >= threshold;
}
console.log('content script loaded');
getAnimeData();
// document.addEventListener('DOMContentLoaded', () => {
//     console.log('DOMContentLoaded')
    
//     return getAnimeData();
// });
// console.log('content script loaded');

// main();

//console.log(similarityRate('オーイ！とんぼ', 'オーイ！とんぼ（第2期）')) // ！とんぼ ！とんぼ（第2期）