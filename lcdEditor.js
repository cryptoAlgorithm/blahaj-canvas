let startPixel = -1, hoverPixel = -1
let lastPointerPosition = null

const pixelIdxFromEvt = e => {
    const rect = e.target.getBoundingClientRect()
    const x = e.offsetX, y = e.offsetY
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return -1
    return Math.floor(x / rect.width * WIDTH) + Math.floor(y / rect.height * HEIGHT) * WIDTH
}

/**
 * perform linear interpolation given 2 points, converting to lcd pixel positions
 * @param startX previous pointer X
 * @param startY previous pointer Y
 * @param endX current pointer X
 * @param endY current pointer Y
 * @param rect parent bounding rect
 * @returns {[]}
 */
const interpolatePointerPositions = (startX, startY, endX, endY, rect) => {
    const interpolatedPixels = []
    const dx = endX - startX
    const dy = endY - startY
    const steps = Math.max(Math.abs(dx), Math.abs(dy))
    const stepX = dx / steps
    const stepY = dy / steps

    for (let i = 0; i <= steps; i++) {
        const x = startX + i * stepX
        const y = startY + i * stepY

        // Convert interpolated pointer positions to pixel indices
        const pxIdx = Math.floor(x / rect.width * WIDTH) + Math.floor(y / rect.height * HEIGHT) * WIDTH
        if (pxIdx >= 0 && pxIdx < WIDTH * HEIGHT && (interpolatedPixels.length === 0 || interpolatedPixels[interpolatedPixels.length - 1] !== pxIdx)) {
            interpolatedPixels.push(pxIdx)
        }
    }
    return interpolatedPixels
}

const handlePointerMove = (e, rect) => {
    const x = e.offsetX, y = e.offsetY
    const pxIdx = pixelIdxFromEvt(e)
    if (pxIdx < 0) return

    if (hoverPixel === pxIdx) return

    if (hoverPixel > 0) screenEditor.children[hoverPixel].classList.remove('hover')

    if (screenEditor.hasPointerCapture(e.pointerId) && dragEnabled.checked) {
        // Interpolate if there's a previous pointer position
        const interpolatedPixels = lastPointerPosition
            ? interpolatePointerPositions(lastPointerPosition.x, lastPointerPosition.y, x, y, rect)
            : [pxIdx]

        interpolatedPixels.forEach(pixelIdx => pixelBrushAction(pixelIdx))
    } else {
        screenEditor.children[pxIdx].classList.add('hover')
    }

    hoverPixel = pxIdx
    lastPointerPosition = { x, y }
}

screenEditor.onpointermove = ev => {
    const rect = ev.target.getBoundingClientRect()
    handlePointerMove(ev, rect)
    // console.log(ev.twist, ev.tiltX, ev.tiltY, ev.pressure, ev.azimuthAngle, ev.altitudeAngle)
    for (const e of ev.getCoalescedEvents()) handlePointerMove(e, rect)
    updateFrame(null)
}
screenEditor.onpointerdown = e => {
    screenEditor.setPointerCapture(e.pointerId)
    startPixel = pixelIdxFromEvt(e)
}
screenEditor.onpointerup = e => {
    const pixelIdx = pixelIdxFromEvt(e)
    if (pixelIdx === startPixel && clickEnabled.checked) {
        pixelBrushAction(pixelIdx)
        updateFrame(null)
        startPixel = -1
    }
    document.querySelectorAll('.screen-editor > div.hover')
        .forEach(el => el.classList.remove('hover'))
    screenEditor.releasePointerCapture(e.pointerId);
}
