export type Produto = {
  id: string;
  name: string;
  description: string;
  price: number;
  price_per_kilo?: number;
  package_weight?: number;
  quantity: number;
  image_url: string;
  barcode?: string;
  flavor?: string;
  active: boolean;
};
