import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Wallet state notifier — tracks 캐시 잔액 (cash balance).
///
/// The state is a single [int] representing the current balance.
/// Actions:
/// - [credit] adds cash (top-up)
/// - [debit] subtracts cash (spend). Clamps to 0 if insufficient.
///
/// Dev seed value: 45,000원.
class WalletNotifier extends StateNotifier<int> {
  WalletNotifier() : super(45000);

  /// Adds [amount] (must be non-negative) to the balance.
  void credit(int amount) {
    if (amount <= 0) return;
    state = state + amount;
  }

  /// Subtracts [amount] from the balance. If [amount] exceeds the
  /// current balance, the state is clamped to 0 rather than going negative.
  /// Returns `true` if the debit fully succeeded, `false` if clamped.
  bool debit(int amount) {
    if (amount <= 0) return true;
    if (amount > state) {
      state = 0;
      return false;
    }
    state = state - amount;
    return true;
  }

  /// Replaces the balance with [amount]. Useful for refresh-from-server flows.
  void setBalance(int amount) {
    state = amount < 0 ? 0 : amount;
  }
}

/// Exposes the wallet state (int balance) and its notifier.
final walletProvider = StateNotifierProvider<WalletNotifier, int>(
  (ref) => WalletNotifier(),
);
