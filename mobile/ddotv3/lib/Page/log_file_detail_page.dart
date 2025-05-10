import 'package:flutter/material.dart';

class LogFileDetailPage extends StatelessWidget {
  final String content;

  const LogFileDetailPage({Key? key, required this.content}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Parse the TSV content into rows and columns
    final rows = content.split('\n').where((line) => line.trim().isNotEmpty).toList();
    final headers = rows.isNotEmpty ? rows.first.split('\t') : [];
    final dataRows = rows.length > 1
        ? rows.sublist(1).map((row) => row.split('\t').map((cell) => DataCell(Text(cell))).toList()).toList()
        : [];

    return Scaffold(
      appBar: AppBar(
        title: Text("Log File Details"),
      ),
      body: SingleChildScrollView(
        scrollDirection: Axis.vertical,
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: DataTable(
            columns: headers.map((header) => DataColumn(label: Text(header))).toList(),
            rows: dataRows.map((dataRow) => DataRow(cells: dataRow)).toList(),
          ),
        ),
      ),
    );
  }
}