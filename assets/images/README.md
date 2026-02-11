# Images Folder

Store your product images and other image assets here.

## Usage

### For Product Images
When adding products through the vendor dashboard, you can:
1. Use external image URLs (like Unsplash)
2. Upload images to this folder and reference them

### Example
If you place an image called `laptop.jpg` in this folder, reference it as:
```
../assets/images/laptop.jpg
```

## Recommended Image Sources

### Free Stock Photos
- **Unsplash**: https://unsplash.com/ (High quality, free to use)
- **Pexels**: https://www.pexels.com/
- **Pixabay**: https://pixabay.com/

### Product Images
For demo purposes, you can use direct Unsplash URLs in the product image field:
```
https://images.unsplash.com/photo-[id]?w=400
```

## Image Guidelines

- **Recommended size**: 400x400px or larger
- **Format**: JPG, PNG, or WebP
- **File size**: Keep under 500KB for fast loading
- **Aspect ratio**: Square (1:1) works best for product cards

---

Currently, the project uses external Unsplash URLs for demo products. You can replace these with local images by:
1. Placing images in this folder
2. Updating the product image URLs in `/js/main.js` (PRODUCTS_DB array)
