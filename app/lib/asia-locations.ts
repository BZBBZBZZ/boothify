export type AsiaLocationMap = Record<string, Record<string, string[]>>;

export const ASIA_LOCATIONS: AsiaLocationMap = {
  Indonesia: {
    "DKI Jakarta": ["Jakarta Pusat", "Jakarta Selatan", "Jakarta Barat", "Jakarta Timur", "Jakarta Utara"],
    "Jawa Barat": ["Bandung", "Bekasi", "Bogor", "Depok", "Cirebon"],
    Banten: ["Tangerang", "Tangerang Selatan", "Serang", "Cilegon"],
    "Jawa Timur": ["Surabaya", "Malang", "Sidoarjo", "Kediri"],
    Bali: ["Denpasar", "Badung", "Gianyar", "Singaraja"],
    "Sumatera Utara": ["Medan", "Binjai", "Pematangsiantar"],
  },
  Malaysia: {
    "Kuala Lumpur": ["Kuala Lumpur"],
    Selangor: ["Shah Alam", "Petaling Jaya", "Subang Jaya", "Klang"],
    Penang: ["George Town", "Butterworth"],
    Johor: ["Johor Bahru", "Batu Pahat"],
    Sabah: ["Kota Kinabalu", "Sandakan"],
  },
  Singapore: {
    "Central Region": ["Singapore"],
    "East Region": ["Singapore"],
    "North Region": ["Singapore"],
    "West Region": ["Singapore"],
  },
  Thailand: {
    Bangkok: ["Bangkok"],
    "Chiang Mai": ["Chiang Mai"],
    Phuket: ["Phuket"],
    Chonburi: ["Pattaya", "Chonburi"],
  },
  Japan: {
    Tokyo: ["Tokyo"],
    Osaka: ["Osaka"],
    Kyoto: ["Kyoto"],
    Hokkaido: ["Sapporo", "Hakodate"],
    Aichi: ["Nagoya"],
  },
  "South Korea": {
    Seoul: ["Seoul"],
    Busan: ["Busan"],
    Incheon: ["Incheon"],
    Gyeonggi: ["Suwon", "Seongnam"],
  },
  Philippines: {
    "Metro Manila": ["Manila", "Quezon City", "Makati", "Pasig"],
    Cebu: ["Cebu City", "Lapu-Lapu"],
    Davao: ["Davao City"],
  },
  Vietnam: {
    "Ho Chi Minh City": ["Ho Chi Minh City"],
    Hanoi: ["Hanoi"],
    "Da Nang": ["Da Nang"],
    "Quang Ninh": ["Ha Long"],
  },
};
