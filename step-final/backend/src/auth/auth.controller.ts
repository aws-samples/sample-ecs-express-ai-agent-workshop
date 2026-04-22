import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  Request,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { I18nContext } from 'nestjs-i18n';
import { AuthService } from './auth.service';
import { UsersService, OAuthProvider, OAuthProviders } from '../users/users.service';
import { AppleTokenDto } from './dto/apple-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignInDto } from './dto/signin.dto';
import { SignUpDto } from './dto/signup.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { TotpCodeDto } from './dto/totp-code.dto';
import { TotpVerifyDto } from './dto/totp-verify.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AppleProfile } from './strategies/apple.strategy';
import { DiscordProfile } from './strategies/discord.strategy';
import { GithubProfile } from './strategies/github.strategy';
import { GoogleProfile } from './strategies/google.strategy';
import { TwitterProfile } from './strategies/twitter.strategy';

type OAuthProfile = AppleProfile | DiscordProfile | GithubProfile | GoogleProfile | TwitterProfile;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  private t(key: string, args?: Record<string, unknown>): string {
    const i18n = I18nContext.current();
    return i18n ? i18n.t(key, { args }) : key;
  }

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user with email and password' })
  @ApiResponse({ status: 201, description: 'Verification email sent' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email address using a verification token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired verification token' })
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({ status: 200, description: 'Verification email sent if applicable' })
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiResponse({ status: 200, description: 'Password reset email sent if applicable' })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using a reset token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset token' })
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Post('signin')
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Returns accessToken, refreshToken, and user profile',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async signIn(@Body() dto: SignInDto) {
    return this.authService.signIn(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using a refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Returns a new accessToken and refreshToken',
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@Request() req: { user: { userId: string; email: string } }) {
    return this.usersService.getMe(req.user.userId);
  }

  @Patch('email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update email address (resets verification and sends new verification email)' })
  @ApiResponse({ status: 200, description: 'Email updated, verification email sent' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async updateEmail(
    @Request() req: { user: { userId: string } },
    @Body() dto: UpdateEmailDto,
  ) {
    return this.authService.updateEmail(req.user.userId, dto.email);
  }

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete the currently authenticated user and all associated data' })
  @ApiResponse({ status: 204, description: 'Account deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@Request() req: { user: { userId: string } }) {
    await this.authService.deleteAccount(req.user.userId);
  }

  // ── TOTP MFA ──

  @Post('totp/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate TOTP secret and QR code URI' })
  @ApiResponse({ status: 200, description: 'Returns secret and otpauth URI' })
  @ApiResponse({ status: 409, description: 'TOTP already enabled' })
  @HttpCode(HttpStatus.OK)
  async totpSetup(@Request() req: { user: { userId: string } }) {
    return this.authService.totpSetup(req.user.userId);
  }

  @Post('totp/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify TOTP code and enable MFA. Returns recovery codes.' })
  @ApiResponse({ status: 200, description: 'TOTP enabled, recovery codes returned' })
  @ApiResponse({ status: 400, description: 'Invalid TOTP code' })
  @HttpCode(HttpStatus.OK)
  async totpEnable(
    @Request() req: { user: { userId: string } },
    @Body() dto: TotpCodeDto,
  ) {
    return this.authService.totpEnable(req.user.userId, dto.code);
  }

  @Post('totp/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable TOTP MFA' })
  @ApiResponse({ status: 200, description: 'TOTP disabled' })
  @ApiResponse({ status: 400, description: 'Invalid TOTP code or TOTP not enabled' })
  @HttpCode(HttpStatus.OK)
  async totpDisable(
    @Request() req: { user: { userId: string } },
    @Body() dto: TotpCodeDto,
  ) {
    return this.authService.totpDisable(req.user.userId, dto.code);
  }

  @Post('totp/verify')
  @ApiOperation({ summary: 'Verify TOTP or recovery code during sign-in MFA challenge' })
  @ApiResponse({ status: 200, description: 'Returns accessToken, refreshToken, and user' })
  @ApiResponse({ status: 401, description: 'Invalid MFA token or code' })
  @HttpCode(HttpStatus.OK)
  async totpVerify(@Body() dto: TotpVerifyDto) {
    return this.authService.totpVerify(dto.mfaToken, dto.code);
  }

  @Post('totp/recovery-codes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Regenerate recovery codes (requires valid TOTP code)' })
  @ApiResponse({ status: 200, description: 'New recovery codes returned' })
  @ApiResponse({ status: 400, description: 'Invalid TOTP code or TOTP not enabled' })
  @HttpCode(HttpStatus.OK)
  async totpRegenerateRecoveryCodes(
    @Request() req: { user: { userId: string } },
    @Body() dto: TotpCodeDto,
  ) {
    return this.authService.totpRegenerateRecoveryCodes(req.user.userId, dto.code);
  }

  // ── Apple OAuth2 ──

  @Get('apple')
  @UseGuards(AuthGuard('apple'))
  @ApiOperation({ summary: 'Initiate Apple Sign In (redirects to Apple)' })
  @ApiResponse({ status: 302, description: 'Redirects to Apple consent screen' })
  appleAuth() {
    // Passport handles the redirect; this method body is never reached.
  }

  @Post('apple/callback')
  @UseGuards(AuthGuard('apple'))
  @ApiOperation({ summary: 'Apple Sign In callback – issues JWT and redirects to frontend' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend /oauth/callback with tokens' })
  async appleCallback(
    @Request() req: { user: AppleProfile; session?: any },
    @Res() res: Response,
  ) {
    return this.handleOAuthCallback(OAuthProviders.Apple, req.user, req, res, 'web');
  }

  @Get('apple/native')
  @UseGuards(AuthGuard('apple-native'))
  @ApiOperation({ summary: 'Initiate Apple Sign In for native apps (iOS/macOS/Android)' })
  @ApiResponse({ status: 302, description: 'Redirects to Apple consent screen' })
  appleNativeAuth() {
    // Passport handles the redirect; this method body is never reached.
  }

  @Post('apple/native/callback')
  @UseGuards(AuthGuard('apple-native'))
  @ApiOperation({ summary: 'Apple Sign In callback for native apps – redirects with custom URL scheme' })
  @ApiResponse({ status: 302, description: 'Redirects to native app via custom URL scheme with tokens' })
  async appleNativeCallback(
    @Request() req: { user: AppleProfile; session?: any },
    @Res() res: Response,
  ) {
    return this.handleOAuthCallback(OAuthProviders.Apple, req.user, req, res, 'native');
  }

  @Post('apple/token')
  @ApiOperation({ summary: 'Exchange Apple identity token for JWT (native SDK flow)' })
  @ApiResponse({ status: 200, description: 'Returns accessToken, refreshToken, and user profile' })
  @ApiResponse({ status: 401, description: 'Invalid Apple identity token' })
  async appleToken(@Body() dto: AppleTokenDto) {
    return this.authService.verifyAppleToken(dto.identityToken, dto.fullName);
  }

  // ── Discord OAuth2 ──

  @Get('discord')
  @UseGuards(AuthGuard('discord'))
  @ApiOperation({ summary: 'Initiate Discord OAuth2 login (redirects to Discord)' })
  @ApiResponse({ status: 302, description: 'Redirects to Discord consent screen' })
  discordAuth() {
    // Passport handles the redirect; this method body is never reached.
  }

  @Get('discord/callback')
  @UseGuards(AuthGuard('discord'))
  @ApiOperation({ summary: 'Discord OAuth2 callback – issues JWT and redirects to frontend' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend /oauth/callback with tokens' })
  async discordCallback(
    @Request() req: { user: DiscordProfile; session?: any },
    @Res() res: Response,
  ) {
    return this.handleOAuthCallback(OAuthProviders.Discord, req.user, req, res, 'web');
  }

  @Get('discord/native')
  @UseGuards(AuthGuard('discord-native'))
  @ApiOperation({ summary: 'Initiate Discord OAuth2 login for native apps (iOS/macOS/Android/Windows)' })
  @ApiResponse({ status: 302, description: 'Redirects to Discord consent screen' })
  discordNativeAuth() {
    // Passport handles the redirect; this method body is never reached.
  }

  @Get('discord/native/callback')
  @UseGuards(AuthGuard('discord-native'))
  @ApiOperation({ summary: 'Discord OAuth2 callback for native apps – redirects with custom URL scheme' })
  @ApiResponse({ status: 302, description: 'Redirects to native app via custom URL scheme with tokens' })
  async discordNativeCallback(
    @Request() req: { user: DiscordProfile; session?: any },
    @Res() res: Response,
  ) {
    return this.handleOAuthCallback(OAuthProviders.Discord, req.user, req, res, 'native');
  }

  // ── GitHub OAuth2 ──

  @Get('github')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'Initiate GitHub OAuth2 login (redirects to GitHub)' })
  @ApiResponse({ status: 302, description: 'Redirects to GitHub consent screen' })
  githubAuth() {
    // Passport handles the redirect; this method body is never reached.
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'GitHub OAuth2 callback – issues JWT and redirects to frontend' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend /oauth/callback with tokens' })
  async githubCallback(
    @Request() req: { user: GithubProfile; session?: any },
    @Res() res: Response,
  ) {
    return this.handleOAuthCallback(OAuthProviders.GitHub, req.user, req, res, 'web');
  }

  @Get('github/native')
  @UseGuards(AuthGuard('github-native'))
  @ApiOperation({ summary: 'Initiate GitHub OAuth2 login for native apps (iOS/macOS/Android)' })
  @ApiResponse({ status: 302, description: 'Redirects to GitHub consent screen' })
  githubNativeAuth() {
    // Passport handles the redirect; this method body is never reached.
  }

  @Get('github/native/callback')
  @UseGuards(AuthGuard('github-native'))
  @ApiOperation({ summary: 'GitHub OAuth2 callback for native apps – redirects with custom URL scheme' })
  @ApiResponse({ status: 302, description: 'Redirects to native app via custom URL scheme with tokens' })
  async githubNativeCallback(
    @Request() req: { user: GithubProfile; session?: any },
    @Res() res: Response,
  ) {
    return this.handleOAuthCallback(OAuthProviders.GitHub, req.user, req, res, 'native');
  }

  // ── Google OAuth2 ──

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth2 login (redirects to Google)' })
  @ApiResponse({ status: 302, description: 'Redirects to Google consent screen' })
  googleAuth() {
    // Passport handles the redirect; this method body is never reached.
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth2 callback – issues JWT and redirects to frontend' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend /oauth/callback with tokens' })
  async googleCallback(
    @Request() req: { user: GoogleProfile; session?: any },
    @Res() res: Response,
  ) {
    return this.handleOAuthCallback(OAuthProviders.Google, req.user, req, res, 'web');
  }

  @Get('google/native')
  @UseGuards(AuthGuard('google-native'))
  @ApiOperation({ summary: 'Initiate Google OAuth2 login for native apps (iOS/macOS/Android)' })
  @ApiResponse({ status: 302, description: 'Redirects to Google consent screen' })
  googleNativeAuth() {
    // Passport handles the redirect; this method body is never reached.
  }

  @Get('google/native/callback')
  @UseGuards(AuthGuard('google-native'))
  @ApiOperation({ summary: 'Google OAuth2 callback for native apps – redirects with custom URL scheme' })
  @ApiResponse({ status: 302, description: 'Redirects to native app via custom URL scheme with tokens' })
  async googleNativeCallback(
    @Request() req: { user: GoogleProfile; session?: any },
    @Res() res: Response,
  ) {
    return this.handleOAuthCallback(OAuthProviders.Google, req.user, req, res, 'native');
  }

  // ── Twitter (X) OAuth2 ──

  @Get('twitter')
  @UseGuards(AuthGuard('twitter'))
  @ApiOperation({ summary: 'Initiate X (Twitter) OAuth2 login (redirects to X)' })
  @ApiResponse({ status: 302, description: 'Redirects to X consent screen' })
  twitterAuth() {
    // Passport handles the redirect; this method body is never reached.
  }

  @Get('twitter/callback')
  @UseGuards(AuthGuard('twitter'))
  @ApiOperation({ summary: 'X (Twitter) OAuth2 callback – issues JWT and redirects to frontend' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend /oauth/callback with tokens' })
  async twitterCallback(
    @Request() req: { user: TwitterProfile; session?: any },
    @Res() res: Response,
  ) {
    return this.handleOAuthCallback(OAuthProviders.Twitter, req.user, req, res, 'web');
  }

  @Get('twitter/native')
  @UseGuards(AuthGuard('twitter-native'))
  @ApiOperation({ summary: 'Initiate X (Twitter) OAuth2 login for native apps (iOS/macOS/Android)' })
  @ApiResponse({ status: 302, description: 'Redirects to X consent screen' })
  twitterNativeAuth() {
    // Passport handles the redirect; this method body is never reached.
  }

  @Get('twitter/native/callback')
  @UseGuards(AuthGuard('twitter-native'))
  @ApiOperation({ summary: 'X (Twitter) OAuth2 callback for native apps – redirects with custom URL scheme' })
  @ApiResponse({ status: 302, description: 'Redirects to native app via custom URL scheme with tokens' })
  async twitterNativeCallback(
    @Request() req: { user: TwitterProfile; session?: any },
    @Res() res: Response,
  ) {
    return this.handleOAuthCallback(OAuthProviders.Twitter, req.user, req, res, 'native');
  }

  // ── Account linking initiation (web) ──

  @Get('link/apple')
  @ApiOperation({ summary: 'Start Apple account linking flow (web)' })
  @ApiResponse({ status: 302, description: 'Redirects to Apple consent screen for account linking' })
  async linkApple(@Query('token') token: string, @Request() req: any, @Res() res: Response) {
    // Apple uses response_mode=form_post (cross-site POST), so the session
    // cookie (SameSite=Lax) is not sent on the callback.  Instead of relying
    // on the session, we embed link info directly in the OAuth state parameter
    // which Apple round-trips back in the POST body.
    const state = this.buildAppleLinkState(token, 'web');
    const callbackUrl = `${process.env.AUTH_CALLBACK_BASE_URL ?? 'http://localhost:4000'}/auth/apple/callback`;
    res.redirect(this.buildAppleAuthUrl(state, callbackUrl));
  }

  @Get('link/discord')
  @ApiOperation({ summary: 'Start Discord account linking flow (web)' })
  @ApiResponse({ status: 302, description: 'Redirects to Discord consent screen for account linking' })
  async linkDiscord(@Query('token') token: string, @Request() req: any, @Res() res: Response) {
    this.storeLinkState(token, req, 'web');
    res.redirect(this.webProxyUrl('/auth/discord'));
  }

  @Get('link/github')
  @ApiOperation({ summary: 'Start GitHub account linking flow (web)' })
  @ApiResponse({ status: 302, description: 'Redirects to GitHub consent screen for account linking' })
  async linkGithub(@Query('token') token: string, @Request() req: any, @Res() res: Response) {
    this.storeLinkState(token, req, 'web');
    res.redirect(this.webProxyUrl('/auth/github'));
  }

  @Get('link/google')
  @ApiOperation({ summary: 'Start Google account linking flow (web)' })
  @ApiResponse({ status: 302, description: 'Redirects to Google consent screen for account linking' })
  async linkGoogle(@Query('token') token: string, @Request() req: any, @Res() res: Response) {
    this.storeLinkState(token, req, 'web');
    res.redirect(this.webProxyUrl('/auth/google'));
  }

  @Get('link/twitter')
  @ApiOperation({ summary: 'Start X (Twitter) account linking flow (web)' })
  @ApiResponse({ status: 302, description: 'Redirects to X consent screen for account linking' })
  async linkTwitter(@Query('token') token: string, @Request() req: any, @Res() res: Response) {
    this.storeLinkState(token, req, 'web');
    res.redirect(this.webProxyUrl('/auth/twitter'));
  }

  // ── Account linking initiation (native) ──

  @Get('link/apple/native')
  @ApiOperation({ summary: 'Start Apple account linking flow (native)' })
  @ApiResponse({ status: 302, description: 'Redirects to Apple consent screen for account linking' })
  async linkAppleNative(@Query('token') token: string, @Request() req: any, @Res() res: Response) {
    const state = this.buildAppleLinkState(token, 'native');
    const callbackUrl = `${process.env.AUTH_NATIVE_CALLBACK_BASE_URL ?? 'http://localhost:4000'}/auth/apple/native/callback`;
    res.redirect(this.buildAppleAuthUrl(state, callbackUrl));
  }

  @Get('link/discord/native')
  @ApiOperation({ summary: 'Start Discord account linking flow (native)' })
  @ApiResponse({ status: 302, description: 'Redirects to Discord consent screen for account linking' })
  async linkDiscordNative(@Query('token') token: string, @Request() req: any, @Res() res: Response) {
    this.storeLinkState(token, req, 'native');
    res.redirect(this.selfUrl(req, '/auth/discord/native'));
  }

  @Get('link/github/native')
  @ApiOperation({ summary: 'Start GitHub account linking flow (native)' })
  @ApiResponse({ status: 302, description: 'Redirects to GitHub consent screen for account linking' })
  async linkGithubNative(@Query('token') token: string, @Request() req: any, @Res() res: Response) {
    this.storeLinkState(token, req, 'native');
    res.redirect(this.selfUrl(req, '/auth/github/native'));
  }

  @Get('link/google/native')
  @ApiOperation({ summary: 'Start Google account linking flow (native)' })
  @ApiResponse({ status: 302, description: 'Redirects to Google consent screen for account linking' })
  async linkGoogleNative(@Query('token') token: string, @Request() req: any, @Res() res: Response) {
    this.storeLinkState(token, req, 'native');
    res.redirect(this.selfUrl(req, '/auth/google/native'));
  }

  @Get('link/twitter/native')
  @ApiOperation({ summary: 'Start X (Twitter) account linking flow (native)' })
  @ApiResponse({ status: 302, description: 'Redirects to X consent screen for account linking' })
  async linkTwitterNative(@Query('token') token: string, @Request() req: any, @Res() res: Response) {
    this.storeLinkState(token, req, 'native');
    res.redirect(this.selfUrl(req, '/auth/twitter/native'));
  }

  // ── Account unlinking ──

  @Delete('link/apple')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlink Apple account from the current user' })
  @ApiResponse({ status: 200, description: 'Returns updated user profile' })
  @ApiResponse({ status: 409, description: 'Cannot unlink: only authentication method' })
  async unlinkApple(@Request() req: { user: { userId: string } }) {
    await this.authService.unlinkSocial(OAuthProviders.Apple, req.user.userId);
    return this.usersService.getMe(req.user.userId);
  }

  @Delete('link/discord')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlink Discord account from the current user' })
  @ApiResponse({ status: 200, description: 'Returns updated user profile' })
  @ApiResponse({ status: 409, description: 'Cannot unlink: only authentication method' })
  async unlinkDiscord(@Request() req: { user: { userId: string } }) {
    await this.authService.unlinkSocial(OAuthProviders.Discord, req.user.userId);
    return this.usersService.getMe(req.user.userId);
  }

  @Delete('link/github')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlink GitHub account from the current user' })
  @ApiResponse({ status: 200, description: 'Returns updated user profile' })
  @ApiResponse({ status: 409, description: 'Cannot unlink: only authentication method' })
  async unlinkGithub(@Request() req: { user: { userId: string } }) {
    await this.authService.unlinkSocial(OAuthProviders.GitHub, req.user.userId);
    return this.usersService.getMe(req.user.userId);
  }

  @Delete('link/google')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlink Google account from the current user' })
  @ApiResponse({ status: 200, description: 'Returns updated user profile' })
  @ApiResponse({ status: 409, description: 'Cannot unlink: only authentication method' })
  async unlinkGoogle(@Request() req: { user: { userId: string } }) {
    await this.authService.unlinkSocial(OAuthProviders.Google, req.user.userId);
    return this.usersService.getMe(req.user.userId);
  }

  @Delete('link/twitter')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlink X (Twitter) account from the current user' })
  @ApiResponse({ status: 200, description: 'Returns updated user profile' })
  @ApiResponse({ status: 409, description: 'Cannot unlink: only authentication method' })
  async unlinkTwitter(@Request() req: { user: { userId: string } }) {
    await this.authService.unlinkSocial(OAuthProviders.Twitter, req.user.userId);
    return this.usersService.getMe(req.user.userId);
  }

  // ── Private helpers ──

  private webProxyUrl(path: string): string {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    return `${frontendUrl}/backend${path}`;
  }

  private selfUrl(req: any, path: string): string {
    const protocol = req.protocol;
    const host = req.get('host');
    return `${protocol}://${host}${path}`;
  }

  private storeLinkState(token: string, req: any, platform: 'web' | 'native') {
    if (!token) throw new UnauthorizedException(this.t('auth.MISSING_TOKEN'));
    let payload: { sub: string };
    try {
      payload = this.jwtService.verify(token, {
        secret: process.env.AUTH_JWT_SECRET ?? 'change-me',
      });
    } catch {
      throw new UnauthorizedException(this.t('auth.INVALID_TOKEN'));
    }
    req.session.linkUserId = payload.sub;
    req.session.linkPlatform = platform;
  }

  /**
   * Build a signed state JWT carrying link info for Apple's form_post flow.
   * The state parameter is round-tripped through Apple, so it survives even
   * when the session cookie (SameSite=Lax) is not sent on Apple's cross-site POST.
   */
  private buildAppleLinkState(token: string, platform: 'web' | 'native'): string {
    if (!token) throw new UnauthorizedException(this.t('auth.MISSING_TOKEN'));
    let payload: { sub: string };
    try {
      payload = this.jwtService.verify(token, {
        secret: process.env.AUTH_JWT_SECRET ?? 'change-me',
      });
    } catch {
      throw new UnauthorizedException(this.t('auth.INVALID_TOKEN'));
    }
    return this.jwtService.sign(
      { sub: payload.sub, platform, purpose: 'apple-link' },
      { secret: process.env.AUTH_JWT_SECRET ?? 'change-me', expiresIn: '5m' },
    );
  }

  private buildAppleAuthUrl(state: string, callbackUrl: string): string {
    const url = new URL('https://appleid.apple.com/auth/authorize');
    url.searchParams.set('client_id', process.env.AUTH_APPLE_CLIENT_ID ?? '');
    url.searchParams.set('redirect_uri', callbackUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'name email');
    url.searchParams.set('response_mode', 'form_post');
    url.searchParams.set('state', state);
    return url.toString();
  }

  private async handleOAuthCallback(
    provider: OAuthProvider,
    profile: OAuthProfile,
    req: { session?: any; body?: any },
    res: Response,
    platform: 'web' | 'native',
  ) {
    let linkUserId = req.session?.linkUserId;
    let linkPlatform = req.session?.linkPlatform;

    // Clear link state from session
    if (req.session) {
      delete req.session.linkUserId;
      delete req.session.linkPlatform;
    }

    // Fall back to the OAuth state parameter (needed for Apple's cross-site
    // form_post where the session cookie with SameSite=Lax is not sent).
    // The link info was embedded in the state by buildAppleLinkState().
    if (!linkUserId && req.body?.state) {
      try {
        const payload = this.jwtService.verify(req.body.state, {
          secret: process.env.AUTH_JWT_SECRET ?? 'change-me',
        });
        if (payload.purpose === 'apple-link') {
          linkUserId = payload.sub;
          linkPlatform = payload.platform;
        }
      } catch {
        // not a link-state JWT or expired – ignore
      }
    }

    if (linkUserId) {
      // Account linking flow
      await this.authService.linkSocial(provider, linkUserId, profile);
      const redirectPlatform = linkPlatform ?? platform;
      if (redirectPlatform === 'native') {
        const scheme = process.env.NATIVE_APP_URL_SCHEME ?? 'oauth2app';
        res.redirect(`${scheme}://oauth/callback?linked=${provider}`);
      } else {
        const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
        res.redirect(`${frontendUrl}/oauth/callback?linked=${provider}`);
      }
    } else {
      // Normal sign-in flow — OAuth bypasses TOTP MFA (provider handles its own MFA)
      const tokens = await this.authService.findOrCreateSocialUser(provider, profile);
      const params = new URLSearchParams({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
      if (platform === 'native') {
        const scheme = process.env.NATIVE_APP_URL_SCHEME ?? 'oauth2app';
        res.redirect(`${scheme}://oauth/callback?${params.toString()}`);
      } else {
        const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
        res.redirect(`${frontendUrl}/oauth/callback?${params.toString()}`);
      }
    }
  }
}
