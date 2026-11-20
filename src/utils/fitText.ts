/**
 * A font size at which a one-line amount fits `width` points: `base` when it already fits, else
 * smaller (down to `minScale` of it). `em` is the average glyph width in ems; RICH's numerals run
 * about 0.6. React Native Web ignores `adjustsFontSizeToFit`, so this keeps big numbers whole
 * there too.
 */
export function fitFontSize(text: string, base: number, width: number, em = 0.6, minScale = 0.5): number {
  const length = Array.from(text).length;
  if (width <= 0 || length === 0) return base;
  const fit = width / (length * em);
  return Math.round(Math.max(base * minScale, Math.min(base, fit)) * 10) / 10;
}
