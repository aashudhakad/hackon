# Product data

Place your product CSV here as `products.csv`, then import it:

```bash
npm run seed:csv
# or with a custom path:
node seedProduct.js path/to/your-file.csv
```

Expected CSV headers:

```
name, main_category, sub_category, image, link, ratings, no_of_ratings, discount_price, actual_price, Category
```

The importer derives engine fields (component, price, rank, themes, brand) from
these columns on read, so only the raw columns are stored.
