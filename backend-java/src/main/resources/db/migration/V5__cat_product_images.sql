-- Point the 5 added cat products at real S3/CloudFront images (were placeholders)
UPDATE products SET image_url='https://dv0xg2r00n59r.cloudfront.net/products/cat-airtag-collar-holder.jpg' WHERE slug='cat-airtag-collar-holder';
UPDATE products SET image_url='https://dv0xg2r00n59r.cloudfront.net/products/cat-travel-bowl.jpg' WHERE slug='cat-travel-bowl';
UPDATE products SET image_url='https://dv0xg2r00n59r.cloudfront.net/products/cat-window-perch.jpg' WHERE slug='cat-window-perch';
UPDATE products SET image_url='https://dv0xg2r00n59r.cloudfront.net/products/cat-grooming-glove.jpg' WHERE slug='cat-grooming-glove';
UPDATE products SET image_url='https://dv0xg2r00n59r.cloudfront.net/products/cat-catnip-kicker.jpg' WHERE slug='cat-catnip-kicker';
