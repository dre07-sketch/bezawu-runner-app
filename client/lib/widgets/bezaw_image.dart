
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../utils/theme.dart';

class BezawImage extends StatelessWidget {
  final String? imagePath;
  final double? width;
  final double? height;
  final BoxFit fit;
  final Widget? placeholder;
  final Widget? errorWidget;
  final double borderRadius;

  const BezawImage({
    super.key,
    required this.imagePath,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.placeholder,
    this.errorWidget,
    this.borderRadius = 0,
  });

  @override
  Widget build(BuildContext context) {
    if (imagePath == null || imagePath!.isEmpty) {
      return _buildError(context);
    }

    final primaryUrl = AppTheme.formatImageUrl(imagePath);
    final secondaryUrl = imagePath!.startsWith('http') 
        ? imagePath! 
        : '${AppTheme.runnerImageBaseUrl}/${imagePath!.startsWith('/') ? imagePath!.substring(1) : imagePath!}';

    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: CachedNetworkImage(
        imageUrl: primaryUrl,
        width: width,
        height: height,
        fit: fit,
        placeholder: (context, url) => placeholder ?? const Center(child: CircularProgressIndicator(strokeWidth: 2)),
        errorWidget: (context, url, error) {
          // Fallback to secondary URL
          return CachedNetworkImage(
            imageUrl: secondaryUrl,
            width: width,
            height: height,
            fit: fit,
            placeholder: (context, url) => placeholder ?? const Center(child: CircularProgressIndicator(strokeWidth: 2)),
            errorWidget: (context, url, error) => errorWidget ?? _buildError(context),
          );
        },
      ),
    );
  }

  Widget _buildError(BuildContext context) {
    return Container(
      width: width,
      height: height,
      color: Colors.grey.withOpacity(0.1),
      child: Icon(LucideIcons.image, color: Colors.grey.withOpacity(0.5), size: (width ?? 40) * 0.5),
    );
  }
}
