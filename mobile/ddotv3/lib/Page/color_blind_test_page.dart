import 'package:ddotv3/Utility/language_provider.dart';
import 'package:ddotv3/Page/monthly_report.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'home_page.dart';
import 'setting_page.dart';
import 'package:graphql/client.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:ddotv3/main.dart';


final String databaseURL = globalDatabaseURL;

class CBtestPage extends StatefulWidget {
  const CBtestPage({Key? key}) : super(key: key);

  @override
  _CBtestPageState createState() => _CBtestPageState();
}

class _CBtestPageState extends State<CBtestPage> {
  int currentRound = 0;
  String currentImagePath = '';
  int correctNumber = 0;
  List<int> usedImageIndices = [];
  int totalScore = 0;
  List<bool> roundScores = List<bool>.filled(10, false);
  List<String> enteredAnswers = [];
  late String validateHeader,RoundHeader, Instruction1, Instruction2, SubmitHeader, 
              colorblindHeader, scoreHeader, scoreSubHeader, ok, errorHeader, errorDesc;
  TextEditingController answerController = TextEditingController();

  late String graphqlEndpoint;
  late HttpLink httpLink;
  late GraphQLClient client;
  final FlutterSecureStorage _storage = FlutterSecureStorage();

  @override
  void initState() {
    super.initState();
    initializeGame();
    initializeGraphQLClient();
  }

  void initializeGraphQLClient() {
    graphqlEndpoint = databaseURL;
    httpLink = HttpLink(graphqlEndpoint);
    client = GraphQLClient(
      link: httpLink,
      cache: GraphQLCache(),
    );
  }

  void initializeGame() {
    currentRound++;

    if (usedImageIndices.length == 10) {
      usedImageIndices = [];
    }

    List<int> allowedIndices = [5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 26, 29, 33, 45, 73];
    allowedIndices.shuffle();
    int newImageIndex;
    do {
      newImageIndex = allowedIndices.removeLast();
    } while (usedImageIndices.contains(newImageIndex));
    usedImageIndices.add(newImageIndex);

    correctNumber = newImageIndex;
    currentImagePath = 'assets/images/colorblind_img/$correctNumber.png';
  }

  void saveColorBlindResult() async {
    final storedCid = await _storage.read(key: 'cid');
    final currentDate = DateTime.now();
    final colorBlindDate = currentDate.toIso8601String().split('T')[0];
    final colorBlindTime = currentDate.toIso8601String().split('T')[1];
    final correct = totalScore;
    final incorrect = 10 - totalScore;

    final MutationOptions options = MutationOptions(
      document: gql('''
        mutation AddColorBlind(\$patientCID: String!, \$colorBlindDate: Date!, \$colorBlindTime: Time!, \$correct: Int!, \$incorrect: Int!) {
          addColorBlind(input: {
            patientCID: \$patientCID,
            colorBlindDate: \$colorBlindDate,
            colorBlindTime: \$colorBlindTime,
            correct: \$correct,
            incorrect: \$incorrect
          }) {
            colorBlindID
            patientCID
            colorBlindDate
            colorBlindTime
            correct
            incorrect
          }
        }
      '''),
      variables: {
        'patientCID': storedCid, // Replace with your actual constant CID
        'colorBlindDate': colorBlindDate,
        'colorBlindTime': colorBlindTime,
        'correct': correct,
        'incorrect': incorrect,
      },
    );

    try {
      final QueryResult result = await client.mutate(options);

      if (result.hasException) {
        print('Error saving color blindness test result to the backend: ${result.exception}');
        _showErrorPopup(errorDesc);
      } else {
        print('Color blindness test result successfully saved to the backend.');
        showResultPopup();
      }
    } catch (error) {
      print('Error: $error');
    }
  }

