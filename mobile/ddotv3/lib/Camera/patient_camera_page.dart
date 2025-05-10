import 'package:camera/camera.dart';
import 'package:ddotv3/Page/home_page.dart';
import 'package:ddotv3/Page/monthly_report.dart';
import 'package:ddotv3/Page/setting_page.dart';
import 'package:flutter/services.dart';
import '../Utility/OrientationFixer.dart';
import '../main.dart';
import 'screens/camera_screen.dart';
import 'screens/file_explorer.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:provider/provider.dart';
import '../Utility/language_provider.dart';

class CameraPage extends StatefulWidget {
  const CameraPage({Key? key}) : super(key: key);

  @override
  State<CameraPage> createState() => _CameraPageState();
}

class _CameraPageState extends State<CameraPage> {
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
                    TextButton(
                      onPressed: () {
                        Navigator.of(context).pushReplacement(
                          MaterialPageRoute(
                            builder: (context) => FileExplorer(),
                          ),
                        );
                      },
                      child: Text(
                        fileExplorerHeader,
                        style: TextStyle(fontSize: 16.0),
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
