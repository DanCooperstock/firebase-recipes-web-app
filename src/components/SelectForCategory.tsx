import { ChangeEvent } from "react";

type CategoryKeys =
  | "breadsSandwichesPizza"
  | "eggsBreakfast"
  | "dessertsBakedGoods"
  | "fishSeafood"
  | "vegetables";

const keysList: CategoryKeys[] = [
  "breadsSandwichesPizza",
  "eggsBreakfast",
  "dessertsBakedGoods",
  "fishSeafood",
  "vegetables",
];

type Categories = { [key in CategoryKeys]?: string };

const categories: Categories = {
  breadsSandwichesPizza: "Breads, Sandwiches & Pizza",
  eggsBreakfast: "Eggs & Breakfast",
  dessertsBakedGoods: "Desserts & Baked Goods",
  fishSeafood: "Fish & Seafood",
  vegetables: "Vegetables",
};

function lookupCategoryLabel(categoryKey: CategoryKeys | "") {
  return categoryKey !== "" ? categories[categoryKey] : "";
}

type SelectForCategoryProps = {
  category: string;
  setCategoryFromEvent: (event: ChangeEvent<HTMLSelectElement>) => void;
};

const SelectForCategory = ({
  category,
  setCategoryFromEvent,
}: SelectForCategoryProps) => {
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
        {keysList.map(function (key) {
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
export { categories, lookupCategoryLabel, CategoryKeys };
