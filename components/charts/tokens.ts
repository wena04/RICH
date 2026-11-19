import { PRIMARY_GREEN, PRIMARY_GREEN_DARK } from '@/constants/Colors';

/**
 * Chart colours. One hue (the brand green) carries every series; checked with the dataviz palette
 * validator against the #FFFFFF card: #2C9B7A clears 3:1. The lighter subcategory green is below
 * 3:1, so every bar that uses it also prints its share and amount as text.
 */
export const CHART_SERIES = PRIMARY_GREEN_DARK;
export const CHART_SERIES_LIGHT = PRIMARY_GREEN;
/** De-emphasised columns (months other than the selected one). */
export const CHART_GRAY = '#DEDEDE';
/** A de-emphasised column under the pointer or finger. */
export const CHART_GRAY_ACTIVE = '#B8B8B8';
export const CHART_BASELINE = '#D8D8D8';
export const CHART_TRACK = '#F2F2F2';
