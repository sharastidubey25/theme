import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/network/api_client.dart';
import '../../../core/session/session_controller.dart';
import 'booking_models.dart';

List<Map<String, dynamic>> _rows(Object? data) =>
    ((data is Map ? data['items'] : data) as List? ?? const []).whereType<Map<String, dynamic>>().toList();

/// Book a Repair API — same endpoints and payloads as the RN screens
/// (screens/bookARepair/*.js, services/master.js, services/serviceCall.js).
class BookingRepository {
  BookingRepository(this._api);
  final ApiClient _api;

  Future<List<RepairCategory>> categories() async {
    final data = await _api.get('master', 'product-categories', query: {'categoryType': 'service', 'searchFilter': '', 'highlighted': ''});
    return _rows(data).map(RepairCategory.fromJson).toList()..sort((a, b) => a.order.compareTo(b.order));
  }

  Future<List<RepairBrand>> brands(int categoryId) async {
    final data = await _api.get('master', 'product-category-brands', query: {'searchFilter': '', 'productCategoryID': categoryId, 'categoryType': ''});
    return _rows(data).map(RepairBrand.fromJson).toList()..sort((a, b) => a.order.compareTo(b.order));
  }

  Future<List<RepairService>> services(int categoryId) async {
    final data = await _api.get('master', 'services', query: {'searchFilter': '', 'productCategoryID': categoryId});
    return _rows(data).map(RepairService.fromJson).toList()..sort((a, b) => a.order.compareTo(b.order));
  }

  Future<List<SubService>> subServices(int serviceId) async {
    final data = await _api.get('master', 'sub-services', query: {'serviceFilter': serviceId, 'searchFilter': ''});
    return _rows(data).map(SubService.fromJson).toList();
  }

  Future<List<NamedItem>> states() async {
    final data = await _api.get('master', 'states', query: {'countryID': 101});
    return _rows(data).map((j) => NamedItem((j['id'] as num).toInt(), '${j['state_name'] ?? ''}')).toList();
  }

  Future<List<NamedItem>> cities(int stateId) async {
    final data = await _api.get('master', 'cities', query: {'stateID': stateId, 'countryID': 101});
    return _rows(data).map((j) => NamedItem((j['id'] as num).toInt(), '${j['city_name'] ?? ''}')).toList();
  }

  Future<List<ServiceAddress>> addresses() async {
    final data = await _api.get('profile', 'customer-addresses', query: {'searchFilter': '', 'statusFilter': ''});
    return _rows(data).map(ServiceAddress.fromJson).toList();
  }

  Future<void> addAddress(ServiceAddress a, {required bool isDefault}) => _api.post('profile', 'add-customer-address', body: {
        'address': a.address,
        'street': a.street,
        'formattedAddress': '',
        'compoundAddress': '',
        'lat': '',
        'long': '',
        'cityID': a.cityId,
        'stateID': a.stateId,
        'countryID': 101,
        'pincode': a.pincode,
        'isDefault': isDefault ? 1 : 0,
      });

  /// service-call/create-service-call → returns serviceCallID.
  Future<int> createServiceCall(Map<String, dynamic> body) async {
    final data = await _api.post('service-call', 'create-service-call', body: body);
    final id = data is Map ? data['serviceCallID'] : null;
    return id is num ? id.toInt() : int.tryParse('$id') ?? 0;
  }

  Future<void> uploadImages(int serviceCallId, List<XFile> images) async {
    if (images.isEmpty) return;
    final form = FormData();
    form.fields.add(MapEntry('serviceCallID', '$serviceCallId'));
    for (final f in images) {
      form.files.add(MapEntry('serviceCallImage', await MultipartFile.fromFile(f.path, filename: f.name)));
    }
    await _api.postMultipart('service-call', 'upload-service-call-image', form);
  }
}

final bookingRepositoryProvider = Provider((ref) => BookingRepository(ref.watch(apiClientProvider)));

final repairCategoriesProvider = FutureProvider((ref) => ref.watch(bookingRepositoryProvider).categories());
final repairBrandsProvider = FutureProvider.family<List<RepairBrand>, int>((ref, id) => ref.watch(bookingRepositoryProvider).brands(id));
final repairServicesProvider = FutureProvider.family<List<RepairService>, int>((ref, id) => ref.watch(bookingRepositoryProvider).services(id));
final statesProvider = FutureProvider((ref) => ref.watch(bookingRepositoryProvider).states());
final citiesProvider = FutureProvider.family<List<NamedItem>, int>((ref, id) => ref.watch(bookingRepositoryProvider).cities(id));

/// Saved addresses (empty for guests).
final savedAddressesProvider = FutureProvider<List<ServiceAddress>>((ref) async {
  if (!ref.watch(isLoggedInProvider)) return const [];
  return ref.watch(bookingRepositoryProvider).addresses();
});
