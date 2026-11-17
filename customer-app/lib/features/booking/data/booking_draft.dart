import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import 'booking_models.dart';

/// Everything picked so far in the Book a Repair flow (RN passed these as route params).
class BookingDraft {
  const BookingDraft({
    this.category,
    this.brand,
    this.brandSkipped = false,
    this.service,
    this.title = '',
    this.tags = const {},
    this.description = '',
    this.images = const [],
    this.address,
    this.date,
    this.slot,
    this.altName = '',
    this.altMobile = '',
  });

  final RepairCategory? category;
  final RepairBrand? brand;

  /// The category has a single brand (e.g. Apple), so the brand step was skipped.
  final bool brandSkipped;
  final RepairService? service;
  final String title;
  final Set<String> tags;
  final String description;
  final List<XFile> images;
  final ServiceAddress? address;
  final DateTime? date;

  /// API value, e.g. "01:00PM - 03:00PM".
  final String? slot;
  final String altName;
  final String altMobile;

  BookingDraft copyWith({
    RepairCategory? category,
    RepairBrand? brand,
    bool? brandSkipped,
    RepairService? service,
    bool clearService = false,
    String? title,
    Set<String>? tags,
    String? description,
    List<XFile>? images,
    ServiceAddress? address,
    DateTime? date,
    String? slot,
    bool clearSlot = false,
    String? altName,
    String? altMobile,
  }) =>
      BookingDraft(
        category: category ?? this.category,
        brand: brand ?? this.brand,
        brandSkipped: brandSkipped ?? this.brandSkipped,
        service: clearService ? null : service ?? this.service,
        title: title ?? this.title,
        tags: tags ?? this.tags,
        description: description ?? this.description,
        images: images ?? this.images,
        address: address ?? this.address,
        date: date ?? this.date,
        slot: clearSlot ? null : slot ?? this.slot,
        altName: altName ?? this.altName,
        altMobile: altMobile ?? this.altMobile,
      );
}

class BookingDraftController extends StateNotifier<BookingDraft> {
  BookingDraftController() : super(const BookingDraft());

  void start() => state = const BookingDraft();

  /// New device → forget brand and problem (and the issue chips, which are per device).
  void setCategory(RepairCategory c) {
    if (state.category?.id == c.id) return;
    state = BookingDraft(address: state.address, date: state.date, slot: state.slot, category: c);
  }

  void setBrand(RepairBrand b, {bool skipped = false}) => state = state.copyWith(brand: b, brandSkipped: skipped);
  void setService(RepairService s) => state = state.copyWith(service: s);
  void update(BookingDraft Function(BookingDraft d) f) => state = f(state);
}

final bookingDraftProvider = StateNotifierProvider<BookingDraftController, BookingDraft>((_) => BookingDraftController());
