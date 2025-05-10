import 'package:ddotv3/Utility/API_fetch.dart';
import 'package:ddotv3/Utility/language_provider.dart';
import 'package:ddotv3/Page/monthly_report.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:graphql/client.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'home_page.dart';
import 'setting_page.dart';
import 'package:ddotv3/Helper/time_set_helper.dart';
import '../main.dart';

final String databaseURL = globalDatabaseURL;

class TimeSetPage extends StatefulWidget {
  const TimeSetPage({Key? key}) : super(key: key);

  @override
  _TimeSetPageState createState() => _TimeSetPageState();
}

class _TimeSetPageState extends State<TimeSetPage> {
  bool isLocked = false; // Flag to track lock status

  final FlutterSecureStorage _secureStorage = FlutterSecureStorage();
  int timesToTakeDose = 1;
  int dosePerDay = 1;
  List<TimeOfDay> setTimes = List.generate(1, (index) => TimeOfDay(hour: 0, minute: 0));
  List<DateTime> existDate = [];
  late String num_dose, instruction_header, instruction, minutes, time_set, dose_per_day_header, o_clock,
  notification_time, Submit, hoursHeader, minutesHeader, reset_button, invalid_time, duplicated_time;
  late final DateTime currentDate;
  late final DateFormat formatter;
  late final String formattedDate;
  late final String graphqlEndpoint;
  late final HttpLink httpLink;
  late final GraphQLClient client;
  @override
  void initState() {
    super.initState();
    _loadSavedValues();
    _fetchDates();
    _loadLockStatus(); // Load lock status when the widget initializes
    currentDate = DateTime.now();
    formatter = DateFormat('yyyy-MM-dd');
    formattedDate = formatter.format(currentDate);
    graphqlEndpoint = databaseURL;
    httpLink = HttpLink(graphqlEndpoint);
    client = GraphQLClient(
      link: httpLink,
      cache: GraphQLCache(),
    );
  }
  Future<void> _loadLockStatus() async {
    // Load lock status from secure storage
    String? lockStatus = await _secureStorage.read(key: 'lock_status');
    if (lockStatus != null && lockStatus == 'locked') {
      setState(() {
        isLocked = true;
      });
    }
  }

  Future<void> _saveLockStatus(bool isLocked) async {
    // Save lock status to secure storage
    await _secureStorage.write(key: 'lock_status', value: isLocked ? 'locked' : 'unlocked');
  }
  Future<void> _fetchDates() async {
    final storedCid = await _secureStorage.read(key: 'cid');
    if (storedCid != null) {
        final dotResult = await getGraphQLData('''
          query DOTQuery {
            getDayActivity(cid: "$storedCid") {
              date
            }
          }
        ''', {});
    if (dotResult.state == GraphQLResultState.success) {
          final dotData = dotResult.data!['getDayActivity'] as List;
          for (var dotActivity in dotData) {
            final DateTime dotDate = DateTime.parse(dotActivity['date']);
            existDate.add(dotDate);
          }
        }
    }
    print('exist date: ${existDate}');
    
    
  }

  Future<void> SetInitialPillsCount() async {
    final storedCid = await _secureStorage.read(key: 'cid');
    final MutationOptions options = MutationOptions(
    document: gql('''
      mutation AddDayActivity(\$input: AddDayActivityInput!) {
        addDayActivity(input: \$input) {
          cid
          date
          isComplete
          pillsNo
        }
      }
    '''),
    variables: {
      'input': {
        'cid': storedCid,
        'date': formattedDate,
        'isComplete': "UNVERIFIED",
        'pillsNo': dosePerDay, // Assuming dosePerDay is a global variable accessible here
      },
    },
  );

  try {
    final QueryResult result = await client.mutate(options);

    if (result.hasException) {
      print('Error adding initial pills count: ${result.exception}');
      // Handle error as needed
    } else {
      print('Initial pills count successfully set.');
      // Handle success as needed
    }
  } catch (error) {
    print('Error: $error');
    // Handle error as needed
  }
  } 

