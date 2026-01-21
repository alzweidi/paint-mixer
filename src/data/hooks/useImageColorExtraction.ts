import { extractDominantColorsFromPixels, pickAutoColorCount } from "../../utils/extractDominantColors"
import { ExtractedColor } from "../../types/types"

const MAX_DIMENSION = 240
const AUTO_MAX_COLORS = 12

const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error("Failed to load image"))
        img.src = src
    })
}

const toExtractedColors = (colors: string[], clusterSizes: number[]): ExtractedColor[] => {
    const total = clusterSizes.reduce((sum, size) => sum + size, 0)
    return colors.map((rgbString, index) => {
        const size = clusterSizes[ index ] ?? 0
        const coveragePct = total > 0 ? (size / total) * 100 : 0
        return { rgbString, coveragePct }
    })
}

export const useImageColorExtraction = () => {
    const extractColors = async (file: File, colorCount: number | "auto"): Promise<ExtractedColor[]> => {
        const objectUrl = URL.createObjectURL(file)

        try {
            const image = await loadImage(objectUrl)
            let targetWidth = image.width
            let targetHeight = image.height

            if (targetWidth > targetHeight && targetWidth > MAX_DIMENSION) {
                const scale = MAX_DIMENSION / targetWidth
                targetWidth = MAX_DIMENSION
                targetHeight = Math.round(targetHeight * scale)
            } else if (targetHeight >= targetWidth && targetHeight > MAX_DIMENSION) {
                const scale = MAX_DIMENSION / targetHeight
                targetHeight = MAX_DIMENSION
                targetWidth = Math.round(targetWidth * scale)
            }

            const canvas = document.createElement("canvas")
            canvas.width = targetWidth
            canvas.height = targetHeight
            const ctx = canvas.getContext("2d")
            if (!ctx) {
                return []
            }

            ctx.drawImage(image, 0, 0, targetWidth, targetHeight)
            const pixels = ctx.getImageData(0, 0, targetWidth, targetHeight).data

            if (colorCount === "auto") {
                const extraction = extractDominantColorsFromPixels(pixels, AUTO_MAX_COLORS)
                const autoCount = pickAutoColorCount(extraction.clusterSizes, {
                    coveragePct: 99,
                    min: 5,
                    max: AUTO_MAX_COLORS,
                })
                return toExtractedColors(extraction.colors, extraction.clusterSizes).slice(0, autoCount)
            }

            const requestedCount = Math.max(0, Math.floor(colorCount))
            if (requestedCount === 0) {
                return []
            }

            const extraction = extractDominantColorsFromPixels(pixels, requestedCount)
            return toExtractedColors(extraction.colors, extraction.clusterSizes)
        } finally {
            URL.revokeObjectURL(objectUrl)
        }
    }

    return { extractColors }
}
