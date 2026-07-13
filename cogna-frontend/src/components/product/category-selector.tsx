import React from 'react';
import { useCatalogStore } from '@/stores/catalog';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

interface CategorySelectorProps {
  categories: Category[];
}

export function CategorySelector({ categories }: CategorySelectorProps) {
  const { selectedCategory, setSelectedCategory } = useCatalogStore();

  return (
    <div className="flex flex-wrap items-center gap-2 font-display">
      <button
        onClick={() => setSelectedCategory(null)}
        className={`rounded-lg px-4 py-2 text-xs font-bold transition-all duration-200 focus:outline-none ${
          selectedCategory === null
            ? 'bg-indigo-600 text-white shadow-sm border border-indigo-700/10'
            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
        }`}
      >
        All Products
      </button>

      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => setSelectedCategory(category.slug)}
          className={`rounded-lg px-4 py-2 text-xs font-bold transition-all duration-200 focus:outline-none ${
            selectedCategory === category.slug
              ? 'bg-indigo-600 text-white shadow-sm border border-indigo-700/10'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}

export default CategorySelector;
