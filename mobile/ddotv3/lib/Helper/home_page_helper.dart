// home_page_helper.dart

import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';


  final FlutterSecureStorage _storage = FlutterSecureStorage();

  Future<int> getTimesPerDay() async {
    final timesPerDayString = await _storage.read(key: 'times_per_day');
    return int.tryParse(timesPerDayString ?? '') ?? 0;
  }

  Future<List<DateTime>> getMedicationTimes() async {
    final timesPerDay = await getTimesPerDay();

    List<DateTime> medicationTimes = [];

    for (int i = 1; i <= timesPerDay; i++) {
      final storedTime = await _storage.read(key: 'time_$i');
      if (storedTime != null && storedTime.isNotEmpty) {
        final List<String> storedTimeParts = storedTime.split('.');
        if (storedTimeParts.length == 2) {
          final int hours = int.parse(storedTimeParts[0]);
          final int minutes = int.parse(storedTimeParts[1]);
          final DateTime time =
              DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day, hours, minutes);
          medicationTimes.add(time);
        }
      }
    }

    // Sort the medication times in ascending order
    medicationTimes.sort((a, b) => a.compareTo(b));

    return medicationTimes;
  }

  Future<void> updateNearestTime(Function() setStateCallback) async {
    final nearestTime = await getNearestTime();
    setStateCallback();
  }

  Future<DateTime> getNearestTime() async {
    final List<DateTime> medicationTimes = await getMedicationTimes();

    // Find the nearest upcoming medication time
    DateTime? nearestTime;
    for (final time in medicationTimes) {
      if (time.isAfter(DateTime.now())) {
        nearestTime = time;
        break;
      }
    }

    // If no upcoming time is found, use the first time of the next day
    if (nearestTime == null) {
      nearestTime = DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day + 1,
          medicationTimes.first.hour, medicationTimes.first.minute);
    }

    return nearestTime;
  }

  Future<int> calculateEndTime() async {
    final DateTime nearestTime = await getNearestTime();
    final Duration difference = nearestTime.difference(DateTime.now());

    // Optionally, you can update the nearest time every minute
    const Duration updateInterval = Duration(minutes: 1);
    Future.delayed(updateInterval, () => updateNearestTime(() {}));
    
    return nearestTime.millisecondsSinceEpoch;
  }

  
