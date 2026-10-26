// Seed menu for the demo. Images live in /public/images (downloaded once, no hotlinking).
export const CATEGORIES = ['North Indian', 'Gujarati', 'Japanese', 'Italian', 'Dessert'];

export const SEED_MENU = [
  // North Indian
  { name: 'Paneer Butter Masala', category: 'North Indian', price: 320, photo: '/images/paneer-butter-masala.jpg',
    description: 'Soft paneer in a slow-cooked tomato–cashew gravy, finished with cream and kasuri methi.' },
  { name: 'Dal Makhani', category: 'North Indian', price: 280, photo: '/images/dal-makhani.jpg',
    description: 'Black urad dal simmered overnight on a low flame, with white butter and a smoky tadka.' },
  { name: 'Chole Bhature', category: 'North Indian', price: 260, photo: '/images/chole-bhature.jpg',
    description: 'Amritsari-style chole with two fluffy bhature, laccha onions and pickle on the side.' },
  { name: 'Veg Dum Biryani', category: 'North Indian', price: 300, photo: '/images/veg-biryani.jpg',
    description: 'Basmati rice layered with seasonal vegetables and saffron, dum-cooked. Comes with boondi raita.' },
  { name: 'Palak Paneer', category: 'North Indian', price: 300, photo: '/images/palak-paneer.jpg',
    description: 'Fresh spinach purée with homemade paneer cubes and a garlic–jeera tadka.' },

  // Gujarati
  { name: 'Khaman Dhokla', category: 'Gujarati', price: 180, photo: '/images/dhokla.jpg',
    description: 'Steamed fresh every morning, tempered with sesame and curry leaves. Green chutney alongside.' },
  { name: 'Methi Thepla (6 pcs)', category: 'Gujarati', price: 150, photo: '/images/thepla.jpg',
    description: 'Thin-rolled fenugreek theplas, served with chhundo and a bowl of curd.' },
  { name: 'Surti Undhiyu', category: 'Gujarati', price: 340, photo: '/images/undhiyu.jpg',
    description: 'Winter-style undhiyu with muthiya and baby brinjals, slow-cooked in its own masala.' },
  { name: 'Khandvi', category: 'Gujarati', price: 170, photo: '/images/khandvi.jpg',
    description: 'Silky gram-flour rolls topped with coconut, coriander and a mustard-seed tadka.' },
  { name: 'Gujarati Thali', category: 'Gujarati', price: 350, photo: '/images/gujarati-thali.jpg',
    description: 'Two sabzis, dal, kadhi, rotli, rice, salad and chaas. Menu changes daily.' },

  // Japanese
  { name: 'Avocado Cucumber Maki (8 pcs)', category: 'Japanese', price: 420, photo: '/images/avocado-maki.jpg',
    description: 'Sushi rice rolled with avocado, cucumber and sesame. Soy, wasabi and pickled ginger on the side.' },
  { name: 'Veg Miso Ramen', category: 'Japanese', price: 380, photo: '/images/veg-ramen.jpg',
    description: 'Miso broth with noodles, bok choy, sweet corn, mushrooms and a chilli-oil drizzle.' },
  { name: 'Vegetable Tempura', category: 'Japanese', price: 320, photo: '/images/veg-tempura.jpg',
    description: 'Seasonal vegetables in a light, crisp batter with a soy–mirin dipping sauce.' },
  { name: 'Edamame', category: 'Japanese', price: 220, photo: '/images/edamame.jpg',
    description: 'Steamed edamame pods tossed in sea salt. Simple and moreish.' },
  { name: 'Yasai Onigiri (2 pcs)', category: 'Japanese', price: 200, photo: '/images/onigiri.jpg',
    description: 'Hand-pressed rice triangles with a seasoned vegetable filling, wrapped in nori.' },

  // Italian
  { name: 'Margherita Pizza', category: 'Italian', price: 380, photo: '/images/margherita.jpg',
    description: 'Hand-stretched base, San Marzano-style tomato sauce, mozzarella and fresh basil.' },
  { name: 'Penne Arrabbiata', category: 'Italian', price: 340, photo: '/images/arrabbiata.jpg',
    description: 'Penne in a spicy garlic–tomato sauce with chilli flakes and parmesan.' },
  { name: 'Mushroom Risotto', category: 'Italian', price: 390, photo: '/images/risotto.jpg',
    description: 'Arborio rice stirred slowly with button and shiitake mushrooms, butter and parmesan.' },
  { name: 'Bruschetta (4 pcs)', category: 'Italian', price: 240, photo: '/images/bruschetta.jpg',
    description: 'Toasted sourdough with marinated tomatoes, basil and olive oil.' },
  { name: 'Veg Lasagna', category: 'Italian', price: 400, photo: '/images/lasagna.jpg',
    description: 'Layers of pasta, roasted vegetables, tomato sugo and béchamel, baked till golden.' },

  // Dessert
  { name: 'Gulab Jamun (2 pcs)', category: 'Dessert', price: 120, photo: '/images/gulab-jamun.jpg',
    description: 'Khoya jamuns soaked in warm cardamom–saffron syrup.' },
  { name: 'Rasmalai (2 pcs)', category: 'Dessert', price: 140, photo: '/images/rasmalai.jpg',
    description: 'Soft chhena discs in chilled saffron milk, topped with pistachios.' },
  { name: 'Chocolate Brownie', category: 'Dessert', price: 160, photo: '/images/brownie.jpg',
    description: 'Dense, fudgy brownie with a crackly top. Eggless.' },
  { name: 'Tiramisu', category: 'Dessert', price: 220, photo: '/images/tiramisu.jpg',
    description: 'Coffee-soaked sponge with mascarpone cream and cocoa. Made without egg.' },
  { name: 'Malai Kulfi', category: 'Dessert', price: 100, photo: '/images/kulfi.jpg',
    description: 'Slow-reduced milk kulfi with cardamom, set on a stick the old way.' },
];
