import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phoneController = TextEditingController();

  bool _isPhoneFocused = false;

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  void _login() {
    // TODO: Connect this button to the real OTP/authentication
    // flow through ApiService when the backend is ready.
    Navigator.pushReplacementNamed(context, '/home');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.brandGreen,
      body: SafeArea(
        child: Stack(
          children: [
            // Decorative background elements
            _buildBackgroundDecor(),

            SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: MediaQuery.of(context).size.height -
                      MediaQuery.of(context).padding.top -
                      MediaQuery.of(context).padding.bottom,
                ),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(22, 18, 22, 24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _buildBrandSection(),

                      const SizedBox(height: 34),

                      _buildLoginCard(),

                      const SizedBox(height: 22),

                      _buildBottomMessage(),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ------------------------------------------------------------
  // BACKGROUND
  // ------------------------------------------------------------

  Widget _buildBackgroundDecor() {
    return Stack(
      children: [
        // Large soft circle
        Positioned(
          top: -120,
          right: -100,
          child: Container(
            width: 300,
            height: 300,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.055),
              shape: BoxShape.circle,
            ),
          ),
        ),

        // Bottom circle
        Positioned(
          bottom: -150,
          left: -120,
          child: Container(
            width: 320,
            height: 320,
            decoration: BoxDecoration(
              color: AppColors.darkGreen.withValues(alpha: 0.28),
              shape: BoxShape.circle,
            ),
          ),
        ),

        // Small decorative circles
        Positioned(
          top: 95,
          left: 25,
          child: _decorativeDot(8),
        ),

        Positioned(
          top: 155,
          right: 35,
          child: _decorativeDot(13),
        ),

        Positioned(
          bottom: 190,
          right: 25,
          child: _decorativeDot(7),
        ),

        // Decorative recycling symbols
        Positioned(
          top: 115,
          right: 70,
          child: Icon(
            Icons.eco_rounded,
            size: 32,
            color: Colors.white.withValues(alpha: 0.08),
          ),
        ),

        Positioned(
          bottom: 115,
          left: 42,
          child: Icon(
            Icons.recycling_rounded,
            size: 42,
            color: Colors.white.withValues(alpha: 0.07),
          ),
        ),
      ],
    );
  }

  Widget _decorativeDot(double size) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.18),
        shape: BoxShape.circle,
      ),
    );
  }

  // ------------------------------------------------------------
  // BRAND
  // ------------------------------------------------------------

  Widget _buildBrandSection() {
    return Column(
      children: [
        // Logo container
        Container(
          width: 94,
          height: 94,
          decoration: BoxDecoration(
            color: Colors.white,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.16),
                blurRadius: 24,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: AppColors.lightGreen,
                  shape: BoxShape.circle,
                ),
              ),
              const Icon(
                Icons.recycling_rounded,
                size: 45,
                color: AppColors.brandGreen,
              ),
            ],
          ),
        ),

        const SizedBox(height: 18),

        const Text(
          'Kabadiwala',
          style: TextStyle(
            fontSize: 36,
            fontWeight: FontWeight.w900,
            letterSpacing: -1,
            color: Colors.white,
          ),
        ),

        const SizedBox(height: 2),

        const Text(
          'कबाड़ी वाला',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w500,
            color: Colors.white70,
          ),
        ),

        const SizedBox(height: 10),

        Container(
          padding: const EdgeInsets.symmetric(
            horizontal: 13,
            vertical: 6,
          ),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.11),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.12),
            ),
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.eco_rounded,
                color: Colors.white,
                size: 14,
              ),
              SizedBox(width: 6),
              Text(
                'Recycle • Earn • Repeat',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.3,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ------------------------------------------------------------
  // LOGIN CARD
  // ------------------------------------------------------------

  Widget _buildLoginCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(22, 25, 22, 22),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.16),
            blurRadius: 30,
            offset: const Offset(0, 14),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Welcome back 👋',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: AppColors.textDark,
              letterSpacing: -0.4,
            ),
          ),

          const SizedBox(height: 6),

          const Text(
            'Turn your recyclable waste into value.',
            style: TextStyle(
              fontSize: 13,
              color: AppColors.textLight,
              height: 1.4,
            ),
          ),

          const SizedBox(height: 23),

          // Phone label
          const Text(
            'Mobile Number',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppColors.textDark,
            ),
          ),

          const SizedBox(height: 9),

          // Phone input
          Focus(
            onFocusChange: (focused) {
              setState(() {
                _isPhoneFocused = focused;
              });
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              height: 58,
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(15),
                border: Border.all(
                  color: _isPhoneFocused
                      ? AppColors.brandGreen
                      : AppColors.border,
                  width: _isPhoneFocused ? 1.5 : 1,
                ),
              ),
              child: Row(
                children: [
                  const SizedBox(width: 15),

                  // India code
                  Container(
                    padding: const EdgeInsets.only(right: 12),
                    decoration: const BoxDecoration(
                      border: Border(
                        right: BorderSide(
                          color: AppColors.border,
                        ),
                      ),
                    ),
                    child: const Text(
                      '+91',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textDark,
                      ),
                    ),
                  ),

                  const SizedBox(width: 12),

                  const Icon(
                    Icons.phone_android_rounded,
                    size: 21,
                    color: AppColors.brandGreen,
                  ),

                  const SizedBox(width: 9),

                  Expanded(
                    child: TextField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      maxLength: 10,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textDark,
                      ),
                      decoration: const InputDecoration(
                        hintText: 'Enter mobile number',
                        hintStyle: TextStyle(
                          color: AppColors.textMuted,
                          fontSize: 14,
                          fontWeight: FontWeight.w400,
                        ),
                        border: InputBorder.none,
                        counterText: '',
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 20),

          // Login button
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: _login,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.actionOrange,
                foregroundColor: Colors.white,
                elevation: 4,
                shadowColor:
                    AppColors.actionOrange.withValues(alpha: 0.30),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(15),
                ),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Continue',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  SizedBox(width: 9),
                  Icon(
                    Icons.arrow_forward_rounded,
                    size: 20,
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          // OTP information
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.lock_outline_rounded,
                size: 14,
                color: AppColors.textMuted,
              ),
              const SizedBox(width: 5),
              const Text(
                'You\'ll receive an OTP on your mobile',
                style: TextStyle(
                  fontSize: 11,
                  color: AppColors.textLight,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ------------------------------------------------------------
  // BOTTOM MESSAGE
  // ------------------------------------------------------------

  Widget _buildBottomMessage() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          Icons.verified_user_outlined,
          size: 15,
          color: Colors.white.withValues(alpha: 0.65),
        ),
        const SizedBox(width: 6),
        Text(
          'A smarter way to recycle',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: Colors.white.withValues(alpha: 0.7),
          ),
        ),
      ],
    );
  }
}