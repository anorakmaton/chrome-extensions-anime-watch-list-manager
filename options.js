document.addEventListener('DOMContentLoaded', () => {
    const seasonSelect = document.getElementById('season-select');
    const episodeListUrlInput = document.getElementById('episodeListUrl');
    const shouldShowPaidVideo = document.getElementById('shouldShowPaidVideo');
    const saveBtn = document.getElementById('saveBtn');
  
    // 初期値を設定する（保存されている場合はその値を表示）
    chrome.storage.local.get(['seriesUrl', 'episodeListUrl', 'shouldShowPaidVideoValue', 'seasonData', 'season'], (result) => {
      if (result.seriesUrl) {
        seriesUrlInput.value = result.seriesUrl;
      }
      if (result.episodeListUrl) {
        episodeListUrlInput.value = result.episodeListUrl;
      }
      if (result.seasonData) {
        result.seasonData.forEach((season) => {
          const newOption = document.createElement('option'); 
          newOption.value = season.seasonName; 
          newOption.text = season.seasonName;
          seasonSelect.add(newOption);
        })
      }
    });
  
    // 保存ボタンがクリックされたときに入力値を保存
    saveBtn.addEventListener('click', () => {
      const season = seasonSelect.value;
      const episodeListUrl = episodeListUrlInput.value;
      const shouldShowPaidVideoValue = shouldShowPaidVideo.checked;
      
      chrome.storage.local.set({ season: season, episodeListUrl: episodeListUrl, shouldShowPaidVideoValue: shouldShowPaidVideoValue }, () => {
        console.log(season)
        alert('設定が保存されました');

      });
    });
  });
  