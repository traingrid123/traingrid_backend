import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Indian food items from Excel data
const foodItemsData: any[] = [
  { name: 'Aloo Tikki', brand: null, caloriesPer100g: 22, proteinPer100g: 0.2, fatsPer100g: 2.4, fiberPer100g: 2.4, iron: 0.91, calcium: 23, sodium: 14, potassium: 224, vitaminD: 2, sugarPer100g: 1.3 },
  { name: 'Kadhi', brand: null, caloriesPer100g: 160, proteinPer100g: 15, fatsPer100g: 2, fiberPer100g: 0.55, calcium: 12, sodium: 7, potassium: 485, fiberPer100g: 8.5, vitaminD: 6.7, sugarPer100g: 0.7 },
  { name: 'Bananas', brand: null, caloriesPer100g: 89, proteinPer100g: 0.3, fatsPer100g: 0.3, fiberPer100g: 1.1, iron: 0.26, potassium: 5, fiberPer100g: 1, vitaminD: 35, sugarPer100g: 12 },
  { name: 'Bread made in wheat', brand: null, caloriesPer100g: 250, proteinPer100g: 1.5, fatsPer100g: 10, fiberPer100g: 2.76, calcium: 20, sodium: 439, potassium: 165, fiberPer100g: 49, vitaminD: 4.1, sugarPer100g: 6.1 },
  { name: 'Mango Chutney', brand: null, caloriesPer100g: 349, proteinPer100g: 0.4, fatsPer100g: 14, fiberPer100g: 6.8, iron: 0.72, potassium: 190, fiberPer100g: 298, vitaminD: 77, fiberPer100g: 13, sugarPer100g: 46 },
  { name: 'Baati', brand: null, caloriesPer100g: 25, proteinPer100g: 0.5, fatsPer100g: 3.8, fiberPer100g: 1.27, calcium: 118, sodium: 56, fiberPer100g: 343, vitaminD: 3.3, sugarPer100g: 0.6 },
  { name: 'Brown Rice', brand: null, caloriesPer100g: 362, proteinPer100g: 2.7, fatsPer100g: 7.5, fiberPer100g: 1.8, iron: 0.55, calcium: 33, sodium: 4, fiberPer100g: 268, vitaminD: 76, fiberPer100g: 3.4, sugarPer100g: 0 },
  { name: 'Cauliflower', brand: null, caloriesPer100g: 32, proteinPer100g: 0.3, fatsPer100g: 0.3, fiberPer100g: 0.72, calcium: 32, sodium: 259, fiberPer100g: 278, vitaminD: 6.3, fiberPer100g: 3.3, sugarPer100g: 0 },
  { name: 'cheese', brand: null, caloriesPer100g: 331, proteinPer100g: 24, fatsPer100g: 20, fiberPer100g: 0.84, iron: 0.84, calcium: 497, sodium: 966, fiberPer100g: 363, vitaminD: 8.3, sugarPer100g: 0 },
  { name: 'Coffee', brand: null, caloriesPer100g: 2, proteinPer100g: 0.3, fatsPer100g: 0.02, fiberPer100g: 0.02, iron: 0.02, calcium: 2, sodium: 1, fiberPer100g: 0.2, vitaminD: 0, sugarPer100g: 0 },
  { name: 'Corn', brand: null, caloriesPer100g: 97, proteinPer100g: 1.4, fatsPer100g: 3.3, fiberPer100g: 0.55, iron: 0.55, calcium: 2, sodium: 253, fiberPer100g: 3.3, vitaminD: 22, fiberPer100g: 7.7 },
  { name: 'Bhel Puri', brand: null, caloriesPer100g: 556, proteinPer100g: 32, fatsPer100g: 5.5, fiberPer100g: 2.13, iron: 30, sodium: 6, fiberPer100g: 502, vitaminD: 60, fiberPer100g: 6.5, sugarPer100g: 0.48 },
  { name: 'Grapes', brand: null, caloriesPer100g: 93, proteinPer100g: 2.1, fatsPer100g: 5.6, fiberPer100g: 2.63, iron: 363, potassium: 927, fiberPer100g: 272, vitaminD: 17, fiberPer100g: 11, sugarPer100g: 6.3 },
  { name: 'Milk', brand: null, caloriesPer100g: 97, proteinPer100g: 6.9, fatsPer100g: 3.8, fiberPer100g: 0.12, iron: 0.12, calcium: 169, sodium: 52, fiberPer100g: 178, vitaminD: 5.2, sugarPer100g: 0 },
  { name: 'Cashew Nuts', brand: null, caloriesPer100g: 553, proteinPer100g: 44, fatsPer100g: 18, fiberPer100g: 6.68, iron: 37, sodium: 12, fiberPer100g: 660, fiberPer100g: 30, vitaminD: 3.3, sugarPer100g: 0 },
  { name: 'Paneer Tikka', brand: null, caloriesPer100g: 40, proteinPer100g: 0.1, fatsPer100g: 1.1, fiberPer100g: 0.21, iron: 0.21, calcium: 23, sodium: 4, fiberPer100g: 146, fiberPer100g: 9, vitaminD: 1.7, sugarPer100g: 4.2 },
  { name: 'Orange', brand: null, caloriesPer100g: 97, proteinPer100g: 0.2, fatsPer100g: 1.5, fiberPer100g: 0.8, iron: 0.8, calcium: 161, sodium: 3, fiberPer100g: 212, fiberPer100g: 25, vitaminD: 11, sugarPer100g: 0 },
  { name: 'Maggi', brand: null, caloriesPer100g: 71, proteinPer100g: 0.7, fatsPer100g: 2.2, fiberPer100g: 0.91, iron: 13, potassium: 381, fiberPer100g: 192, vitaminD: 14, fiberPer100g: 0.9, sugarPer100: 4 },
  { name: 'Pears', brand: null, caloriesPer100g: 57, proteinPer100g: 0.1, fatsPer100g: 0.4, fiberPer100g: 0.18, iron: 0.18, calcium: 9, potassium: 1, fiberPer100g: 116, fiberPer100g: 15, fiberPer100g: 3.1, sugarPer100g: 0 },
  { name: 'Aloo Matar', brand: null, caloriesPer100g: 81, proteinPer100g: 0.4, fatsPer100g: 5.4, fiberPer100g: 1.47, iron: 1.47, calcium: 25, potassium: 5, fiberPer100g: 244, fiberPer100g: 14, fiberPer100g: 5.7, sugarPer100g: 0.5 },
  { name: "Glucone'D", brand: null, caloriesPer100g: 411, proteinPer100g: 17, fatsPer100g: 46, fiberPer100g: 8.57, iron: 8.57, calcium: 500, potassium: 329, fiberPer100g: 1129, fiberPer100g: 19, fiberPer100g: 7.1, sugarPer100g: 200 },
  { name: 'Sitafal', brand: null, caloriesPer100g: 18, proteinPer100g: 0.1, fiberPer100g: 0.7, iron: 0.57, calcium: 15, potassium: 237, fiberPer100g: 230, fiberPer100g: 4.3, fiberPer100g: 1.1, vitaminD: 0 },
  { name: 'Rohu Curry', brand: null, caloriesPer100g: 187, proteinPer100g: 9.3, fatsPer100g: 16, iron: 1.17, iron: 1.17, calcium: 402, potassium: 178, fiberPer100g: 9.4, sugarPer100g: 0, vitaminD: 0 },
  { name: 'Surmai', brand: null, caloriesPer100g: 184, proteinPer100g: 6.3, fatsPer100g: 30, iron: 1.31, iron: 1.31, calcium: 10, potassium: 50, fiberPer100g: 323, fiberPer100g: 0, vitaminD: 0, sugarPer100g: 0 },
  { name: 'Veg Pizza', brand: null, caloriesPer100g: 298, proteinPer100g: 14, fatsPer100g: 12, fiberPer100g: 2.14, iron: 146, potassium: 692, fiberPer100g: 199, fiberPer100g: 30, fiberPer100g: 1.8, sugarPer100g: 3.2 },
  { name: 'Cheese Pizza', brand: null, caloriesPer100g: 276, proteinPer100g: 11, fatsPer100g: 11, fiberPer100g: 2.47, iron: 192, potassium: 580, fiberPer100g: 170, fiberPer100g: 33, fiberPer100g: 2.1, sugarPer100g: 2.5 },
  { name: 'Onion Pakoda', brand: null, caloriesPer100g: 289, proteinPer100g: 14, fatsPer100g: 3.5, fiberPer100g: 0.91, iron: 17, potassium: 357, fiberPer100g: 545, fiberPer100g: 37, fiberPer100g: 3.9, sugarPer100g: 0.3 },
  { name: 'Butter Chicken', brand: null, caloriesPer100g: 292, proteinPer100g: 15, fatsPer100g: 18, fiberPer100g: 0.62, iron: 0.62, calcium: 13, potassium: 859, fiberPer100g: 315, fiberPer100g: 20, fiberPer100g: 1.3, sugarPer100g: 0 },
  { name: 'Chicken Kolapuri', brand: null, caloriesPer100g: 256, proteinPer100g: 12, fatsPer100g: 13, fiberPer100g: 2.78, iron: 92, potassium: 660, fiberPer100g: 178, fiberPer100g: 25, fiberPer100g: 1.4, sugarPer100g: 0 },
  { name: 'Chicken 65', brand: null, caloriesPer100g: 257, proteinPer100g: 12, fatsPer100g: 15, fiberPer100g: 1.32, iron: 92, potassium: 605, fiberPer100g: 256, fiberPer100g: 23, fiberPer100g: 1.2, sugarPer100g: 5 },
  { name: 'Gulab Jamun', brand: null, caloriesPer100g: 426, proteinPer100g: 23, fatsPer100g: 5.2, fiberPer100g: 1.06, iron: 60, fiberPer100g: 402, fiberPer100g: 102, fiberPer100g: 51, fiberPer100g: 1.5, sugarPer100g: 32 },
  { name: 'Jalebi', brand: null, caloriesPer100g: 452, proteinPer100g: 25, fatsPer100g: 4.9, fiberPer100g: 4.24, iron: 424, fiberPer100g: 326, fiberPer100g: 201, fiberPer100g:51, fiberPer100g: 1.9, sugarPer100g: 27 },
  { name: 'Dairy Milk', brand: null, caloriesPer100g: 381, proteinPer100g: 1.4, fatsPer100g: 2, fiberPer100g: 0.8, iron: 0.8, calcium: 18, fiberPer100g: 286, fiberPer100g: 110, fiberPer100g: 90, fiberPer100g: 2.5, sugarPer100g: 65 },
  { name: 'Fruit and Nut chocolate', brand: null, caloriesPer100g: 429, proteinPer100g: 9.5, fatsPer100g: 13, fiberPer100g:2.28, iron: 11, fiberPer100g: 4, potassium: 490, fiberPer100g: 241, fiberPer100g: 73, fiberPer100g: 14, sugarPer100g: 0.5 },
  { name: 'Dosa', brand: null, caloriesPer100g: 168, proteinPer100g: 3.7, fatsPer100g: 4.5, fiberPer100g: 8, iron: 0.7, calcium: 94, fiberPer100g: 76, fiberPer100g: 29, fiberPer100g: 0.9, sugarPer100g: 0.1 },
  { name: 'Idli', brand: null, caloriesPer100g: 156, proteinPer100g: 1.7, fatsPer100g: 5, iron: 17.2, fiberPer100g: 2.4, calcium: 4, fiberPer100g: 207, fiberPer100g: 63, fiberPer100g: 30, fiberPer100g: 2.1, sugarPer100g: 0.74 },
  { name: 'Poha', brand: null, caloriesPer100g: 130, proteinPer100g: 1.5, fatsPer100g: 2.6, fiberPer100g: 3.16, iron: 1, calcium: 201, fiberPer100g: 117, fiberPer100g: 26, fiberPer100g: 9.1, sugarPer100g: 0.5 },
  { name: 'Chappati', brand: null, caloriesPer100g: 297, proteinPer100g: 7.5, fatsPer100g: 11, fiberPer100g: 3.01, iron: 93, fiberPer100g: 409, fiberPer100g: 266, fiberPer100g: 46, fiberPer100g: 4.9, sugarPer100g: 2.7 },
  { name: 'Tomato', brand: null, caloriesPer100g: 16, proteinPer100g: 0.2, fatsPer100g:1.2, fiberPer100g: 0.47, iron: 0.47, calcium: 5, fiberPer100g: 42, fiberPer100g: 212, fiberPer100g: 3.2, sugarPer100g: 0.9 },
  { name: 'Dahi', brand: null, caloriesPer100g: 60, proteinPer100g:4.3, fiberPer100g: 1, iron: 0.08, calcium: 183, fiberPer100g: 70, fiberPer100g: 234, fiberPer100g: 7, fiberPer100g: 1.7, sugarPer100g: 0 },
  { name: 'Cake', brand: null, caloriesPer100g: 407, proteinPer100g: 6.2, fatsPer100g: 4.4, fiberPer100g: 3.81, iron: 17, fiberPer100g: 45, fiberPer100g: 7, fiberPer100g: 51, fiberPer100g:84, fiberPer100g: 2.9, sugarPer100g: 55 },
  { name: 'Chowmein', brand: null, caloriesPer100g: 108, proteinPer100g: 0.2, fatsPer100g: 1.8, fiberPer100g: 0.14, iron: 0.14, calcium: 4, fiberPer100g: 19, fiberPer100g: 424, fiberPer100g: 1, fiberPer100g: 0 },
  { name: 'Uttapam', brand: null, caloriesPer100g: 188, proteinPer100g: 7.2, fatsPer100g: 4.4, fiberPer100g: 24, iron: 6.4, fiberPer100g: 522, fiberPer100g: 91, fiberPer100g: 26.4, fiberPer100g: 2.2, sugarPer100g: 0 },
  { name: 'Bhaji Pav', brand: null, caloriesPer100g: 151, proteinPer100g: 2.4, fiberPer100g: 9, fiberPer100g: 37, fiberPer100g: 4.3, iron: 4.3, fiberPer100g: 438, fiberPer100g: 180, fiberPer100g: 29, fiberPer100g: 3.1, vitaminD: 1.35 },
  { name: 'Dal Makhani', brand: null, caloriesPer100g: 109, proteinPer100g: 8.5, fiberPer100g: 2.1, iron: 35.2, fiberPer100g: 8.3, fiberPer100g: 243, fiberPer100g: 366, fiberPer100g: 6.3, fiberPer100g: 1.5, sugarPer100g: 3.29 },
  { name: 'Almonds', brand: null, caloriesPer100g: 579, proteinPer100g: 50, fatsPer100g: 21, fiberPer100g: 3.71, iron: 26.9, fiberPer100g: 269, fiberPer100g: 1733, fiberPer100g: 22, vitaminD: 13, sugarPer100g: 4.4 },
  { name: 'Mushrooms', brand: null, caloriesPer100g: 22, proteinPer100g: 0.3, fiberPer100g: 3.1, iron: 0.5, fiberPer100g: 3, fiberPer100g: 5, fiberPer100g: 318, fiberPer100g: 3.3, fiberPer100g: 1.7, sugarPer100g: 2 },
  { name: 'Egg Yolk', brand: null, caloriesPer100g: 196, proteinPer100g: 15, fatsPer100g: 14, fiberPer100g: 1.89, iron: 62, fiberPer100g: 207, fiberPer100g: 152, fiberPer100g: 0.8, fiberPer100g: 0, vitaminD: 0.88, sugarPer100g: 0.4 },
  { name: 'Sweet Potatoes', brand: null, caloriesPer100g: 76, proteinPer100g: 0.1, fatsPer100g: 1.4, fiberPer100g: 0.72, iron: 0.72, calcium: 27, fiberPer100g: 27, fiberPer100g: 230, fiberPer100g: 18, fiberPer100g: 2.5, sugarPer100g: 5.7 },
  { name: 'Masala Aloo', brand: null, caloriesPer100g: 87, proteinPer100g: 0.1, fiberPer100g: 1.9, fiberPer100g: 0.31, iron: 5, fiberPer100g: 240, fiberPer100g: 379, fiberPer100g: 20, fiberPer100g: 2, sugarPer100g: 0.9 },
  { name: 'White Rice', brand: null, caloriesPer100g: 360, proteinPer100g: 0.6, fatsPer100g: 6.6, fiberPer100g: 4.36, iron: 4.36, calcium: 9, fiberPer100g: 1, fiberPer100g: 186, fiberPer100g: 79, fiberPer100g: 1.4, sugarPer100g: 0 },
  { name: 'Orange juice', brand: null, caloriesPer100g: 45, proteinPer100g: 0.2, fatsPer100g: 0.7, fiberPer100g: 0.2, iron: 0.2, calcium: 11, fiberPer100g: 1, fiberPer100g: 200, fiberPer100g: 10, fiberPer100g: 0, sugarPer100g: 8.4 },
  { name: 'Sweet Dahi', brand: null, caloriesPer100g: 73, proteinPer100g: 1.9, fiberPer100g: 10, iron: 0.04, fiberPer100g: 0.04, calcium: 115, fiberPer100g: 34, fiberPer100g: 141, fiberPer100g: 3.9, fiberPer100g: 0, sugarPer100g: 3.6 },
  { name: 'Cornflakes', brand: null, caloriesPer100g: 40, proteinPer100g: 0.9, fatsPer100g: 3.2, fiberPer100g: 0.88, iron: 0.88, calcium: 10, fiberPer100g: 1, fiberPer100g: 192, fiberPer100g: 11, fiberPer100g: 2.6, sugarPer100g: 0, sugarPer100g: 0 },
  { name: 'Laal Chai', brand: null, caloriesPer100g: 1, proteinPer100g: 0, fatsPer100g: 0.2, iron: 0.02, fiberPer100g: 0, iron: 0, calcium: 0, sodium: 0, fiberPer100g: 2, fiberPer100g: 0, vitaminD: 0, sugarPer100g: 0 },
  { name: 'Pumpkin seeds', brand: null, caloriesPer100g: 486, proteinPer100g: 31, fatsPer100g: 17, fiberPer100g: 7.72, iron: 7.72, calcium: 631, fiberPer100g: 16, fiberPer100g: 407, fiberPer100g: 42, fiberPer100g: 34, sugarPer100g: 0, vitaminD: 0 },
  { name: 'Butter Paneer', brand: null, caloriesPer100g: 95, proteinPer100g: 4.2, fatsPer100g: 11, fiberPer100g: 0.1, iron: 0.1, fiberPer100g: 56, fiberPer100g: 403, fiberPer100g: 86, fiberPer100g: 3, fiberPer100g: 1, fiberPer100g: 0, fiberPer100g: 0.4 },
  { name: 'Salmon', brand: null, caloriesPer100g: 127, proteinPer100g: 4.4, fatsPer100g: 21, iron: 0.38, fiberPer100g: 7.75, potassium: 366, fiberPer100g: 0, fiberPer100g: 435, fiberPer100g: 0, fiberPer100g: 0 },
  { name: 'Chocos', brand: null, caloriesPer100g: 384, proteinPer100g: 0.9, fatsPer100g: 5.9, iron: 19.4, fiberPer100g: 2.57, calcium: 1, fiberPer100g: 571, fiberPer100g: 107, fiberPer100g: 88, fiberPer100g: 2.7, fiberPer100g: 286, fiberPer100g: 7.8 },
  { name: 'Beans', brand: null, caloriesPer100g: 31, proteinPer100g: 0.2, fatsPer100g: 1.8, fiberPer100g: 1.03, iron: 37, fiberPer100G: 6, fiberPer100g: 211, fiberPer100G: 7, fiberPer100g: 2.7, vitaminD: 0, sugarPer100g: 3.3 },
  { name: 'Dal Fry', brand: null, caloriesPer100g: 101, proteinPer100g: 0.5, fiberPer100g: 8.8, iron: 3.1, iron: 14, fiberPer100G: 246, fiberPer100G: 284, fiberPer100G: 21, fiberPer100G: 0, sugarPer100g: 0, sugarPer100g: 0 },
  { name: 'Red Sauce Pasta', brand: null, caloriesPer100g: 126, proteinPer100g: 0.7, fatsPer100g: 2.6, fiberPer100g: 0.25, iron: 0.1, fiberPer100G: 10, fiberPer100G: 31, fiberPer100G: 4.8, fiberPer100G: 0, vitaminD: 0, sugarPer100g: 0 },
  { name: 'Chai', brand: null, caloriesPer100g: 1, proteinPer100g: 0, fiberPer100G: 0.08, iron: 2.1, fiberPer100G: 9, fiberPer100G: 0.2, fiberPer100G: 0, fiberPer100G: 0, fiberPer100G: 0, vitaminD: 0, sugarPer100G: 0 },
  { name: 'Apples', brand: null, caloriesPer100g: 52, proteinPer100g: 0.2, fatsPer100g: 0.3, fiberPer100g: 0.12, iron: 0.12, calcium: 6, fiberPer100G: 1, fiberPer100G: 107, fiberPer100G: 14, fiberPer100G: 10, fiberPer100G: 0, sugarPer100g: 0 },
  { name: 'Strawberries', brand: null, caloriesPer100g: 32, proteinPer100g: 0.3, fatsPer100g: 0.7, fiberPer100g: 0.7, iron: 0.41, iron: 16, fiberPer100G: 1, fiberPer100G: 153, fiberPer100G: 7.7, fiberPer100G: 2, fiberPer100G: 4.9, sugarPer100g: 0 },
  { name: 'Kiwi', brand: null, caloriesPer100g: 120, proteinPer100g: 1.9, fatsPer100g: 4.4, fiberPer100g: 1.49, iron: 1.49, iron: 17, fiberPer100G: 7, fiberPer100G: 172, fiberPer100G: 21, fiberPer100G: 2.8, sugarPer100g: 0, vitaminD: 0.9 },
  { name: 'Mutton', brand: null, caloriesPer100g: 109, proteinPer100g: 2.3, fatsPer100g: 21, iron: 2.83, fiberPer100G: 13.82, iron: 0, potassium: 82, fiberPer100G: 385, fiberPer100G: 57, fiberPer100G: 0, fiberPer100G: 0, vitaminD: 0, sugarPer100g: 0 },
  { name: 'Boiled Chicken', brand: null, caloriesPer100g: 114, proteinPer100g: 2.3, fatsPer100: 22, fiberPer100G: 3.2, iron: 12, fiberPer100G: 50, fiberPer100G: 378, fiberPer100G: 0, fiberPer100G: 0, fiberPer100G: 0, vitaminD: 0 },
  { name: 'Chicken Tandoori', brand: null, caloriesPer100g: 295, proteinPer100g: 15, fatsPer100: 19, fiberPer100G: 0.72, iron: 11, fiberPer100G: 798, fiberPer100G: 334, fiberPer100G: 22, fiberPer100G: 1.1, sugarPer100g: 0 },
  { name: 'Kebab', brand: null, caloriesPer100g: 255, proteinPer100g: 13, fiberPer100g: 3.3, iron: 0.69, iron: 19, fiberPer100G: 43, fiberPer100G: 551, fiberPer100G: 31, fiberPer100G: 3.5, sugarPer100g: 0.9 },
  { name: 'Tomato Rice', brand: null, caloriesPer100g: 195, proteinPer100g: 4.9, fiberPer100g: 3.6, iron: 1.18, fiberPer100G: 39, fiberPer100G: 396, fiberPer100G: 77, fiberPer100G: 131, fiberPer100G: 34, fiberPer100G: 1.1, sugarPer100g: 1.4 },
  { name: 'Prawns', brand: null, caloriesPer100g: 319, proteinPer100g: 20, fatsPer100: 14, fiberPer100G: 1.54, iron: 47, fiberPer100G: 1400, fiberPer100G: 128, fiberPer100G: 21, fiberPer100G: 1.5, fiberPer100G: 0, sugarPer100g: 0.8 },
  { name: 'Momos', brand: null, caloriesPer100g: 170, proteinPer100g: 8.5, fiberPer100g: 7.8, iron: 1.29, fiberPer100G: 45, fiberPer100G: 351, fiberPer100G: 206, fiberPer100G: 16, fiberPer100G: 1.5, vitaminD: 2 },
  { name: 'Mixed Veg', brand: null, caloriesPer100g: 194, proteinPer100g: 12, fatsPer100g: 6.5, iron: 57, fiberPer100G: 145, fiberPer100G: 375, fiberPer100G: 127, fiberPer100G: 16, fiberPer100G: 1.1, sugarPer100g: 2.8 },
  { name: 'Chicken sausage', brand: null, caloriesPer100g: 297, proteinPer100g: 21, fatsPer100g: 26, fiberPer100G: 1.29, iron: 22, fiberPer100G: 73, fiberPer100G: 362, fiberPer100G: 0, fiberPer100G: 0, fiberPer100G: 0 },
  { name: 'Malai Chicken', brand: null, caloriesPer100g: 146, proteinPer100g: 2.8, fatsPer100g: 28, fiberPer100G: 0.56, iron: 7, fiberPer100G: 993, fiberPer100G: 999, fiberPer100G: 1.8, sugarPer100g: 0, vitaminD: 0, sugarPer100g: 1.2 },
  { name: 'Nachos', brand: null, caloriesPer100g: 350, proteinPer100g: 22, fatsPer100g: 4.3, iron: 0.75, iron: 0.75, fiberPerG: 63, fiberPer100G: 313, fiberPer100G: 362, fiberPer100G: 35, fiberPer100G: 3.2, sugarPer100g: 2.2 },
  { name: 'Chicken Popcorn', brand: null, caloriesPer100g: 351, proteinPer100g: 22, fatsPer100g:18, fiberPer100G: 1.42, iron: 32, fiberPer100G: 1140, fiberPer100G: 288, fiberPer100G: 21, fiberPer100G: 1, sugarPer100g: 0 },
  { name: 'Nalli Nihari', brand: null, caloriesPer100g: 203, proteinPer100g: 10, fiberPer100g: 27, iron: 1.52, iron: 1.52, calcium: 28, fiberPer100G: 78, fiberPer100G: 294, fiberPer100G: 0, fiberPer100G: 8, fiberPer100G: 0, vitaminD: 0, vitaminD: 0 },
  { name: 'Fish Eggs', brand: null, caloriesPer100g: 159, proteinPer100g: 4, fiberPer100g: 29, fiberPer100G: 6.81, iron: 0, calcium: 681, fiberPerG: 409, fiberPer100G: 0, fiberPer100G: 0, vitaminD: 0, sugarPer100g: 0 },
  { name: 'King Fish', brand: null, caloriesPer100g: 550, proteinPer100g: 50, fiberPer100g: 22, iron: 3.4, fiberPer100G: 68, fiberPerG: 1531, fiberPer100G: 257, fiberPerG: 5.4, fiberPer100G: 0, fiberPer100G: 0, vitaminD: 0, sugarPer100G: 0 },
  { name: 'Banana Chips', brand: null, caloriesPer100g: 519, proteinPer100g: 34, fatsPer100g: 2.3, iron: 1.25, iron: 1.25, calcium: 18, fiberPer100G: 6, fiberPer100G: 536, fiberPer100G: 58, fiberPer100G: 7.7, vitaminD: 0, sugarPer100g: 35 },
  { name: 'Honey', brand: null, caloriesPer100g: 304, proteinPer100g: 0, fatsPer100g: 0.3, fiberPer100g: 0.42, iron: 6, fiberPer100G: 4, fiberPer100G: 52, fiberPerG: 82, fiberPer100G: 0, fiberPer100G: 2, fiberPer100G: 0, vitaminD: 0, vitaminD: 0, sugarPer100g: 82 },
  { name: 'Chocolate Icecream', brand: null, caloriesPer100g: 216, proteinPer100g: 11, fiberPer100G: 3.8, iron: 0.93, fiberPer100G: 109, fiberPer100G: 76, fiberPer100G: 249, fiberPer100G: 28, fiberPer100G: 1.2, vitaminD: 0, sugarPer100g: 25 },
  { name: 'Vanilla Ice cream', brand: null, caloriesPer100g: 207, proteinPer100g: 11, fiberPer100G: 3.5, iron: 0.09, fiberPer100G: 0.09, calcium: 128, fiberPer100G: 80, fiberPerG: 199, fiberPer100G: 24, fiberPer100G: 0.7, vitaminD: 0, sugarPer100g: 21 },
  { name: 'Strawberry Icecream', brand: null, caloriesPer100g: 192, proteinPer100g: 8.4, fiberPer100G: 3.2, iron: 0.21, fiberPer100G: 0.21, calcium: 120, fiberPer100G: 60, fiberPerG: 188, fiberPer100G: 28, fiberPer100g: 0.9, vitaminD: 0, vitaminD: 0, sugarPer100g: 0 },
  { name: 'Rasmalai', brand: null, caloriesPer100g: 318, proteinPer100g: 0.2, fiberPer100G: 1.8, iron: 0.23, fiberPer100G: 0.23, iron: 0, potassium: 3, fiberPer100G: 80, fiberPerG: 581, fiberPerG: 0, fiberPer100G: 1, fiberPerG: 0, vitaminD: 0.58, sugarPer100g: 0 }
];

