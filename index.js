const $ = (e) => document.getElementById(e)

WIDTH = 128
HEIGHT = 64

LEDS = 6*3

let frames = []
let curFrame = null;

let selectedLED = -1

// LCD elements initialisation
const screen = $('screen')
const previewCtx = screen.getContext('2d')
previewCtx.fillStyle = '#000'
previewCtx.imageSmoothingEnabled = false
const screenEditor = $('screen-editor')
const pixelBrushAction = (px) => {
    if (curFrame == null) return
    frames[curFrame].lcd[px] = brushSet.checked ? 1 : 0
}
for (let i = 0; i < WIDTH*HEIGHT; ++i) {
    const px = document.createElement('div')
    px.onclick = () => {
        if (!clickEnabled.checked) return
        pixelBrushAction(i)
    }
    screenEditor.appendChild(px)
}

// LED array elements initialisation
const ledArray = $('led-array')
const ledEditor = $('led-editor')
for (let i = 0; i < LEDS; ++i) {
    ledArray.appendChild(document.createElement('div'))
    const editorLED = document.createElement('div')
    editorLED.onclick = () => {
        if (editorLED.classList.contains('selected')) {
            editorLED.classList.remove('selected')
            selectedLED = -1
        } else {
            document.querySelectorAll('.led-editor > div.selected')
                .forEach(e => e.classList.remove('selected'))
            editorLED.classList.add('selected')
            selectedLED = i
        }
        refreshControls()
    }
    ledEditor.appendChild(editorLED)
}


const updateFrame = (newIdx) => {
    if (newIdx != null) {
        if (newIdx >= frames.length || newIdx < 0) return
        curFrame = newIdx
        console.log('updated to new frame', curFrame)
        refreshControls()
    }
    if (curFrame == null) return
    if (curFrame >= frames.length) curFrame = frames.length - 1
    const frame = frames[curFrame]

    // LCD UPDATE
    frame.lcd.forEach((px, i) => {
        // update lcd canvas
        if (px) previewCtx.fillRect(i % WIDTH, Math.floor(i/WIDTH),1,1)
        else previewCtx.clearRect(i % WIDTH, Math.floor(i/WIDTH),1,1)
        // update lcd editor area
        screenEditor.children[i].classList.toggle('black', !!px)
    })

    // LED ARRAY UPDATE
    frame.led.forEach((c, i) => {
        ledArray.children[i].style.backgroundColor = intToHex(c)
        ledEditor.children[i].style.backgroundColor = intToHex(c)
    })

    frameLabel.innerText = `${curFrame+1}/${frames.length}`
}


// CONTROLS

// actions
const seek = $('seek')
const play = $('play')
const step = $('step')
const newFrame = $('new-frame')
const dupeFrame = $('dupe-frame')
const delFrame = $('del-frame')
const ledColorPicker = $('led-color')
const dragEnabled = $('drag-enable')
const clickEnabled = $('click-enable')
const brushSet = $('brush-set')
const clearCanvas = $('clear-frame')
const importImage = $('import-img')

// config
const fpsTarget = $('framerate')
const highFpsWarn = $('high-fps-warn')

const frameLabel = $('frame-num')

const insertFrameNext = (newFrame) => {
    if (curFrame === frames.length-1) frames.push(newFrame)
    else frames.splice(curFrame, 0, newFrame)
}
const createEmptyFrame = () => {
    insertFrameNext({
        lcd: new Array(WIDTH*HEIGHT).fill(0),
        led: new Array(LEDS).fill(0xaaaaaa)
    })
}
const createDupeFrame = () => {
    if (curFrame < 0) return
    const frame = frames[curFrame]
    insertFrameNext({
        lcd: [...frame.lcd],
        led: [...frame.led]
    })
}
/**
 * syncs controls to current data
 */
const refreshControls = () => {
    play.disabled = step.disabled = seek.disabled = dupeFrame.disabled = frames.length === 0
    seek.max = frames.length-1
    seek.value = curFrame ?? 0
    ledColorPicker.disabled = selectedLED < 0 || curFrame == null
    importImage.disabled = curFrame == null
    if (selectedLED >= 0 && curFrame) ledColorPicker.value = intToHex(frames[curFrame].led[selectedLED])
}

/**
 * Syncs config elements
 */
const refreshConfigs = () => {
    highFpsWarn.hidden = fpsTarget.value !== '60'
}

// config actions
fpsTarget.oninput = (e) => {
    refreshConfigs()
}

// frame actions
newFrame.onclick = () => {
    createEmptyFrame()
    updateFrame(curFrame == null ? 0 : curFrame + 1)
}
dupeFrame.onclick = () => {
    createDupeFrame()
    updateFrame(curFrame + 1)
}
delFrame.onclick = () => {
    // Move to the next frame if not at end
    if (curFrame === frames.length-1) {

    }
}
clearCanvas.addEventListener('click', () => {
    if (curFrame < 0) return
    if (!confirm('Clear canvas for this frame? This will permanently reset LCD contents (only for this frame).')) return
    frames[curFrame].lcd.fill(0)
    updateFrame(null)
})

// seekbar
seek.addEventListener('input', (e) => {
    updateFrame(parseInt(e.currentTarget.value))
})

// playback actions
let intervalID = null
let nextFrame = 0
const rerenderPlayback = () => {
    if (curFrame !== nextFrame) updateFrame(nextFrame)
    if (intervalID) requestAnimationFrame(rerenderPlayback)
}
const stopPlayback = () => {
    clearInterval(intervalID)
    intervalID = null
    play.innerText = 'Play'
}
play.addEventListener('click', () => {
    if (intervalID) { // stop playing
        stopPlayback()
    } else { // start playing
        play.innerText = 'Pause'
        if (curFrame === frames.length - 1) updateFrame(0)
        nextFrame = curFrame
        intervalID = setInterval(() => {
            nextFrame++
            if (nextFrame >= frames.length) stopPlayback()
        }, 1000/parseInt(fpsTarget.value))
        requestAnimationFrame(rerenderPlayback)
    }
})
step.addEventListener('click', () => {
    if (curFrame === frames.length - 1) updateFrame(0)
    else updateFrame(curFrame + 1)
})

ledColorPicker.oninput = (e) => {
    if (curFrame < 0 || selectedLED < 0) return
    frames[curFrame].led[selectedLED] = hexToInt(e.currentTarget.value)
    updateFrame(null)
}

refreshControls()
refreshConfigs()
