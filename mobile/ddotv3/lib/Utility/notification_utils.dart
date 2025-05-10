// notification_utils.dart
import 'package:ddotv3/Utility/language_provider.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:timezone/data/latest.dart' as tz;
import 'package:timezone/timezone.dart' as tz;

final FlutterSecureStorage _storage = FlutterSecureStorage();
// String language = _storage.read(key: 'Language') as String;

Future<void> scheduleFixedTimeNotifications(
    FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin,
    List<String> fixedTimes) async {
  tz.initializeTimeZones();
  final String timeZoneName = 'Asia/Bangkok'; // Set your desired time zone here
  tz.setLocalLocation(tz.getLocation(timeZoneName));

  for (int i = 0; i < fixedTimes.length; i++) {
    final String fixedTime = fixedTimes[i];
    final now = DateTime.now();
    final scheduledTime = tz.TZDateTime(tz.local, now.year, now.month, now.day,
        int.parse(fixedTime.split(':')[0]), int.parse(fixedTime.split(':')[1]));

    const AndroidNotificationDetails androidNotificationDetails =
        AndroidNotificationDetails(
      'your_channel_id',
      'your_channel_name',
      channelDescription: 'your_channel_description',
      importance: Importance.max,
      priority: Priority.high,
    );

    const NotificationDetails notificationDetails =
        NotificationDetails(android: androidNotificationDetails);
    // late String headerText, footerText;
    // if(language == "th"){
    //   headerText = "ถึงเวลาทานยา";
    //   footerText = "กรุณาเปิดแอพและอัดคลิปทานยา";
    // }
    // else{
    //   headerText = "Time to take dose";
    //   footerText = "Please open the app, and record the video";
    // }
    await flutterLocalNotificationsPlugin.zonedSchedule(
      i + 1, // Unique ID for each notification
      "ถึงเวลาทานยา/Time to take dose",
      "กรุณาเปิดแอพและอัดคลิปทานยา \n Please open the app, and record the video",
      scheduledTime,
      notificationDetails,
      androidAllowWhileIdle: true,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
          
    );
  }
}
