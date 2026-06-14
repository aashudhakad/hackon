/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * CSV → MongoDB product importer.
 *
 * Reads a product CSV (Amazon grocery export) and upserts every row into the
 * `products` collection used by the backend. Engine fields (component, price,
 * rank, themes, brand) are derived on read by the backend, so this script only
 * stores the raw CSV columns plus a generated `id` and `availability`.
 *
 * Usage:
 *   node seedProduct.js [path/to/products.csv]
 * Defaults to ./data/products.csv
 *
 * Expected CSV headers:
 *   name, main_category, sub_category, image, link, ratings,
 *   no_of_ratings, discount_price, actual_price, Category
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { parse } = require('csv-parse');

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/amazon-instant-engine';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'amazon-instant-engine';

const csvPath = process.argv[2] || path.join(__dirname, 'data', 'products.csv');

// Mongoose model matching the backend Product schema (raw CSV columns).
const ProductSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    mainCategory: { type: String, default: '' },
    subCategory: { type: String, default: '' },
    category: { type: String, required: true, index: true },
    image: { type: String, default: '' },
    link: { type: String, default: '' },
    ratings: { type: Number, default: 0 },
    noOfRatings: { type: Number, default: 0 },
    discountPrice: { type: Number, default: 0, min: 0 },
    actualPrice: { type: Number, default: 0, min: 0 },
    availability: { type: String, enum: ['in-stock', 'out-of-stock'], default: 'in-stock' },
  },
  { timestamps: true, versionKey: false },
);

const ProductModel = mongoose.model('Product', ProductSchema);

/** Parses "₹7,251" / "1,438" / "" into a finite number (0 on failure). */
function toNumber(value) {
  if (value === undefined || value === null) return 0;
  const cleaned = String(value).replace(/[^0-9.]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/** Slugifies a string for use in a stable id. */
function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

async function readRows(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .on('error', reject)
      .pipe(
        parse({
          columns: true,
          skip_empty_lines: true,
          relax_quotes: true,
          relax_column_count: true,
          trim: true,
          bom: true,
        }),
      )
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

function mapRow(row, index) {
  // Support both camelCase (cleaned_data.csv) and snake_case header styles.
  const get = (...keys) => {
    for (const k of keys) {
      if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') return row[k];
    }
    return '';
  };

  const name = get('name', 'Name');
  const category = get('category', 'Category') || 'misc';
  if (!String(name).trim()) return null;

  const discountPrice = toNumber(get('discountPrice', 'discount_price'));
  const actualPrice = toNumber(get('actualPrice', 'actual_price'));

  return {
    id: `${slugify(name) || 'product'}-${index}`,
    name: String(name).trim(),
    mainCategory: String(get('mainCategory', 'main_category')).trim(),
    subCategory: String(get('subCategory', 'sub_category')).trim(),
    category: String(category).trim().toLowerCase(),
    image: String(get('image')).trim(),
    link: String(get('link')).trim(),
    ratings: toNumber(get('ratings')),
    noOfRatings: toNumber(get('noOfRatings', 'no_of_ratings')),
    discountPrice,
    actualPrice,
    availability: 'in-stock',
  };
}

async function main() {
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`);
    console.error('Pass a path: node seedProduct.js path/to/products.csv');
    process.exit(1);
  }

  console.log(`Reading CSV: ${csvPath}`);
  const rawRows = await readRows(csvPath);
  console.log(`Parsed ${rawRows.length} rows.`);

  const docs = rawRows.map(mapRow).filter(Boolean);
  console.log(`Prepared ${docs.length} valid product documents.`);

  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME });
  console.log(`Connected to MongoDB (${MONGODB_DB_NAME}).`);

  await ProductModel.deleteMany({});
  console.log('Cleared existing products.');

  const BATCH = 1000;
  let inserted = 0;
  for (let i = 0; i < docs.length; i += BATCH) {
    const batch = docs.slice(i, i + BATCH);
    await ProductModel.insertMany(batch, { ordered: false });
    inserted += batch.length;
    console.log(`Inserted ${inserted}/${docs.length}`);
  }

  console.log(`Done. Imported ${inserted} products.`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Import failed:', err.message);
  process.exit(1);
});
