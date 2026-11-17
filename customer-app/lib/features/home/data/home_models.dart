import '../../../core/config/app_config.dart';

class SiteBanner {
  const SiteBanner({required this.id, required this.image, required this.alt, this.link});
  final int id;
  final String image;
  final String alt;
  final String? link;

  factory SiteBanner.fromJson(Map<String, dynamic> j) => SiteBanner(
        id: j['id'] as int,
        // Same fallback order as HomeBanner.js
        image: CdnPath.url(CdnPath.banners, (j['app_banner'] ?? j['desktop_responsive_banner']) as String?),
        alt: '${j['banner_alt'] ?? ''}',
        link: j['app_link'] as String?,
      );
}

class ServiceCategory {
  const ServiceCategory({required this.id, required this.name, required this.icon});
  final int id;
  final String name;
  final String icon;

  factory ServiceCategory.fromJson(Map<String, dynamic> j) => ServiceCategory(
        id: j['id'] as int,
        name: '${j['product_category_name'] ?? ''}',
        icon: CdnPath.url(CdnPath.categoryLogo, j['icon'] as String?),
      );
}

class VideoTestimonial {
  const VideoTestimonial({required this.id, required this.title, required this.by, required this.thumbnail, required this.videoUrl});
  final int id;
  final String title;
  final String by;
  final String thumbnail;
  final String videoUrl;

  factory VideoTestimonial.fromJson(Map<String, dynamic> j) => VideoTestimonial(
        id: j['id'] as int,
        title: '${j['about'] ?? j['comments'] ?? ''}',
        by: '${j['submitted_by'] ?? ''}',
        thumbnail: _thumb(j['video_thumbnail'] as String?, '${j['video_file'] ?? ''}'),
        videoUrl: '${j['video_file'] ?? ''}',
      );

  /// CDN thumbnail, else YouTube's own (from youtu.be/ID or ?v=ID).
  static String _thumb(String? file, String video) {
    if (file != null && file.isNotEmpty) return CdnPath.url(CdnPath.testimonialVideoThumbnail, file);
    final u = Uri.tryParse(video);
    final id = u == null ? null : (u.queryParameters['v'] ?? (u.host.contains('youtu.be') && u.pathSegments.isNotEmpty ? u.pathSegments.first : null));
    return id == null ? CdnPath.url(CdnPath.testimonialVideoThumbnail, null) : 'https://img.youtube.com/vi/$id/mqdefault.jpg';
  }
}
