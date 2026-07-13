import React, { useMemo } from 'react';
import { useCatalogStore } from '@/stores/catalog';
import ProductCard, { Product } from './product-card';
import CategorySelector, { Category } from './category-selector';
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  onAddToCart?: (product: Product) => void;
}

export function ProductGrid({ products, categories, onAddToCart }: ProductGridProps) {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    page,
    setPage,
    limit,
    sortBy,
    setSortBy,
  } = useCatalogStore();

  // Filter & Sort products locally
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by Category
    if (selectedCategory) {
      result = result.filter(
        (p) => p.category.slug.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category.name.toLowerCase().includes(q)
      );
    }

    // Sort Products
    result.sort((a, b) => {
      if (sortBy === 'price_asc') return parseFloat(a.price) - parseFloat(b.price);
      if (sortBy === 'price_desc') return parseFloat(b.price) - parseFloat(a.price);
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      return 0; // 'newest' default fallback (stable sort)
    });

    return result;
  }, [products, selectedCategory, searchQuery, sortBy]);

  // Paginate products
  const totalPages = Math.ceil(filteredProducts.length / limit);
  const paginatedProducts = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return filteredProducts.slice(startIndex, startIndex + limit);
  }, [filteredProducts, page, limit]);

  return (
    <div className="space-y-6 font-display">
      {/* Controls Bar: Category selector, search input & sorting */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <CategorySelector categories={categories} />
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search AI APIs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative w-full sm:w-44 flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-slate-400" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none cursor-pointer appearance-none"
            >
              <option value="newest">Sort: Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid List */}
      {paginatedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p className="text-sm font-semibold text-slate-500">No AI subscriptions found matching your criteria.</p>
        </div>
      )}

      {/* Pagination controls */}
      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2 pt-6 border-t border-slate-100">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft size={16} className="text-slate-600" />
          </button>
          
          <span className="text-xs font-bold text-slate-500">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ChevronRight size={16} className="text-slate-600" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default ProductGrid;