  Future<void> checkAndSetPillsCount() async {
    final storedCid = await _secureStorage.read(key: 'cid');
    // final dosePerDay = 2; // Adjust this value as needed

    final MutationOptions options = MutationOptions(
      document: gql('''
        mutation UpdateDayActivityPillsNo(\$cid: String!, \$date: Date!, \$newPillsNo: Int!) {
          updateDayActivityPillsNo(input: { cid: \$cid, date: \$date, newPillsNo: \$newPillsNo }) {
            cid
            date
            pillsNo
          }
        }
      '''),
      variables: {
        'cid': storedCid,
        'date': formattedDate,
        'newPillsNo': dosePerDay,
      },
    );

    try {
      final QueryResult result = await client.mutate(options);

      if (result.hasException) {
        print('Error updating pills count: ${result.exception}');
        // Print "no" when an error occurs
        print('no');
      } else {
        print('Pills count successfully updated for today.');
        // Print "yes" when pills count updated successfully
        print('yes');
      }
    } catch (error) {
      print('Error: $error');
      // Print "no" when an error occurs
      print('no');
    }
  }

  bool isDateMatchExistDate(DateTime currentDate, List<DateTime> existDate) {
    for (DateTime date in existDate) {
      if (date.year == currentDate.year &&
          date.month == currentDate.month &&
          date.day == currentDate.day) {
        return true;
      }
    }
    return false;
  }

