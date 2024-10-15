document.addEventListener('DOMContentLoaded', () => {
    const seriesUrlInput = document.getElementById('seriesUrl');
    const episodeListUrlInput = document.getElementById('episodeListUrl');
    const saveBtn = document.getElementById('saveBtn');
  
    // 初期値を設定する（保存されている場合はその値を表示）
    chrome.storage.sync.get(['seriesUrl', 'episodeListUrl'], (result) => {
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
  
      chrome.storage.sync.set({ seriesUrl, episodeListUrl }, () => {
        alert('設定が保存されました');
      });
    });
  });
  