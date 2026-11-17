import '../../core/config/app_config.dart';

num _num(Object? v) => v is num ? v : num.tryParse('$v') ?? 0;

class Product {
  const Product({
    required this.id,
    required this.name,
    required this.slug,
    required this.gallery,
    required this.costPrice,
    required this.sellingPrice,
    required this.discountPercent,
    required this.rating,
    required this.type,
    required this.categoryName,
    required this.brandName,
    required this.stock,
    required this.inCart,
    required this.inWishlist,
  });

  final int id;
  final String name;
  final String slug;
  final List<String> gallery;
  final num costPrice;
  final num sellingPrice;
  final num discountPercent;
  final double rating;
  final String type;
  final String categoryName;
  final String brandName;
  final int stock;
  final bool inCart;
  final bool inWishlist;

  /// First image Flutter can decode (the CDN holds some .avif files, which it can't).
  String get imageUrl {
    final usable = gallery.where((f) => !f.toLowerCase().endsWith('.avif'));
    return CdnPath.url(CdnPath.productGallery, usable.isEmpty ? null : usable.first);
  }
  bool get hasDiscount => discountPercent > 0 && costPrice > sellingPrice;

  factory Product.fromJson(Map<String, dynamic> j) => Product(
        id: _num(j['id']).toInt(),
        name: '${j['product_name'] ?? ''}'.trim(),
        slug: '${j['product_slug'] ?? ''}',
        gallery: (j['product_gallery'] as List?)?.map((e) => '$e').toList() ?? const [],
        costPrice: _num(j['cost_price']),
        sellingPrice: _num(j['effective_selling_price'] ?? j['selling_price']),
        discountPercent: _num(j['discount_percent']),
        rating: _num(j['average_rating']).toDouble(),
        type: '${j['product_type'] ?? ''}',
        categoryName: '${j['product_category_name'] ?? ''}',
        brandName: '${j['brand_name'] ?? ''}',
        stock: _num(j['stock']).toInt(),
        inCart: (j['cart_item'] as List?)?.isNotEmpty ?? false,
        inWishlist: (j['wishlist_item'] as List?)?.isNotEmpty ?? false,
      );
}