   Future<void> _loadSavedValues() async {
    int savedTimesPerDay = int.tryParse(await _secureStorage.read(key: 'times_per_day') ?? '0') ?? 0;
    int savedDosePerDay = int.tryParse(await _secureStorage.read(key: 'dose_per_day') ?? '0') ?? 0;
    setState(() {
      dosePerDay = savedDosePerDay;
    });
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
      await sortTimesAndAlerts();

      setState(() {
        timesToTakeDose = savedTimesPerDay;
        setTimes = loadedSetTimes;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    String language = context.read<LanguageProvider>().language;
    _updateTexts(language);
    return Scaffold(
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                children: [
                  Container(
                    color: Theme.of(context).colorScheme.primary,
                    padding: const EdgeInsets.all(16.0),
                    child: Center(
                      child: Text(
                        time_set,
                        style: TextStyle(color: Colors.white, fontSize: 18.0),
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        buildButtonRow(
                          dose_per_day_header, // Use the text for dose per day
                          dosePerDay.toString(), // Display the dose per day value
                          isLocked ? null : () {
                            setState(() {
                              if (dosePerDay > 1) {
                                dosePerDay--;
                              }
                            });
                          },
                          isLocked ? null :() {
                            setState(() {
                              if (dosePerDay < 13) {
                                dosePerDay++;
                              }
                            });
                          },
                        ),
                        buildButtonRow(
                          num_dose,
                          timesToTakeDose.toString(),
                          isLocked ? null :() {
                            setState(() {
                              if (timesToTakeDose > 1) {
                                timesToTakeDose--;
                                setTimes.removeLast();
                                print("Minus: $setTimes");
                                print("Total times: $timesToTakeDose");
                              }
                            });
                          },
                          isLocked ? null :() {
                            setState(() {
                              if (timesToTakeDose < 3) {
                                timesToTakeDose++; 
                                setTimes.add(TimeOfDay(hour: 0, minute: 0));
                                print("Plus: $setTimes");
                                print("Total times: $timesToTakeDose");
                              }
                            });
                          },
                        ),
                        SizedBox(height: 16.0),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              instruction_header,
                              style: TextStyle(fontSize: 16.0, color: Colors.grey),
                            ),
                            Text(
                              instruction,
                              style: TextStyle(fontSize: 16.0, color: Colors.grey),
                            ),
                          ],
                        ),
                        // Dynamically generate Set Time rows
                        for (int i = 0; i < timesToTakeDose; i++) buildTimeSetRow(i),
                        SizedBox(height: 16.0),
                        // Submit Button
                        Container(
                          width: double.infinity,
                          margin: EdgeInsets.symmetric(vertical: 12.0),
                          child: ElevatedButton(
                            onPressed: () {
                              _handleSubmit();
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green,
                              padding: EdgeInsets.symmetric(vertical: 12.0),
                            ),
                            child: Text(
                              Submit,
                              style: TextStyle(fontSize: 18.0, color: Colors.white),
                            ),
                          ),
                        ),
                        // Reset Button
                        Container(
                          width: double.infinity,
                          margin: EdgeInsets.symmetric(vertical: 12.0),
                          child: ElevatedButton(
                            onPressed: () {
                              _handleReset();
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.red,
                              padding: EdgeInsets.symmetric(vertical: 12.0),
                            ),
                            child: Text(
                              reset_button,
                              style: TextStyle(fontSize: 18.0, color: Colors.white),
                            ),
                          ),
                        ),
                        // Lock Button
                        Container(
                          width: double.infinity,
                          margin: EdgeInsets.symmetric(vertical: 12.0),
                          child: ElevatedButton(
                            onPressed: () {
                              print("LOCK CLICKED");
                              setState(() {
                                isLocked = !isLocked;
                                _saveLockStatus(isLocked); // Save lock status when it changes
                              });
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.blue,
                              padding: EdgeInsets.symmetric(vertical: 12.0),
                            ),
                            child: Text(
                              isLocked ? "UNLOCKED" : "LOCK",
                              style: TextStyle(fontSize: 18.0, color: Colors.white),
                            ),
                          ),
                        ),
                        
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          Container(
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
                    // Navigate back to the Home Page
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => HomePage()),
                    );
                  },
                  icon: Icon(Icons.home, color: Colors.white),
                ),
                IconButton(
                  onPressed: () {
                    // Navigate to the Setting Page
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
  
  Future<void> _handleSubmit() async {
    
    if (hasDuplicates(setTimes)) {
      showErrorDialog(context, duplicated_time);
      return;
    }

    // Save values to secure storage
    await _secureStorage.write(key: 'dose_per_day', value: dosePerDay.toString());
    await _secureStorage.write(key: 'times_per_day', value: timesToTakeDose.toString());
    for (int i = 0; i < timesToTakeDose; i++) {
      String timeKey = 'time_${i + 1}';
      // Combine hours and minutes into a single string (e.g., '13.30')
      String timeValue = '${setTimes[i].hour}.${setTimes[i].minute}';
      await _secureStorage.write(key: timeKey, value: timeValue);
    }

    // Call the sorting function after submitting
    await sortTimesAndAlerts();
    DateTime currentDate = DateTime.now();
    bool isMatch = isDateMatchExistDate(currentDate, existDate);
    if (!isMatch) {
      print('No activity row for today. Initial row is setted.');
      await SetInitialPillsCount();
    }
    else{
      await checkAndSetPillsCount();
    }
    // Print all saved values in secure storage
    _printSavedValues();
    scheduleNotifications(flutterLocalNotificationsPlugin);

    
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => HomePage()),
    );
  }

  void _handleReset() async {
    // Delete 'times_per_day' key
    await _secureStorage.delete(key: 'times_per_day');

    // Delete 'time_n' keys based on the current value of timesToTakeDose
    for (int i = 1; i <= timesToTakeDose; i++) {
      await _secureStorage.delete(key: 'time_$i');
    }

    // Empty the setTimes list and reset timesToTakeDose
    setState(() {
      setTimes = List.generate(1, (index) => TimeOfDay(hour: 0, minute: 0));
      timesToTakeDose = 1;
    });
  }

  Future<void> _printSavedValues() async {
    // Retrieve and print all saved values
    
    print('Saved values in secure storage:');
    print('times_per_day: ${await _secureStorage.read(key: 'times_per_day')}');
    print('doses_per_day: ${await _secureStorage.read(key: 'dose_per_day')}');
    for (int i = 0; i < timesToTakeDose; i++) {
      String timeKey = 'time_${i + 1}';
      print('$timeKey: ${await _secureStorage.read(key: timeKey)}');
    }
  }

  
  void _updateTexts(String language) {
    if (language == "th") {
      num_dose = "จำนวนครั้งต่อวัน";
      instruction_header = "ตัวอย่าง";
      instruction = "บ่ายโมงครึ่ง -> 13 นาฬิกา 30 นาที";
      minutes = "นาที";
      time_set = "ตั้งเวลา";
      notification_time = "เตือนทานยา";
      Submit = "บันทึก";
      hoursHeader = "นาฬิกา";
      minutesHeader = "นาที";
      reset_button = "รีเซ็ต/ล้างค่าเวลา";
      duplicated_time = "โปรดตั้งเวลาที่ไม่ซ้ำกัน";
      dose_per_day_header = "จำนวนยาทั้งหมด(เม็ด)";
      o_clock = "นาฬิกา";
    } else {
      num_dose = "Notifications per day";
      instruction_header = "Example";
      instruction = "1pm30mins -> 13 o'clocks 30 mins";
      minutes = "mins";
      time_set = "Time set";
      notification_time = "Set time";
      Submit = "Submit";
      hoursHeader = "o'clock";
      minutesHeader = "mins";
      reset_button = "Reset";
      duplicated_time = "Duplicate time sets are not allowed.";
      dose_per_day_header = "No. of pills today(dose)";
      o_clock = "o'clocks";
    }
  }

  Widget buildButtonRow(
    String leftText,
    String buttonText,
    void Function()? onDecrease,
    void Function()? onIncrease,

  ) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              leftText,
              style: TextStyle(fontSize: 16.0),
            ),
            Row(
              children: [
                ElevatedButton(
                  onPressed: onDecrease,
                  child: Icon(Icons.remove),
                ),
                SizedBox(width: 8.0),
                Text(
                  buttonText,
                  style: TextStyle(fontSize: 16.0),
                ),
                SizedBox(width: 8.0),
                ElevatedButton(
                  onPressed: onIncrease,
                  child: Icon(Icons.add),
                ),
              ],
            ),
          ],
        ),
        SizedBox(height: 8.0),
        Container(
          height: 1.0,
          color: Colors.black,
        ),
        SizedBox(height: 16.0),
      ],
    );
  }

  Widget buildTimeSetRow(int index) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              '$notification_time ${index + 1} ',
              style: TextStyle(fontSize: 16.0),
            ),
            Row(
              children: [
                // Scrollable Dropdown for Hours
                DropdownButton<int>(
                  value: setTimes[index].hour,
                  onChanged: (int? value) {
                    setState(() {
                      setTimes[index] = TimeOfDay(hour: value!, minute: setTimes[index].minute);
                    });
                  },
                  items: List.generate(25, (index) => index) // Change to 25 to include 24
                      .map((int item) {
                        return DropdownMenuItem<int>(
                          value: item,
                          child: Text(item.toString()),
                        );
                      })
                      .toList(),
                ),
                SizedBox(width: 8.0),
                Text(
                  o_clock,
                  style: TextStyle(fontSize: 16.0),
                ),
                SizedBox(width: 16.0),
                // Scrollable Dropdown for Minutes
                DropdownButton<int>(
                  value: setTimes[index].minute,
                  onChanged: (int? value) {
                    setState(() {
                      setTimes[index] = TimeOfDay(hour: setTimes[index].hour, minute: value!);
                    });
                  },
                  items: List.generate(61, (index) => index) // Change to 61 to include 60
                      .map((int item) {
                        return DropdownMenuItem<int>(
                          value: item,
                          child: Text(item.toString()),
                        );
                      })
                      .toList(),
                ),
                SizedBox(width: 8.0),
                Text(
                  minutes,
                  style: TextStyle(fontSize: 16.0),
                ),
              ],
            ),
          ],
        ),
        SizedBox(height: 8.0),
        Container(
          height: 1.0,
          color: Colors.black,
        ),
        SizedBox(height: 16.0),
      ],
    );
  }

  Widget buildDropdownRow(
    String leftText,
    String dropdownValue,
    List<String> dropdownItems,
    void Function(String?)? onChanged,
  ) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              leftText,
              style: TextStyle(fontSize: 16.0),
            ),
            Row(
              children: [
                DropdownButton<String>(
                  value: dropdownValue,
                  onChanged: onChanged,
                  items: dropdownItems.map((String item) {
                    return DropdownMenuItem<String>(
                      value: item,
                      child: Text(item),
                    );
                  }).toList(),
                ),
                SizedBox(width: 8.0),
                Text('นาที/mins'),
              ],
            ),
          ],
        ),
        SizedBox(height: 8.0),
        Container(
          height: 1.0,
          color: Colors.black,
        ),
        SizedBox(height: 16.0),
      ],
    );
  }

}
