import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/utils/format.dart';
import '../models/product.dart';
import 'net_image.dart';

/// Product tile used in home rails and listings.
class ProductCard extends StatelessWidget {
  const ProductCard({
    super.key,
    required this.product,
    required this.onTap,
    required this.onAddToCart,
    required this.onWishlist,
    this.width = 172,
  });

  final Product product;
  final VoidCallback onTap;
  final VoidCallback onAddToCart;
  final VoidCallback onWishlist;
  final double width;

  @override
  Widget build(BuildContext context) {
    final p = product;
    return SizedBox(
      width: width,
      child: Material(
        color: AppColors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg - 4),
          side: const BorderSide(color: AppColors.border),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Image well
                AspectRatio(
                  aspectRatio: 1,
                  child: Container(
                    decoration: BoxDecoration(color: AppColors.white, borderRadius: BorderRadius.circular(AppRadius.md)),
                    child: Stack(children: [
                      Positioned.fill(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: NetImage(p.imageUrl, fit: BoxFit.contain, background: AppColors.white),
                        ),
                      ),
                      if (p.hasDiscount)
                        Positioned(
                          left: 8,
                          top: 8,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                            decoration: BoxDecoration(color: AppColors.navy, borderRadius: BorderRadius.circular(6)),
                            child: Text('-${p.discountPercent.round()}%',
                                style: AppText.mono(10.5, color: Colors.white, weight: FontWeight.w500)),
                          ),
                        ),
                      Positioned(
                        right: 6,
                        top: 6,
                        child: _RoundIcon(
                          icon: p.inWishlist ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                          color: p.inWishlist ? AppColors.primary : AppColors.ink2,
                          onTap: onWishlist,
                        ),
                      ),
                    ]),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(4, 10, 4, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Expanded(
                          child: Text(p.brandName.isEmpty ? p.categoryName : p.brandName,
                              maxLines: 1, overflow: TextOverflow.ellipsis, style: AppText.mono(10.5, color: AppColors.ink3)),
                        ),
                        if (p.rating > 0) ...[
                          const Icon(Icons.star_rounded, size: 14, color: AppColors.primary2),
                          const SizedBox(width: 2),
                          Text(p.rating.toStringAsFixed(1), style: AppText.body(11.5, weight: FontWeight.w600, color: AppColors.ink2)),
                        ],
                      ]),
                      const SizedBox(height: 4),
                      SizedBox(
                        height: 36,
                        child: Text(p.name,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: AppText.body(13, weight: FontWeight.w500, color: AppColors.ink, height: 1.38)),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (p.hasDiscount)
                                  Text(inr(p.costPrice),
                                      style: AppText.body(11, color: AppColors.ink3)
                                          .copyWith(decoration: TextDecoration.lineThrough, decorationColor: AppColors.ink3))
                                else
                                  const SizedBox(height: 16),
                                FittedBox(
                                  fit: BoxFit.scaleDown,
                                  alignment: Alignment.centerLeft,
                                  child: Text(inr(p.sellingPrice), style: AppText.head(16, color: AppColors.ink)),
                                ),
                              ],
                            ),
                          ),
                          _AddButton(added: p.inCart, onTap: onAddToCart),
                        ],
                      ),
                      const SizedBox(height: 4),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RoundIcon extends StatelessWidget {
  const _RoundIcon({required this.icon, required this.color, required this.onTap});
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Material(
        color: AppColors.gray2,
        shape: const CircleBorder(),
        elevation: 0,
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: onTap,
          child: Padding(padding: const EdgeInsets.all(6), child: Icon(icon, size: 16, color: color)),
        ),
      );
}

class _AddButton extends StatelessWidget {
  const _AddButton({required this.added, required this.onTap});
  final bool added;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Tooltip(
        message: added ? 'In cart' : 'Add to cart',
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: added ? null : AppColors.gradPrimary,
            color: added ? AppColors.greenSoft : null,
            shape: BoxShape.circle,
          ),
          child: Material(
            type: MaterialType.transparency,
            child: InkWell(
              customBorder: const CircleBorder(),
              onTap: onTap,
              child: SizedBox(
                width: 36,
                height: 36,
                child: Icon(added ? Icons.check_rounded : Icons.add_shopping_cart_rounded,
                    size: 18, color: added ? AppColors.green : Colors.white),
              ),
            ),
          ),
        ),
      );
}
