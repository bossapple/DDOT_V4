import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import 'package:provider/provider.dart';
import '../Utility/language_provider.dart';
import 'log_file_detail_page.dart';
import 'upload_log_file_page.dart';

class LogFilePage extends StatefulWidget {
  const LogFilePage({Key? key}) : super(key: key);

  @override
  _LogFilePageState createState() => _LogFilePageState();
}

class _LogFilePageState extends State<LogFilePage> {

  Future<List<File>> _getStoredLogFiles() async {
    final directory = await getApplicationDocumentsDirectory();
    final logDir = Directory('${directory.path}/logs');
    if (!await logDir.exists()) {
      await logDir.create(recursive: true);
    }
    return logDir.listSync().whereType<File>().toList();
  }

  Future<File> _storeLogFile(String content, String fileName) async {
    final directory = await getApplicationDocumentsDirectory();
    final logDir = Directory('${directory.path}/logs');
    if (!await logDir.exists()) {
      await logDir.create(recursive: true);
    }
    final file = File('${logDir.path}/$fileName');
    return file.writeAsString(content);
  }

  @override
  Widget build(BuildContext context) {
    String language = context.read<LanguageProvider>().language;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          language == "th" ? "ไฟล์บันทึก" : "Log Files",
          style: TextStyle(color: Colors.white),
        ),
        backgroundColor: Theme.of(context).colorScheme.primary,
        actions: [
          IconButton(
            icon: Icon(Icons.cloud_upload),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => UploadLogFilePage(), // Replace with the actual page for uploading log files
                ),
              );
            },
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              language == "th" ? "ไฟล์ที่จัดเก็บ:" : "Stored Files:",
              style: TextStyle(fontSize: 18.0, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 10.0),
            Expanded(
              child: FutureBuilder<List<File>>(
                future: _getStoredLogFiles(),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return Center(child: CircularProgressIndicator());
                  } else if (snapshot.hasError) {
                    return Center(child: Text(language == "th" ? "เกิดข้อผิดพลาดในการโหลดไฟล์" : "Error loading files"));
                  } else {
                    final files = snapshot.data ?? [];
                    if (files.isEmpty) {
                      return Center(child: Text(language == "th" ? "ไม่มีไฟล์ที่จัดเก็บ" : "No stored files"));
                    }
                    return ListView.builder(
                      itemCount: files.length,
                      itemBuilder: (context, index) {
                        return ListTile(
                          title: Text(files[index].path.split('/').last),
                          trailing: IconButton(
                            icon: Icon(Icons.delete, color: Colors.red),
                            onPressed: () {
                              showDialog(
                                context: context,
                                builder: (BuildContext context) {
                                  return AlertDialog(
                                    title: Text(language == "th" ? "ยืนยันการลบ" : "Confirm Deletion"),
                                    content: Text(language == "th" ? "คุณต้องการลบไฟล์นี้หรือไม่?" : "Do you want to delete this file?"),
                                    actions: [
                                      TextButton(
                                        onPressed: () {
                                          Navigator.of(context).pop();
                                        },
                                        child: Text(language == "th" ? "ยกเลิก" : "Cancel"),
                                      ),
                                      TextButton(
                                        onPressed: () async {
                                          await files[index].delete();
                                          setState(() {});
                                          Navigator.of(context).pop();
                                        },
                                        child: Text(language == "th" ? "ลบ" : "Delete"),
                                      ),
                                    ],
                                  );
                                },
                              );
                            },
                          ),
                          onTap: () async {
                            final content = await files[index].readAsString();
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => LogFileDetailPage(content: content),
                              ),
                            );
                          },
                        );
                      },
                    );
                  }
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}