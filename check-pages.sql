-- Check all pages in the database
SELECT 
  id,
  slug,
  title,
  "isActive",
  "createdAt",
  "updatedAt",
  LENGTH(content) as content_length
FROM pages
ORDER BY "createdAt" DESC;

