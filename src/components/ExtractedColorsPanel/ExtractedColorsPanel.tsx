import React from 'react'
import styles from './ExtractedColorsPanel.module.scss'
import tinycolor from "tinycolor2"
import { ColorPart, RecipeSuggestion } from '../../types/types'

type ExtractedColorsPanelProps = {
    colors: string[]
    selectedIndex: number | null
    onSelect: (index: number) => void
    referenceImageUrl: string | null
    palette: ColorPart[]
    suggestions: Array<RecipeSuggestion | null>
    onApplySuggestion?: (suggestion: RecipeSuggestion) => void
}

const LOW_MATCH_THRESHOLD = 60

const formatIngredientList = (ingredients: RecipeSuggestion['ingredients'], palette: ColorPart[]): string => {
    return ingredients.map((ingredient) => {
        const paint = palette[ ingredient.index ]
        const label = paint?.label ?? `Paint ${ ingredient.index + 1 }`
        const partLabel = ingredient.parts === 1 ? 'part' : 'parts'
        return `${ ingredient.parts } ${ partLabel } ${ label }`
    }).join(' + ')
}

const ExtractedColorsPanel: React.FC<ExtractedColorsPanelProps> = ({
    colors,
    selectedIndex,
    onSelect,
    referenceImageUrl,
    palette,
    suggestions,
    onApplySuggestion
}) => {
    const basePaints = palette.filter((paint) => !paint.recipe)

    return (
        <section className={ styles.ExtractedColorsPanel }>
            <header className={ styles.header }>
                <h3>Reference Analysis</h3>
            </header>

            <div className={ styles.body }>
                <div className={ styles.referenceColumn }>
                    <div className={ styles.referenceImage }>
                        { referenceImageUrl ? (
                            <img src={ referenceImageUrl } alt="Reference" />
                        ) : (
                            <div className={ styles.placeholder }>No reference image yet.</div>
                        ) }
                    </div>

                    <div className={ styles.basePaints }>
                        <h4>Available paints</h4>
                        { basePaints.length ? (
                            <div className={ styles.paintList }>
                                { basePaints.map((paint, index) => (
                                    <span
                                        key={ `${ paint.label }-${ index }` }
                                        className={ styles.paintChip }
                                        data-testid="base-paint"
                                        style={ {
                                            backgroundColor: paint.rgbString,
                                            color: tinycolor(paint.rgbString).isDark() ? 'white' : 'black'
                                        } }
                                    >
                                        { paint.label }
                                    </span>
                                )) }
                            </div>
                        ) : (
                            <div className={ styles.placeholder }>No paints yet.</div>
                        ) }
                    </div>
                </div>

                <div className={ styles.colorsColumn }>
                    <h4>Extracted colors</h4>
                    { colors.length ? (
                        <>
                            <div className={ styles.swatchRow }>
                                { colors.map((color, index) => {
                                    const isSelected = index === selectedIndex
                                    return (
                                        <button
                                            key={ `${ color }-${ index }` }
                                            type="button"
                                            className={ `${ styles.swatchButton } ${ isSelected ? styles.selected : '' }` }
                                            style={ { backgroundColor: color } }
                                            onClick={ () => onSelect(index) }
                                            data-testid="extracted-swatch"
                                            aria-pressed={ isSelected }
                                        >
                                            <span className={ styles.swatchIndex }>{ index + 1 }</span>
                                        </button>
                                    )
                                }) }
                            </div>

                            <div className={ styles.colorList }>
                                { colors.map((color, index) => {
                                    const suggestion = suggestions[ index ]
                                    return (
                                        <div key={ `${ color }-detail-${ index }` } className={ styles.colorCard }>
                                            <div
                                                className={ styles.colorPreview }
                                                style={ { backgroundColor: color } }
                                            />
                                            <div className={ styles.colorDetails }>
                                                <div className={ styles.colorTitle }>
                                                    Color { index + 1 }
                                                </div>

                                                { suggestion ? (
                                                    <div className={ styles.suggestion }>
                                                        <div className={ styles.suggestionRow }>
                                                            <span
                                                                className={ styles.resultSwatch }
                                                                style={ { backgroundColor: suggestion.resultRgb } }
                                                            />
                                                            <span className={ styles.matchPct }>
                                                                { suggestion.matchPct.toFixed(1) }%
                                                            </span>
                                                            { suggestion.matchPct < LOW_MATCH_THRESHOLD && (
                                                                <span className={ styles.lowMatch }>
                                                                    Best possible match
                                                                </span>
                                                            ) }
                                                        </div>
                                                        <div className={ styles.ingredients }>
                                                            { formatIngredientList(suggestion.ingredients, palette) }
                                                        </div>
                                                        { onApplySuggestion && (
                                                            <button
                                                                type="button"
                                                                className={ styles.applyButton }
                                                                onClick={ () => onApplySuggestion(suggestion) }
                                                            >
                                                                Apply to mixer
                                                            </button>
                                                        ) }
                                                    </div>
                                                ) : (
                                                    <div className={ styles.placeholder }>No suggestion yet.</div>
                                                ) }
                                            </div>
                                        </div>
                                    )
                                }) }
                            </div>
                        </>
                    ) : (
                        <div className={ styles.placeholder }>Upload an image to extract colors.</div>
                    ) }
                </div>
            </div>
        </section>
    )
}

export default ExtractedColorsPanel
