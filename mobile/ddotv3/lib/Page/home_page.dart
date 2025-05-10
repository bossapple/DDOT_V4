import 'dart:io';

import 'package:ddotv3/Utility/API_fetch.dart';
import 'package:ddotv3/Utility/Bluetooth/ChatPage.dart';
import 'package:ddotv3/Utility/Bluetooth/SelectBondedDevicePage.dart';
import 'package:flutter_bluetooth_serial/flutter_bluetooth_serial.dart';
import 'package:flutter_countdown_timer/flutter_countdown_timer.dart';
import 'package:flutter_countdown_timer/current_remaining_time.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'setting_page.dart';
import 'time_set_page.dart';
import 'side_effect_page.dart';
import 'color_blind_test_page.dart';
import 'package:provider/provider.dart';
import '../Utility/language_provider.dart';
import 'monthly_report.dart';
import 'package:ddotv3/Helper/home_page_helper.dart';
import 'dart:async';
import 'package:intl/intl.dart';
import '../Camera/patient_camera_page.dart';
import '../Camera/patient_camera_page_start.dart';
import '../Camera/screens/file_explorer.dart';
import 'package:path_provider/path_provider.dart';
import 'package:provider/provider.dart';
import '../Utility/Bluetooth/MainPage.dart';
import 'package:permission_handler/permission_handler.dart';

