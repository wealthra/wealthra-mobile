import React, { useState, useEffect } from "react";
import {
   View,
   Text,
   StyleSheet,
   FlatList,
   TouchableOpacity,
   ActivityIndicator,
   Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import { getThemeColors } from "../utils/getThemeColors";
import { horizontalScale, verticalScale, moderateScale } from "../utils/scaling";
import ScreenHeader from "../../components/ScreenHeader";
import CategoryModal from "../../components/CategoryModal";
import { getUserCategories, addCategory, updateCategory, deleteCategory } from "../services/api";
import { CategoryDto } from "../services/api";

interface CategoriesScreenProps {
   isDarkMode: boolean;
   onToggleTheme: () => void;
   navigation: any;
}

const CategoriesScreen: React.FC<CategoriesScreenProps> = ({ isDarkMode, navigation }) => {
   const { t } = useTranslation();
   const themeColors = getThemeColors(isDarkMode);

   const [categories, setCategories] = useState<CategoryDto[]>([]);
   const [loading, setLoading] = useState(true);
   const [modalVisible, setModalVisible] = useState(false);
   const [selectedCategory, setSelectedCategory] = useState<CategoryDto | null>(null);

   const fetchCategories = async () => {
      try {
         setLoading(true);
         const data = await getUserCategories();
         setCategories(data);
      } catch (error) {
         console.error("Error fetching categories:", error);
         Alert.alert(t("alert.genericErrorTitle"), t("alert.failedtoFetch"));
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchCategories();
   }, []);

   const handleSaveCategory = async (name: string) => {
      try {
         if (selectedCategory) {
            await updateCategory(selectedCategory.id, name);
            Alert.alert(t("success") || "Success", t("categoryManagement.categoryUpdated"));
         } else {
            await addCategory(name);
            Alert.alert(t("success") || "Success", t("categoryManagement.categoryAdded"));
         }
         fetchCategories();
      } catch (error) {
         console.error("Error saving category:", error);
         Alert.alert(t("error") || "Error", t("alert.genericErrorTitle"));
      }
      setModalVisible(false);
   };

   const handleDeleteCategory = (id: number) => {
      Alert.alert(
         t("categoryManagement.deleteConfirm"),
         "",
         [
            { text: t("alert.cancel"), style: "cancel" },
            {
               text: t("alert.confirm"),
               style: "destructive",
               onPress: async () => {
                  try {
                     await deleteCategory(id);
                     setCategories(categories.filter((c) => c.id !== id));
                     Alert.alert(t("success") || "Success", t("categoryManagement.categoryDeleted"));
                  } catch (error) {
                     console.error("Error deleting category:", error);
                     Alert.alert(t("error") || "Error", t("alert.failedtoDelete"));
                  }
               },
            },
         ],
         { cancelable: true }
      );
   };

   const renderCategoryItem = ({ item }: { item: CategoryDto }) => (
      <View
         style={[
            styles.categoryItem,
            {
               backgroundColor: themeColors.card_background,
               borderColor: themeColors.frame_stroke,
            },
         ]}>
         <View style={styles.categoryInfo}>
            <Text style={[styles.categoryName, { color: themeColors.card_title }]}>{item.name}</Text>
         </View>
         <View style={styles.actionButtons}>
            <TouchableOpacity
               onPress={() => {
                  setSelectedCategory(item);
                  setModalVisible(true);
               }}
               style={[styles.smallButton, { backgroundColor: themeColors.green + "20" }]}>
               <Text style={[styles.smallButtonText, { color: themeColors.green }]}>{t("categoryManagement.edit")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
               onPress={() => handleDeleteCategory(item.id)}
               style={[styles.smallButton, { backgroundColor: "#FF3B3020" }]}>
               <Text style={[styles.smallButtonText, { color: themeColors.red }]}>{t("categoryManagement.delete")}</Text>
            </TouchableOpacity>
         </View>
      </View>
   );

   function handleNavigate(screen: string): void {
      if (screen !== "Categories") {
         navigation.navigate(screen);
      }
   }

   return (
      <View style={[styles.container, { backgroundColor: themeColors.page_background }]}>
         <ScreenHeader isDarkMode={isDarkMode} onNavigate={handleNavigate} currentRoute="Categories" />

         <View style={styles.content}>
            <View
               style={[
                  styles.card,
                  {
                     backgroundColor: themeColors.card_background,
                     borderColor: themeColors.frame_stroke,
                  },
               ]}>
               <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: themeColors.card_title }]}>{t("categoryManagement.title")}</Text>
                  <TouchableOpacity
                     style={[
                        styles.addButton,
                        {
                           borderColor: themeColors.frame_stroke,
                           backgroundColor: themeColors.card_background,
                        },
                     ]}
                     onPress={() => {
                        setSelectedCategory(null);
                        setModalVisible(true);
                     }}>
                     <Text style={[styles.addButtonText, { color: themeColors.card_title }]}>+</Text>
                  </TouchableOpacity>
               </View>

               {loading && categories.length === 0 ? (
                  <ActivityIndicator size="large" color={themeColors.green} style={styles.loader} />
               ) : (
                  <FlatList
                     data={categories}
                     renderItem={renderCategoryItem}
                     keyExtractor={(item) => item.id.toString()}
                     showsVerticalScrollIndicator={false}
                     contentContainerStyle={styles.listContent}
                     refreshing={loading}
                     onRefresh={fetchCategories}
                     style={styles.categoryList}
                     ListEmptyComponent={
                        !loading ? (
                           <View style={styles.emptyContainer}>
                              <Text style={[styles.emptyText, { color: themeColors.card_title + "80" }]}>
                                 {t("noCategories") || "No categories found"}
                              </Text>
                           </View>
                        ) : null
                     }
                  />
               )}
            </View>
         </View>

         <CategoryModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            onSave={handleSaveCategory}
            category={selectedCategory}
            isDarkMode={isDarkMode}
         />
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
   },
   headerSection: {
      display: "none",
   },
   content: {
      flex: 1,
      width: "100%",
      paddingHorizontal: horizontalScale(16),
   },
   card: {
      borderRadius: moderateScale(24),
      padding: moderateScale(16),
      marginBottom: verticalScale(10),
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: verticalScale(2) },
      shadowOpacity: 0.1,
      shadowRadius: moderateScale(8),
      borderWidth: 1,
      flex: 1, // Let it take available space but contained
      maxHeight: "90%", // Match typical layout of other screens
   },
   cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: verticalScale(16),
   },
   cardTitle: {
      fontSize: moderateScale(22),
      fontWeight: "700",
   },
   addButton: {
      width: moderateScale(40),
      height: moderateScale(40),
      borderRadius: moderateScale(20),
      justifyContent: "center",
      alignItems: "center",
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      borderWidth: 1,
   },
   addButtonText: {
      fontSize: moderateScale(24),
      fontWeight: "400",
   },
   categoryList: {
      flex: 1,
   },
   listContent: {
      paddingBottom: verticalScale(20),
   },
   categoryItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: moderateScale(16),
      borderRadius: moderateScale(16),
      marginBottom: verticalScale(10),
      borderWidth: 1,
   },
   categoryInfo: {
      flex: 1,
   },
   categoryName: {
      fontSize: moderateScale(17),
      fontWeight: "600",
   },
   actionButtons: {
      flexDirection: "row",
      alignItems: "center",
   },
   smallButton: {
      paddingHorizontal: horizontalScale(10),
      paddingVertical: verticalScale(6),
      borderRadius: moderateScale(10),
      marginLeft: horizontalScale(8),
   },
   smallButtonText: {
      fontSize: moderateScale(13),
      fontWeight: "600",
   },
   loader: {
      marginTop: verticalScale(50),
   },
   emptyContainer: {
      marginTop: verticalScale(100),
      alignItems: "center",
   },
   emptyText: {
      fontSize: moderateScale(16),
      textAlign: "center",
   },
});

export default CategoriesScreen;
