
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:audioplayers/audioplayers.dart';
import '../utils/theme.dart';

class QRScannerScreen extends StatefulWidget {
  const QRScannerScreen({super.key});

  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> {
  final TextEditingController _manualController = TextEditingController();
  final AudioPlayer _audioPlayer = AudioPlayer();
  bool _isScanning = true;

  @override
  void initState() {
    super.initState();
    _audioPlayer.setReleaseMode(ReleaseMode.stop);
  }

  @override
  void dispose() {
    _manualController.dispose();
    _audioPlayer.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) async {
    if (!_isScanning) return;
    final List<Barcode> barcodes = capture.barcodes;
    for (final barcode in barcodes) {
      if (barcode.rawValue != null) {
        setState(() => _isScanning = false);
        
        // Play Eagle Sound
        try {
          await _audioPlayer.stop(); // Stop any previous sound
          await _audioPlayer.play(AssetSource(AppTheme.eagleSoundPath.replaceFirst('assets/', '')));
          debugPrint('Eagle sound triggered: ${AppTheme.eagleSoundPath}');
        } catch (e, stack) {
          debugPrint('Error playing sound: $e');
          debugPrint(stack.toString());
        }

        final code = barcode.rawValue!.replaceAll('ORDER:', '').trim();
        
        // Delay slightly longer so the user hears the sound before the screen pops
        await Future.delayed(const Duration(milliseconds: 1500));
        
        if (mounted) {
          Navigator.pop(context, code);
        }
        break;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Scanner
          MobileScanner(
            controller: MobileScannerController(
              facing: CameraFacing.back,
            ),
            onDetect: _onDetect,
          ),
          
          // Overlay
          _buildOverlay(),
          
          // UI Controls
          SafeArea(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const SizedBox(width: 48),
                      const Text(
                        'SCAN QR CODE',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 2),
                      ),
                      IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(LucideIcons.x, color: Colors.white),
                        style: IconButton.styleFrom(backgroundColor: Colors.black54),
                      ),
                    ],
                  ),
                ),
                
                const Spacer(),
                
                // Manual Input
                Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    children: [
                      TextField(
                        controller: _manualController,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 4),
                        textAlign: TextAlign.center,
                        textCapitalization: TextCapitalization.characters,
                        decoration: InputDecoration(
                          hintText: 'ENTER CODE MANUALLY',
                          hintStyle: TextStyle(color: Colors.white.withOpacity(0.3), letterSpacing: 1),
                          filled: true,
                          fillColor: Colors.white.withOpacity(0.1),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(20),
                            borderSide: BorderSide.none,
                          ),
                        ),
                        onSubmitted: (val) {
                          if (val.isNotEmpty) {
                            Navigator.pop(context, val.toUpperCase());
                          }
                        },
                      ),
                      const SizedBox(height: 16),
                      if (_manualController.text.isNotEmpty)
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: () => Navigator.pop(context, _manualController.text.toUpperCase()),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.primary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            ),
                            child: const Text('VERIFY CODE', style: TextStyle(fontWeight: FontWeight.w900)),
                          ),
                        ),
                      const SizedBox(height: 8),
                      Text(
                        'Type the code from the customer App',
                        style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOverlay() {
    return Stack(
      children: [
        ColorFiltered(
          colorFilter: ColorFilter.mode(Colors.black.withOpacity(0.5), BlendMode.srcOut),
          child: Stack(
            children: [
              Container(
                decoration: const BoxDecoration(
                  color: Colors.transparent,
                ),
              ),
              Center(
                child: Container(
                  width: 260,
                  height: 260,
                  decoration: BoxDecoration(
                    color: Colors.black,
                    borderRadius: BorderRadius.circular(40),
                  ),
                ),
              ),
            ],
          ),
        ),
        Center(
          child: Container(
            width: 260,
            height: 260,
            decoration: BoxDecoration(
              border: Border.all(color: AppTheme.primary, width: 4),
              borderRadius: BorderRadius.circular(40),
            ),
          ),
        ),
      ],
    );
  }
}
