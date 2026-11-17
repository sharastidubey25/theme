/// Mirrors `app/config/appConfig.prod.js` from the React Native app.
abstract final class AppConfig {
  static const apiBaseUrl = 'https://api.fixpapa.com/v1/customer/';
  static const cdnBaseUrl = 'https://cdn.fixpapa.com/';
  static const pageSize = 10;
}

/// CDN folders (Config.FilePath in the RN app).
abstract final class CdnPath {
  static const banners = 'banners/';
  static const categoryLogo = 'category_logo/';
  static const productGallery = 'product_gallery/';
  static const testimonialVideoThumbnail = 'testimonial_video_thumbnail/';

  /// File names can contain spaces/parentheses, e.g. `HB57C-EPSON (2).webp`.
  static String url(String folder, String? file) =>
      '${AppConfig.cdnBaseUrl}$folder${Uri.encodeComponent((file == null || file.isEmpty) ? 'default_image.png' : file)}';
}