class HomePage extends StatefulWidget {
  const HomePage({Key? key}) : super(key: key);

  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> with TickerProviderStateMixin {
  late Timer _circleUpdateTimer;
  late List<String> days;
  late List<AnimationController> controllers;
  late int timesPerDay;
  final FlutterSecureStorage _storage = FlutterSecureStorage();
  late Timer _timer;
  List<Map<String, dynamic>> observationDetails = [];
  // Set default status for each day
  String sun_status = "";
  String mon_status = "";
  String tue_status = "";
  String wed_status = "";
  String thur_status = "";
  String fri_status = "";
  String sat_status = "";
  late String time_set, take_video, color_blind, side_effect, pill_status, no_time, upload_button, popup_header, popup_desc, close,
        instruction, take_today, not_taken, fill_slot, filled_slot, next_dose, num_dose, current_day_desc, pillbox_button, start_button;

  String? username = 'Loading...';
  @override
  void initState() {
    super.initState();
    _requestStoragePermission();
    // _startCircleUpdateTimer();
    controllers = List.generate(7, (index) {
      final controller = AnimationController(
        vsync: this,
        duration: const Duration(seconds: 1),
      );
      controller.repeat(reverse: true);
      return controller;
    });
    calculateStatus();
    _loadStatusFromStorage();
    _loadData();
    _fetchObservationDetails();
     _timer = Timer.periodic(Duration(seconds: 15), (Timer timer) {
      if (mounted) {
        setState(() {});
      }
    });
    checkForMp4Files();
  }
  _loadStatusFromStorage() async {
    sun_status = await _storage.read(key: 'sun_status') ?? "test";
    mon_status = await _storage.read(key: 'mon_status') ?? "test";
    tue_status = await _storage.read(key: 'tue_status') ?? "test";
    wed_status = await _storage.read(key: 'wed_status') ?? "test";
    thur_status = await _storage.read(key: 'thur_status') ?? "test";
    fri_status = await _storage.read(key: 'fri_status') ?? "test";
    sat_status = await _storage.read(key: 'sat_status') ?? "test";
    setState(() {});
  }
  @override
  void dispose() {
    for (var controller in controllers) {
      controller.dispose();
    }
    _timer.cancel();
    super.dispose();
  }

  


  _loadData() async {
    timesPerDay = await _getTimesPerDay();
    // Fetch user data including first name and last name
    final storedCid = await _storage.read(key: 'cid');
    if (storedCid != null) {
      final result = await getGraphQLData('''
        query ExampleQuery {
          getUserInfo(cid: "$storedCid") {
            Firstname
            Lastname
          }
        }
      ''', {});

      if (result.state == GraphQLResultState.success) {
        final userInfo = result.data!['getUserInfo'];
        String firstname = userInfo['Firstname'];
        String lastname = userInfo['Lastname'];
        username = '$firstname $lastname';
      } else {
        print('Error fetching user data: ${result.error}');
      }
    }

    
    if (mounted) {
      setState(() {});
    }

  }
  
  Future<void> _fetchObservationDetails() async {
  final storedCid = await FlutterSecureStorage().read(key: 'cid');
  final storedObserverCid = await FlutterSecureStorage().read(key: 'observerCID');
  if (storedCid != null && storedObserverCid == null) {
    final result = await getGraphQLData('''
      query ObservationDetailsQuery {
        getObservationDetails(cid: "$storedCid") {
          registeredBy
        }
      }
    ''', {});
    if (result.state == GraphQLResultState.success) {
      setState(() {
        // Explicitly cast the List<Object?> to List<Map<String, dynamic>>
        observationDetails = (result.data!['getObservationDetails'] as List<Object?>)
            .map((item) => item as Map<String, dynamic>)
            .toList();
      });
      // Save observerCID to secure storage
      final observerCID = observationDetails.isNotEmpty
          ? observationDetails.first['registeredBy'] ?? ''
          : '';
      if (observerCID.isNotEmpty) {
        await FlutterSecureStorage().write(key: 'observerCID', value: observerCID);
        print("Saved observerCID");
      }
    } else {
      print('Error fetching observation details: ${result.error}');
    }
  }
  }

  Color dayColor(String status) {
    if (status == "filled_in") {
      return Colors.green;
    } else if (status == "not_eaten") {
      return Colors.grey;
    } else if (status == "fill_in") {
      // return Colors.yellow;
      return Colors.grey;
    } else if (status == "test"){
      return Colors.grey;
    }
    else {
      return Colors.grey;
    }
  }

  String getStatusForDay(int dayIndex) {
    switch (dayIndex) {
      case 0:
        return sun_status;
      case 1:
        return mon_status;
      case 2:
        return tue_status;
      case 3:
        return wed_status;
      case 4:
        return thur_status;
      case 5:
        return fri_status;
      case 6:
        return sat_status;
      default:
        return "filled_in";
    }
  }

  Future<void> checkForMp4Files() async {
    final directory = await getApplicationDocumentsDirectory();
    List<FileSystemEntity> fileList = await directory.list().toList();

    for (var file in fileList) {
      if (file.path.endsWith('.mp4')) {
        setState(() {
          print("OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO");
          showPopup(context);
        });
        return; // If found at least one .mp4 file, no need to continue checking
      }
    }
  }
  void showPopup(BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text(popup_header),
          content: Text(popup_desc),
          actions: <Widget>[
            TextButton(
              onPressed: () {
                Navigator.of(context).pop(); // Close the dialog
              },
              child: Text(close),
            ),
          ],
        );
      },
    );
  }
  void update_text(String language){
    if (language == "th") {
      time_set = "ตั้งเวลา";
      take_video = "อัดวีดีโอ";
      color_blind = "ตาบอดสี";
      side_effect = "ผลข้างเคียง";
      pill_status = "สถานะกล่องยา";
      instruction = "สัญญาณไฟสถานะกล่องยา";
      take_today = "ทานวันนี้";
      not_taken = "ไม่มียาในช่อง";
      fill_slot = "กรุณาเติมยา";
      filled_slot = "มียาในช่อง";
      next_dose = "ทานครั้งถัดไปเวลา:";
      num_dose = "จำนวนครั้งในวันนี้:";
      days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์'];
      current_day_desc = "วงกลมสีขาว = วันนี้";
      no_time = "โปรดตั้งเวลา";
      upload_button = "ส่งวีดีโอ";
      pillbox_button = "กล่องยา";
      popup_header = "คุณมีวีดีโอที่ยังไม่ส่ง";
      popup_desc = "โปรดไปที่หน้าส่งวีดีโอและทำการส่งวีดีโอ";
      close = "ปิด";
      start_button = "เริ่ม";
    } else {
      time_set = "Time Set";
      take_video = "Take Video";
      color_blind = "Colorblind";
      side_effect = "Side Effect";
      pill_status = "Pillbox Status";
      instruction = "Instruction";
      take_today = "Take today";
      not_taken = "No pills in slot";
      fill_slot = "Fill slot";
      filled_slot = "Pills in slot";
      next_dose = "Next dose at:";
      num_dose = "No. of times today:";
      days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      current_day_desc = "White circle = today";
      no_time = "Please Set The Time";
      upload_button = "Upload Video";
      pillbox_button = "Pillbox";
      popup_header = "You have videos that haven't been uploaded";
      popup_desc = "Please click the send video button and upload the video.";
      close = "Close";
      start_button = "START";
    }
  }
  @override
  Widget build(BuildContext context) {
    String language = context.read<LanguageProvider>().language;
    update_text(language);
    
    return Scaffold(
    body: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: double.infinity,
          color: Theme.of(context).colorScheme.primary,
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Left side: "d-DOTv4 by MUICT"
                Text(
                  'd-DOTv4 by MUICT',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold,fontSize: 16),
                ),
                // Right side: Username
                Text(
                  username!,
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                ),
              ],
            ),
          ),
        ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Text(
                  pill_status,
                  style: TextStyle(fontSize: 18.0, fontWeight: FontWeight.bold),
                ),
                SizedBox(width: 8.0),
                // Add gray text next to the pill status
                Text(
                  current_day_desc, // Replace with your actual gray text
                  style: TextStyle(fontSize: 16.0, color: Colors.grey),
                ),
              ],
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              for (var i = 0; i < 7; i++) 
                _buildCircleWithText(
                  days[i % 7], // Adjust index to cycle through days array
                  dayColor(getStatusForDay(i % 7)), // Same adjustment for color
                  () {
                    // print('i: $i, ${days[i % 7]}, system weekday: ${DateTime.now().weekday}');
                    return i == DateTime.now().weekday;
                  }(),
                )
            ],
          ),


          SizedBox(height: 10.0),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Text(
                  instruction,
                  style: TextStyle(fontSize: 18.0, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          SizedBox(height: 10.0),
          // New Row for Circles with Texts
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildCircleWithText(not_taken, Colors.grey, false),
              _buildCircleWithText(filled_slot, Colors.green, false),
            ],
          ),
          SizedBox(height: 10.0),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(next_dose),
                  FutureBuilder<DateTime>(
                    future: getNearestTime(),
                    builder: (context, snapshot) {
                      if (snapshot.hasError) {
                        return Text('??:??');
                      } else if (snapshot.connectionState == ConnectionState.waiting) {
                        return CircularProgressIndicator();
                      } else {
                        // Use the retrieved value
                        final nearestTime = snapshot.data;
                        final formattedTime = nearestTime != null
                            ? DateFormat.Hm().format(nearestTime)
                            : 'N/A'; // Replace 'N/A' with your desired default text
                        return Text(formattedTime);
                      }
                    },
                  ),
                ],
              ),
              SizedBox(width: 32.0), // Add a big space between Text(next_dose) and Text(num_dose)
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(num_dose),
                  FutureBuilder<int>(
                    future: _getTimesPerDay(),
                    builder: (context, snapshot) {
                      if (snapshot.hasError) {
                        return Text('Error: ${snapshot.error}');
                      } else {
                        return Text(snapshot.data?.toString() ?? ''); // Use the retrieved value
                      }
                    },
                  ),
                ],
              ),
            ],
          ),
          // Countdown Timer
          Center(
            child: Padding(
              padding: const EdgeInsets.only(top: 10.0),
              child: FutureBuilder<int>(
                future: _calculateEndTime(),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const CircularProgressIndicator(); // or any loading indicator
                  } else if (snapshot.hasError) {
                    // Display "Please set the time" instead of the error message
                    return Text(no_time);
                  } else {
                    final endTime = snapshot.data ?? DateTime.now().millisecondsSinceEpoch;

                    // Check if endTime is greater than 0 (meaning there is valid time data)
                    if (endTime > 0) {
                      return CountdownTimer(
                        endTime: endTime,
                        widgetBuilder: (_, CurrentRemainingTime? time) {
                          if (time == null) {
                            return const SizedBox.shrink();
                          }

                          // Format hours, minutes, and seconds to ensure two digits
                          String formattedHours = time.hours == null ? '00' : time.hours!.toString().padLeft(2, '0');
                          String formattedMinutes = time.min == null ? '00' : time.min!.toString().padLeft(2, '0');
                          String formattedSeconds = time.sec == null ? '00' : time.sec!.toString().padLeft(2, '0');

                          return Text(
                            '$formattedHours:$formattedMinutes:$formattedSeconds',
                            style: TextStyle(fontSize: 48),
                          );
                        },
                      );
                    } else {
                      // Display "Please set the time" when there is no valid time data
                      return Text(no_time);
                    }
                  }
                },
              ),
            ),
          ),
          SizedBox(height: 10.0),
          // Row for "Time Set" and "Take Dose"

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              SizedBox(
                width: 150.0, // Adjust the width as needed
                height: 60.0, // Adjust the height as needed
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => TimeSetPage()),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10.0), // Adjust the value as needed
                    ),
                    padding: EdgeInsets.symmetric(horizontal: 20.0, vertical: 20.0),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.access_time, size: 20.0, color: Colors.white),
                      SizedBox(width: 8.0),
                      Text(time_set, style: TextStyle(fontSize: 16.0, color: Colors.white)),
                    ],
                  ),
                ),
              ),
              SizedBox(
                width: 150.0, // Adjust the width as needed
                height: 60.0, // Adjust the height as needed
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => CameraPage()),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10.0), // Adjust the value as needed
                    ),
                    padding: EdgeInsets.symmetric(horizontal: 20.0, vertical: 20.0),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.videocam, size: 20.0, color: Colors.white),
                      SizedBox(width: 8.0),
                      Text(take_video, style: TextStyle(fontSize: 16.0, color: Colors.white)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 20.0),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              SizedBox(
                width: 150.0, // Adjust the width as needed
                height: 60.0, // Adjust the height as needed
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => CBtestPage()),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10.0), // Adjust the value as needed
                    ),
                    padding: EdgeInsets.symmetric(horizontal: 20.0, vertical: 20.0),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.remove_red_eye, size: 20.0, color: Colors.white),
                      SizedBox(width: 8.0),
                      Text(color_blind, style: TextStyle(fontSize: 16.0, color: Colors.white)),
                    ],
                  ),
                ),
              ),
              SizedBox(
                width: 150.0, // Adjust the width as needed
                height: 60.0, // Adjust the height as needed
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => SideEffectPage()),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10.0), // Adjust the value as needed
                    ),
                    padding: EdgeInsets.symmetric(horizontal: 20.0, vertical: 20.0),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.report, size: 20.0, color: Colors.white),
                      SizedBox(width: 8.0),
                      Text(side_effect, style: TextStyle(fontSize: 16.0, color: Colors.white)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 20.0),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround, // Aligns the button to the center
            children: [
              SizedBox(
                width: 150.0, // Adjust the width as needed
                height: 60.0, // Adjust the height as needed
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => FileExplorer()),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10.0), // Adjust the value as needed
                    ),
                    padding: EdgeInsets.symmetric(horizontal: 20.0, vertical: 20.0),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.upload, size: 20.0, color: Colors.white),
                      SizedBox(width: 8.0),
                      Text(upload_button, style: TextStyle(fontSize: 13.0, color: Colors.white)),
                    ],
                  ),
                ),
              ),
              SizedBox(
                width: 150.0, // Adjust the width as needed
                height: 60.0, // Adjust the height as needed
                child: ElevatedButton(
                  onPressed: () async {
                    // Navigator.push(
                    //   context,
                    //   MaterialPageRoute(builder: (context) => MainPage()),
                    // );
                    final BluetoothDevice? selectedDevice =
                          await Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) {
                            return SelectBondedDevicePage(
                                checkAvailability: false);
                          },
                        ),
                      );

                      if (selectedDevice != null) {
                        print('Connect -> selected ' +
                            selectedDevice.address);
                        _startChat(context, selectedDevice);
                      } else {
                        print('Connect -> no device selected');
                      }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10.0), // Adjust the value as needed
                    ),
                    padding: EdgeInsets.symmetric(horizontal: 20.0, vertical: 20.0),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.bluetooth, size: 20.0, color: Colors.white),
                      SizedBox(width: 8.0),
                      Text(pillbox_button, style: TextStyle(fontSize: 16.0, color: Colors.white)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 20.0),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround, // Aligns the button to the center
            children: [
              SizedBox(
                width: 150.0, // Adjust the width as needed
                height: 60.0, // Adjust the height as needed
                child: ElevatedButton(
                  onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => CameraPage_start()),
                  );
                  },
                  style: ElevatedButton.styleFrom(
                  backgroundColor: Theme.of(context).colorScheme.primary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10.0), // Adjust the value as needed
                  ),
                  padding: EdgeInsets.symmetric(horizontal: 20.0, vertical: 20.0),
                  ),
                  child: Center( // Center the content
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center, // Center the row content
                    children: [
                    Icon(Icons.start, size: 20.0, color: Colors.white),
                    SizedBox(width: 8.0),
                    Text(start_button, style: TextStyle(fontSize: 13.0, color: Colors.white)),
                    ],
                  ),
                  ),
                ),
              )
             
            ],
          ),

          
          Expanded(
            child: Container(
            ),
          ),
          Container(
            width: double.infinity,
            color: Theme.of(context).colorScheme.primary,
            padding: const EdgeInsets.all(16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                IconButton(
                  onPressed: () {
                    // Handle eye icon tap
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => MonthlyReportPage()),
                    );
                  },
                  icon: Icon(Icons.calendar_month, color: Colors.white),
                ),
                IconButton(
                  onPressed: () {
                    // Handle home icon tap
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => HomePage()),
                    );
                  },
                  icon: Icon(Icons.home, color: Colors.white),
                ),
                IconButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => SettingPage()),
                    );
                  },
                  icon: Icon(Icons.settings, color: Colors.white),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  void _startChat(BuildContext context, BluetoothDevice server) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) {
          return ChatPage(server: server);
        },
      ),
    );
  }
  Widget _buildCircleWithText(String text, Color color, bool isCurrentDay) {
    return Column(
      children: [
        Container(
          width: 40.0,
          height: 40.0,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: color,
          ),
          // Add a rectangular border around the circle for the current day
          child: isCurrentDay
              ? Padding(
                  padding: EdgeInsets.all(4.0), // Adjust the margin as needed
                  child: Container(
                    width: 40.0,
                    height: 40.0,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: Colors.white,
                        width: 2.0,
                      ),
                    ),
                  ),
                )
              : null,
        ),
        SizedBox(height: 4.0),
        Text(
          text,
          style: TextStyle(fontSize: 12.0),
        ),
      ],
    );
  }

  Future<int> _getTimesPerDay() async {
    return getTimesPerDay();
  }

  Future<int> _calculateEndTime() async {
    return calculateEndTime();
  }

  Future<void> calculateStatus() async {
    // await _storage.write(key: 'pillbox_data', value: "1000111111111111");
    String? stored_data = await _storage.read(key: 'pillbox_data');
    print("Stored data: $stored_data");
    // for (var i = stored_data!.length ; i < 16 ; i++) {
    //   stored_data = '0' + stored_data!;
    //   // print(stored_data);
    // }

    //01111111 01111111 (first 8 digits are IR, second 8 digits are Reed)
    if (stored_data != null){
      String irDigits = stored_data.substring(1, 10).trim();
      List<String> statusDigits = irDigits.runes.map((rune) => String.fromCharCode(rune)).toList();
      print("irDigits: $irDigits");
      print("statusDigits: $statusDigits");
      print("statusDigits[7] Sunday: ${statusDigits[7]}");
      print("statusDigits[1] Saturday: ${statusDigits[1]}");
      print("statusDigits[2] Friday: ${statusDigits[2]}");
      print("statusDigits[3] Thursday: ${statusDigits[3]}");
      print("statusDigits[4] Wednesday: ${statusDigits[4]}");
      print("statusDigits[5] Tuesday: ${statusDigits[5]}");
      print("statusDigits[6] Monday: ${statusDigits[6]}");
      statusDigits[7] == '0' ?  await _storage.write(key: 'sun_status', value: "filled_in") : await _storage.write(key: 'sun_status', value: "fill_in");
      statusDigits[6] == '0' ?  await _storage.write(key: 'mon_status', value: "filled_in") : await _storage.write(key: 'mon_status', value: "fill_in");
      statusDigits[5] == '0' ?  await _storage.write(key: 'tue_status', value: "filled_in") : await _storage.write(key: 'tue_status', value: "fill_in");
      statusDigits[4] == '0' ?  await _storage.write(key: 'wed_status', value: "filled_in") : await _storage.write(key: 'wed_status', value: "fill_in");
      statusDigits[3] == '0' ?  await _storage.write(key: 'thur_status', value: "filled_in") : await _storage.write(key: 'thur_status', value: "fill_in");
      statusDigits[2] == '0' ?  await _storage.write(key: 'fri_status', value: "filled_in") : await _storage.write(key: 'fri_status', value: "fill_in");
      statusDigits[1] == '0' ?  await _storage.write(key: 'sat_status', value: "filled_in") : await _storage.write(key: 'sat_status', value: "fill_in");
    }
  }
  
  Future<void> _requestStoragePermission() async {
    final status = await Permission.storage.request();
    if (!status.isGranted) {
      print("Storage permission denied.");
    }
  }
}
