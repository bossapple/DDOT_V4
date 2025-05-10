import 'dart:io';
import 'package:flutter/widgets.dart';
import 'package:flutter/services.dart';

class OrientationFixer extends StatefulWidget {
  final Widget child;
  final List<DeviceOrientation> preferredOrientations;

  OrientationFixer(
      {required this.child,
      this.preferredOrientations = const [DeviceOrientation.portraitUp]})
      : assert(preferredOrientations != null);

  @override
  _OrientationFixerState createState() => _OrientationFixerState();
}

class _OrientationFixerState extends State<OrientationFixer>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    SystemChrome.setPreferredOrientations(widget.preferredOrientations);
    super.dispose();
  }

  @override
  void didChangeMetrics() {
    SystemChrome.setPreferredOrientations(widget.preferredOrientations);
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}
