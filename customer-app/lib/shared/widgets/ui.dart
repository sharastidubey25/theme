import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';

/// Minimal v2 building blocks — mirror the classes in design-html/*-v2.html
/// (.btn, .round, .field, .chip, .lab …). Change both together.

/// `.btn` — 54 tall, radius 16, solid orange; grey when disabled.
class FpButton extends StatelessWidget {
  const FpButton({super.key, required this.label, required this.onPressed, this.icon = Icons.arrow_forward_rounded, this.loading = false, this.ghost = false});
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool loading;
  final bool ghost;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null && !loading;
    final bg = ghost ? AppColors.bg2 : (onPressed == null ? AppColors.disabled : AppColors.primary);
    final fg = ghost ? AppColors.ink2 : (onPressed == null ? AppColors.muted : Colors.white);
    return SizedBox(
      height: ghost ? 50 : 54,
      width: double.infinity,
      child: Material(
        color: bg,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: enabled ? onPressed : null,
          child: Center(
            child: loading
                ? SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: fg))
                : Row(mainAxisSize: MainAxisSize.min, children: [
                    Text(label, style: AppText.body(15.5, weight: FontWeight.w600, color: fg, height: 1.2)),
                    if (icon != null && !ghost) ...[const SizedBox(width: 8), Icon(icon, size: 19, color: fg)],
                  ]),
          ),
        ),
      ),
    );
  }
}

/// `.round` — 40px circle with a hairline border.
class RoundIconButton extends StatelessWidget {
  const RoundIconButton({super.key, required this.icon, required this.onTap, this.badge = false, this.tooltip});
  final IconData icon;
  final VoidCallback onTap;
  final bool badge;
  final String? tooltip;

  @override
  Widget build(BuildContext context) {
    final btn = Material(
      color: Colors.white,
      shape: const CircleBorder(side: BorderSide(color: AppColors.line)),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: SizedBox(
          width: 40,
          height: 40,
          child: Stack(alignment: Alignment.center, children: [
            Icon(icon, size: 20, color: AppColors.ink),
            if (badge)
              Positioned(
                top: 9,
                right: 10,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(color: AppColors.primary, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 1.5)),
                ),
              ),
          ]),
        ),
      ),
    );
    return tooltip == null ? btn : Tooltip(message: tooltip!, child: btn);
  }
}

/// `.label` / `.lab` — field label with an optional muted hint on the right.
class FieldLabel extends StatelessWidget {
  const FieldLabel(this.text, {super.key, this.hint, this.top = 20});
  final String text;
  final String? hint;
  final double top;

  @override
  Widget build(BuildContext context) => Padding(
        padding: EdgeInsets.only(top: top, bottom: 8),
        child: Row(children: [
          Expanded(child: Text(text, style: AppText.body(13, weight: FontWeight.w600, color: AppColors.ink2, height: 1.2))),
          if (hint != null) Text(hint!, style: AppText.body(12.5, color: AppColors.muted, height: 1.2)),
        ]),
      );
}

/// `.field` — white input, 1.5px line border; orange border + soft ring on focus.
class FpField extends StatefulWidget {
  const FpField({
    super.key,
    required this.controller,
    this.hint,
    this.prefix,
    this.icon,
    this.suffix,
    this.keyboardType,
    this.maxLength,
    this.digitsOnly = false,
    this.maxLines = 1,
    this.minLines,
    this.error,
    this.onChanged,
    this.onSubmitted,
    this.autofocus = false,
    this.textInputAction = TextInputAction.next,
    this.autofillHints,
    this.textCapitalization = TextCapitalization.none,
    this.showCounter = false,
  });

  final TextEditingController controller;
  final String? hint;
  final Widget? prefix;
  final IconData? icon;
  final Widget? suffix;
  final TextInputType? keyboardType;
  final int? maxLength;
  final bool digitsOnly;
  final int maxLines;
  final int? minLines;
  final String? error;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final bool autofocus;
  final TextInputAction textInputAction;
  final Iterable<String>? autofillHints;
  final TextCapitalization textCapitalization;
  final bool showCounter;

  @override
  State<FpField> createState() => _FpFieldState();
}

class _FpFieldState extends State<FpField> {
  final _focus = FocusNode();

