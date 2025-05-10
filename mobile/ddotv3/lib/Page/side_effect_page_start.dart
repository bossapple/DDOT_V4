import 'package:ddotv3/Page/monthly_report.dart';
import 'package:flutter/material.dart';
import 'home_page.dart';
import 'setting_page.dart';
import 'package:graphql/client.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:provider/provider.dart';
import '../Utility/language_provider.dart';
import 'package:ddotv3/main.dart';
import 'package:intl/intl.dart';
import 'color_blind_test_page.dart';

final String databaseURL = globalDatabaseURL;

class SideEffectPage_start extends StatefulWidget {
  const SideEffectPage_start({Key? key}) : super(key: key);

  @override
  _SideEffectPage_startState createState() => _SideEffectPage_startState();
}

class SideEffect {
  final String imagePath;
  bool isChecked;
  String additionalInfo;

  SideEffect(this.imagePath, this.isChecked, this.additionalInfo);
}

class _SideEffectPage_startState extends State<SideEffectPage_start> {
  List<SideEffect> sideEffects = [
    SideEffect('assets/images/side_effect_img/itchy_skin.jpg', false, ''),
    SideEffect('assets/images/side_effect_img/numbness.jpg', false, ''),
    SideEffect('assets/images/side_effect_img/orange_pee.jpg', false, ''),
    SideEffect('assets/images/side_effect_img/stomachache.jpg', false, ''),
    SideEffect('assets/images/side_effect_img/swollen_face.jpg', false, ''),
    SideEffect('assets/images/side_effect_img/vomit.jpg', false, ''),
    SideEffect('assets/images/side_effect_img/yellow_eye_body.jpg', false, ''),
  ];
  SideEffect otherEffect = SideEffect('', false, '');
  String checkedSideEffectsString = '';
  String checkedSideEffectsStringToUpload = '';
  late String graphqlEndpoint;
  late HttpLink httpLink;
  late GraphQLClient client;
  late String topperHeader, buttonHeader, otherHeader, validationHeader, peeHeader, itchyHeader, numbnessHeader, swollenFaceHeader, stomachHeader, vomitHeader, yellowHeader
              , errorHeader, errorDesc, submittedDesc, checkedDesc, skip_botton; 
  final FlutterSecureStorage _storage = FlutterSecureStorage();
  
  @override
  void initState() {
    super.initState();
    // Initialize the GraphQL client
    graphqlEndpoint = databaseURL; 
    httpLink = HttpLink(graphqlEndpoint);
    client = GraphQLClient(
      link: httpLink,
      cache: GraphQLCache(),
    );
  }

