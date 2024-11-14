const packLCDBitmap = (bm) => {
    const pack = [];
    for (let i = 0; i < bm.length; i += 8) {
        let value = 0;
        for (let j = 0; j < 8; j++) {
            value |= bm[i + j] << j;
        }
        pack.push(value);
    }
    return pack;
}
const unpackLCDBitmap = (pack) => {
    const bits = [];
    pack.forEach(val => {
        for (let i = 0; i < 8; i++) {
            bits.push((val >> i) & 1);
        }
    })
    return bits;
}

const serialiseFrames = () => JSON.stringify({
    lcd: frames.map(f => packLCDBitmap(f.lcd)),
    led: frames.map(f => f.led)
})

const deserialiseFrames = (data) => {
    const ser = JSON.parse(data)
    const dec = []
    if (!ser.lcd || !ser.led || ser.lcd.length !== ser.led.length) throw new Error('Malformed data')
    for (let i = 0; i < ser.lcd.length; ++i) {
        dec.push({
            lcd: unpackLCDBitmap(ser.lcd[i]),
            led: ser.led[i]
        })
    }
    return dec
}

const serialisedTextarea = $('serialised-data')

$('export').addEventListener('click', () => {
    serialisedTextarea.value = serialiseFrames()
})

$('import').addEventListener('click', () => {
    try {
        const decFrames = deserialiseFrames(serialisedTextarea.value)
        if (!confirm(`Load ${decFrames.length} frames? This will override all existing frames and cannot be undone.`)) return
        frames = decFrames
        if (frames.length > 0) updateFrame(0)
    } catch (e) {
        console.error(e)
        alert('Invalid serialised data, check validity of data')
    }
})
