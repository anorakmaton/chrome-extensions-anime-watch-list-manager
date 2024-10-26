document.addEventListener('DOMContentLoaded', () => {
    const seriesUrlInput = document.getElementById('seriesUrl');
    const episodeListUrlInput = document.getElementById('episodeListUrl');
    const shouldShowPaidVideo = document.getElementById('shouldShowPaidVideo');
    const saveBtn = document.getElementById('saveBtn');
  
    // 初期値を設定する（保存されている場合はその値を表示）
    chrome.storage.local.get(['seriesUrl', 'episodeListUrl', 'shouldShowPaidVideoValue'], (result) => {
      if (result.seriesUrl) {
        seriesUrlInput.value = result.seriesUrl;
      }
      if (result.episodeListUrl) {
        episodeListUrlInput.value = result.episodeListUrl;
      }
    });
  
    // 保存ボタンがクリックされたときに入力値を保存
    saveBtn.addEventListener('click', () => {
      const seriesUrl = seriesUrlInput.value;
      const episodeListUrl = episodeListUrlInput.value;
      const shouldShowPaidVideoValue = shouldShowPaidVideo.checked;
      
      chrome.storage.local.set({ seriesUrl: seriesUrl, episodeListUrl: episodeListUrl, shouldShowPaidVideoValue: shouldShowPaidVideoValue }, () => {
        alert('設定が保存されました');
      });
    });
  });
  