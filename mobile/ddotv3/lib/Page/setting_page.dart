import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:flutter/material.dart';
import 'package:ddotv3/main.dart';
import 'home_page.dart';
import 'logfile.dart';

import '../Utility/language_provider.dart';
import 'package:provider/provider.dart';
import 'monthly_report.dart';
import '../Utility/API_fetch.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:intl/intl.dart';

class SettingPage extends StatefulWidget {
  const SettingPage({Key? key}) : super(key: key);

  @override
  _SettingPageState createState() => _SettingPageState();
}

class _SettingPageState extends State<SettingPage> {
  late String settingHeader, infoHeader, logOutHeader, languageValue, changeLang, lang, firstnameHeader, emailHeader,
      cidHeader, dobHeader, telephoneHeader, provinceHeader, districtHeader, subdistrictHeader, homeaddressHeader, deviceHeader;
  String username = 'Loading...'; // Default value while fetching data
  String email = 'Loading...';
  String cid = 'Loading...';
  String dob = 'Loading...';
  String telephone = 'Loading...';
  String province = 'Loading...';
  String tambon = 'Loading...';
  String amphoe = 'Loading...';
  String homeAddress = 'Loading...';
  final FlutterSecureStorage _storage = FlutterSecureStorage();
  bool hasMp4Files = false;
  @override
  void initState() {
    super.initState();
    _fetchUserData();
    
  }
  
  Future<void> _fetchUserData() async {
    final storedCid = await _storage.read(key: 'cid');
    if (storedCid != null) {
      // Replace 'path_to_your_getGraphQLData_file' with the actual path
      final result = await getGraphQLData('''
        query ExampleQuery {
          getUserInfo(cid: "$storedCid") {
            Firstname
            Lastname
            email
            CID
            dob
            telephone
            province
            tambon
            amphoe
            homeAddress
          }
        }
      ''', {});
      if (result.state == GraphQLResultState.success) {
        final userInfo = result.data!['getUserInfo'];
        setState(() {
          String firstname = userInfo['Firstname'];
          String lastname = userInfo['Lastname'];
          username = '$firstname $lastname';
          email = userInfo['email'] ?? '-'; 
          cid = userInfo['CID'] ?? '-';
          dob = _formatDate(userInfo['dob']) ?? '-';
          telephone = userInfo['telephone'] ?? '-';
          province = userInfo['province'] ?? '-';
          tambon = userInfo['tambon'] ?? '-';
          amphoe = userInfo['amphoe'] ?? '-';
          homeAddress = userInfo['homeAddress'] ?? '-';
        });    
      } else {
        print('Error fetching user data: ${result.error}');
      }

    }
  }
  String? _formatDate(String? date) {
    if (date != null) {
      final parsedDate = DateTime.parse(date);
      return DateFormat('yyyy-MM-dd').format(parsedDate);
    }
    return null;
  }
  @override
  Widget build(BuildContext context) {
    String language = context.read<LanguageProvider>().language;
    _updateTexts(language);

    return Scaffold(
      body: Column(
        children: [
          Container(
            color: Theme.of(context).colorScheme.primary,
            padding: const EdgeInsets.all(16.0),
            child: Center(
              child: Text(
                settingHeader,
                style: TextStyle(color: Colors.white, fontSize: 18.0),
              ),
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    infoHeader,
                    style: TextStyle(fontSize: 24.0, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 16.0),
                  buildInfoRow(context, firstnameHeader, username),
                  buildInfoRow(context, emailHeader, email),
                  buildInfoRow(context, cidHeader, cid),
                  buildInfoRow(context, dobHeader, dob),
                  buildInfoRow(context, telephoneHeader, telephone),
                  buildInfoRow(context, provinceHeader, province),
                  buildInfoRow(context, districtHeader, tambon),
                  buildInfoRow(context, subdistrictHeader, amphoe),
                  buildInfoRow(context, homeaddressHeader, homeAddress),
                  buildInfoRow(context, lang, languageValue),
                  SizedBox(height: 16.0),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      ElevatedButton.icon(
                        onPressed: () async {
                          // Delete all entries from secure storage
                          await _storage.deleteAll();

                          // Print all data in secure storage (will print "No data found" after deletion)
                          await printAllDataInSecureStorage();

                          Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(builder: (context) => MyApp()),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Theme.of(context).colorScheme.primary,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10.0), // Adjust the value as needed
                          ),
                        ),
                        icon: Icon(Icons.logout, color: Colors.white),
                        label: Text(logOutHeader, style: TextStyle(color: Colors.white)),
                      ),
                      ElevatedButton.icon(
                        onPressed: () {
                          if (getCurrentLanguage(context) == "th") {
                            context.read<LanguageProvider>().setLanguage("en");
                          } else {
                            context.read<LanguageProvider>().setLanguage("th");
                          }
                          setState(() {});
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Theme.of(context).colorScheme.primary,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10.0), // Adjust the value as needed
                          ),
                        ),
                        icon: Icon(Icons.language, color: Colors.white),
                        label: Text(changeLang, style: TextStyle(color: Colors.white)),
                      ),
                      ElevatedButton.icon(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => LogFilePage()),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Theme.of(context).colorScheme.primary,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10.0),
                          ),
                        ),
                        icon: Icon(Icons.insert_drive_file, color: Colors.white),
                        label: Text(
                          language == "th" ? "ไฟล์บันทึก" : "Log Files",
                          style: TextStyle(color: Colors.white),
                        ),
                      ),
                    ],
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
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => MonthlyReportPage()),
                    );
                  },
                  icon: Icon(Icons.calendar_month, color: Colors.white),
                ),
                IconButton(
                  onPressed: () {
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

  void _updateTexts(String language) {
    if (language == "th") {
      languageValue = "ภาษาไทย";
      changeLang = "เปลี่ยนภาษา";
      lang = "ภาษา";
      firstnameHeader = "ชื่อ นามสกุล";
      emailHeader = "อีเมล";
      cidHeader = "เลขบัตรประชาชน";
      dobHeader = "ปีเกิด/เดือน/วัน";
      telephoneHeader = "หมายเลขโทรศัพท์";
      provinceHeader = "จังหวัด";
      districtHeader = "ตำบล";
      subdistrictHeader = "อำเภอ";
      homeaddressHeader = "ที่อยู่";
      deviceHeader = "อุปกรณ์";
      logOutHeader = "ออกจากระบบ";
      settingHeader = "การตั้งค่า";
      infoHeader = "ข้อมูลผู้ป่วย";
    } else {
      languageValue = "English";
      changeLang = "Change Language";
      lang = "Language";
      firstnameHeader = "Firstname";
      emailHeader = "Email";
      cidHeader = "Citizen ID";
      dobHeader = "Date of Birth";
      telephoneHeader = "Telephone Number";
      provinceHeader = "Province";
      districtHeader = "District";
      subdistrictHeader = "Subdistrict";
      homeaddressHeader = "Home Address";
      deviceHeader = "Device";
      logOutHeader = "Logout";
      settingHeader = "Setting";
      infoHeader = "Patient Information";
    }
  }

  Widget buildInfoRow(BuildContext context, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$label: ',
            style: TextStyle(fontSize: 16.0, fontWeight: FontWeight.bold),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(fontSize: 16.0),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> printAllDataInSecureStorage() async {
    final Map<String, String>? allEntries = await _storage.readAll();

    if (allEntries != null && allEntries.isNotEmpty) {
      print('All data in secure storage:');
      allEntries.forEach((key, value) {
        print('$key: $value');
      });
    } else {
      print('No data found in secure storage.');
    }
  }
}