import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bluetooth_serial/flutter_bluetooth_serial.dart';
import 'package:scoped_model/scoped_model.dart';
import './BackgroundCollectedPage.dart';
import './BackgroundCollectingTask.dart';
import './ChatPage.dart';
import './DiscoveryPage.dart';
import './SelectBondedDevicePage.dart';
import '../../Page/home_page.dart';
import '../../Page/monthly_report.dart';
import '../../Page/setting_page.dart';

class MainPage extends StatefulWidget {
  @override
  _MainPage createState() => new _MainPage();
}

class _MainPage extends State<MainPage> {
  BluetoothState _bluetoothState = BluetoothState.UNKNOWN;

  String _address = "...";
  String _name = "...";

  Timer? _discoverableTimeoutTimer;
  int _discoverableTimeoutSecondsLeft = 0;

  BackgroundCollectingTask? _collectingTask;

  bool _autoAcceptPairingRequests = false;

  @override
  void initState() {
    super.initState();

    // Get current state
    FlutterBluetoothSerial.instance.state.then((state) {
      setState(() {
        _bluetoothState = state;
      });
    });

    Future.doWhile(() async {
      // Wait if adapter not enabled
      if ((await FlutterBluetoothSerial.instance.isEnabled) ?? false) {
        return false;
      }
      await Future.delayed(Duration(milliseconds: 0xDD));
      return true;
    }).then((_) {
      // Update the address field
      FlutterBluetoothSerial.instance.address.then((address) {
        setState(() {
          _address = address!;
        });
      });
    });

    FlutterBluetoothSerial.instance.name.then((name) {
      setState(() {
        _name = name!;
      });
    });

    // Listen for futher state changes
    FlutterBluetoothSerial.instance
        .onStateChanged()
        .listen((BluetoothState state) {
      setState(() {
        _bluetoothState = state;

        // Discoverable mode is disabled when Bluetooth gets disabled
        _discoverableTimeoutTimer = null;
        _discoverableTimeoutSecondsLeft = 0;
      });
    });
  }

  @override
  void dispose() {
    FlutterBluetoothSerial.instance.setPairingRequestHandler(null);
    _collectingTask?.dispose();
    _discoverableTimeoutTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.primary,
        title: Center(
          child: Text(
            'เชื่อมต่อกล่องยา',
            style: TextStyle(color: Colors.white),
            ),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              children: <Widget>[
                Divider(),
                SwitchListTile(
                  title: const Text('เปิดบลูทูธ', style: TextStyle(fontSize: 24)),
                  value: _bluetoothState.isEnabled,
                  onChanged: (bool value) {
                    // Do the request and update with the true value then
                    future() async {
                      // async lambda seems to not working
                      if (value)
                        await FlutterBluetoothSerial.instance.requestEnable();
                      else
                        await FlutterBluetoothSerial.instance.requestDisable();
                    }

                    future().then((_) {
                      setState(() {});
                    });
                  },
                ),
                // ListTile(
                //   title: ElevatedButton(
                //       child: const Text('ค้นหาอุปกรณ์เพื่อเชื่อมต่อ', style: TextStyle(fontSize: 20)),
                //       onPressed: () async {
                //         final BluetoothDevice? selectedDevice =
                //             await Navigator.of(context).push(
                //           MaterialPageRoute(
                //             builder: (context) {
                //               return DiscoveryPage();
                //             },
                //           ),
                //         );

                //         if (selectedDevice != null) {
                //           print('Discovery -> selected ' +
                //               selectedDevice.address);
                //         } else {
                //           print('Discovery -> no device selected');
                //         }
                //       }),
                // ),
                ListTile(
                  title: ElevatedButton(
                    child: const Text('เชื่อมต่อกับอุปกรณ์(กล่องยา)', style: TextStyle(fontSize: 20)),
                    onPressed: () async {
                      final BluetoothDevice? selectedDevice =
                          await Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) {
                            return SelectBondedDevicePage(
                                checkAvailability: false);
                          },
                        ),
                      );

                      if (selectedDevice != null) {
                        print('Connect -> selected ' +
                            selectedDevice.address);
                        _startChat(context, selectedDevice);
                      } else {
                        print('Connect -> no device selected');
                      }
                    },
                  ),
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
    );
  }

  void _startChat(BuildContext context, BluetoothDevice server) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) {
          return ChatPage(server: server);
        },
      ),
    );
  }

  Future<void> _startBackgroundTask(
    BuildContext context,
    BluetoothDevice server,
  ) async {
    try {
      _collectingTask = await BackgroundCollectingTask.connect(server);
      await _collectingTask!.start();
    } catch (ex) {
      _collectingTask?.cancel();
      showDialog(
        context: context,
        builder: (BuildContext context) {
          return AlertDialog(
            title: const Text('Error occured while connecting'),
            content: Text("${ex.toString()}"),
            actions: <Widget>[
              new TextButton(
                child: new Text("Close"),
                onPressed: () {
                  Navigator.of(context).pop();
                },
              ),
            ],
          );
        },
      );
    }
  }
}
