type RgbSample = [ number, number, number ]

const MAX_SAMPLE_PIXELS = 8000
const MIN_ALPHA = 128
const KMEANS_ITERATIONS = 10

const clampToByte = (value: number): number => {
    return Math.max(0, Math.min(255, Math.round(value)))
}

const getSamplePixels = (pixels: Uint8ClampedArray): RgbSample[] => {
    const totalPixels = Math.floor(pixels.length / 4)
    const stride = Math.max(1, Math.floor(totalPixels / MAX_SAMPLE_PIXELS))
    const samples: RgbSample[] = []

    for (let i = 0; i < totalPixels; i += stride) {
        const idx = i * 4
        const alpha = pixels[ idx + 3 ]
        if (alpha < MIN_ALPHA) {
            continue
        }
        samples.push([ pixels[ idx ], pixels[ idx + 1 ], pixels[ idx + 2 ] ])
    }

    return samples
}

const initializeCentroids = (samples: RgbSample[], k: number): RgbSample[] => {
    const step = samples.length / k
    const centroids: RgbSample[] = []

    for (let i = 0; i < k; i++) {
        const index = Math.min(samples.length - 1, Math.floor((i + 0.5) * step))
        const sample = samples[ index ]
        centroids.push([ sample[ 0 ], sample[ 1 ], sample[ 2 ] ])
    }

    return centroids
}

const findNearestCentroidIndex = (sample: RgbSample, centroids: RgbSample[]): number => {
    let bestIndex = 0
    let bestDistance = Number.POSITIVE_INFINITY

    for (let i = 0; i < centroids.length; i++) {
        const centroid = centroids[ i ]
        const dr = sample[ 0 ] - centroid[ 0 ]
        const dg = sample[ 1 ] - centroid[ 1 ]
        const db = sample[ 2 ] - centroid[ 2 ]
        const distance = dr * dr + dg * dg + db * db
        if (distance < bestDistance) {
            bestDistance = distance
            bestIndex = i
        }
    }

    return bestIndex
}

const computeClusterSizes = (samples: RgbSample[], centroids: RgbSample[]): number[] => {
    const sizes = new Array(centroids.length).fill(0)

    for (let i = 0; i < samples.length; i++) {
        const nearest = findNearestCentroidIndex(samples[ i ], centroids)
        sizes[ nearest ] += 1
    }

    return sizes
}

export const extractDominantColorsFromPixels = (
    pixels: Uint8ClampedArray,
    colorCount: number
): { colors: string[]; clusterSizes: number[] } => {
    const requestedCount = Math.floor(colorCount)
    if (!pixels || pixels.length < 4 || requestedCount <= 0) {
        return { colors: [], clusterSizes: [] }
    }

    const samples = getSamplePixels(pixels)
    if (samples.length === 0) {
        return { colors: [], clusterSizes: [] }
    }

    const k = Math.min(requestedCount, samples.length)
    let centroids = initializeCentroids(samples, k)

    for (let iteration = 0; iteration < KMEANS_ITERATIONS; iteration++) {
        const sumR = new Array(k).fill(0)
        const sumG = new Array(k).fill(0)
        const sumB = new Array(k).fill(0)
        const counts = new Array(k).fill(0)

        for (let i = 0; i < samples.length; i++) {
            const sample = samples[ i ]
            const nearest = findNearestCentroidIndex(sample, centroids)
            sumR[ nearest ] += sample[ 0 ]
            sumG[ nearest ] += sample[ 1 ]
            sumB[ nearest ] += sample[ 2 ]
            counts[ nearest ] += 1
        }

        for (let i = 0; i < k; i++) {
            if (counts[ i ] === 0) {
                continue
            }
            centroids[ i ] = [
                sumR[ i ] / counts[ i ],
                sumG[ i ] / counts[ i ],
                sumB[ i ] / counts[ i ],
            ]
        }
    }

    const clusterSizes = computeClusterSizes(samples, centroids)
    const clusters = centroids.map((centroid, index) => ({
        centroid,
        size: clusterSizes[ index ],
    }))

    clusters.sort((a, b) => {
        if (b.size !== a.size) {
            return b.size - a.size
        }
        if (a.centroid[ 0 ] !== b.centroid[ 0 ]) {
            return a.centroid[ 0 ] - b.centroid[ 0 ]
        }
        if (a.centroid[ 1 ] !== b.centroid[ 1 ]) {
            return a.centroid[ 1 ] - b.centroid[ 1 ]
        }
        return a.centroid[ 2 ] - b.centroid[ 2 ]
    })

    return {
        colors: clusters.map((cluster) => {
            const [ r, g, b ] = cluster.centroid
            return `rgb(${ clampToByte(r) }, ${ clampToByte(g) }, ${ clampToByte(b) })`
        }),
        clusterSizes: clusters.map((cluster) => cluster.size),
    }
}

export const pickAutoColorCount = (
    clusterSizes: number[],
    options?: { coveragePct?: number; min?: number; max?: number }
): number => {
    if (!clusterSizes.length) {
        return 0
    }

    const coveragePct = options?.coveragePct ?? 99
    const min = options?.min ?? 5
    const max = options?.max ?? 12

    const total = clusterSizes.reduce((sum, size) => sum + size, 0)
    if (total <= 0) {
        return 0
    }

    let cumulative = 0
    let count = 0
    for (let i = 0; i < clusterSizes.length; i++) {
        cumulative += clusterSizes[ i ]
        count += 1
        if ((cumulative / total) * 100 >= coveragePct) {
            break
        }
    }

    const clampedMax = Math.min(max, clusterSizes.length)
    const clampedMin = Math.min(min, clampedMax)
    return Math.min(clampedMax, Math.max(clampedMin, count))
}
