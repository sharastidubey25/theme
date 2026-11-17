import '../../../core/config/app_config.dart';

num _num(Object? v) => v is num ? v : num.tryParse('$v') ?? 0;
int _int(Object? v) => _num(v).toInt();

/// master/product-categories?categoryType=service
class RepairCategory {
  const RepairCategory({required this.id, required this.rawName});
  final int id;
  final String rawName;

  factory RepairCategory.fromJson(Map<String, dynamic> j) =>
      RepairCategory(id: _int(j['id']), rawName: '${j['product_category_name'] ?? ''}'.trim());

  /// "Laptop Repair" → "Laptop", "Networking / LAN Repair" → "Networking", "WI-FI Repair" → "Wi-Fi".
  String get name {
    final n = rawName.replaceAll(RegExp(r'\s*repair\s*$', caseSensitive: false), '').trim();
    final l = n.toLowerCase();
    if (l.startsWith('networking')) return 'Networking';
    if (l.replaceAll('-', '') == 'wifi') return 'Wi-Fi';
    return n;
  }

  /// Website booking-popup illustration (assets/images/devices/KIND.svg).
  String get art {
    final l = rawName.toLowerCase();
    for (final k in const ['apple', 'biometric', 'cctv', 'desktop', 'laptop', 'monitor', 'printer', 'projector', 'server', 'scanner', 'tablet', 'ups']) {
      if (l.contains(k)) return k;
    }
    if (l.contains('network')) return 'network';
    if (l.replaceAll('-', '').contains('wifi')) return 'wifi';
    return 'laptop';
  }

  /// Popular devices first (same order as design-html/05-book-repair-v2.html).
  int get order {
    const o = ['laptop', 'desktop', 'printer', 'cctv', 'apple', 'monitor', 'tablet', 'projector', 'scanner', 'ups', 'wifi', 'network', 'server', 'biometric'];
    final i = o.indexOf(art);
    return i < 0 ? 99 : i;
  }
}

/// master/product-category-brands?productCategoryID=…
class RepairBrand {
  const RepairBrand({required this.id, required this.rawName, required this.logo, required this.order});
  final int id;
  final String rawName;
  final String logo;
  final int order;

  static const other = RepairBrand(id: 0, rawName: 'Other brand', logo: '', order: 9999);

  factory RepairBrand.fromJson(Map<String, dynamic> j) => RepairBrand(
        id: _int(j['brand_id']),
        rawName: '${j['brand_name'] ?? ''}'.trim(),
        logo: '${j['logo'] ?? ''}',
        order: _int(j['display_order']),
      );

  static const _clean = {
    'MSI (Micro-Star International)': 'MSI',
    'Hewlett Packard Enterprise (HPE)': 'HPE',
    'Bosch Security Systems': 'Bosch',
    'Honeywell Security': 'Honeywell',
    'Dahua Technology': 'Dahua',
    'Chrisite': 'Christie',
    'RICOH': 'Ricoh',
  };
  String get name => _clean[rawName] ?? rawName;
  bool get isOther => id == 0;

  /// Clean local logo when the website has one (assets/images/brands), else the CDN logo.
  static const _local = {
    'Dell': 'dell.svg', 'HP': 'hp.svg', 'Lenovo': 'lenovo.svg', 'Asus': 'asus.svg', 'Acer': 'acer.svg',
    'Microsoft': 'microsoft.svg', 'MSI': 'msi.svg', 'Cisco': 'cisco.svg', 'TP-Link': 'tp-link.svg', 'Samsung': 'samsung.svg',
    'Epson': 'epson.svg', 'Brother': 'brother.svg', 'Fujitsu': 'fujitsu.svg', 'HCL': 'hcl.svg', 'CP Plus': 'cp-plus.png',
    'Luminous': 'luminous.png', 'Microtek': 'microtek.svg', 'Zebronics': 'zebronics.png', 'Apple': 'apple.svg',
  };
  String? get localAsset => _local[name] == null ? null : 'assets/images/brands/${_local[name]}';
  String get logoUrl => CdnPath.url('brand_logo/', logo);
}

/// master/services?productCategoryID=…
class RepairService {
  const RepairService({
    required this.id,
    required this.name,
    required this.subServiceId,
    required this.subServiceName,
    required this.price,
    required this.cgst,
    required this.sgst,
    required this.order,
  });
  final int id;
  final String name;
  final int subServiceId;
  final String subServiceName;
  final num price;
  final num cgst;
  final num sgst;
  final int order;

  factory RepairService.fromJson(Map<String, dynamic> j) => RepairService(
        id: _int(j['id']),
        name: '${j['service_name'] ?? ''}'.trim(),
        subServiceId: _int(j['primary_sub_service_id']),
        subServiceName: '${j['primary_sub_service_name'] ?? ''}'.trim(),
        price: _num(j['minimum_service_price']),
        cgst: _num(j['cgst']),
        sgst: _num(j['sgst']),
        order: _int(j['display_order']),
      );
}

/// master/sub-services?serviceFilter=…
class SubService {
  const SubService({required this.id, required this.name, required this.price, required this.cgst, required this.sgst, required this.carbonCredit});
  final int id;
  final String name;
  final num price;
  final num cgst;
  final num sgst;
  final num carbonCredit;

  factory SubService.fromJson(Map<String, dynamic> j) => SubService(
        id: _int(j['id']),
        name: '${j['sub_service_name'] ?? ''}'.trim(),
        price: _num(j['minimum_service_price']),
        cgst: _num(j['cgst']),
        sgst: _num(j['sgst']),
        carbonCredit: _num(j['carbon_credit']),
      );
}

class NamedItem {
  const NamedItem(this.id, this.name);
  final int id;
  final String name;
}

/// profile/customer-addresses row (or one typed in by a guest — id 0).
class ServiceAddress {
  const ServiceAddress({
    required this.id,
    required this.address,
    this.street = '',
    required this.stateId,
    required this.cityId,
    required this.pincode,
    this.stateName = '',
    this.cityName = '',
    this.isDefault = false,
  });
  final int id;
  final String address;
  final String street;
  final int stateId;
  final int cityId;
  final String pincode;
  final String stateName;
  final String cityName;
  final bool isDefault;

  factory ServiceAddress.fromJson(Map<String, dynamic> j) => ServiceAddress(
        id: _int(j['id']),
        address: '${j['address'] ?? ''}'.trim(),
        street: '${j['street'] ?? ''}'.trim(),
        stateId: _int(j['state_id']),
        cityId: _int(j['city_id']),
        pincode: '${j['pincode'] ?? ''}',
        stateName: '${j['state_name'] ?? ''}',
        cityName: '${j['city_name'] ?? ''}',
        isDefault: '${j['is_default']}' == '1' || j['is_default'] == true,
      );

  /// "Jaipur, Rajasthan · 302012"
  String get place => [
        [cityName, stateName].where((s) => s.isNotEmpty).join(', '),
        pincode,
      ].where((s) => s.isNotEmpty).join(' · ');
}