  void handleFinalRound() {
    if (currentRound == 10) {
      // showResultPopup();
      saveColorBlindResult();
    } else {
      setState(() {
        initializeGame();
        answerController.clear();
      });
    }
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

  void updateRoundScore(bool isCorrect, String enteredAnswer) {
    if (currentRound <= 10) {
      roundScores[currentRound - 1] = isCorrect;
      enteredAnswers.add(enteredAnswer);
      if (isCorrect) {
        totalScore++;
      }
    }

    handleFinalRound();
  }

  void showResultPopup() {
  showDialog(
    context: context,
    builder: (BuildContext context) {
      return AlertDialog(
        title: Text(scoreHeader),
        content: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('$scoreSubHeader: $totalScore/10'),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop(); // Close the dialog
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (context) => HomePage()),
                (route) => false, // Remove all previous routes
              );
            },
            child: Text(ok),
          ),
        ],
      );
    },
  );
}


  void showValidationErrorPopup(String message) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Validation Error'),
          content: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(message),
            ],
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: Text('OK'),
            ),
          ],
        );
      },
    );
  }
  
  @override
Widget build(BuildContext context) {
  String language = context.read<LanguageProvider>().language;
    _updateTexts(language);
    
  return Scaffold(
    resizeToAvoidBottomInset: false, // Prevent body resizing when keyboard appears
    body: Column(
      mainAxisSize: MainAxisSize.min, // Take minimum vertical space
      children: [
        Container(
          color: Theme.of(context).colorScheme.primary,
          padding: const EdgeInsets.all(16.0),
          child: Center(
            child: Text(
              colorblindHeader,
              style: TextStyle(color: Colors.white, fontSize: 18.0),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '$RoundHeader: $currentRound',
                style: TextStyle(fontSize: 16.0, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Image.asset(
                  currentImagePath,
                  width: 320,
                  height: 320,
                ),
                SizedBox(height: 16.0),
                Text(
                  Instruction1,
                  style: TextStyle(fontSize: 16.0),
                ),
                Text(
                  Instruction2,
                  style: TextStyle(fontSize: 16.0),
                ),
                SizedBox(height: 16.0),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    Expanded(
                      child: TextField(
                        controller: answerController,
                        keyboardType: TextInputType.number,
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 16.0),
                      ),
                    ),
                    SizedBox(width: 8.0),
                    ElevatedButton(
                      onPressed: () {
                        String enteredAnswer = answerController.text.trim();

                        if (enteredAnswer.isEmpty) {
                          showValidationErrorPopup(
                              validateHeader);
                        } else {
                          bool isCorrect = enteredAnswer == correctNumber.toString();
                          updateRoundScore(isCorrect, enteredAnswer);
                        }
                      },
                      child: Text(SubmitHeader),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        Align(
          alignment: Alignment.bottomCenter,
          child: Container(
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
        ),
      ],
    ),
  );
}
  void _updateTexts(String language) {
      if (language == "th") {
        RoundHeader = "รูปที่";
        Instruction1 = "การทดสอบตาบอดสีมีทั้งหมด 10 รูป";
        Instruction2 = "ผู้ป่วยต้องกรอกตัวเลขในช่องแล้วกดบันทึกคำตอบจนครบ 10 รูป";
        SubmitHeader = "บันทึก";
        colorblindHeader = "แบบทดสอบตาบอดสี";
        validateHeader = "โปรดกรอกตัวเลขที่มองเห็นในรูป";
        scoreHeader = "คะแนน";
        scoreSubHeader = "คะแนนที่ได้";
        ok = "ตกลง";
        errorHeader = "เกิดข้อผิดพลาด";
        errorDesc = "โปรดเช็คการเชื่อมต่ออินเตอร์เน็ตหรือติดต่อเจ้่าหน้าที่";
      } else {
        RoundHeader = "Image";
        Instruction1 = "There a total of 10 images in this color blindness test.";
        Instruction2 = "Patient must enter the number and click submit until finish.";
        SubmitHeader = "Submit";
        colorblindHeader = "Color Blindness test";
        validateHeader = "Please enter a number";
        scoreHeader = "Score";
        scoreSubHeader = "Total Score";
        ok = "Ok";
        errorHeader = "Error";
        errorDesc = "Please check the internet connection or contact observer.";
      }
    }
}