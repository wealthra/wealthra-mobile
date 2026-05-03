/**
 * Maps currency codes to symbols.
 */
const currencyMap: Record<string, string> = {
   USD: "$",
   EUR: "€",
   TRY: "₺",
   GBP: "£",
   JPY: "¥",
   // Add more as needed
};

/**
 * Gets the currency symbol for a given code.
 * If no code is provided, returns default "$".
 * If code is not found, returns the code itself.
 */
export const getCurrencySymbol = (code?: string): string => {
   if (!code) return "$";
   
   // If the code is already a common symbol, return it
   if (Object.values(currencyMap).includes(code)) return code;
   
   return currencyMap[code.toUpperCase()] || code;
};

/**
 * Rounds a financial amount to the nearest whole number.
 */
export const roundAmount = (amount: number | null | undefined): number => {
   if (amount === null || amount === undefined) return 0;
   return Math.round(amount);
};
