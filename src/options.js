document.addEventListener('DOMContentLoaded', () => {
  const seasonSelect = document.getElementById('season-select');
  const episodeListUrlInput = document.getElementById('episodeListUrl');
  const shouldShowPaidVideo = document.getElementById('shouldShowPaidVideo');
  const saveBtn = document.getElementById('saveBtn');
  const seasonSyncBtn = document.getElementById('seasonSyncBtn');

  // 初期値を設定する（保存されている場合はその値を表示）
  chrome.storage.local.get(['shouldShowPaidVideoValue', 'seasonData', 'season'], async (result) => {
    if (result.seasonData) {
      seasonDataArray = Object.values(result.seasonData);
      seasonDataArray.sort((a, b) => parseInt(a.seasonCode) - parseInt(b.seasonCode));
      seasonDataArray.forEach((season) => {
        console.log(season); // TODO: debug
        const newOption = document.createElement('option');
        newOption.value = season.seasonName;
        newOption.text = season.seasonName;
        seasonSelect.add(newOption);
      })
      const season = await getLocal('season');
      seasonSelect.value = season;
    }

    shouldShowPaidVideo.checked = result.shouldShowPaidVideoValue;
  
  });

  // シーズン更新ボタンがクリックされたときにbackground.jsにメッセージを送信
  seasonSyncBtn.addEventListener('click', async () => {
    chrome.runtime.sendMessage({ action: 'updateSeason' }, // メッセージ内容
      (response) => { // レスポンスを受け取るコールバック関数
        if (chrome.runtime.lastError) {
            console.error("Error:", chrome.runtime.lastError.message);
        } else {
            console.log("Received response:", response);
            updateElement();
        }
      }
    );

  });
  // 保存ボタンがクリックされたときに入力値を保存
  saveBtn.addEventListener('click', async () => {
    const season = seasonSelect.value;
    const shouldShowPaidVideoValue = shouldShowPaidVideo.checked;

    // 選択されたシーズンのデータが存在するか確認
    const selectedSeasonData = await getLocal(season);
    if (!selectedSeasonData) { // データが存在しなければ初期化する
      const seasonData = await getLocal('seasonData');
      const selectedSeasonData = seasonData[season];
      chrome.runtime.sendMessage({ 
        action: 'initAnimeTitle', 
        seasonData: selectedSeasonData,
        season: season
      });
    }
  
    chrome.storage.local.set({ season: season, shouldShowPaidVideoValue: shouldShowPaidVideoValue }, () => {
      console.log(season)
      alert('設定が保存されました');

    });
  });
});

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

async function updateElement() {
  const seasonSelect = document.getElementById('season-select');
  // 以前のデータを消去
  seasonSelect.innerHTML = '';
  chrome.storage.local.get(['shouldShowPaidVideoValue', 'seasonData'], async (result) => {
    if (result.seasonData) {
      Object.values(result.seasonData).forEach((season) => {
        const newOption = document.createElement('option');
        newOption.value = season.seasonName;
        newOption.text = season.seasonName;
        seasonSelect.add(newOption);
      })
      const season = await getLocal('season');
      seasonSelect.value = season;
    }
  });
}