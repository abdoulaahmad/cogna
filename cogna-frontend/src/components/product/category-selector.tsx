

export interface Category { id: string; name: string; slug: string; description?: string | null }
interface CategorySelectorProps { categories: Category[]; selectedCategory: string | null; onChange: (value: string | null) => void }
export default function CategorySelector({ categories, selectedCategory, onChange }: CategorySelectorProps) {
  return <div className="flex max-w-full flex-wrap gap-2"><button type="button" onClick={() => onChange(null)} className={selectedCategory === null ? 'rounded-full bg-[#D4AF37] px-4 py-2.5 text-xs font-bold text-[#062C23]' : 'rounded-full border border-emerald-100/15 bg-white/[0.04] px-4 py-2.5 text-xs font-bold text-emerald-100/75 transition hover:border-[#D4AF37]/60'}>All products</button>{categories.map((category) => <button type="button" key={category.id} onClick={() => onChange(category.slug)} className={selectedCategory === category.slug ? 'rounded-full bg-[#D4AF37] px-4 py-2.5 text-xs font-bold text-[#062C23]' : 'rounded-full border border-emerald-100/15 bg-white/[0.04] px-4 py-2.5 text-xs font-bold text-emerald-100/75 transition hover:border-[#D4AF37]/60'}>{category.name}</button>)}</div>;
}