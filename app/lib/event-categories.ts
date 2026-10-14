export type EventCategoryOption = {
  value: string;
  label: string;
};

export const EVENT_CATEGORY_OPTIONS: EventCategoryOption[] = [
  { value: "fnb", label: "Kuliner (Food & Beverage)" },
  { value: "fashion", label: "Fashion, Beauty & Lifestyle" },
  { value: "hobby", label: "Hobi, Pop Culture & Hiburan" },
  { value: "property", label: "Properti, Interior & Home Living" },
  { value: "tourism", label: "Pariwisata (Tour, Travel & Hospitality)" },
  { value: "wedding", label: "Wedding & Event Organizer" },
  { value: "automotive", label: "Otomotif (Automotive)" },
  { value: "tech", label: "Teknologi, Elektronik & Sains (Tech, Electronic & Science Innovation)" },
  { value: "education", label: "Edukasi & Karir (Education & Career)" },
  { value: "craft", label: "Seni & Kriya (Art, Craft & Culture)" },
  { value: "family", label: "Keluarga & Anak (Mom, Baby & Kids)" },
  { value: "health", label: "Kesehatan, Olahraga & Kebugaran (Health, Fitness & Wellness)" },
  { value: "agriculture", label: "Agrikultur, Flora & Fauna (Pets & Plants)" },
  { value: "business", label: "Bisnis, Keuangan & Jasa Profesi (B2B, Finance & Services)" },
  { value: "environment", label: "Lingkungan & Dampak Sosial (Specific SDGs / Green Expo)" },
  { value: "industrial", label: "Manufaktur, Industri & Mesin (Industrial & Manufacturing)" },
  { value: "government", label: "Pemerintah & Pelayanan Publik (Government & Civic)" },
  { value: "religion", label: "Religi, Spiritual & Halal Lifestyle" },
  { value: "maritime", label: "Maritim, Aviasi & Transportasi Berat" },
];

export function getEventCategoryLabel(value: string): string {
  return EVENT_CATEGORY_OPTIONS.find((option) => option.value === value || option.label === value)?.label || value;
}

export function getEventCategoryValue(value: string): string {
  return EVENT_CATEGORY_OPTIONS.find((option) => option.value === value || option.label === value)?.value || value;
}

export function isFoodCategory(value: string): boolean {
  return getEventCategoryValue(value) === "fnb";
}
