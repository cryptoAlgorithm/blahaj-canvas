const dialog = $('import-dialog')
const imageImportForm = document.forms['image-import']

const importConfirm = $('import-confirm')

function processImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        // Load the image
        reader.onload = (event) => {
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);

        img.onload = () => {
            // Set up canvas to draw the resized image
            const width = 128;
            const height = 64;
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            // Draw and resize the image
            ctx.drawImage(img, 0, 0, width, height);
            const imageData = ctx.getImageData(0, 0, width, height);
            const pixels = imageData.data;
            const grayscale = [];

            // Convert to grayscale
            for (let i = 0; i < pixels.length; i += 4) {
                const gray = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
                grayscale.push(gray);
            }

            // Stucki dithering parameters
            const widthOffset = [1, 2];
            const heightOffset = [1, 2];
            const diffusionMatrix = [
                [0, 0, 0, 8, 4],
                [2, 4, 8, 4, 2],
                [1, 2, 4, 2, 1]
            ];
            const diffusionFactor = 42; // Sum of all values in diffusionMatrix

            // 1-bit output array
            const binaryPixels = new Uint8Array(width * height);

            // Apply Stucki dithering
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const index = y * width + x;
                    const oldPixel = grayscale[index];
                    const newPixel = oldPixel < 128 ? 0 : 255;
                    const error = oldPixel - newPixel;

                    binaryPixels[index] = newPixel === 255 ? 1 : 0; // Store as 1-bit

                    // Distribute error using Stucki matrix
                    for (let dy = 0; dy < diffusionMatrix.length; dy++) {
                        for (let dx = -2; dx <= 2; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            const xi = x + dx;
                            const yi = y + dy;
                            if (xi >= 0 && xi < width && yi >= 0 && yi < height) {
                                const diffIndex = yi * width + xi;
                                grayscale[diffIndex] += (error * diffusionMatrix[dy][dx + 2]) / diffusionFactor;
                            }
                        }
                    }
                }
            }

            resolve(binaryPixels); // Return the 1D array representation
        };

        img.onerror = () => {
            reject(new Error("Failed to load the image"));
        };
    });
}

importImage.onclick = () => {
    dialog.showModal()
}

dialog.addEventListener('close', e => {
    if (dialog.returnValue === 'cancel') return
    processImage(imageImportForm['image'].files[0]).then(v => {
        frames[curFrame].lcd = v
        updateFrame(null)
    })
})

importConfirm.addEventListener('click', e => {
    e.preventDefault()
    dialog.close('confirm')
})
