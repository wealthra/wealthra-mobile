import * as React from "react";
import Svg, { Circle, Path } from "react-native-svg";

export const LightMode = ({ color = "#000000", size = 24 }) => (
   <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth="2" />
      <Path
         d="M12 2V4M12 20v2M4 12H2m20 0h-2M6.34 6.34L4.93 4.93m12.73 12.73l1.41 1.41M17.66 6.34l1.41-1.41M6.34 17.66l-1.41 1.41"
         stroke={color}
         strokeWidth="2"
         strokeLinecap="round"
      />
   </Svg>
);
