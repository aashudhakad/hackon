/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * CSV → MongoDB image URL updater.
 *
 * Compares products in final.csv against the products already stored in
 * MongoDB. For every CSV row that matches an existing product (matched by
 * normalized name + category), the product's `image` URL in MongoDB is
 * replaced with the new URL from final.csv. No documents are inserted or
 * deleted — only the `image` field of matching rows is updated.
 *
 * Usage:
 *   node updateImagesFromFinal.js [path/to/final.csv]
 * Defaults to ../dataset/final.csv
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { parse } = require('csv-parse');

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/amazon-instant-engine';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'amazon-instant-engine';

const csvPath = process.argv[2] || path.join(__dirname, '..', 'dataset', 'final.csv');

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

/** Normalizes a value for tolerant matching (lowercase, collapsed whitespace). */
function norm(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/** Builds a composite match key from name + category. */
function matchKey(name, category) {
  return `${norm(name)}||${norm(category)}`;
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

function getField(row, ...keys) {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
      return String(row[k]).trim();
    }
  }
  return '';
}

async function main() {
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  console.log(`Reading CSV: ${csvPath}`);
  const rawRows = await readRows(csvPath);
  console.log(`Parsed ${rawRows.length} rows.`);

  // Build a lookup: matchKey -> newImageUrl (last one wins on dupes).
  const imageByKey = new Map();
  let csvWithImage = 0;
  for (const row of rawRows) {
    const name = getField(row, 'name', 'Name');
    const category = getField(row, 'category', 'Category');
    const image = getField(row, 'image');
    if (!name || !category || !image) continue;
    imageByKey.set(matchKey(name, category), image);
    csvWithImage += 1;
  }
  console.log(`CSV rows with usable name+category+image: ${csvWithImage}`);
  console.log(`Unique match keys from CSV: ${imageByKey.size}`);

  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME });
  console.log(`Connected to MongoDB (${MONGODB_DB_NAME}). Existing data is preserved.`);

  const total = await ProductModel.estimatedDocumentCount();
  console.log(`Total products in DB: ${total}`);

  // Stream DB products, find matches, prepare image-only updates.
  const ops = [];
  const matchedKeys = new Set();
  let matchedDocs = 0;
  let unchanged = 0;

  const cursor = ProductModel.find(
    {},
    { _id: 1, name: 1, category: 1, image: 1 },
  ).lean().cursor();

  for await (const doc of cursor) {
    const key = matchKey(doc.name, doc.category);
    const newImage = imageByKey.get(key);
    if (!newImage) continue;

    matchedKeys.add(key);
    matchedDocs += 1;

    if (norm(doc.image) === norm(newImage)) {
      unchanged += 1;
      continue;
    }

    ops.push({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { image: newImage } },
      },
    });
  }

  console.log(`Matched DB documents: ${matchedDocs}`);
  console.log(`Already up-to-date (same image): ${unchanged}`);
  console.log(`Documents to update: ${ops.length}`);

  // Report CSV keys that did not match anything in the DB.
  const unmatchedCsvKeys = [...imageByKey.keys()].filter((k) => !matchedKeys.has(k));
  if (unmatchedCsvKeys.length > 0) {
    console.log(`\nCSV products with NO match in DB (${unmatchedCsvKeys.length}):`);
    for (const k of unmatchedCsvKeys) {
      console.log(`  - ${k.replace('||', '  |  category: ')}`);
    }
  }

  if (ops.length === 0) {
    console.log('\nNothing to update.');
    await mongoose.disconnect();
    process.exit(0);
  }

  const BATCH = 1000;
  let written = 0;
  for (let i = 0; i < ops.length; i += BATCH) {
    const batch = ops.slice(i, i + BATCH);
    const res = await ProductModel.bulkWrite(batch, { ordered: false });
    written += res.modifiedCount ?? batch.length;
    console.log(`Updated ${Math.min(i + BATCH, ops.length)}/${ops.length} (modified so far: ${written})`);
  }

  console.log(`\nDone. Image URLs updated on ${written} product document(s).`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Update failed:', err.message);
  process.exit(1);
});
