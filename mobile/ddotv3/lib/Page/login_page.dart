//login_page
import 'package:ddotv3/Utility/API_fetch.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:provider/provider.dart';
import '../Utility/language_provider.dart';
import 'home_page.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({Key? key}) : super(key: key);

  @override
  _LoginPageState createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  late String usernameHeader, passwordHeader, enterUsername, enterPassword, login
              ,errorBanner, okButton, incorrectError, networkError, fillError;
  final TextEditingController _cidController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final FlutterSecureStorage _storage = FlutterSecureStorage();
  bool _isObscure = true;
  @override
  void initState() {
    super.initState();
    _checkAndNavigateToHomePage();
  }

  Future<void> _checkAndNavigateToHomePage() async {
    String? storedCid = await _storage.read(key: 'cid');
    if (storedCid != null && storedCid.isNotEmpty) {
      print('Found cid in secure storage: $storedCid');
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => HomePage()),
      );
    } else {
      print('No cid found in secure storage.');
    }
  }

  @override
  Widget build(BuildContext context) {
    String language = context.read<LanguageProvider>().language;
    _updateTexts(language);
    

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.primary,
        title: Text('d-DOTv4 by MUICT', style: TextStyle(color: Colors.white)),
      ),
      body: SingleChildScrollView(
        child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset(
              'assets/images/tuberculosis.jpg',
              height: 300, // adjust the height as needed
              width: 406, // occupy the full width
              fit: BoxFit.cover, // cover the entire space
            ),
            SizedBox(height: 20.0),
            Text(usernameHeader, style: TextStyle(fontSize: 16.0)),
            TextField(
              controller: _cidController,
              decoration: InputDecoration(
                hintText: enterUsername,
              ),
              style: TextStyle(fontSize: 24.0),
            ),
            SizedBox(height: 20.0),
            Text(passwordHeader, style: TextStyle(fontSize: 16.0)),
            TextField(
              controller: _passwordController,
              obscureText: _isObscure, // Initially true to hide the password
              decoration: InputDecoration(
                hintText: enterPassword,
                suffixIcon: GestureDetector(
                  onTap: () {
                    setState(() {
                      _isObscure = !_isObscure; // Toggle password visibility
                    });
                  },
                  child: Icon(
                    _isObscure ? Icons.visibility : Icons.visibility_off,
                  ),
                ),
              ),
              style: TextStyle(fontSize: 24.0),
            ),

            SizedBox(height: 30.0),
            ElevatedButton(
              onPressed: () async {
                if (_cidController.text.isEmpty || _passwordController.text.isEmpty) {
                  _showErrorDialog(fillError);
                  return;
                }

                GraphQLResult<Map<String, dynamic>> result = await getGraphQLData(
                  '''
                  query GetUser(\$cid: String!) {
                    getUserInfo(cid: \$cid) {
                      CID
                      telephone
                      userRole
                    }
                  }
                  ''',
                  {"cid": _cidController.text},
                );

                if (result.state == GraphQLResultState.success) {
                  final userData = result.data!['getUserInfo'];

                  if (userData != null &&
                      userData['userRole'] == 'PATIENT' &&
                      _isValidPassword(userData['telephone'])) {
                    await _storage.write(key: 'cid', value: _cidController.text);
                    print('Saved cid to secure storage: ${_cidController.text}');
                    await printAllDataInSecureStorage();
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(builder: (context) => HomePage()),
                    );
                  } else {
                    _showErrorDialog(incorrectError);
                  }
                } else {
                  _showErrorDialog(networkError);
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.primary,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10.0), // Adjust the value as needed
                ),
              ),
              child: Text(login, style: TextStyle(color: Colors.white)),
            ),
            // ElevatedButton(
            //   onPressed: () {
            //     Navigator.pushReplacement(
            //           context,
            //           MaterialPageRoute(builder: (context) => HomePage()),
            //         );
            //   },
            //   style: ElevatedButton.styleFrom(
            //     backgroundColor: Theme.of(context).colorScheme.primary,
            //     shape: RoundedRectangleBorder(
            //       borderRadius: BorderRadius.circular(10.0), // Adjust the value as needed
            //     ),
            //   ),
            //   child: Text(login, style: TextStyle(color: Colors.white)),
            // ),


            SizedBox(height: 16.0),
            GestureDetector(
              onTap: () {
                if (getCurrentLanguage(context) == "th") {
                  context.read<LanguageProvider>().setLanguage("en");
                } else {
                  context.read<LanguageProvider>().setLanguage("th");
                }
                setState(() {});
              },
              child: Container(
                width: 40.0,
                height: 40.0,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Theme.of(context).colorScheme.primary,
                ),
                child: Icon(Icons.language, color: Colors.white),
              ),
            ),
          ],
        ),
      ),
      )
    );
  }

  void _updateTexts(String language) {
    if (language == "th") {
      usernameHeader = "เลขบัตรประชาชน";
      passwordHeader = "รหัสผ่าน";
      enterUsername = "กรอกเลขบัตรประชาชน";
      enterPassword = "กรอกรหัสผ่าน";
      login = "เข้าสู่ระบบ";
      errorBanner = "เกิดข้อผิดพลาด";
      okButton = "ตกลง";
      incorrectError = "เลขบัตรประจำตัวประชาชนหรือรหัสผ่านไม่ถูกต้อง หรือไม่ใช่ผู้ป่วย";
      networkError = "ดึงข้อมูลไม่สำเร็จ โปรดเช็คการทำงานของอินเตอร์เน็ต";
      fillError = "โปรดกรอกทั้งเลขบัตรประจำตัวประชาชนและรหัสผ่าน";
    } else {
      usernameHeader = "Citizen ID";
      passwordHeader = "Password";
      enterUsername = "Enter your Citizen ID";
      enterPassword = "Enter your password";
      login = "Log in";
      errorBanner = "Error";
      okButton = "Ok";
      incorrectError = "Incorrect CID or password, or you are not a PATIENT.";
      networkError = "Error fetching user data. Please check your connection.";
      fillError = "Please fill in both CID and password.";
    }
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

  bool _isValidPassword(String userTelephone) {
    final last3DigitsOfCid = _cidController.text.substring(_cidController.text.length - 3);
    final expectedPassword = '$userTelephone$last3DigitsOfCid';
    return _passwordController.text == expectedPassword;
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text(errorBanner),
          content: Text(message),
          actions: <Widget>[
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: Text(okButton),
            ),
          ],
        );
      },
    );
  }
}
