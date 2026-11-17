/// Indian-grouped rupee price, e.g. 188000 → ₹1,88,000 (matches the RN app).
String inr(num value) {
  final whole = value.round();
  final neg = whole < 0;
  var s = whole.abs().toString();
  if (s.length > 3) {
    final last3 = s.substring(s.length - 3);
    var rest = s.substring(0, s.length - 3);
    final parts = <String>[];
    while (rest.length > 2) {
      parts.insert(0, rest.substring(rest.length - 2));
      rest = rest.substring(0, rest.length - 2);
    }
    if (rest.isNotEmpty) parts.insert(0, rest);
    s = '${parts.join(',')},$last3';
  }
  return '${neg ? '-' : ''}₹$s';
}