  Future<void> _submitForm() async {
    // Get the current date and time
    if (!_isAnyCheckboxChecked()) {
    _showErrorPopup("Please choose the side effects");
    return;
    }
    DateTime currentDate = DateTime.now().toLocal();
    String effectDate = currentDate.toIso8601String().split('T')[0];
    String effectTime = currentDate.toIso8601String().split('T')[1];

    print("effectTime: ${effectTime}");
    // Get the checked side effects in the specified string format
    List<String> checkedSideEffects = [];
    List<String> checkedSideEffectsToUpload = [];
    for (SideEffect effect in sideEffects) {
      if (effect.isChecked) {
        checkedSideEffects.add(getTextForImage(effect.imagePath));
        checkedSideEffectsToUpload.add(getTextForImageToUpload(effect.imagePath));
      }
    }

    if (otherEffect.isChecked) {
      checkedSideEffects.add('${otherEffect.additionalInfo}');
      checkedSideEffectsToUpload.add('${otherEffect.additionalInfo}');
    }

    checkedSideEffectsString = checkedSideEffects.join(', ');
    checkedSideEffectsStringToUpload = checkedSideEffectsToUpload.join(', ');
    // Save the data to the backend using the addSideEffect mutation
    // await saveSideEffectToBackend(checkedSideEffectsString, effectDate, effectTime);
    await saveSideEffectToBackend(checkedSideEffectsStringToUpload, effectDate, effectTime);

    // Show "Submitted" popup for 5 seconds with checked side effects
    

    // Delayed navigation back to the home page after 5 seconds
    Future.delayed(Duration(seconds: 5), () {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => HomePage()),
      );
    });
  }

  bool _isAnyCheckboxChecked() {
  // Check if at least one checkbox is checked
  for (SideEffect effect in sideEffects) {
    if (effect.isChecked) {
      return true;
    }
  }

  // Check "Other" checkbox
  return otherEffect.isChecked; 
  }

  void _showErrorPopup(String message) {
  showDialog(
    context: context,
    builder: (BuildContext context) {
      return AlertDialog(
        content: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(errorHeader),
            SizedBox(height: 8),
            Text(message),
          ],
        ),
      );
    },
  );
  }
  Future<void> saveSideEffectToBackend(
    
      String checkedSideEffectsString, String effectDate, String effectTime) async {
        final storedCid = await _storage.read(key: 'cid');
    print('Saving to the database:');
    print('Patient CID: $storedCid'); 
    print('Effect Date: $effectDate');
    print('Effect Time: $effectTime');
    print('Effect Description: $checkedSideEffectsString');

    final MutationOptions options = MutationOptions(
      document: gql('''
        mutation AddSideEffect(\$patientCID: String!, \$effectDate: Date!, \$effectTime: Time!, \$effectDesc: String!) {
          addSideEffect(input: { patientCID: \$patientCID, effectDate: \$effectDate, effectTime: \$effectTime, effectDesc: \$effectDesc }) {
            sideEffectID
            patientCID
            effectDate
            effectTime
            effectDesc
          }
        }
      '''),
      variables: {
        'patientCID': storedCid, 
        'effectDate': effectDate,
        'effectTime': effectTime,
        'effectDesc': checkedSideEffectsString,
      },
    );

    try {
      final QueryResult result = await client.mutate(options);

      if (result.hasException) {
        _showErrorPopup(errorDesc);
        print('Error saving side effect data to the backend: ${result.exception}');
      } else {
        _showSubmittedPopup();
        print('Side effect data successfully saved to the backend.');
      }
    } catch (error) {
      print('Error: $error');
    }
  }

  String getTextForImage(String imagePath) {
    switch (imagePath) {
      case 'assets/images/side_effect_img/itchy_skin.jpg':
        return itchyHeader;
      case 'assets/images/side_effect_img/numbness.jpg':
        return numbnessHeader;
      case 'assets/images/side_effect_img/orange_pee.jpg':
        return peeHeader;
      case 'assets/images/side_effect_img/stomachache.jpg':
        return stomachHeader;
      case 'assets/images/side_effect_img/swollen_face.jpg':
        return swollenFaceHeader;
      case 'assets/images/side_effect_img/vomit.jpg':
        return vomitHeader;
      case 'assets/images/side_effect_img/yellow_eye_body.jpg':
        return yellowHeader;
      default:
        return '';
    }
  }
  String getTextForImageToUpload(String imagePath) {
    switch (imagePath) {
      case 'assets/images/side_effect_img/itchy_skin.jpg':
        return "คันตามผิวหนัง";
      case 'assets/images/side_effect_img/numbness.jpg':
        return "ชานิ้วมือ/นิ้วเท้า";
      case 'assets/images/side_effect_img/orange_pee.jpg':
        return "ปัสสาวะเป็นสีส้ม";
      case 'assets/images/side_effect_img/stomachache.jpg':
        return "ปวดท้อง";
      case 'assets/images/side_effect_img/swollen_face.jpg':
        return "ใบหน้าบวม";
      case 'assets/images/side_effect_img/vomit.jpg':
        return "อาเจียน";
      case 'assets/images/side_effect_img/yellow_eye_body.jpg':
        return "ดวงตา/ตัวเป็นสีเหลือง";
      default:
        return '';
    }
  }

  void _showSubmittedPopup() {
    List<String> checkedSideEffects = [];

    // Get the names of checked side effects
    for (SideEffect effect in sideEffects) {
      if (effect.isChecked) {
        checkedSideEffects.add(getTextForImage(effect.imagePath));
      }
    }

    // Add "Other" if checked
    if (otherEffect.isChecked) {
      checkedSideEffects.add('${otherEffect.additionalInfo}');
    }

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          content: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(submittedDesc),
              SizedBox(height: 8),
              Text(checkedDesc),
              for (String sideEffect in checkedSideEffects)
                Text('- $sideEffect'),
            ],
          ),
        );
      },
    );
  }

  void _updateTexts(String language) {
    if (language == "th") {
      topperHeader = "รายงานผลข้างเคียง";
      buttonHeader = "บันทึก";
      otherHeader = "อื่นๆ";
      validationHeader = "โปรดเลือกผลข้างเคียง";
      stomachHeader = "ปวดท้อง";
      numbnessHeader = "ชานิ้วมือ/นิ้วเท้า";
      peeHeader = "ปัสสาวะเป็นสีส้ม";
      itchyHeader = "คันตามผิวหนัง";
      swollenFaceHeader = "ใบหน้าบวม";
      vomitHeader = "อาเจียน";
      yellowHeader = "ดวงตา/ตัว เป็นสีเหลือง";
      errorHeader = "เกิดข้อผิดพลาด";
      errorDesc = "โปรดเช็คการเชื่อมต่ออินเตอร์เน็ตหรือติดต่อเจ้่าหน้าที่";
      submittedDesc = "บันทึกผลข้างเคียงแล้ว";
      checkedDesc = "ผลข้างเคียงที่เลือก";
      skip_botton = "ไม่พบผลข้างเคียง";
    } else {
      topperHeader = "Side Effect Report";
      buttonHeader = "Submit";
      otherHeader = "Other";
      validationHeader = "Please choose the side effect";
      stomachHeader = "Stomachache";
      numbnessHeader = "Finger numbness";
      peeHeader = "Orange pee";
      itchyHeader = "Itchy skin";
      swollenFaceHeader = "Swollen face";
      vomitHeader = "Vomit";
      yellowHeader = "Yellow eye/body";
      errorHeader = "Error";
      errorDesc = "Please check the internet connection or contact observer.";
      submittedDesc = "Submitted";
      checkedDesc = "Checked Side Effects";
      skip_botton = "No side effects found";
    }
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
                topperHeader,
                style: TextStyle(color: Colors.white, fontSize: 18.0),
              ),
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: ListView.builder(
                itemCount: sideEffects.length + 1, // Add 1 for "Other" row
                itemBuilder: (context, index) {
                  if (index < sideEffects.length) {
                    // Existing side effects row
                    return Row(
                      children: [
                        Image.asset(
                          sideEffects[index].imagePath,
                          width: 150,
                          height: 150,
                        ),
                        SizedBox(width: 16),
                        Text(getTextForImage(sideEffects[index].imagePath)),
                        Spacer(),
                        Checkbox(
                          value: sideEffects[index].isChecked,
                          onChanged: (value) {
                            setState(() {
                              sideEffects[index].isChecked = value!;
                            });
                          },
                        ),
                      ],
                    );
                  } else {
                    // "Other" row
                    return Row(
                      children: [
                        Checkbox(
                          value: otherEffect.isChecked,
                          onChanged: (value) {
                            setState(() {
                              otherEffect.isChecked = value!;
                            });
                          },
                        ),
                        SizedBox(width: 16),
                        Expanded(
                          child: TextFormField(
                            decoration: InputDecoration(
                              labelText: otherHeader,
                            ),
                            onChanged: (value) {
                              setState(() {
                                otherEffect.additionalInfo = value;
                              });
                            },
                          ),
                        ),
                      ],
                    );
                  }
                },
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                ElevatedButton(
                  onPressed: _submitForm,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    padding: EdgeInsets.symmetric(horizontal: 20.0, vertical: 10.0),
                  ),
                  child: Text(buttonHeader, style: TextStyle(fontSize: 16.0, color: Colors.white)),
                ),
                ElevatedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => CBtestPage()),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                    padding: EdgeInsets.symmetric(horizontal: 20.0, vertical: 10.0),
                  ),
                  icon: Icon(Icons.not_interested, color: Colors.white),
                  label: Text(skip_botton, style: TextStyle(fontSize: 16.0, color: Colors.white)),
                ),
              ],
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
}


