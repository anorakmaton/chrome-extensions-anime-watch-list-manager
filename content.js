let videoElement = document.querySelector('video');
if (videoElement) {
    videoElement.addEventListener('ended', () => {
        // 次の動画を取得し、ページ遷移
        chrome.runtime.sendMessage({ action: "playNext" });
    });
}
