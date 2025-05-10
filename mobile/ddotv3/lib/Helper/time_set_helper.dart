// time_set_helpers.dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter/material.dart';

  bool isTimeValid(TimeOfDay time) {
    final currentTime = DateTime.now();
    final maxAllowedTime = DateTime(currentTime.year, currentTime.month, currentTime.day, 23, 59);

    // Convert TimeOfDay to DateTime
    final selectedTime = DateTime(currentTime.year, currentTime.month, currentTime.day, time.hour, time.minute);

    // Check if the set time is behind the current time and within the allowed gap
    return selectedTime.isAfter(currentTime) && selectedTime.isBefore(maxAllowedTime);
  }

  void showErrorDialog(BuildContext context, String errorMessage) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text("Error"),
          content: Text(errorMessage),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
              },
              child: Text("OK"),
            ),
          ],
        );
      },
    );
  }

  bool hasDuplicates(List<TimeOfDay> list) {
    Set<TimeOfDay> uniqueTimes = Set<TimeOfDay>();
    for (TimeOfDay time in list) {
      if (uniqueTimes.contains(time)) {
        return true; // Duplicate found
      }
      uniqueTimes.add(time);
    }
    return false; // No duplicates found
  }

  int _timeOfDayToInt(TimeOfDay time) {
    return time.hour * 60 + time.minute;
  }

  Future<void> sortTimesAndAlerts() async {
    final FlutterSecureStorage _secureStorage = FlutterSecureStorage();
    int savedTimesPerDay = int.tryParse(await _secureStorage.read(key: 'times_per_day') ?? '0') ?? 0;

    if (savedTimesPerDay > 0) {
      List<TimeOfDay> loadedSetTimes = [];

      for (int index = 0; index < savedTimesPerDay; index++) {
        String timeKey = 'time_${index + 1}';
        String timeValue = await _secureStorage.read(key: timeKey) ?? '0.0';
        List<String> timeParts = timeValue.split('.');
        int hour = int.tryParse(timeParts[0]) ?? 0;
        int minute = int.tryParse(timeParts[1]) ?? 0;
        loadedSetTimes.add(TimeOfDay(hour: hour, minute: minute));
      }

      loadedSetTimes.sort((a, b) => _timeOfDayToInt(a).compareTo(_timeOfDayToInt(b)));

      // Save the sorted values back to the secure storage
      for (int i = 0; i < loadedSetTimes.length; i++) {
        String timeKey = 'time_${i + 1}';
        String timeValue = '${loadedSetTimes[i].hour}.${loadedSetTimes[i].minute}';
        await _secureStorage.write(key: timeKey, value: timeValue);
      }
    }
  }

