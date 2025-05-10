import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class LanguageProvider extends ChangeNotifier {
  final FlutterSecureStorage _storage = FlutterSecureStorage();

  String _language = "th";

  LanguageProvider() {
    // Check if language is already stored in secure storage
    _getLanguageFromSecureStorage().then((storedLanguage) {
      if (storedLanguage != null) {
        _language = storedLanguage;
        notifyListeners();
      }
    });
  }

  String get language => _language;

  void setLanguage(String newLanguage) async {
    _language = newLanguage;
    // Save the new language to secure storage
    await _saveLanguageToSecureStorage(newLanguage);
    notifyListeners();
  }

  Future<String?> _getLanguageFromSecureStorage() async {
    return await _storage.read(key: 'Language');
  }

  Future<void> _saveLanguageToSecureStorage(String language) async {
    await _storage.write(key: 'Language', value: language);
  }
}

String getCurrentLanguage(BuildContext context) {
  return context.read<LanguageProvider>().language;
}
