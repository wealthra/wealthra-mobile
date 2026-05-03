/**
 * Utilities for rounding financial data.
 */

/**
 * Rounds a single numeric value to the nearest whole number.
 */
export const roundAmount = (amount: number | null | undefined): number => {
   if (amount === null || amount === undefined) return 0;
   return Math.round(amount);
};

/**
 * Rounds all numeric values in an object that match a set of currency-related keys.
 */
export const roundFinancialData = <T extends any>(data: T): T => {
   if (!data) return data;

   if (Array.isArray(data)) {
      return data.map(item => roundFinancialData(item)) as any;
   }

   if (typeof data === 'object') {
      const result = { ...data } as any;
      const keysToRound = [
         'amount', 
         'targetAmount', 
         'currentAmount', 
         'totalBalance', 
         'totalIncome', 
         'totalExpenses', 
         'totalSaved', 
         'totalTarget', 
         'limitAmount',
         'totalSpending',
         'periodicIncome',
         'oneTimeIncome',
         'periodicExpenses',
         'oneTimeExpenses',
         'achievedAmount',
         'notAchievedAmount'
      ];

      for (const key in result) {
         if (keysToRound.includes(key) && typeof result[key] === 'number') {
            result[key] = Math.round(result[key]);
         } else if (typeof result[key] === 'object' && result[key] !== null) {
            result[key] = roundFinancialData(result[key]);
         }
      }
      return result;
   }

   return data;
};