async function main() {
  try {
    console.log('🌱 Seeding food items database...');

    for (const item of foodItemsData) {
      const servingsPer100g = (100 / (item.caloriesPer100g || 100)).toFixed(1);
      const servingSizeGrams = Math.round(100 / parseFloat(servingsPer100g));

      await prisma.foodItem.upsert({
        where: { name: item.name },
        update: {
          caloriesPer100g: item.caloriesPer100g ?? 0,
          proteinPer100g: item.proteinPer100g ?? 0,
          carbsPer100g: item.carbsPer100g ?? 0,
          fatsPer100g: item.fatsPer100g ?? 0,
          fiberPer100g: item.fiberPer100g ?? null,
          servingSizeGrams,
          isCustom: false,
          createdById: null
        },
        create: {
          name: item.name,
          brand: item.brand,
          caloriesPer100g: item.caloriesPer100g ?? 0,
          proteinPer100g: item.proteinPer100g ?? 0,
          carbsPer100g: item.carbsPer100g ?? 0,
          fatsPer100g: item.fatsPer100g ?? 0,
          fiberPer100g: item.fiberPer100g ?? null,
          servingSizeGrams,
          isCustom: false,
          createdById: null
        }
      });
    }

    console.log(`✅ Seeded ${foodItemsData.length} food items`);
  } catch (error) {
    console.error('❌ Error seeding food items:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
