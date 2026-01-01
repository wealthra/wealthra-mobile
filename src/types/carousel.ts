export interface SlideTitle {
   firstPart: string;
   highlightedPart: string;
   highlightColor?: string; // Add this for custom highlight colors
}

export interface SlideData {
   id: number;
   title: string | SlideTitle;
   description: string;
   percentage?: string;
   color: string;
   imgUrl?: string;
   translationKey: string; // Add this field to identify translations
}
