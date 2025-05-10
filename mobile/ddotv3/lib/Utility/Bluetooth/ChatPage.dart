import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:ddotv3/Utility/language_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bluetooth_serial/flutter_bluetooth_serial.dart';
import 'package:provider/provider.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import 'package:permission_handler/permission_handler.dart';
import '../../Page/home_page.dart';
import '../../Page/monthly_report.dart';
import '../../Page/setting_page.dart';

class ChatPage extends StatefulWidget {
  final BluetoothDevice server;

  const ChatPage({required this.server});

  @override
  _ChatPage createState() => new _ChatPage();
}

class _Message {
  int whom;
  String text;

  _Message(this.whom, this.text);
}

class _ChatPage extends State<ChatPage> {
  static final clientID = 0;
  BluetoothConnection? connection;

  List<_Message> messages = List<_Message>.empty(growable: true);
  String _messageBuffer = '';

  final TextEditingController textEditingController =
      new TextEditingController();
  final ScrollController listScrollController = new ScrollController();

  bool isConnecting = true;
  bool get isConnected => (connection?.isConnected ?? false);

  bool isDisconnecting = false;
  List<List<String>> tsvDataList = []; // Two-dimensional list to store TSV data

  @override
  void initState() {
    super.initState();
    String language = context.read<LanguageProvider>().language;
    BluetoothConnection.toAddress(widget.server.address).then((_connection) {
      print('Connected to the device');
      connection = _connection;
      setState(() {
        isConnecting = false;
        isDisconnecting = false;
      });

      connection!.input!.listen(_onDataReceived).onDone(() {
        if (isDisconnecting) {
          print('Disconnecting locally!');
          showConnectionCompletedPopup(context, language, "Disconnected");
        } else {
          print('Disconnected remotely!');
          showConnectionCompletedPopup(context, language, "Disconnected");
        }
        if (this.mounted) {
          setState(() {});
        }
      });
      showConnectionCompletedPopup(context, language, "Connected");
    }).catchError((error) {
      print('Cannot connect, exception occured');
      print(error);
    });
  }

