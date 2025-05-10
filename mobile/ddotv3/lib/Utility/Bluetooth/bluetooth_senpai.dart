import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_bluetooth_serial/flutter_bluetooth_serial.dart';

class BluetoothUtil extends StatefulWidget {
  final BluetoothDevice server;

  const BluetoothUtil({required this.server});

  @override
  _BluetoothUtilState createState() => _BluetoothUtilState();
}

class _BluetoothUtilState extends State<BluetoothUtil> {
  BluetoothConnection? connection;

  @override
  void initState() {
    super.initState();

    BluetoothConnection.toAddress(widget.server.address).then((_connection) {
      print('Connected to the device');
      connection = _connection;

      connection!.input!.listen(_onDataReceived).onDone(() {
        print('Disconnected remotely!');
      });
    }).catchError((error) {
      print('Cannot connect, exception occurred');
      print(error);
    });
  }

  @override
  void dispose() {
    if (connection != null) {
      connection!.dispose();
      connection = null;
    }

    super.dispose();
  }

  void _onDataReceived(Uint8List data) {
    String receivedString = utf8.decode(data);
    print('Received: $receivedString');
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(
          title: Text('Bluetooth Communication'),
        ),
        body: Container(
          child: Center(
            child: Text(
              'Waiting for Bluetooth data...',
              style: TextStyle(fontSize: 18),
            ),
          ),
        ),
      ),
    );
  }
}
