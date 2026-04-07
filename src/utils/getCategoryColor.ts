import { getThemeColors } from "./getThemeColors";

export const getCategoryColor = (categoryName: string, isDarkMode: boolean): string => {
   const themeColors = getThemeColors(isDarkMode);
   const normalizedName = (categoryName || "").toLowerCase().trim();

   // Mapping each of the 30 categories to its theme-aware color
   switch (normalizedName) {
      case "alcohol & bars":
         return themeColors.alcohol_bars_category;
      case "books & learning":
         return themeColors.books_learning_category;
      case "business expenses":
         return themeColors.business_expenses_category;
      case "car maintenance":
         return themeColors.car_maintenance_category;
      case "cash & atm withdrawals":
         return themeColors.cash_atm_category;
      case "childcare & family":
         return themeColors.childcare_family_category;
      case "clothing & accessories":
         return themeColors.clothing_accessories_category;
      case "coffee & snacks":
         return themeColors.coffee_snacks_category;
      case "debt payments":
         return themeColors.debt_payments_category;
      case "education":
         return themeColors.education_category;
      case "electronics & gadgets":
         return themeColors.electronics_gadgets_category;
      case "entertainment":
         return themeColors.entertainment_category;
      case "food & dining":
         return themeColors.food_category;
      case "gifts & donations":
         return themeColors.gifts_donations_category;
      case "groceries":
         return themeColors.groceries_category;
      case "health & fitness":
         return themeColors.health_category;
      case "hobbies & sports":
         return themeColors.hobbies_sports_category;
      case "home maintenance":
         return themeColors.home_maintenance_category;
      case "housing":
         return themeColors.housing_category;
      case "insurance":
         return themeColors.insurance_category;
      case "investments & savings":
         return themeColors.investments_savings_category;
      case "personal care":
         return themeColors.personal_care_category;
      case "pets":
         return themeColors.pets_category;
      case "shopping":
         return themeColors.shopping_category;
      case "subscriptions & software":
         return themeColors.subscriptions_software_category;
      case "taxes & fees":
         return themeColors.taxes_fees_category;
      case "transport":
         return themeColors.transport_category;
      case "travel & vacation":
         return themeColors.travel_vacation_category;
      case "utilities":
         return themeColors.utilities_category;
      case "miscellaneous":
      default:
         return themeColors.other_category;
   }
};

