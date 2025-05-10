import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mssql_connection/mssql_connection.dart';
import 'dart:io';
import 'package:path_provider/path_provider.dart';

class UploadLogFilePage extends StatefulWidget {
  @override
  _UploadLogFilePageState createState() => _UploadLogFilePageState();
}

class _UploadLogFilePageState extends State<UploadLogFilePage> {
  final _sqlConnection = MssqlConnection.getInstance();
  String ip = '10.34.2.195',
      port = '1433',
      username = 'sa',
      password = 'ThitinanD-D0T',
      databaseName = 'dDOTv4';

  bool isUploading = false;
  String uploadStatus = "";

  Future<void> uploadLogFileToDatabase(File file) async {
    setState(() {
      isUploading = true;
      uploadStatus = "Uploading to database...";
    });

    try {
      // Parse the TSV file
      final lines = await file.readAsLines();
      final data = lines.map((line) => line.split('\t')).toList();

      // Connect to the SQL Server database
      bool connected = await _sqlConnection.connect(
        ip: ip,
        port: port,
        databaseName: databaseName,
        username: username,
        password: password,
      );

      if (!connected) {
        setState(() {
          uploadStatus = "Connection to database failed.";
        });
        return;
      }

      // Insert data into the database
      for (var row in data) {
        if (row.length >= 3) {
          try {
            // Parse and format the Timestamp
            final timestamp = DateTime.parse(row[0]);
            final formattedTimestamp = timestamp.toIso8601String();

            await _sqlConnection.writeData(
              "INSERT INTO pillboxlog (Timestamp, SensorData, BoxID) VALUES ('$formattedTimestamp', '${row[1]}', '${row[2]}')",
            );
          } catch (e) {
            // Handle parsing errors for individual rows
            print("Error parsing or inserting row: $row, Error: $e");
          }
        }
      }

      setState(() {
        uploadStatus = "Upload to database successful!";
      });
    } catch (e) {
      setState(() {
        uploadStatus = "Error: $e";
      });
    } finally {
      setState(() {
        isUploading = false;
      });
      _sqlConnection.disconnect();
    }
  }

  Future<List<File>> _getLogFiles() async {
    final directory = await getApplicationDocumentsDirectory();
    final logDir = Directory('${directory.path}/logs');
    if (!await logDir.exists()) {
      return [];
    }
    return logDir.listSync().whereType<File>().toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Upload Log Files"),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Select a log file to upload to the database:",
              style: TextStyle(fontSize: 18.0, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 10.0),
            Expanded(
              child: FutureBuilder<List<File>>(
                future: _getLogFiles(),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return Center(child: CircularProgressIndicator());
                  } else if (snapshot.hasError) {
                    return Center(child: Text("Error loading files"));
                  } else {
                    final files = snapshot.data ?? [];
                    if (files.isEmpty) {
                      return Center(child: Text("No log files found"));
                    }
                    return ListView.builder(
                      itemCount: files.length,
                      itemBuilder: (context, index) {
                        return ListTile(
                          title: Text(files[index].path.split('/').last),
                          trailing: isUploading
                              ? CircularProgressIndicator()
                              : IconButton(
                                  icon: Icon(Icons.cloud_upload, color: Colors.blue),
                                  onPressed: () => uploadLogFileToDatabase(files[index]),
                                ),
                        );
                      },
                    );
                  }
                },
              ),
            ),
            if (uploadStatus.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 10.0),
                child: Text(
                  uploadStatus,
                  style: TextStyle(
                    color: uploadStatus.contains("successful")
                        ? Colors.green
                        : Colors.red,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}