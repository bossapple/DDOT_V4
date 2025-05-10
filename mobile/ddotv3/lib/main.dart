// main.dart
import 'package:ddotv3/Page/home_page.dart';
import 'package:ddotv3/Page/login_page.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'dart:async';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'Utility/language_provider.dart';
import 'Utility/notification_utils.dart';
import 'package:camera/camera.dart';
import 'package:permission_handler/permission_handler.dart';

final FlutterSecureStorage _storage = FlutterSecureStorage();
FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
      FlutterLocalNotificationsPlugin();

final String globalVideoURL = "http://10.34.112.53:3500/upload";
final String globalDatabaseURL = "http://10.34.112.53:4000/";
List<CameraDescription> cameras = [];

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Request storage permissions at app startup
  await Permission.storage.request();

  try { 
    cameras = await availableCameras();
  } on CameraException catch (e) {
    print('Error in fetching the cameras: $e');
  }

  // Initialize notifications
  FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
      FlutterLocalNotificationsPlugin();

  const AndroidInitializationSettings androidInitSettings =
      AndroidInitializationSettings('@mipmap/ic_launcher');

  final InitializationSettings initializationSettings =
      InitializationSettings(android: androidInitSettings);

  await flutterLocalNotificationsPlugin.initialize(initializationSettings);

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => LanguageProvider()),
      ],
      child: MyApp(),
    ),
  );

  // Request notification permissions
  await flutterLocalNotificationsPlugin
      .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>()!
      .requestNotificationsPermission();
  
  scheduleNotifications(flutterLocalNotificationsPlugin);
}
  void scheduleNotifications(FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin) async {
  final timesPerDay = 13;
  List<String> userDefinedTimes = [];

  for (int i = 1; i <= timesPerDay; i++) {
    final storedTime = await _storage.read(key: 'time_$i');
    if (storedTime != null && storedTime.isNotEmpty) {
      final List<String> storedTimeParts = storedTime.split('.');
      if (storedTimeParts.length == 2) {
        final int hours = int.parse(storedTimeParts[0]);
        final int minutes = int.parse(storedTimeParts[1]);
        userDefinedTimes.add('$hours:$minutes');
        print(userDefinedTimes);
      }
    }
  }

  await scheduleFixedTimeNotifications(
    flutterLocalNotificationsPlugin,
    userDefinedTimes,
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'd-DOTv4 by MUICT',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
            seedColor: Color.fromARGB(255, 83, 106, 238)),
        useMaterial3: true,
      ),
      home: const LoginPage(),
      // home: const HomePage(),
      debugShowCheckedModeBanner: false,
    );
  }
}
