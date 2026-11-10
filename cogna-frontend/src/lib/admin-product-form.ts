export function productSlug(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function updateProductName<T extends { name: string; slug: string }>(
  form: T, name: string, editingExisting: boolean,
): T {
  const automaticSlug = !editingExisting && (!form.slug || form.slug === productSlug(form.name));
  return { ...form, name, slug: automaticSlug ? productSlug(name) : form.slug };
}
