import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:intl/intl.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';
import '../Utility/language_provider.dart';
import 'setting_page.dart';
import 'home_page.dart';
import '../Utility/API_fetch.dart';
import 'package:table_calendar/table_calendar.dart';

class MonthlyReportPage extends StatefulWidget {
  const MonthlyReportPage({Key? key}) : super(key: key);

  @override
  _MonthlyReportPageState createState() => _MonthlyReportPageState();
}

class _MonthlyReportPageState extends State<MonthlyReportPage> {
  late DateTime currentMonth;
  String language = "";
  late String report, daily_report, dot_status, color_blind_test, side_effect_report, no_record,
              side_effects, Close, Instruction1, Instruction2, Instruction3, CbReminder, CbReminderDesc,
              Instruction4, startDateHeader, totalDaysHeader, ObserverContact, Statistic, not_eaten, 
              INCOMPLETED, COMPLETED, UNVERIFIED, done, sideeffects, eaten, missed, days, how_to_use;
  List<DateTime> highlightedDOTDates = [];
  List<DateTime> highlightedPartialDates = [];
  List<DateTime> highlightedUnverfiedDates = [];
  List<DateTime> highlightedCompletedDates = [];
  List<DateTime> highlightedColorBlindDates = [];
  List<DateTime> highlightedSideEffectDates = [];
  final FlutterSecureStorage _storage = FlutterSecureStorage();
  String formattedStartDate = 'Loading...';
  int differenceInDays = 0;
  String username = 'Loading...';

  @override
  void initState() {
    super.initState();
    initializeDateFormatting("th", null);
    currentMonth = DateTime.now();
    initialize();
  }
  Future<void> initialize() async {
    await _fetchDOTDates();
    _printFetchedDOTDates();
    if(differenceInDays >= 30){
      _checkColorBlindTestReminder();
    }
  }

  Future<void> _fetchDOTDates() async {
    final storedCid = await _storage.read(key: 'cid');
    if (storedCid != null) {
        final dotResult = await getGraphQLData('''
          query DOTQuery {
            getDayActivity(cid: "$storedCid") {
              date
              isComplete
            }
          }
        ''', {});
        final colorBlindResult = await getGraphQLData('''
          query ColorBlindQuery {
            getColorBlind(cid: "$storedCid") {
              colorBlindDate
            }
          }
        ''', {});
        final sideEffectResult = await getGraphQLData('''
          query SideEffectQuery {
            getSideEffect(cid: "$storedCid") {
              effectDate
            }
          }
        ''', {});
        
        if (dotResult.state == GraphQLResultState.success) {
          final dotData = dotResult.data!['getDayActivity'] as List;
          for (var dotActivity in dotData) {
            final DateTime dotDate = DateTime.parse(dotActivity['date']);
            final String isComplete = dotActivity['isComplete'];
            highlightedDOTDates.add(dotDate);
            if (isComplete == "COMPLETED") {
              highlightedCompletedDates.add(dotDate);
            } else if (isComplete == "INCOMPLETED"){
              highlightedPartialDates.add(dotDate);
            } else if (isComplete == "UNVERIFIED"){
              highlightedUnverfiedDates.add(dotDate);
            }

          }
        }

        if (colorBlindResult.state == GraphQLResultState.success) {
          final colorBlindData = colorBlindResult.data!['getColorBlind'] as List;
          for (var colorBlind in colorBlindData) {
            final DateTime colorBlindDate = DateTime.parse(colorBlind['colorBlindDate']);
            highlightedColorBlindDates.add(colorBlindDate);
          }
        }

        if (sideEffectResult.state == GraphQLResultState.success) {
          final sideEffectData = sideEffectResult.data!['getSideEffect'] as List;
          for (var sideEffect in sideEffectData) {
            final DateTime sideEffectDate = DateTime.parse(sideEffect['effectDate']);
            highlightedSideEffectDates.add(sideEffectDate);
          }
        final admissionDetailsResult = await getGraphQLData('''
            query GetAdmissionDetails {
              getAdmissionDetails(cid: "$storedCid") {
                startDate
              }
            }
          ''', {});
          if (admissionDetailsResult.state == GraphQLResultState.success) {
            final admissionDetails = admissionDetailsResult.data!['getAdmissionDetails'];
            final startDate = admissionDetails['startDate'];
            DateTime admissionStartDate = DateTime.parse(startDate);
            formattedStartDate = DateFormat('yyyy-MM-dd').format(admissionStartDate);
            print('Admission Start Date: $formattedStartDate');
            final currentDate = DateTime.now();
            final daysDifference = currentDate.difference(admissionStartDate).inDays;
            setState(() {
              differenceInDays = daysDifference;
            });
          } else {
            print('Error fetching Admission Details: ${admissionDetailsResult.error}');
          }
        } else {
          print('Error fetching Side Effect dates: ${sideEffectResult.error}');
        }
      final storedObserverCID = await _storage.read(key: 'observerCID');
      if (storedObserverCID != null) {
        final result = await getGraphQLData('''
          query ExampleQuery {
            getUserInfo(cid: "$storedObserverCID") {
              Firstname
              Lastname
              telephone
            }
          }
        ''', {});
        if (result.state == GraphQLResultState.success) {
          final userInfo = result.data!['getUserInfo'];
          setState(() {
            String firstname = userInfo['Firstname'];
            String lastname = userInfo['Lastname'];
            String telephone = userInfo['telephone'];
            username = '$firstname $lastname $telephone';
          });
        }
      }
    }
  }
  void _printFetchedDOTDates() {
    print('Fetched DOT Dates:');
    for (var date in highlightedDOTDates) {
      print('${DateFormat('yyyy-MM-dd').format(date)}');
    }
  }

