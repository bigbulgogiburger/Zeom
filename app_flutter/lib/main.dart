import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '천지연꽃신당',
      theme: ThemeData.dark(),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  static const apiBase = String.fromEnvironment('API_BASE', defaultValue: 'http://localhost:8080');

  String message = '';
  List<dynamic> counselors = [];

  Future<void> loadCounselors() async {
    setState(() => message = '불러오는 중...');
    try {
      final res = await http.get(Uri.parse('$apiBase/api/v1/counselors'));
      if (res.statusCode >= 400) {
        setState(() => message = '조회 실패: ${res.statusCode}');
        return;
      }
      final json = jsonDecode(res.body) as List<dynamic>;
      setState(() {
        counselors = json;
        message = '연결 성공';
      });
    } catch (e) {
      setState(() => message = '연결 실패: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('천지연꽃신당 앱')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ElevatedButton(
              onPressed: loadCounselors,
              child: const Text('상담사 목록 불러오기'),
            ),
            const SizedBox(height: 12),
            Text(message),
            const SizedBox(height: 12),
            Expanded(
              child: ListView.builder(
                itemCount: counselors.length,
                itemBuilder: (context, index) {
                  final c = counselors[index] as Map<String, dynamic>;
                  return Card(
                    child: ListTile(
                      title: Text(c['name']?.toString() ?? '-'),
                      subtitle: Text('${c['specialty'] ?? ''}\n${c['intro'] ?? ''}'),
                      isThreeLine: true,
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
