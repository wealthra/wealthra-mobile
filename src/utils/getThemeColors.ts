import colors from "../colors";

export const getThemeColors = (isDarkMode: boolean) => {
   return {
      yellow: isDarkMode ? colors.dark.yellow_dark : colors.light.yellow_light,
      blue: isDarkMode ? colors.dark.blue_dark : colors.light.blue_light,
      red: isDarkMode ? colors.dark.red_dark : colors.light.red_light,
      green: isDarkMode ? colors.dark.green_dark : colors.light.green_light,
      food_category: isDarkMode ? colors.dark.food_category_dark : colors.light.food_category_light,
      housing_category: isDarkMode ? colors.dark.housing_category_dark : colors.light.housing_category_light,
      entertainment_category: isDarkMode ? colors.dark.entertainment_category_dark : colors.light.entertainment_category_light,
      education_category: isDarkMode ? colors.dark.education_category_dark : colors.light.education_category_light,
      transport_category: isDarkMode ? colors.dark.transport_category_dark : colors.light.transport_category_light,
      health_category: isDarkMode ? colors.dark.healthcare_category_dark : colors.light.healthcare_category_light,
      shopping_category: isDarkMode ? colors.dark.shopping_category_dark : colors.light.shopping_category_light,
      other_category: isDarkMode ? colors.dark.other_category_dark : colors.light.other_category_light,
      frame_stroke: isDarkMode ? colors.dark.frame_stroke_dark : colors.light.frame_stroke_light,
      frame_fill: isDarkMode ? colors.dark.frame_fill_dark : colors.light.frame_fill_light,
      page_background: isDarkMode ? colors.dark.page_background_dark : colors.light.page_background_light,
      card_text: isDarkMode ? colors.dark.card_text_dark : colors.light.card_text_light,
      percentage_background: isDarkMode ? colors.dark.percentage_background_dark : colors.light.percentage_background_light,
      dot_background: isDarkMode ? colors.dark.dot_background_dark : colors.light.dot_background_light,
      card_title: isDarkMode ? colors.dark.card_title_dark : colors.light.card_title_light,
      card_description: isDarkMode ? colors.dark.card_description_dark : colors.light.card_description_light,
      text_input_background: isDarkMode ? colors.dark.text_input_background_dark : colors.light.text_input_background_light,
      input_text: isDarkMode ? colors.dark.input_text_dark : colors.light.input_text_light,
   };
};
