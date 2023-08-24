const categories = {
  breadsSandwichesPizza: "Breads, Sandwiches & Pizza",
  eggsBreakfast: "Eggs & Breakfast",
  dessertsBakedGoods: "Desserts & Baked Goods",
  fishSeafood: "Fish & Seafood",
  vegetables: "Vegetables",
};

function lookupCategoryLabel(categoryKey) {
  return categories[categoryKey];
}

export { categories, lookupCategoryLabel };

