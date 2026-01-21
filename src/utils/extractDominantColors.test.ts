import { extractDominantColorsFromPixels, pickAutoColorCount } from "./extractDominantColors"

describe("extractDominantColorsFromPixels", () => {
    it("returns empty output for invalid inputs", () => {
        const result = extractDominantColorsFromPixels(new Uint8ClampedArray([]), 0)

        expect(result.colors).toEqual([])
        expect(result.clusterSizes).toEqual([])
    })

    it("returns dominant colors sorted by cluster size", () => {
        const pixels = new Uint8ClampedArray([
            255, 0, 0, 255,
            255, 0, 0, 255,
            255, 0, 0, 255,
            255, 0, 0, 255,
            0, 0, 255, 255,
            0, 0, 255, 255,
        ])

        const result = extractDominantColorsFromPixels(pixels, 2)

        expect(result.colors).toEqual([ "rgb(255, 0, 0)", "rgb(0, 0, 255)" ])
        expect(result.clusterSizes).toEqual([ 4, 2 ])
    })

    it("handles tied cluster sizes with centroid tie-breakers", () => {
        const pixels = new Uint8ClampedArray([
            10, 20, 30, 255,
            200, 20, 30, 255,
        ])

        const result = extractDominantColorsFromPixels(pixels, 2)

        expect(result.clusterSizes).toEqual([ 1, 1 ])
        expect(result.colors).toEqual([ "rgb(10, 20, 30)", "rgb(200, 20, 30)" ])
    })

    it("uses the green channel as a secondary tie-breaker", () => {
        const pixels = new Uint8ClampedArray([
            10, 20, 30, 255,
            10, 200, 30, 255,
        ])

        const result = extractDominantColorsFromPixels(pixels, 2)

        expect(result.clusterSizes).toEqual([ 1, 1 ])
        expect(result.colors).toEqual([ "rgb(10, 20, 30)", "rgb(10, 200, 30)" ])
    })

    it("uses the blue channel as a tertiary tie-breaker", () => {
        const pixels = new Uint8ClampedArray([
            10, 20, 30, 255,
            10, 20, 200, 255,
        ])

        const result = extractDominantColorsFromPixels(pixels, 2)

        expect(result.clusterSizes).toEqual([ 1, 1 ])
        expect(result.colors).toEqual([ "rgb(10, 20, 30)", "rgb(10, 20, 200)" ])
    })

    it("keeps empty clusters when centroids overlap", () => {
        const pixels = new Uint8ClampedArray([
            50, 50, 50, 255,
            50, 50, 50, 255,
        ])

        const result = extractDominantColorsFromPixels(pixels, 2)

        expect(result.clusterSizes).toEqual([ 2, 0 ])
    })

    it("ignores transparent pixels", () => {
        const pixels = new Uint8ClampedArray([
            255, 0, 0, 255,
            0, 255, 0, 0,
            255, 0, 0, 255,
        ])

        const result = extractDominantColorsFromPixels(pixels, 1)

        expect(result.colors).toEqual([ "rgb(255, 0, 0)" ])
        expect(result.clusterSizes).toEqual([ 2 ])
    })

    it("returns empty output when no visible pixels exist", () => {
        const pixels = new Uint8ClampedArray([
            0, 0, 0, 0,
            0, 0, 0, 0,
        ])

        const result = extractDominantColorsFromPixels(pixels, 3)

        expect(result.colors).toEqual([])
        expect(result.clusterSizes).toEqual([])
    })
})

describe("pickAutoColorCount", () => {
    it("returns 0 for empty clusters", () => {
        expect(pickAutoColorCount([])).toBe(0)
    })

    it("returns 0 when total cluster size is zero", () => {
        expect(pickAutoColorCount([ 0, 0, 0 ])).toBe(0)
    })

    it("picks the smallest count meeting coverage", () => {
        const count = pickAutoColorCount([ 60, 25, 10, 5 ], {
            coveragePct: 90,
            min: 1,
            max: 4,
        })

        expect(count).toBe(3)
    })

    it("clamps to max", () => {
        const count = pickAutoColorCount([ 40, 30, 20, 10 ], {
            coveragePct: 99,
            min: 1,
            max: 2,
        })

        expect(count).toBe(2)
    })
})