  @override
  void initState() {
    super.initState();
    _focus.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _focus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final on = _focus.hasFocus;
    final err = widget.error != null;
    final multi = widget.maxLines > 1;
    final border = err ? AppColors.error : (on ? AppColors.primary : AppColors.line);
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        constraints: BoxConstraints(minHeight: multi ? 84 : 54),
        padding: EdgeInsets.symmetric(horizontal: 14, vertical: multi ? 10 : 0),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: border, width: 1.5),
          boxShadow: on ? [BoxShadow(color: (err ? AppColors.error : AppColors.primary).withValues(alpha: .10), spreadRadius: 4)] : null,
        ),
        child: Row(crossAxisAlignment: multi ? CrossAxisAlignment.start : CrossAxisAlignment.center, children: [
          if (widget.icon != null) ...[Icon(widget.icon, size: 19, color: AppColors.ink3), const SizedBox(width: 10)],
          if (widget.prefix != null) widget.prefix!,
          Expanded(
            child: TextField(
              controller: widget.controller,
              focusNode: _focus,
              autofocus: widget.autofocus,
              keyboardType: widget.keyboardType ?? (multi ? TextInputType.multiline : null),
              maxLines: widget.maxLines,
              minLines: widget.minLines,
              maxLength: widget.maxLength,
              textInputAction: multi ? TextInputAction.newline : widget.textInputAction,
              textCapitalization: widget.textCapitalization,
              autofillHints: widget.autofillHints,
              inputFormatters: [if (widget.digitsOnly) FilteringTextInputFormatter.digitsOnly],
              onChanged: widget.onChanged,
              onSubmitted: widget.onSubmitted,
              cursorColor: AppColors.primary,
              style: AppText.body(15, color: AppColors.ink, height: 1.4),
              decoration: InputDecoration(
                isDense: true,
                filled: false,
                hintText: widget.hint,
                hintStyle: AppText.body(15, color: AppColors.muted, height: 1.4),
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                errorBorder: InputBorder.none,
                focusedErrorBorder: InputBorder.none,
                counterText: '',
                contentPadding: EdgeInsets.symmetric(vertical: multi ? 4 : 16),
              ),
            ),
          ),
          if (widget.suffix != null) widget.suffix!,
        ]),
      ),
      if (widget.showCounter && widget.maxLength != null)
        Padding(
          padding: const EdgeInsets.only(top: 4),
          child: ValueListenableBuilder(
            valueListenable: widget.controller,
            builder: (_, v, _) => Text('${v.text.length}/${widget.maxLength}', textAlign: TextAlign.right, style: AppText.body(11, color: AppColors.muted)),
          ),
        ),
      if (err)
        Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Text(widget.error!, style: AppText.body(12.5, color: AppColors.error, height: 1.3)),
        ),
    ]);
  }
}

/// `.cc` — India flag + "+91" + divider, used as a phone field prefix.
class PhonePrefix extends StatelessWidget {
  const PhonePrefix({super.key});

  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.only(right: 10),
        padding: const EdgeInsets.only(right: 12),
        decoration: const BoxDecoration(border: Border(right: BorderSide(color: AppColors.line))),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(3),
            child: const SizedBox(
              width: 20,
              height: 14,
              child: Column(children: [
                Expanded(child: ColoredBox(color: Color(0xFFFF9933), child: SizedBox.expand())),
                Expanded(child: ColoredBox(color: Colors.white, child: SizedBox.expand())),
                Expanded(child: ColoredBox(color: Color(0xFF138808), child: SizedBox.expand())),
              ]),
            ),
          ),
          const SizedBox(width: 6),
          Text('+91', style: AppText.body(15, weight: FontWeight.w600, color: AppColors.ink, height: 1.2)),
        ]),
      );
}

/// `.chip` — pill toggle; selected = orange border, peach fill, check icon.
class FpChip extends StatelessWidget {
  const FpChip({super.key, required this.label, required this.selected, required this.onTap, this.icon, this.expand = false});
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final IconData? icon;
  final bool expand;

  @override
  Widget build(BuildContext context) {
    final fg = selected ? AppColors.primary : AppColors.ink2;
    final leading = icon ?? (selected ? Icons.check_rounded : null);
    return Material(
      color: selected ? AppColors.primarySoft : Colors.white,
      shape: StadiumBorder(side: BorderSide(color: selected ? AppColors.primary : AppColors.line, width: 1.5)),
      child: InkWell(
        customBorder: const StadiumBorder(),
        onTap: onTap,
        child: Container(
          height: 36,
          padding: const EdgeInsets.symmetric(horizontal: 14),
          child: Row(mainAxisSize: expand ? MainAxisSize.max : MainAxisSize.min, mainAxisAlignment: MainAxisAlignment.center, children: [
            if (leading != null) ...[Icon(leading, size: 15, color: selected ? AppColors.primary : AppColors.ink3), const SizedBox(width: 6)],
            Flexible(
              child: Text(label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.body(13, weight: selected ? FontWeight.w600 : FontWeight.w500, color: fg, height: 1.2)),
            ),
          ]),
        ),
      ),
    );
  }
}

/// Device illustrations from the website booking popup (assets/images/devices/*.svg).
class DeviceArt extends StatelessWidget {
  const DeviceArt(this.kind, {super.key, this.width = 72});
  final String kind;
  final double width;

  @override
  Widget build(BuildContext context) =>
      SvgPicture.asset('assets/images/devices/$kind.svg', width: width, height: width * .75, fit: BoxFit.contain);
}

/// Soft radio (22px) used on option rows and address cards.
class FpRadio extends StatelessWidget {
  const FpRadio({super.key, required this.on});
  final bool on;

  @override
  Widget build(BuildContext context) => Container(
        width: 22,
        height: 22,
        alignment: Alignment.center,
        decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: on ? AppColors.primary : AppColors.borderStrong, width: 2)),
        child: on ? Container(width: 10, height: 10, decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle)) : null,
      );
}

/// Shows an error/info line at the bottom of the screen.
void showToast(BuildContext context, String message, {bool error = true}) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(
      content: Text(message),
      behavior: SnackBarBehavior.floating,
      backgroundColor: error ? AppColors.ink : AppColors.green,
    ));
}
