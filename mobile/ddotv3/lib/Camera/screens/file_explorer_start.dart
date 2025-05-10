import 'dart:io';

import 'package:ddotv3/Utility/language_provider.dart';
import 'package:provider/provider.dart';

import 'widget/file_card.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:http/http.dart' as http;
import 'package:ddotv3/main.dart';
import 'package:ddotv3/Page/side_effect_page_start.dart';
import '../patient_camera_page_start.dart';

final String videoURL = globalVideoURL;

class FileExplorer_start extends StatefulWidget {
  @override
  State<FileExplorer_start> createState() => _FileExplorer_startState();
}

class _FileExplorer_startState extends State<FileExplorer_start> {
  List<File> allFileList = [];
  List<String> filePath = [];
  late String pageHeader, ContinueButtonText;

  
  Future<List<String>> _getFilePath() async {
    final directory = await getApplicationDocumentsDirectory();
    List<FileSystemEntity> fileList = await directory.list().toList();
    List<Map<int, dynamic>> fileNames = [];

    filePath.clear();

    fileList.forEach((file) {
      if (file.path.contains('.mp4')) {
        filePath.add(file.path);
      }
    });

    if (filePath != []) {
      print(filePath);
      return filePath;
    }

    return [];
  }

  Future<String?> uploadImage(filename) async {
    var request = http.MultipartRequest(
        'POST', Uri.parse(videoURL));
    request.files.add(await http.MultipartFile.fromPath('video', filename));
    var res = await request.send();
    print(" Response: ${res.reasonPhrase}");
    return res.reasonPhrase;
  }

  @override
  void initState() {
    super.initState();
  }

  getAllFile() async {
    final directory = await getApplicationDocumentsDirectory();
    List<FileSystemEntity> fileList = await directory.list().toList();
    allFileList.clear();
    List<Map<int, dynamic>> fileNames = [];

    fileList.forEach((file) {
      if (file.path.contains('.mp4')) {
        allFileList.add(File(file.path));

        String name = file.path.split('/').last.split('.').first;
        fileNames.add({0: int.parse(name), 1: file.path.split('/').last});
        print(file.path);
      }
    });
    // if (filePath.isNotEmpty) {
    //   print("Uploading $filePath");
    //   // uploadImage(filePath);
    // }
  }

  @override
  Widget build(BuildContext context) {
    String language = context.read<LanguageProvider>().language;
    _updateTexts(language);

    return Scaffold(
      appBar: AppBar(
        title: Text(pageHeader),
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (context) => const CameraPage_start(),
            ),
          ),
        ),
      ),
      body: Container(
        child: FutureBuilder(
          future: _getFilePath(),
          builder: ((context, AsyncSnapshot<List> snapshot) {
            if (!snapshot.hasData) {
              return const Center(
                child: CircularProgressIndicator(),
              );
            } else {
              var data = snapshot.data;
              print(data?.length);
              int? dataLenght = data?.length;
              return Column(
                children: [
                  Expanded(
                    child: ListView.builder(
                      itemCount: dataLenght,
                      itemBuilder: ((context, int index) {
                        return FileCard(
                          filePath: data![index],
                          onDelete: () {
                            setState(() {
                              // Remove the file path from the list
                              data.removeAt(index);
                            });
                          },
                          onUpdateUI: () {
                            setState(() {}); // Trigger UI update
                          },
                        );
                      }),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => SideEffectPage_start(),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Theme.of(context).colorScheme.primary,
                        padding: EdgeInsets.symmetric(vertical: 20.0, horizontal: 40.0),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10.0),
                        ),
                      ),
                      icon: Icon(Icons.arrow_forward, color: Colors.white),
                      label: Text(
                        ContinueButtonText,
                        style: TextStyle(color: Colors.white, fontSize: 16.0),
                      ),
                    ),
                  ),
                ],
              );
            }
          }),
        ),
      ),
    );
  }

  void _updateTexts(String language) {
    if (language == "th") {
      pageHeader = "หน้าส่งวีดีโอ";
      ContinueButtonText = "ถัดไป";
    } else {
      pageHeader = "Video Explorer";
      ContinueButtonText = "Continue";
    }
  }

  Widget _buildHeaderBox() {
    return Container(
      margin: const EdgeInsets.all(16.0),
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: Colors.blueAccent,
        borderRadius: BorderRadius.circular(8.0),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.5),
            spreadRadius: 2,
            blurRadius: 5,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Text(
        pageHeader,
        style: TextStyle(
          color: Colors.white,
          fontSize: 18.0,
          fontWeight: FontWeight.bold,
        ),
        textAlign: TextAlign.center,
      ),
    );
  }
}
