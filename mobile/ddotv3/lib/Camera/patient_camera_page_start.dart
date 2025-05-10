import 'package:camera/camera.dart';
import 'package:ddotv3/Page/home_page.dart';
import 'package:ddotv3/Page/monthly_report.dart';
import 'package:ddotv3/Page/setting_page.dart';
import 'package:flutter/services.dart';
import '../Utility/OrientationFixer.dart';
import '../main.dart';
import 'screens/camera_screen.dart';
import 'screens/file_explorer_start.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:provider/provider.dart';
import '../Utility/language_provider.dart';

class CameraPage_start extends StatefulWidget {
  const CameraPage_start({Key? key}) : super(key: key);

  @override
  State<CameraPage_start> createState() => _CameraPage_startState();
}

class _CameraPage_startState extends State<CameraPage_start> {
  bool pressed = false;
  late String fileExplorerHeader, pageHeader;

  @override
  void initState() {
    super.initState();

    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
    ]);
  }

  @override
  dispose() {
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeRight,
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    String language = context.read<LanguageProvider>().language;
    _updateTexts(language);

    return OrientationFixer(
      preferredOrientations: const [DeviceOrientation.portraitUp],
      child: Scaffold(
        body: Column(
          children: [
            Container(
              color: Theme.of(context).colorScheme.primary,
              padding: const EdgeInsets.all(16.0),
              child: Center(
                child: Text(
                  pageHeader,
                  style: TextStyle(color: Colors.white, fontSize: 18.0),
                ),
              ),
            ),
            Expanded(
              child: Center(
                child: Column(
                  children: [
                    Padding(
                      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 15),
                    ),
                    Center(
                      child: SizedBox(
                        width: 300,
                        height: 600,
                        child: CameraScreen(),
                      ),
                      
                    ),
                  Center(
        child: Container(
          padding: EdgeInsets.symmetric(vertical: 8.0, horizontal: 16.0), // Add padding inside the box
          margin: EdgeInsets.all(10.0), // Optional: Add margin outside the box
          decoration: BoxDecoration(
            color: Colors.blueGrey[50], // Background color of the box
            border: Border.all(color: Colors.blueGrey.shade300), // Border around the box
            borderRadius: BorderRadius.circular(8.0), // Rounded corners for the box
            boxShadow: [ // Optional: Add a subtle shadow
              BoxShadow(
                color: Colors.grey.withOpacity(0.2),
                spreadRadius: 1,
                blurRadius: 3,
                offset: Offset(0, 2), // changes position of shadow
              ),
            ],
          ),
          child: TextButton(
            onPressed: () {
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(
                  builder: (context) => FileExplorer_start(),
                ),
              );
            },
            // Optional: Remove default padding if container padding is sufficient
            // style: TextButton.styleFrom(
            //   padding: EdgeInsets.zero,
            //   minimumSize: Size(50, 30), // Adjust if needed
            //   tapTargetSize: MaterialTapTargetSize.shrinkWrap, // Minimise tap area if needed
            // ),
            child: Text(
              fileExplorerHeader,
              style: TextStyle(fontSize: 16.0, color: Colors.blueGrey[800]), // Adjust text color if needed
            ),
          ),
        ),
      ),
                    // TextButton(
                    //   onPressed: () {
                    //     Navigator.of(context).pushReplacement(
                    //       MaterialPageRoute(
                    //         builder: (context) => FileExplorer_start(),
                    //       ),
                    //     );
                    //   },
                    //   child: 
                    //   Text(
                    //     fileExplorerHeader,
                    //     style: TextStyle(fontSize: 16.0),
                    //   ),
                    // ),
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
      ),
    );
  }

  void _updateTexts(String language) {
    if (language == "th") {
      fileExplorerHeader = "หน้าส่งวีดีโอ";
      pageHeader = "อัดวีดีโอ";
    } else {
      fileExplorerHeader = "Video Explorer";
      pageHeader = "Video Record Page";
    }
  }
}
