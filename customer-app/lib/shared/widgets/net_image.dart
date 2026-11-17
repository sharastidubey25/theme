import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Cached network image with a calm placeholder and a broken-image fallback.
class NetImage extends StatelessWidget {
  const NetImage(this.url, {super.key, this.fit = BoxFit.cover, this.width, this.height, this.background = AppColors.gray2});
  final Color background;
  final String url;
  final BoxFit fit;
  final double? width;
  final double? height;

  @override
  Widget build(BuildContext context) => CachedNetworkImage(
        imageUrl: url,
        fit: fit,
        width: width,
        height: height,
        fadeInDuration: const Duration(milliseconds: 250),
        placeholder: (_, _) => ColoredBox(color: background),
        errorWidget: (_, _, _) => ColoredBox(
          color: background,
          child: const Center(child: Icon(Icons.image_outlined, color: AppColors.borderStrong)),
        ),
      );
}
