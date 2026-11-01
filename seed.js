require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const links = require('./imageLinks');

const PLACEHOLDER = '/images/placeholder.svg';
const missing = [];

// Returns the link for a product image, or the placeholder if it is empty/invalid.
function img(key) {
  const url = (links[key] || '').trim();
  if (/^https:\/\//.test(url)) return url;
  missing.push(key);
  return PLACEHOLDER;
}

const products = [
  // ---------- Living Room ----------
  { name: 'Oslo 3-Seater Sofa', description: 'Soft grey fabric sofa with solid wood legs and removable cushion covers.', price: 14500, category: 'Living Room', image: img('sofa'), stock: 8 },
  { name: 'Nordic Armchair', description: 'Compact accent armchair with a curved back, ideal for reading corners.', price: 5200, category: 'Living Room', image: img('armchair'), stock: 12 },
  { name: 'Round Coffee Table', description: 'Oak-finish top with a matte black metal base, 80 cm diameter.', price: 2800, category: 'Living Room', image: img('coffee-table'), stock: 15 },
  { name: 'Low TV Unit', description: 'Two-door TV stand with cable management, fits screens up to 65 inches.', price: 4900, category: 'Living Room', image: img('tv-unit'), stock: 6 },
  { name: 'Walnut Media Console', description: 'Mid-century console with sliding doors and cable cut-outs, fits screens up to 75 inches.', price: 7200, category: 'Living Room', image: img('tv-unit-walnut'), stock: 5 },

  // ---------- Bedroom ----------
  { name: 'Linea Queen Bed', description: 'Upholstered headboard with a sturdy wooden frame, fits a 160x200 mattress.', price: 11800, category: 'Bedroom', image: img('bed'), stock: 5 },
  { name: 'Oak Platform Bed', description: 'Low solid wood frame with slatted base, no box spring needed, fits a 160x200 mattress.', price: 9200, category: 'Bedroom', image: img('bed-wood'), stock: 6 },
  { name: 'Oak Platform Bed', description: 'Low solid wood frame with slatted base, no box spring needed, fits a 160x200 mattress.', price: 9200, category: 'Bedroom', image: img('bed-wood'), stock: 6 },
  { name: 'Single Storage Bed', description: 'Single bed with two deep drawers underneath, perfect for kids and guest rooms.', price: 6400, category: 'Bedroom', image: img('bed-single'), stock: 9 },
  { name: 'Single Storage Bed', description: 'Single bed with two deep drawers underneath, perfect for kids and guest rooms.', price: 6400, category: 'Bedroom', image: img('bed-single'), stock: 9 },
  { name: 'Sliding Door Wardrobe', description: 'Three-door wardrobe with hanging rail and internal shelves.', price: 13200, category: 'Bedroom', image: img('wardrobe'), stock: 4 },
  { name: 'Slim Nightstand', description: 'One-drawer bedside table with a solid beech frame.', price: 1650, category: 'Bedroom', image: img('nightstand'), stock: 20 },

  // ---------- Dining ----------
  { name: 'Extendable Dining Table', description: 'Seats 4 or extends to seat 6, scratch-resistant melamine top.', price: 9600, category: 'Dining', image: img('dining-table'), stock: 7 },
  { name: 'Walnut Dining Chair', description: 'Ergonomic curved backrest, padded seat, sold individually.', price: 1450, category: 'Dining', image: img('dining-chair'), stock: 30 },
  // ---------- Kitchen ----------
  { name: 'Compact Kitchen Table', description: 'Solid wood top with tapered legs, seats 4 and fits small kitchens.', price: 4300, category: 'Kitchen', image: img('kitchen-table'), stock: 10 },
  { name: 'Swivel Bar Stool', description: 'Counter-height stool with a padded seat, backrest and footrest, sold individually.', price: 1350, category: 'Kitchen', image: img('bar-stools'), stock: 24 },
  { name: 'Open Kitchen Rack', description: 'Multi-tier metal and wood shelf for dishes, jars and cookware.', price: 1950, category: 'Kitchen', image: img('kitchen-rack'), stock: 16 },
  { name: 'Rolling Kitchen Cart', description: 'Mobile island with a wooden top, two shelves and lockable wheels.', price: 3600, category: 'Kitchen', image: img('kitchen-cart'), stock: 11 },
  { name: 'Tall Pantry Cabinet', description: 'Slim cabinet with adjustable shelves and a lower drawer for dry goods.', price: 5800, category: 'Kitchen', image: img('pantry-cabinet'), stock: 7 },

  // ---------- Outdoor ----------
  { name: 'Garden Dining Set', description: 'Weather-resistant table with four chairs, powder-coated steel frame.', price: 12400, category: 'Outdoor', image: img('patio-dining'), stock: 5 },
  { name: 'Rattan Lounge Sofa Set', description: 'Corner sofa with a coffee table, all-weather rattan and washable cushions.', price: 18900, category: 'Outdoor', image: img('rattan-sofa'), stock: 4 },
  { name: 'Hanging Egg Chair', description: 'Woven wicker pod with a soft cushion, comes with a sturdy stand.', price: 7400, category: 'Outdoor', image: img('egg-chair'), stock: 8 },
  { name: 'Balcony Bistro Set', description: 'Foldable table with two chairs, designed to fit small balconies.', price: 3200, category: 'Outdoor', image: img('bistro-set'), stock: 13 },
  { name: 'Teak Sun Lounger', description: 'Reclining wooden lounger with five positions and wheels for easy moving.', price: 6900, category: 'Outdoor', image: img('sun-lounger'), stock: 9 },
];

async function seed() {
  try {
    if (missing.length) {
      console.warn(`\n${missing.length} product(s) have no valid image link yet (placeholder used):`);
      missing.forEach((k) => console.warn(`  - ${k}`));
      console.warn('Add the links in imageLinks.js and run this script again.\n');
    } else {
      console.log('All image links found.');
    }
    await mongoose.connect(process.env.MONGO_URI);
    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log(`Seeded ${products.length} products`);
  } catch (err) {
    console.error('Seeding failed:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();