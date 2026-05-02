import axiosInstance from "../axiosInstance";
import { getStoredToken } from "./authService";
import { CategoryDto, CreateCategoryCommand, UpdateCategoryCommand, CategoryBreakdownItem, TopCategoryDto } from "../types";

export const getUserCategories = async (): Promise<CategoryDto[]> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      console.log("Fetching categories");

      const response = await axiosInstance.get<CategoryDto[]>(`/api/Categories`, {
         headers: {
            "Content-Type": "application/json",
         },
      });

      console.log("Categories API Response Structure:", typeof response.data, Array.isArray(response.data) ? "Array" : "Object");

      // Normalize response: handle both raw arrays and paginated objects with 'items'
      if (Array.isArray(response.data)) {
         return response.data;
      } else if (response.data && typeof response.data === 'object' && (response.data as any).items) {
         console.log("Normalizing categories from 'items' property");
         return (response.data as any).items;
      }

      return response.data || [];
   } catch (error: any) {
      console.error("Failed to fetch categories:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch categories");
   }
};


export const addCategory = async (name: string): Promise<number> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const requestData: CreateCategoryCommand = { name };

      const response = await axiosInstance.post<number>(`/api/Categories`, requestData, {
         headers: {
            "Content-Type": "application/json",
         },
      });

      return response.data;
   } catch (error: any) {
      console.error("Failed to add category:", error);
      throw new Error(error.response?.data?.message || "Failed to add category");
   }
};

export const updateCategory = async (id: number, name: string): Promise<void> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const requestData: UpdateCategoryCommand = { id, name };

      await axiosInstance.put(`/api/Categories/${id}`, requestData, {
         headers: {
            "Content-Type": "application/json",
         },
      });

      console.log(`Successfully updated category with ID: ${id}`);
   } catch (error: any) {
      console.error(`Failed to update category ${id}:`, error);
      throw new Error(error.response?.data?.message || "Failed to update category");
   }
};

export const deleteCategory = async (id: number): Promise<void> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      await axiosInstance.delete(`/api/Categories/${id}`, {
         headers: {
            "Content-Type": "application/json",
         },
      });

      console.log(`Successfully deleted category with ID: ${id}`);
   } catch (error: any) {
      console.error(`Failed to delete category ${id}:`, error);
      throw new Error(error.response?.data?.message || "Failed to delete category");
   }
};
