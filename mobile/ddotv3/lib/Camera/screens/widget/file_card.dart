//file card
import 'dart:io';
import 'dart:math';

import 'package:ddotv3/Utility/language_provider.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:graphql/client.dart';
import 'package:intl/intl.dart';
import 'package:http/http.dart' as http;
import 'package:ddotv3/main.dart';
import 'package:provider/provider.dart';

final String videoURL = globalVideoURL;
final String databaseURL = globalDatabaseURL;

final FlutterSecureStorage _secureStorage = FlutterSecureStorage();
// late final String graphqlEndpoint;
// late final HttpLink httpLink;
// late final GraphQLClient client;
// late final DateTime currentDate;
// late final DateFormat formatter;
// late final String formattedDate;

class FileCard extends StatelessWidget {
  final String filePath;
  final VoidCallback onDelete;
  final VoidCallback onUpdateUI; // New callback to trigger UI update
  // late String deleteHeader, deleteDesc, cancel, ok, uploadHeader, uploadSuccess, errorHeader, errorDesc;

  const FileCard({Key? key, required this.filePath, required this.onDelete, required this.onUpdateUI}) : super(key: key);

  
  
  Future<String> getFileSize(String filepath, int decimals) async {
    var file = File(filepath);
    int bytes = await file.length();
    if (bytes <= 0) return "0 B";
    const suffixes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    var i = (log(bytes) / log(1024)).floor();
    String size =
        ('${(bytes / pow(1024, i)).toStringAsFixed(decimals)} ${suffixes[i]}');
    return size;
  }

  Future<String?> uploadVideo(String filename, String time_to_upload, String date_to_upload) async {
    String serverIp = videoURL;

    List<String> parts = time_to_upload.split(':');
    String hours = parts[0];
    String minutes = parts[1];
    String secondsWithFraction = parts[2];
    List<String> secParts = secondsWithFraction.split('.');
    String seconds = secParts[0];
    String convertedTime = "$hours" + "-" + "$minutes" + "-" + "$seconds";

    var request = http.MultipartRequest('POST', Uri.parse(serverIp));
    final storedCid = await _secureStorage.read(key: 'cid');
    int lastIndex_ = filename.lastIndexOf("/");
    // String cutFilename_ = "$storedCid" + "_" + "$date_to_upload" + "_" + "$convertedTime" + "_"+ filename.substring(lastIndex_ + 1);
    String cutFilename_ = "$storedCid" + "_" + "$date_to_upload" + "_"+ filename.substring(lastIndex_ + 1);
    request.files.add(await http.MultipartFile.fromPath('video', filename, filename: cutFilename_));
    print("Upload $filename to $serverIp");
    var response = await request.send();
    print(" Response: ${response.reasonPhrase}");
    if (response.statusCode == 200) {
      // Successful upload
      uploadDotActivity(cutFilename_,time_to_upload,date_to_upload);
      return response.reasonPhrase;
    } else {
      throw Exception('Failed to upload video');
    }
  }