  @override
  void dispose() {
    if (isConnected) {
      isDisconnecting = true;
      connection?.dispose();
      connection = null;
    }

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final List<Row> list = messages.map((_message) {
      return Row(
        children: <Widget>[
          Container(
            child: Text(
              (text) {
                return text == '/shrug' ? '¯\\_(ツ)_/¯' : text;
              }(_message.text.trim()),
              style: TextStyle(color: Colors.white),
            ),
            padding: EdgeInsets.all(12.0),
            margin: EdgeInsets.only(bottom: 8.0, left: 8.0, right: 8.0),
            width: 222.0,
            decoration: BoxDecoration(
                color:
                    _message.whom == clientID ? Colors.blueAccent : Colors.grey,
                borderRadius: BorderRadius.circular(7.0)),
          ),
        ],
        mainAxisAlignment: _message.whom == clientID
            ? MainAxisAlignment.end
            : MainAxisAlignment.start,
      );
    }).toList();

    final serverName = widget.server.name ?? "Unknown";
    late String connectingHeader, recevingHeader = "";
    ;
    String language = context.read<LanguageProvider>().language;
    if (language == "th") {
      connectingHeader = "กำลังเชื่อมต่อกับ ";
      recevingHeader = "รับข้อมูลจาก ";
    } else {
      connectingHeader = "Connecting with ";
      recevingHeader = "Receiving data from ";
    }
    return Scaffold(
      appBar: AppBar(
        title: (isConnecting
            ? Text(connectingHeader + serverName + '...',
                style: TextStyle(
                    color: Colors.white)) // Change text color to white
            : isConnected
                ? Text(recevingHeader + serverName,
                    style: TextStyle(
                        color: Colors.white)) // Change text color to white
                : Text(recevingHeader + serverName,
                    style: TextStyle(
                        color: Colors.white))), // Change text color to white
        backgroundColor: Theme.of(context)
            .colorScheme
            .primary, // Set background color to primary color
      ),
      body: SafeArea(
        child: Column(
          children: <Widget>[
            Flexible(
              child: ListView(
                padding: const EdgeInsets.all(12.0),
                controller: listScrollController,
                children: list,
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
                        MaterialPageRoute(
                            builder: (context) => MonthlyReportPage()),
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

  void _onDataReceived(Uint8List data) {
    String dataString = utf8.decode(data);
    _messageBuffer += dataString; // Append data to the buffer

    // Process the buffer in chunks to handle large data
    int index;
    while ((index = _messageBuffer.indexOf('\r')) != -1) {
      String receivedMessage = _messageBuffer.substring(0, index);
      _messageBuffer = _messageBuffer.substring(index + 1);

      if (receivedMessage.isNotEmpty) {
        if (receivedMessage.contains("\t")) {
          // Handle TSV log file received in bulk
          List<String> rows = receivedMessage.split("\n");
          for (String row in rows) {
            if (row.contains("\t")) {
              List<String> columns = row.split("\t");
              if (columns.length >= 3) {
                tsvDataList.add(columns);
                save_tsv_to_secure_storage(columns[0], columns[1], columns[2]);
              }
            }
          }
        }
      }
    }

    // Ensure the buffer only contains valid data
    if (_messageBuffer.isNotEmpty && !_messageBuffer.endsWith('\r')) {
      // Retain incomplete data for the next chunk
      _messageBuffer = _messageBuffer;
    }
  }

  void save_tsv_to_secure_storage(String timestamp, String sensorData, String boxID) async {
    print("Read TSV log: Timestamp: $timestamp, SensorData: $sensorData, BoxID: $boxID");
    final directory = await getApplicationDocumentsDirectory();
    final logDir = Directory('${directory.path}/logs');
    if (!await logDir.exists()) {
      await logDir.create(recursive: true);
    }

    // Use a fixed file name for logs received at the same time
    final fileName =
        "log_${DateTime.now().toIso8601String().split('T').first}.tsv";
    final file = File('${logDir.path}/$fileName');

    final status = await Permission.storage.request();
    if (status.isGranted) {
      // Save the log entry to the app's private external storage directory
      final externalDir = Directory('/storage/self/primary/Documents');
      if (!await externalDir.exists()) {
        await externalDir.create(recursive: true);
      }
      final debugFile = File('${externalDir.path}/$fileName');

      // Write to both files concurrently
      try {
        await Future.wait([
          file.writeAsString("$timestamp\t$sensorData\t$boxID\n",
              mode: FileMode.append),
          debugFile.writeAsString("$timestamp\t$sensorData\t$boxID\n",
              mode: FileMode.append),
        ]);
      } catch (e) {
        print("Failed to write to files: $e");
      }
    } else {
      print("Storage permission denied.");
    }
  }

  void _sendMessage(String text) async {
    text = text.trim();
    textEditingController.clear();

    if (text.length > 0) {
      try {
        connection!.output.add(Uint8List.fromList(utf8.encode(text + "\r\n")));
        await connection!.output.allSent;

        setState(() {
          messages.add(_Message(clientID, text));
        });

        Future.delayed(Duration(milliseconds: 333)).then((_) {
          listScrollController.animateTo(
              listScrollController.position.maxScrollExtent,
              duration: Duration(milliseconds: 333),
              curve: Curves.easeOut);
        });
      } catch (e) {
        // Ignore error, but notify state
        setState(() {});
      }
    }
  }

  void showConnectionCompletedPopup(
      BuildContext context, String language, String type_) {
    late String headerText, descText, okText;
    if (language == "th" && type_ == "Connected") {
      headerText = "การเชื่อมต่อสำเร็จ";
      descText =
          "โปรดรอการส่งข้อมูลสักครู่\n หากสำเร็จจะกลับไปหน้าหลักโดยอัติโนมัติ";
      okText = "หน้าหลัก";
    } else if (language == "en" && type_ == "Connected") {
      headerText = "Connected";
      descText =
          "Please wait for data transfering\n Once done it will automatically route to main page.";
      okText = "back to home page";
    } else if (language == "en" && type_ == "Disconnected") {
      headerText = "Connection Failed";
      descText = "Please try again.";
      okText = "Ok";
    } else if (language == "th" && type_ == "Disconnected") {
      headerText = "การเชื่อมต่อไม่สำเร็จ";
      descText = "โปรดลองอีกครั้ง";
      okText = "หน้าหลัก";
    } else {
      headerText = "Error";
      descText = "Please try again later";
      okText = "back to home page";
    }
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text(
            headerText,
            style: TextStyle(fontSize: 20),
          ),
          content: Text(
            descText,
            style: TextStyle(fontSize: 15),
          ),
          actions: <Widget>[
            TextButton(
              onPressed: () {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (context) => HomePage()),
                );
              },
              child: Text(okText),
            ),
          ],
        );
      },
    );
  }
}

Future<void> exportLogFilesToDownloads(BuildContext context) async {
  try {
    // Request storage permission
    if (await Permission.storage.request().isGranted) {
      // Get the app's log directory
      final appDirectory = await getApplicationDocumentsDirectory();
      final logDir = Directory('${appDirectory.path}/logs');

      if (!await logDir.exists()) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("No log files found to export.")),
        );
        return;
      }

      // Get the Downloads directory
      final downloadsDir = Directory('/storage/emulated/0/Download');

      if (!await downloadsDir.exists()) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Downloads folder not found.")),
        );
        return;
      }

      // Copy log files to the Downloads directory
      final logFiles = logDir.listSync().whereType<File>();
      for (var file in logFiles) {
        final fileName = file.path.split('/').last;
        final newFile = File('${downloadsDir.path}/$fileName');
        await file.copy(newFile.path);
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Log files exported to Downloads folder.")),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Storage permission denied.")),
      );
    }
  } catch (e) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("Failed to export log files: $e")),
    );
  }
}
