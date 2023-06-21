// 参考案例：http://zxt_team.gitee.io/qq-music-player/


//自动解决300ms
FastClick.attach(document.body);
// 异步获取数据
(async function () {
  const baseBox = document.querySelector('.header .base'),
    playerButton = document.querySelector('.player-button'),
    wraperBox = document.querySelector('.wraper'),
    footerBox = document.querySelector('.footer-box'),
    timeCurrentBox = document.querySelector('.timeCurrent'),
    timeDurationBox = document.querySelector('.timeDuration'),
    alreadyBox = document.querySelector('.already'),
    markImagebox = document.querySelector('.mark-image'),
    loadingBox = document.querySelector('.loading-box'),
    audioBox = document.querySelector('#audiobox')
  let wraperList = [],
    timer = null,
    matchNum = 0//记录历史匹配的数量



  //音乐控制
  const format = function format(time) {
    let minutes = Math.floor(time / 60)
    seconds = Math.round(time - minutes * 60)
    minutes = minutes < 10 ? '0' + minutes : '' + minutes
    seconds = seconds < 10 ? '0' + seconds : '' + seconds
    return {
      minutes,
      seconds
    }
  }
  const playEnd = function () {
    clearInterval(timer)
    timer = null
    timeCurrentBox.innerHTML = `00:00`
    alreadyBox.style.width = '0%'
    wraperBox.style.transform = 'translateY(0)'
    wraperList.forEach(item => item.className = '')
    matchNum = 9
    playerButton.className = 'player-button'

  }
  const handle = function () {
    let PH = wraperList[0].offsetHeight

    let { currentTime, duration } = audioBox
    if (isNaN(currentTime) || isNaN(duration)) return
    //播放结束
    if (currentTime >= duration) {
      playEnd()
      return
    }
    //控制进度条
    let { minutes: currentTimeMinutes, seconds: currentTimeSeconds } = format(currentTime),
      { minutes: durationMinutes, seconds: durationSeconds } = format(duration),
      ratio = Math.round(currentTime / duration * 100)

    timeCurrentBox.innerHTML = `
    ${currentTimeMinutes}:${currentTimeSeconds}
    `
    timeDurationBox.innerHTML = `
    ${durationMinutes}:${durationSeconds}
    `
    alreadyBox.style.width = `${ratio}%`

    //控制歌词 查找和当前匹配的歌词中
    let matchs = wraperList.filter(item => {
      let minutes = item.getAttribute('minutes'),
        seconds = item.getAttribute('seconds')
      return minutes === currentTimeMinutes && seconds === currentTimeSeconds
    })
    if (matchs.length > 0) {

      //让匹配的有选中样式其余的没有选中样式
      wraperList.forEach(item => {
        item.className = ''
      })
      matchs.forEach(item => {
        item.className = 'active'
      })
      //控制移动
      matchNum += matchs.length
      if (matchNum > 3) {
        let offset = (matchNum - 3) * PH
        wraperBox.style.transform = `translateY(${-offset}px)`
      }
    }

  }
  playerButton.addEventListener('click', function () {
    if (audioBox.paused) {
      //当前是暂停的 让其播放
      audioBox.play()
      playerButton.classList.add("move")
      handle()
      if (!timer) timer = setInterval(handle, 1000)
      return

    }
    //当前是播放的
    audioBox.pause()
    playerButton.classList.remove("move")
    clearInterval(timer)
    timer = null

  })

  //歌词的处理
  const bindLyric = function bindLyric(lyric) {
    //处理歌词部分特殊符号
    lyric = lyric.replace(/&#(\d+);/g, (value, $1) => {
      let instead = value
      switch (+$1) {
        case 32:
          instead = " "
          break
        case 40:
          instead = "("
          break

        case 41:
          instead = ")"
          break
        case 45:
          instead = "-"
          break
        default:

      }
      return instead
    })
    //解析歌词
    let arr = []
    lyric.replace(
      /\[(\d+)&#58;(\d+)&#46;(?:\d+)\]([^&#?]+)(?:&#10;)?/g,
      (_, $1, $2, $3) => {
        arr.push({
          minutes: $1,
          seconds: $2,
          text: $3
        })
      }
    )
    //绑定歌词
    let str = ``
    arr.forEach(({ minutes, seconds, text }) => {
      str += `<p minutes="${minutes}" seconds="${seconds}">
       ${text}
  </p>`
    })
    wraperBox.innerHTML = str
    wraperList = Array.from(wraperBox.querySelectorAll('p'))

  }

  //实现数据的绑定
  const binding = function binding(data) {
    let { title, author, duration, pic, audio, lyric } = data
    //绑定头部的基本信息
    baseBox.innerHTML = `
     <div class="cover">
      <img src="${pic}" alt="">
       </div>
       <div class="info">
       <h2 class="title">${title}}</h2>
       <h3 class="autor">${author}}</h3>
       </div>
     `
    //杂七杂八的信息
    timeDurationBox.innerHTML = duration
    markImagebox.style.backgroundImage = `
     url(${pic})
     `
    audioBox.src = audio
    //绑定歌词信息
    bindLyric(lyric)

    //关闭loading
    loadingBox.style.display = 'none'
  }



  /*  向服务发送请求 从服务器获取相关数据 */
  try {
    let { code, data } = await API.queryLyric()
    if (+code === 0) {
      //请求成功 网络层和业务层都成功
      binding(data)
      return
    }
  } catch (_) { }
  alert('网络繁忙，请刷新页面')

})()
