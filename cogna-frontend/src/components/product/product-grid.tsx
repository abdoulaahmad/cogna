import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react';
import type { ChangeEvent } from 'react';
import ProductCard, { type Product } from './product-card';
import type { Category } from './category-selector';
import CategorySelector from './category-selector';

export type CatalogSort = 'newest' | 'price_asc' | 'price_desc' | 'name_asc';
interface ProductGridProps {
  products: Product[];
  categories: Category[];
  search: string;
  selectedCategory: string | null;
  sort: CatalogSort;
  page: number;
  totalPages: number;
  total: number;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string | null) => void;
  onSortChange: (value: CatalogSort) => void;
  onPageChange: (page: number) => void;
  onAddToCart: (product: Product) => void;
}

export default function ProductGrid({ products, categories, search, selectedCategory, sort, page, totalPages, total, onSearchChange, onCategoryChange, onSortChange, onPageChange, onAddToCart }: ProductGridProps) {
  const sorted = [...products].sort((a, b) => sort === 'price_asc' ? Number(a.price) - Number(b.price) : sort === 'price_desc' ? Number(b.price) - Number(a.price) : sort === 'name_asc' ? a.name.localeCompare(b.name) : 0);
  const handleSort = (event: ChangeEvent<HTMLSelectElement>) => onSortChange(event.target.value as CatalogSort);
  return <section className="space-y-7">
    <div className="flex flex-col gap-4 rounded-3xl border border-emerald-100/15 bg-black/15 p-4 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
      <CategorySelector categories={categories} selectedCategory={selectedCategory} onChange={onCategoryChange}/>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative min-w-0 sm:w-72"><Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-100/45" size={16}/><input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search products" className="w-full rounded-2xl border border-emerald-100/15 bg-[#062C23]/80 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-emerald-100/40 focus:border-[#D4AF37]/70"/></label>
        <label className="flex items-center gap-2 rounded-2xl border border-emerald-100/15 bg-[#062C23]/80 px-3 text-emerald-100/70"><SlidersHorizontal size={15}/><select value={sort} onChange={handleSort} className="bg-transparent py-3 text-xs font-bold outline-none"><option value="newest">Newest</option><option value="price_asc">Price: low first</option><option value="price_desc">Price: high first</option><option value="name_asc">Name: A–Z</option></select></label>
      </div>
    </div>
    <div className="flex items-center justify-between text-xs text-emerald-100/55"><span>{total} live {total === 1 ? 'product' : 'products'}</span>{selectedCategory && <button type="button" onClick={() => onCategoryChange(null)} className="font-bold text-[#F8D56B] hover:text-white">Clear category</button>}</div>
    {sorted.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{sorted.map((product) => <ProductCard key={product.id} product={product} onAddToCart={onAddToCart}/>)}</div> : <div className="rounded-3xl border border-dashed border-emerald-100/20 bg-white/[0.04] px-6 py-20 text-center"><p className="text-lg font-bold text-white">No products matched your search.</p><p className="mt-2 text-sm text-emerald-100/60">Try a different term or clear the active category.</p></div>}
    {totalPages > 1 && <nav aria-label="Catalog pages" className="flex items-center justify-center gap-4 pt-2"><button type="button" disabled={page === 1} onClick={() => onPageChange(page - 1)} className="rounded-full border border-emerald-100/20 p-2.5 text-emerald-100 transition hover:border-[#D4AF37] disabled:opacity-35"><ChevronLeft size={17}/></button><span className="text-xs font-bold text-emerald-100/70">Page {page} of {totalPages}</span><button type="button" disabled={page === totalPages} onClick={() => onPageChange(page + 1)} className="rounded-full border border-emerald-100/20 p-2.5 text-emerald-100 transition hover:border-[#D4AF37] disabled:opacity-35"><ChevronRight size={17}/></button></nav>}
  </section>;
}