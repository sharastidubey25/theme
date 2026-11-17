import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/app_config.dart';
import '../../../core/network/api_client.dart';
import '../../../shared/models/product.dart';
import 'home_models.dart';

/// Home data — same endpoints and params as the RN home sections.
class HomeRepository {
  HomeRepository(this._api);
  final ApiClient _api;

  // HomeBanner.js ('banner') and HomeServiceBanner.js ('service') → master/site-banners
  Future<List<SiteBanner>> banners(String bannerType) async {
    final data = await _api.get('master', 'site-banners', query: {'bannerType': bannerType});
    return (data as List).map((e) => SiteBanner.fromJson(e)).toList();
  }

  // BookARepair.js → master/product-categories?highlighted=1
  Future<List<ServiceCategory>> highlightedServices() async {
    final data = await _api.get('master', 'product-categories', query: {'categoryType': '', 'searchFilter': '', 'highlighted': 1});
    return (data as List).map((e) => ServiceCategory.fromJson(e)).toList();
  }

  // ClientTestimonial.js → master/testimonials
  Future<List<VideoTestimonial>> videoTestimonials() async {
    final data = await _api.get('master', 'testimonials', query: {'searchFilter': '', 'highlighted': 1, 'reviewType': 'video'});
    return (data as List).map((e) => VideoTestimonial.fromJson(e)).toList();
  }

  /// DealOfTheDay.js (type ''), Refurbished.js ('refurbished'), ProductSale.js ('new').
  Future<List<Product>> products({String type = '', int limit = AppConfig.pageSize}) async {
    final data = await _api.get('product', 'all-products', query: {
      'page': 1, 'limit': limit, 'search': '', 'brand': '', 'category': '', 'type': type, 'price': '',
      'sortBy': 'newest', 'storage': '', 'screen': '', 'screenType': '', 'gpuType': '', 'gpuBrand': '', 'ram': '',
    });
    final items = (data is Map ? data['items'] : data) as List? ?? const [];
    return items.map((e) => Product.fromJson(e)).toList();
  }
}

final homeRepositoryProvider = Provider((ref) => HomeRepository(ref.watch(apiClientProvider)));

final bannersProvider = FutureProvider.family<List<SiteBanner>, String>((ref, type) => ref.watch(homeRepositoryProvider).banners(type));
final highlightedServicesProvider = FutureProvider((ref) => ref.watch(homeRepositoryProvider).highlightedServices());
final testimonialsProvider = FutureProvider((ref) => ref.watch(homeRepositoryProvider).videoTestimonials());

/// Keyed by product `type` filter.
final homeProductsProvider = FutureProvider.family<List<Product>, String>(
  (ref, type) => ref.watch(homeRepositoryProvider).products(type: type),
);
