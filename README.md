# START Backend

Professional backend module for product management used in the START workspace. This README documents setup, local development, database schema, API endpoints, and guidance for working with product variants and media.

## Table of Contents
- About
- Quick Start
- Requirements
- Environment
- Database
- Running Locally
- API Endpoints
- Product Variants & Media
- Testing
- Troubleshooting
- Contributing
- License

## About
This module implements product management features used by the frontend application in the `Frontend` workspace. It provides APIs to create, update, fetch, and delete products, including product profiles, media, and variants persisted across `products`, `product_profile` and `product_variants` tables.

## Quick Start
1. Install dependencies:

```bash
cd START
npm install
```

2. Configure environment variables (see `Environment` below).

3. Run database migrations and seed data (if applicable).

4. Start the server in development mode:

```bash
npm run dev
```

## Requirements
- Node.js 18+ (or current LTS)
- PostgreSQL for local development
- Environment variables configured for DB connection and uploads

## Environment
Create a `.env` file at the repository root (or use your preferred secrets mechanism) with values similar to:

```
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/dbname
UPLOADS_DIR=./uploads
JWT_SECRET=replace_me
```

## Database
This module uses PostgreSQL. Key tables include:

- `products` — core product records (product_id PK, company_id tenanting)
- `product_profile` — extended product profile, media JSONB, image_url
- `product_variants` — variant rows linked to products (attributes JSONB, media text)

Migrations are located in the `migrations/` folder. Apply them with the project's migration scripts (see `scripts/` in this module).

## Running Locally
- Start the database (Postgres) and ensure `DATABASE_URL` points to it.
- Run `npm install` in the `START` folder.
- Run migrations: `node scripts/migrate.js` (or use provided tooling).
- Start the server: `npm run dev` or `node src/server.js`.

## API Endpoints (summary)
- `GET /api/products` — list products
- `GET /api/products/:id` — get product (includes `product_profile` and `variants`)
- `POST /api/products` — create product (supports multipart `images` uploads)
- `PUT /api/products/:id` — update product (supports multipart `images` uploads)
- `DELETE /api/products/:id` — delete product

Notes:
- Uploaded files should be sent under the `images` field (array) when using multipart/form-data.
- The server maps uploaded files to `product_profile.image_urls` and `image_url` by default.

## Product Variants & Media
- Variants are stored in `product_variants` with fields: `variant_id`, `sku`, `attributes` (JSONB), `price`, `media` (text), `stock`.
- When creating/updating products from the frontend the client should send `variants` as a JSON array:

```json
[
	{
		"id":"V-...",
		"sku":"SKU-1",
		"attributes": {"color":"Blue","material":"Fabric"},
		"price": 123.45,
		"media":"/uploads/..../file.jpg",
		"stock": 10
	}
]
```

- When using multipart uploads, the frontend currently appends files under `images` and the server stores those as product images. If you want variant-specific image saving, map uploaded files to variants by index or include pre-uploaded URLs in the `variants` JSON.

## Testing
- Unit and integration tests are not bundled by default. To test endpoints manually:

1. Start the server
2. Use a tool like Postman or curl to POST a product JSON or multipart/form-data

Example curl (JSON):

```bash
curl -X POST http://localhost:3000/api/products \
	-H "Content-Type: application/json" \
	-d '{"name":"Test","sku":"TST-1","price":100}'
```

Example multipart upload (images + variants):

```bash
curl -X POST http://localhost:3000/api/products \
	-F "name=Test Product" \
	-F "sku=TP-1" \
	-F "images=@./path/to/img1.jpg" \
	-F "variants=$(printf '%s' '[{"sku":"V1","price":10,"media":""}]')"
```

## Troubleshooting
- If variants are not appearing in GET `/api/products/:id`, ensure:
	- The create/update request included `variants` JSON (or the backend persisted them);
	- For multipart requests, `variants` must be appended as a JSON string field (e.g., `fd.append('variants', JSON.stringify(variants))`).

- Check server logs for SQL errors or transaction rollbacks.

## Contributing
- Fork the repo and create feature branches.
- Run tests and linters before submitting PRs.

## License
This project uses the same license as the parent workspace. Add or replace with your preferred license file.