  @override
  Widget build(BuildContext context) {
    String language = context.read<LanguageProvider>().language;
    late String deleteHeader, deleteDesc, cancelButton, okButton, uploading_, uploadSuccess, errorDesc, errorHeader;
    if(language == "th"){
      deleteHeader = "ลบไฟล์";
      deleteDesc = "ทำการลบไฟล์:";
      cancelButton = "ยกเลิก";
      okButton = "ตกลง";
      uploading_ = "กำลังอัพโหลดไฟล์...";
      uploadSuccess = "อัพโหลดสำเร็จ";
      errorDesc = "เกิดข้อผิดพลาด";
      errorHeader = "ไม่สามารถอัพโหลดไฟล์ \n โปรดเช็คการเชื่อมต่อและลองอีกครั้ง";
    }else{
      deleteHeader = "Delete file";
      deleteDesc = "Deleting";
      cancelButton = "Cancel";
      okButton = "Ok";
      uploading_ = "Uploading...";
      uploadSuccess = "Upload success";
      errorDesc = "Error Occur";
      errorHeader = "Unable to upload, please check internet connection and try again.";
    }
    Future<bool?> deleteConfirmationDialog(String path, String name, String dateFormated) async {
      return showDialog<bool>(
        context: context,
        builder: (BuildContext context) {
          return AlertDialog(
            title: Text(deleteHeader),
            content: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Text('$deleteDesc $dateFormated | $name'),
              ],
            ),
            actions: <Widget>[
              TextButton(
                onPressed: () {
                  Navigator.pop(context, false);
                },
                child: Text(cancelButton),
              ),
              TextButton(
                onPressed: () async {
                  try {
                    await deleteFile(path);
                    Navigator.pop(context, true);
                  } catch (e) {
                    print(e);
                  }
                },
                child: Text(okButton),
              ),
            ],
          );
        },
      );
    }

    Future<bool?> uploadConfirmationDialog(String path, String name, String dateFormated, String time_to_upload, String date_to_upload) async {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (BuildContext context) {
          return AlertDialog(
            title: Text(uploading_),
          );
        },
      );

      try {
        String? uploadedFileName = await uploadVideo(path, time_to_upload, date_to_upload); // Get uploaded file name or identifier
        await deleteFile(path); // Delete the file after successful upload
        Navigator.pop(context); // Close the "Uploading..." dialog
        onUpdateUI(); // Trigger UI update
        showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              title: Text(uploadSuccess),
              actions: <Widget>[
                TextButton(
                  onPressed: () {
                    Navigator.pop(context, true);
                  },
                  child: Text(okButton),
                ),
              ],
            );
          },
        );
        return true;
      } catch (e) {
        print(e);
        Navigator.pop(context); // Close the "Uploading..." dialog
        showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              title: Text(errorHeader),
              content: Text(errorDesc),
              actions: <Widget>[
                TextButton(
                  onPressed: () {
                    Navigator.pop(context, false);
                  },
                  child: Text(okButton),
                ),
              ],
            );
          },
        );
        return false;
      }
    }

    if (filePath.isNotEmpty) {
      String graphqlEndpoint = databaseURL;
      HttpLink httpLink = HttpLink(graphqlEndpoint);
      GraphQLClient client = GraphQLClient(
        link: httpLink,
        cache: GraphQLCache(),
      );

      String name = filePath.split('/').last.split('.').first;
      print("name: $name");
      var date = DateTime.fromMillisecondsSinceEpoch(int.parse(name));
      print("date: $date");
      var dateFormated = DateFormat('dd/MM/yyyy, HH:mm').format(date);
      var time_to_upload = DateFormat('HH:mm:ss.SSSSSSS').format(date);
      var date_to_upload = DateFormat('yyyy-MM-dd').format(date);
      print("dateFormated: $dateFormated");
      print("time_to_upload: $time_to_upload");
      print("date_to_upload: $date_to_upload");
      return FutureBuilder(
        future: getFileSize(filePath, 2),
        builder: (BuildContext context, AsyncSnapshot<String> snapshot) {
          if (snapshot.hasData) {
            String? data = snapshot.data;
            return ListTile(
              leading: IconButton(
                icon: const Icon(Icons.delete),
                onPressed: () async {
                  bool? deleteConfirmed = await deleteConfirmationDialog(filePath, name, dateFormated);
                  if (deleteConfirmed == true) {
                    // File will be deleted upon confirmation
                    onDelete();
                  }
                },
              ),
              title: Text("$dateFormated | $name"),
              subtitle: Text("$filePath \n $data"),
              trailing: IconButton(
                icon: const Icon(Icons.upload),
                onPressed: () {
                  uploadConfirmationDialog(filePath, name, dateFormated, time_to_upload, date_to_upload);
                },
              ),
            );
          } else {
            return Container();
          }
        },
      );
    }
    return const Text("Error occur/ผิดพลาด");
  }

  Future<void> deleteFile(String filePath) async {
    final file = File(filePath);
    await file.delete();
  }

  Future<void> uploadDotActivity(String filename, String time_to_upload, String date_to_upload) async {
    // currentDate = DateTime.now();
    // formatter = DateFormat('yyyy-MM-dd');
    // formattedDate = formatter.format(currentDate);
    final storedCid = await _secureStorage.read(key: 'cid');
    // final currentTime = currentDate.toIso8601String().split('T')[1];
    // print("formattedDate: $formattedDate");
    // print("currentTime: $currentTime");
    print("time_to_upload: $time_to_upload");
    print("date_to_upload: $date_to_upload");
    final MutationOptions options = MutationOptions(
      document: gql('''
        mutation AddDotActivity(\$input: AddDotActivityInput!) {
          addDotActivity(input: \$input) {
            dotActivityID
            date
            time
            videoLink
            pillEaten
            cid
          }
        }
      '''),
      variables: {
        'input': {
          'date': date_to_upload,
          'time': time_to_upload,
          'videoLink': filename,
          'pillEaten': 0,
          'cid': storedCid,
        },
      },
    );
    try {
      // Perform the mutation
      String graphqlEndpoint = databaseURL;
      HttpLink httpLink = HttpLink(graphqlEndpoint);
      GraphQLClient client = GraphQLClient(
        link: httpLink,
        cache: GraphQLCache(),
      );
      final QueryResult result = await client.mutate(options);

      if (result.hasException) {
        // Handle mutation exception
        print('Error adding DOT activity: ${result.exception}');
      } else {
        // Handle mutation success
        print('DOT activity successfully added: ${result.data}');
      }
    } catch (error) {
      // Handle any other errors
      print('Error: $error');
    }
  }
}