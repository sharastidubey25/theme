import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:package_info_plus/package_info_plus.dart';

/// Device fields the auth endpoints expect (RN used react-native-device-info).
class DeviceMeta {
  const DeviceMeta({required this.deviceID, required this.deviceIP, required this.deviceType, required this.appVersion});
  final String deviceID;
  final String deviceIP;
  final String deviceType;
  final String appVersion;

  static DeviceMeta? _cache;

  static Future<DeviceMeta> load() async {
    if (_cache != null) return _cache!;
    var id = '';
    var type = '';
    try {
      type = Platform.operatingSystem; // 'android' / 'ios' like RN Platform.OS
      final info = DeviceInfoPlugin();
      if (Platform.isAndroid) {
        id = (await info.androidInfo).id;
      } else if (Platform.isIOS) {
        id = (await info.iosInfo).identifierForVendor ?? '';
      } else if (Platform.isLinux) {
        id = (await info.linuxInfo).machineId ?? '';
      }
    } catch (_) {}

    var version = '';
    try {
      final p = await PackageInfo.fromPlatform();
      version = '${p.version}.${p.buildNumber}';
    } catch (_) {}

    var ip = '';
    try {
      final ifaces = await NetworkInterface.list(type: InternetAddressType.IPv4);
      for (final i in ifaces) {
        for (final a in i.addresses) {
          if (!a.isLoopback) {
            ip = a.address;
            break;
          }
        }
        if (ip.isNotEmpty) break;
      }
    } catch (_) {}

    return _cache = DeviceMeta(deviceID: id, deviceIP: ip, deviceType: type, appVersion: version);
  }
}