  @override
  Widget build(BuildContext context) {
    language = context.read<LanguageProvider>().language;
    _updateTexts(language);
    String currentMonthText = language == "th"
        ? DateFormat('MMMM', 'th').format(currentMonth)
        : DateFormat('MMMM').format(currentMonth);
    return Scaffold(
      body: Column(
        children: [
          Container(
            color: Theme.of(context).colorScheme.primary,
            padding: const EdgeInsets.all(16.0),
            child: Center(
              child: Text(
                report,
                style: TextStyle(color: Colors.white, fontSize: 18.0),
              ),
            ),
          ),
          TableCalendar(
            locale: language,
            firstDay: DateTime.utc(2020, 1, 1),
            lastDay: DateTime.utc(2030, 12, 31),
            focusedDay: currentMonth,
            calendarFormat: CalendarFormat.month,
            startingDayOfWeek: StartingDayOfWeek.sunday,
            availableGestures: AvailableGestures.none,
            daysOfWeekVisible: true,
            headerStyle: HeaderStyle(
              formatButtonVisible: false,
            ),
            calendarStyle: CalendarStyle(
              outsideDaysVisible: false,
              todayDecoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary,
                shape: BoxShape.circle,
              ),
              selectedDecoration: BoxDecoration(
                color: Theme.of(context).colorScheme.secondary,
                shape: BoxShape.circle,
              ),
            ),
            onDaySelected: (selectedDay, focusedDay) {
              _showDayPopup(context, selectedDay);
            },
            eventLoader: _loadEvents,
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  ElevatedButton(
                    onPressed: () {
                      _showInstructionPopup(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Theme.of(context).colorScheme.primary,
                      padding: EdgeInsets.symmetric(horizontal: 10.0, vertical: 10.0), // Decrease the padding
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.help, size: 16.0, color: Colors.white), // Decrease the icon size
                        SizedBox(width: 4.0), // Adjust the spacing
                        Text(how_to_use, style: TextStyle(fontSize: 14.0, color: Colors.white)), // Decrease the font size
                      ],
                    ),
                  ),
                  SizedBox(width: 16.0), // Add spacing between the instruction button and reset icon
                  IconButton(
                    onPressed: () {
                      _resetToCurrentMonth();
                    },
                    icon: Icon(Icons.refresh, color: Theme.of(context).colorScheme.primary),
                  ),
                ],
              ),
              SizedBox(height: 10), 
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "$Statistic:",style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 10),
                  Text(
                    "$startDateHeader:\t$formattedStartDate",style: TextStyle(fontSize: 16),
                  ),
                  SizedBox(height: 10),
                  Text(
                    "$totalDaysHeader:\t$differenceInDays",style: TextStyle(fontSize: 16),
                  ),
                  SizedBox(height: 10),
                  Text(
                    "$ObserverContact:\t$username",style: TextStyle(fontSize: 16),
                  ),
                  SizedBox(height: 10),
                  Text(
                    // "$eaten: ${highlightedCompletedDates.length} $days | $missed: ${highlightedPartialDates.length} $days | $not_eaten: ${differenceInDays - highlightedDOTDates.length} $days",style: TextStyle(fontSize: 16),
                    "$eaten: ${highlightedCompletedDates.length + highlightedPartialDates.length}$days",style: TextStyle(fontSize: 16),
                  ),
                ],
              ),
            ],
          ),
          Spacer(),
          Container(
            color: Theme.of(context).colorScheme.primary,
            padding: const EdgeInsets.all(16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                IconButton(
                  onPressed: () {
                    Navigator.push(context,MaterialPageRoute(builder: (context) => MonthlyReportPage()),);
                  },
                  icon: Icon(Icons.calendar_month, color: Colors.white),
                ),
                IconButton(
                  onPressed: () {
                    Navigator.push(context,MaterialPageRoute(builder: (context) => HomePage()),
                    );
                  },
                  icon: Icon(Icons.home, color: Colors.white),
                ),
                IconButton(
                  onPressed: () {
                    Navigator.push(context,MaterialPageRoute(builder: (context) => SettingPage()),
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
  List<Map<String, dynamic>> _loadEvents(DateTime day) {
    List<Map<String, dynamic>> events = [];
    if (_hasDOTEvent(day)) {
      events.add({'type': 'DOT'});
    }
    if (_hasColorBlindEvent(day)) {
      events.add({'type': 'ColorBlind'});
    }
    if (_hasSideEffectEvent(day)) {
      events.add({'type': 'SideEffect'});
    }
    return events;
  }
  Map<DateTime, List<Map<String, dynamic>>> _getEventsMap() {
    Map<DateTime, List<Map<String, dynamic>>> eventsMap = {};
    for (DateTime date in highlightedDOTDates) {
      List<Map<String, dynamic>> events = [];
      if (_hasDOTEvent(date)) {
        events.add({'type': 'DOT'});
      }
      if (_hasColorBlindEvent(date)) {
        events.add({'type': 'ColorBlind'});
      }
      if (_hasSideEffectEvent(date)) {
        events.add({'type': 'SideEffect'});
      }
      eventsMap[date] = events;
    }
    return eventsMap;
  }
  bool _hasDOTEvent(DateTime day) {
    return highlightedDOTDates.contains(day);
  }
  bool _hasColorBlindEvent(DateTime day) {
    return highlightedColorBlindDates.contains(day);
  }
  bool _hasSideEffectEvent(DateTime day) {
    return highlightedSideEffectDates.contains(day);
  }
  void _updateTexts(String language) {
    if (language == "th") {
      report = "ความคืบหน้าการรักษา";
      daily_report = "รายงานรายวัน";
      dot_status = "สถานะ DOT";
      color_blind_test = "การทดสอบตาบอดสี";
      side_effect_report = "การรายงานผลข้างเคียง";
      side_effects = "ผลข้างเคียง";
      Close = "ปิด";
      Instruction1 = "กดที่ลูกศรซ้ายและขวาด้านบนของปฏิทินเพื่อเปลี่ยนเดือน";
      Instruction2 = "กดที่ลูกศรย้อนกลับใต้ปฏิทินเพื่อเลือกเดือนปัจจุบัน";
      Instruction3 = "วันที่มีจุดสีดำ • ใต้เลขวันหมายถึงวันที่มีประวัติการรักษา";
      Instruction4 = "คลิกที่เลขวันที่เพื่อเช็คประวัติของวันนั้น";
      Statistic = "สถิติการรักษา";
      startDateHeader = "วันที่เริ่มรักษา";
      totalDaysHeader = "จำนวนวันที่ได้รับการรักษา";
      ObserverContact = "ติดต่อเจ้าหน้าที่";
      INCOMPLETED = "ทานยาไม่ครบ";
      COMPLETED = "ทานยาครบ";
      UNVERIFIED = "ยังไม่ตรวจสอบ";
      done = "ทำแล้ว";
      sideeffects = "มีผลข้างเคียง";
      eaten = "ทานยาแล้ว";
      missed = "ทานไม่ครบ";
      days = "วัน";
      how_to_use = "คู่มือการใช้งาน";
      not_eaten = "ไม่มีประวัติทานยา";
      CbReminder = "โปรดทำแบบทดสอบตาบอดสี";
      CbReminderDesc = "คุณไม่ได้ทำแบบทดสอบตาบอดสีเกินระยะเวลา 7 วัน";
      no_record = "ไม่มีประวัติ";
    } else {
      report = "Progression";
      daily_report = "Daily Report";
      dot_status = "DOT Status";
      color_blind_test = "Colorblind Test";
      side_effect_report = "Side Effect Report";
      side_effects = "Side Effects";
      Close = "Close";
      Instruction1 = "Click the left and right arrow to switch between months.";
      Instruction2 = "Click the refresh arrow to see the current month.";
      Instruction3 = "Days with dot • underneath mean days with medical history.";
      Instruction4 = "Click on specific day to see the history of that day.";
      Statistic = "Treatment Statistic";
      startDateHeader = "Treatment start date";
      totalDaysHeader = "Total days on treatment";
      ObserverContact = "Contact Staff";
      INCOMPLETED = "Incompleted doses";
      COMPLETED = "Completed doses";
      UNVERIFIED = "Not approved";
      done = "Done";
      sideeffects = "Has side effects";
      eaten = "Pills taken";
      missed = "Missed doses";
      days = "days";
      how_to_use = "How to use";
      not_eaten = "No pills taken activity";
      CbReminder = "Please do colorblind testing";
      CbReminderDesc = "You haven't done do the colorblind testing for more than 7 days.";
      no_record = "No record";
    }
  }
  void _resetToCurrentMonth() {
    setState(() {
      currentMonth = DateTime.now();
    });
  }
  void _showDayPopup(BuildContext context, DateTime selectedDay) {
    final hasColorBlindEvent = _hasColorBlindEvent(selectedDay);
    final colorBlindBackgroundColor = hasColorBlindEvent ? Colors.lightGreen : Colors.transparent;
    final hasSideEffectEvent = _hasSideEffectEvent(selectedDay);
    final sideEffectBackgroundColor = hasSideEffectEvent ? Colors.yellow : Colors.transparent;

    String dotStatus;
    Color dotStatusBackgroundColor;

    // Check if the selectedDay is in highlightedDOTDates
    if (highlightedDOTDates.contains(selectedDay)) {
      // Check if the selectedDay is in highlightedPartialDates
      if (highlightedPartialDates.contains(selectedDay)) {
        dotStatus = INCOMPLETED;
        dotStatusBackgroundColor = Colors.red;
      } 
      // Check if the selectedDay is in highlightedCompletedDates
      else if (highlightedCompletedDates.contains(selectedDay)) {
        dotStatus = COMPLETED;
        dotStatusBackgroundColor = Colors.lightGreen;
      } 
      else if (highlightedUnverfiedDates.contains(selectedDay)){
        dotStatus = UNVERIFIED;
        dotStatusBackgroundColor = Colors.grey;
      }
      // If not in either list, show 'UNVERIFIED'
      else {
        dotStatus = no_record;
        dotStatusBackgroundColor = Colors.transparent;
      }
    } 
    // If not in highlightedDOTDates, show 'UNKNOWN'
    else {
      dotStatus = no_record;
      dotStatusBackgroundColor = Colors.transparent;
    }

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          content: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                daily_report,
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 15),
              _buildReportLine(Icons.medical_information, dot_status, dotStatus, dotStatusBackgroundColor),
              SizedBox(height: 10),
              _buildReportLine(Icons.remove_red_eye, color_blind_test, hasColorBlindEvent ? done : no_record, colorBlindBackgroundColor),
              SizedBox(height: 10),
              _buildReportLine(Icons.warning, side_effects, hasSideEffectEvent ? sideeffects : no_record, sideEffectBackgroundColor),
              SizedBox(height: 10),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: Text(Close),
            ),
          ],
        );
      },
    );
  }
  Widget _buildReportLine(IconData icon, String label, String value, Color? bgColor) {
    return Container(
      color: bgColor,
      child: Row(
        children: [
          Icon(icon, color: Theme.of(context).colorScheme.primary),
          SizedBox(width: 5),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '$label:',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              Text(value),
            ],
          ),
        ],
      ),
    );
  }
  void _showInstructionPopup(BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text(how_to_use),
          content: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildInstructionWithBulletPoint(Instruction1),
              SizedBox(height: 5),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.chevron_left),
                  Icon(Icons.chevron_right),
                ],
              ),
              SizedBox(height: 5),
              _buildInstructionWithBulletPoint(Instruction1),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.refresh),
                ],
              ),
              SizedBox(height: 5),
              _buildInstructionWithBulletPoint(Instruction3),
              SizedBox(height: 5),
              _buildInstructionWithBulletPoint(Instruction4),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: Text(Close),
            ),
          ],
        );
      },
    );
  }
  Widget _buildInstructionWithBulletPoint(String instruction) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text("•", style: TextStyle(fontSize: 30)),
        SizedBox(width: 5),
        Expanded(
          child: Text(
            instruction,
            style: TextStyle(fontSize: 15),
          ),
        ),
      ],
    );
  }
  void _checkColorBlindTestReminder() {
    if (highlightedColorBlindDates.isNotEmpty) {
      final latestColorBlindDate = highlightedColorBlindDates.reduce((a, b) => a.isAfter(b) ? a : b);
      final difference = DateTime.now().difference(latestColorBlindDate).inDays;
      print("latestColorBlindDate: ${latestColorBlindDate}");
      print("Current date: ${DateTime.now()}");
      print("differenceInDays ${difference}");
      if (difference >= 7) {
        showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              title: Text(CbReminder),
              content: Text(CbReminderDesc),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                  },
                  child: Text(Close),
                ),
              ],
            );
          },
        );
      }
    }
  }

}
