(() => {
  const player = document.querySelector('.handbook-music');
  const audio = player.querySelector('audio');
  const button = player.querySelector('.handbook-music-toggle');
  const volume = player.querySelector('input');
  const volumeValue = player.querySelector('output');
  const status = player.querySelector('.handbook-music-status');
  let request = 0;

  function syncPlayback() {
    const active = !audio.paused && !audio.ended && !audio.error;
    player.classList.toggle('is-playing', active);
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', active ? '暂停背景音乐' : '播放背景音乐');
  }

  function showError() {
    audio.pause();
    syncPlayback();
    status.textContent = '音乐暂时无法播放，请再次点击重试。';
    player.classList.add('has-error');
  }

  button.addEventListener('click', async () => {
    const currentRequest = ++request;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    status.textContent = '';
    player.classList.remove('has-error');
    try {
      if (audio.error) audio.load();
      await audio.play();
    } catch (error) {
      // 快速再次点击会取消尚未完成的播放请求。
      if (currentRequest === request && error.name !== 'AbortError') showError();
    }
  });

  for (const event of ['play', 'playing', 'pause', 'ended']) {
    audio.addEventListener(event, syncPlayback);
  }
  audio.addEventListener('error', showError);

  function updateVolume() {
    audio.volume = Number(volume.value) / 100;
    volumeValue.value = `${volume.value}%`;
    volume.setAttribute('aria-valuetext', volumeValue.value);
  }

  volume.addEventListener('input', updateVolume);
  updateVolume();
  player.hidden = false;
})();
