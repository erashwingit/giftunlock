/**
 * lib/products.ts — Centralized Product Catalog with Image & Customization Support
 */

export interface ProductItem {
  id:          string;
  name:        string;
  price:       number;
  formattedPrice: string;
  image:       string;
  emoji:       string;
  tag:         string | null;
  desc:        string;
  alt:         string;
  sizes?:      string[];
}

export const DEFAULT_PRODUCTS: ProductItem[] = [
  {
    id: "T-Shirt",
    name: "T-Shirt",
    price: 899,
    formattedPrice: "₹899",
    image: "/products/t-shirt.jpg",
    emoji: "👕",
    tag: "Best Seller",
    desc: "240 GSM French Terry Cotton with vibrant artistic QR print",
    alt: "GiftUnlock personalized memory T-shirt with Holi artistic QR code",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
  },
  {
    id: "Beer Mug",
    name: "Beer Mug",
    price: 799,
    formattedPrice: "₹799",
    image: "/products/beer-mug.jpg",
    emoji: "🍺",
    tag: null,
    desc: "Frosted glass mug with scratch-resistant festive QR print",
    alt: "GiftUnlock personalized memory frosted beer mug with artistic QR code",
  },
  {
    id: "Coffee Mug",
    name: "Coffee Mug",
    price: 699,
    formattedPrice: "₹699",
    image: "/products/coffee-mug.jpg",
    emoji: "☕",
    tag: null,
    desc: "11oz matte black ceramic mug with golden floral memory QR",
    alt: "GiftUnlock personalized memory coffee mug with artistic QR code",
  },
  {
    id: "Cushion",
    name: "Cushion",
    price: 699,
    formattedPrice: "₹699",
    image: "/products/cushion.jpg",
    emoji: "🛋️",
    tag: null,
    desc: "30×30 cm soft textured linen with high-definition QR weave",
    alt: "GiftUnlock personalized memory cushion with ornate artistic QR code",
  },
  {
    id: "Water Bottle",
    name: "Water Bottle",
    price: 899,
    formattedPrice: "₹899",
    image: "/products/water-bottle.jpg",
    emoji: "💧",
    tag: null,
    desc: "750ml stainless steel insulated bottle with laser-sharp QR",
    alt: "GiftUnlock personalized memory water bottle with artistic QR code",
  },
  {
    id: "Face Mask",
    name: "Face Mask",
    price: 499,
    formattedPrice: "₹499",
    image: "/products/face-mask.jpg",
    emoji: "😷",
    tag: null,
    desc: "Breathable 3-ply cotton designer mask with neon/gold artistic QR",
    alt: "GiftUnlock personalized memory face mask with artistic QR code",
  },
];

export function getProductById(id: string): ProductItem | undefined {
  return DEFAULT_PRODUCTS.find((p) => p.id.toLowerCase() === id.toLowerCase() || p.name.toLowerCase() === id.toLowerCase());
}
