export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
};

