import * as React from "react";
import Svg, { Path } from "react-native-svg";

interface Props {
   color?: string;
   size?: number;
}

export const ChevronUp = ({ color = "currentColor", size = 16 }: Props) => (
   <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M4 10L8 6L12 10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
   </Svg>
);
