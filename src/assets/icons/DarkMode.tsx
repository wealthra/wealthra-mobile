import * as React from "react";
import Svg, { Path } from "react-native-svg";

export const DarkMode = ({ color = "#000000", size = 24 }) => (
   <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
   </Svg>
);
