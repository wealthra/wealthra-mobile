import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * Scales based on screen width.
 * Useful for horizontal dimensions: width, marginHorizontal, paddingHorizontal, gap, etc.
 */
const horizontalScale = (size: number) => (width / guidelineBaseWidth) * size;

/**
 * Scales based on screen height.
 * Useful for vertical dimensions: height, marginVertical, paddingVertical, top, bottom, etc.
 */
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;

/**
 * Scaled value with a damping factor.
 * Useful for fonts and items that shouldn't grow too much on tablets.
 * Default factor is 0.5.
 */
const moderateScale = (size: number, factor = 0.5) => size + (horizontalScale(size) - size) * factor;

export { horizontalScale, verticalScale, moderateScale };
