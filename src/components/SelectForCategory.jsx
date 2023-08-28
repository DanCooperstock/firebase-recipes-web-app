import React from "react";

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

const SelectForCategory = ({ category, setCategoryFromEvent }) => {
  return (
    <label className="recipe-label input-label">
      Category:
      <select
        value={category}
        required
        onChange={(e) => setCategoryFromEvent(e)}
        className="select"
      >
        <option value=""></option>
        {Object.keys(categories).map(function (key) {
          return (
            <option value={key} key={key}>
              {categories[key]}
            </option>
          );
        })}
      </select>
    </label>
  );
};

export default SelectForCategory;
export { categories, lookupCategoryLabel };
