import { styles } from '@/assets/styles/AuthScreen.styles';
import { useRouter } from 'expo-router';
import { useState } from 'react'
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../../constants/Colors';
import { SvgXml } from 'react-native-svg';
import { Ionicons } from "@expo/vector-icons";
import { useClerk, useSignIn, useSignUp } from '@clerk/clerk-expo';

type Mode = 'login' | 'register'

export default function AuthScreen() {

    const { signIn, setActive: signInSetActive } = useSignIn();
    const { signUp, setActive: signUpSetActive } = useSignUp();
    const { setActive } = useClerk();

    const [mode, setMode] = useState<Mode>('login');
    const [name, setName] = useState('');
    const [handle, setHandle] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [verifyingMode, setVerifyingMode] = useState<'login' | 'register' | 'login_mfa'>('register');

    const router = useRouter();

    const handleSubmit = async () => {
        if (!email.trim() || !password.trim()) {
            return Alert.alert('Validation', 'Email and password are required.');
        }

        if (mode === 'register' && (!name.trim() || !handle.trim())) {
            return Alert.alert('Validation', 'Name and handle are required for registration.');
        }

        setLoading(true);

        try {
            if (mode === 'login') {
                // Handle login logic here - API
                if (!signIn) return;

                const result = await signIn.create({
                    identifier: email,
                    password,
                })

                if (result.status === 'complete') {
                    await setActive({ session: result.createdSessionId });
                    router.replace('/(tabs)');
                } else if (result.status === 'needs_first_factor') {
                    const emailFactor = result.supportedFirstFactors?.find(
                        (f: any) => f.strategy === 'email_code'
                    );
                    if (emailFactor) {
                        await signIn.prepareFirstFactor({
                            strategy: 'email_code',
                            emailAddressId: (emailFactor as any).emailAddressId,
                        });
                        setVerifyingMode('login');
                        Alert.alert(
                            'Check Your Email',
                            `A 6-digit verification code has been sent to ${email}. Please check your inbox.`,
                            [{ text: 'OK', onPress: () => setVerifying(true) }]
                        );
                    }
                } else if (result.status === 'needs_second_factor') {
                    // TOTP codes are generated on-device — no preparation step needed
                    Alert.alert(
                        'Two-Factor Authentication',
                        'Open your authenticator app and enter the 6-digit code to continue.',
                        [{ text: 'OK', onPress: () => setVerifying(true) }]
                    );
                    setVerifyingMode('login_mfa');
                }
            } else {
                // Handle registration logic here - API
                if (!signUp) return;

                const spaceIdx = name.trim().indexOf(' ');
                const firstName = spaceIdx === -1 ? name.trim() : name.trim().substring(0, spaceIdx);
                const lastName = spaceIdx === -1 ? '' : name.trim().substring(spaceIdx + 1);

                const result = await signUp.create({
                    emailAddress: email,
                    password,
                    firstName,
                    lastName,
                    username: handle.toLowerCase().replace(/\s/g, ''),
                })

                await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

                setVerifyingMode('register');
                Alert.alert(
                    'Verify Your Email',
                    `A 6-digit verification code has been sent to ${email}. Please check your inbox.`,
                    [{ text: 'OK', onPress: () => setVerifying(true) }]
                );
            }
        } catch (err: any) {
            Alert.alert('Authentication Error', err?.errors?.[0]?.message || err?.message || 'An error occurred during authentication.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!verificationCode.trim()) {
            return Alert.alert('Validation', 'Please enter the verification code.');
        }

        setLoading(true);

        try {
            if (verifyingMode === 'register') {
                if (!signUp) return;
                const result = await signUp.attemptEmailAddressVerification({
                    code: verificationCode,
                });
                if (result.status === 'complete') {
                    await setActive({ session: result.createdSessionId });
                    router.replace('/(tabs)');
                }
            } else if (verifyingMode === 'login') {
                if (!signIn) return;
                const result = await signIn.attemptFirstFactor({
                    strategy: 'email_code',
                    code: verificationCode,
                });
                if (result.status === 'complete') {
                    await setActive({ session: result.createdSessionId });
                    router.replace('/(tabs)');
                }
            } else if (verifyingMode === 'login_mfa') {
                if (!signIn) return;
                const result = await signIn.attemptSecondFactor({
                    strategy: 'totp',
                    code: verificationCode,
                });
                if (result.status === 'complete') {
                    await setActive({ session: result.createdSessionId });
                    router.replace('/(tabs)');
                }
            }
        } catch (err: any) {
            Alert.alert('Verification Error', err?.errors?.[0]?.message || err?.message || 'Invalid verification code.');
        } finally {
            setLoading(false);
        }
    }

    const svgMarkup = `
    <svg width="63" height="70" viewBox="0 0 63 70" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M33.817 52.382c0-15.988 12.96-28.948 28.948-28.948v17.585c0 15.987-12.96 28.948-28.948 28.948zm-4.869 0c0-15.988-12.96-28.948-28.948-28.948v17.585c0 15.987 12.96 28.948 28.948 28.948z" fill="#fff"/>
        <g clip-path="url(#a)">
        <path d="M31.487 0c0 8.764 7.049 15.881 15.786 15.992l.207.001-.207.001c-8.737.11-15.786 7.228-15.786 15.992 0-8.833-7.16-15.993-15.993-15.993 8.833 0 15.993-7.16 15.993-15.993" fill="#fff"/>
        </g>
        <defs>
        <clipPath id="a">
          <path fill="#fff" d="M15.494 0H47.48v31.986H15.494z"/>
        </clipPath>
        </defs>
    </svg>`;

    if (verifying) {
        return (
            <SafeAreaView
                style={styles.safe}
            >
                <KeyboardAvoidingView
                    style={styles.kav}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <ScrollView
                        contentContainerStyle={styles.scroll}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Logo */}
                        <View
                            style={styles.logoRow}
                        >
                            <LinearGradient
                                colors={[Colors.primary, Colors.primaryContainer]}
                                style={styles.logoBox}
                            >
                                <SvgXml xml={svgMarkup} width='50%' height='50%' />
                            </LinearGradient>
                            <Text style={styles.appName}>InstaChat</Text>
                        </View>

                        {/* Hero Text */}
                        <Text style={styles.heading}>Verify Email</Text>
                        <Text style={styles.subheading}>We've sent a 6-digit verification code to your {email}.</Text>

                        {/* Form */}
                        <View style={styles.form}>
                            <View style={styles.field}>
                                <Text style={styles.fieldLabel}>Verification Code</Text>
                                <TextInput
                                    style={styles.input}
                                    value={verificationCode}
                                    onChangeText={setVerificationCode}
                                    placeholder="Enter 6-digit code"
                                    placeholderTextColor={Colors.outlineVariant}
                                    keyboardType="number-pad"
                                    autoCapitalize='none'
                                />
                            </View>

                            {/* Back to sign up link */}
                            <View style={styles.toggleRow}>
                                <Text style={styles.toggleText}>Didn't receive the code? </Text>
                                <TouchableOpacity
                                    onPress={() => { setVerifying(false) }}
                                >
                                    <Text style={styles.toggleLink}>Go back to sign up</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Submit Button */}
                            <TouchableOpacity
                                disabled={loading}
                                activeOpacity={0.88}
                                style={styles.btnWrapper}
                                onPress={handleVerify}
                            >
                                <LinearGradient
                                    colors={[Colors.primary, Colors.primaryContainer]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.btn}
                                >
                                    {loading ? (
                                        <ActivityIndicator color={Colors.onPrimary} size='small' />
                                    ) : (
                                        <>
                                            <Text style={styles.btnText}>
                                                Verify Code
                                                <Ionicons name='arrow-forward' size={18} color={Colors.onPrimary} />
                                            </Text>

                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView
            style={styles.safe}
        >
            <KeyboardAvoidingView
                style={styles.kav}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Logo */}
                    <View
                        style={styles.logoRow}
                    >
                        <LinearGradient
                            colors={[Colors.primary, Colors.primaryContainer]}
                            style={styles.logoBox}
                        >
                            <SvgXml xml={svgMarkup} width='50%' height='50%' />
                        </LinearGradient>
                        <Text style={styles.appName}>InstaChat</Text>
                    </View>

                    {/* Hero Text */}
                    <Text style={styles.heading}>{mode === 'login' ? 'Welcome back 👏' : 'Create an account'}</Text>
                    <Text style={styles.subheading}>{mode === 'login' ? 'Sign in to continue Chatting' : 'Fill in your details to get started'}</Text>

                    {/* Form */}
                    <View style={styles.form}>
                        {mode === 'register' && (
                            <>
                                <View style={styles.field}>
                                    <Text style={styles.fieldLabel}>Full Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={name}
                                        onChangeText={setName}
                                        placeholder="Your Name"
                                        placeholderTextColor={Colors.outlineVariant}
                                        autoCapitalize='words'
                                    />
                                </View>
                                <View style={styles.field}>
                                    <Text style={styles.fieldLabel}>Username Handle</Text>
                                    <View style={styles.handleRow}>
                                        <Text style={styles.atSign}>@</Text>
                                        <TextInput
                                            style={[styles.input, styles.handleInput]}
                                            value={handle}
                                            onChangeText={(v) => setHandle(v.replace(/\s/g, ''))}
                                            placeholder="Username"
                                            placeholderTextColor={Colors.outlineVariant}
                                            autoCapitalize='none'
                                        />
                                    </View>
                                </View>
                            </>
                        )}
                        <View style={styles.field}>
                            <Text style={styles.fieldLabel}>Email</Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="you@example.com"
                                placeholderTextColor={Colors.outlineVariant}
                                keyboardType="email-address"
                                autoCapitalize='none'
                            />
                        </View>
                        <View style={styles.field}>
                            <Text style={styles.fieldLabel}>Password</Text>
                            <TextInput
                                style={styles.input}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="••••••••"
                                placeholderTextColor={Colors.outlineVariant}
                                secureTextEntry
                            />
                        </View>

                        {/* Toggle Mode */}
                        <View style={styles.toggleRow}>
                            <Text style={styles.toggleText}>
                                {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
                            >
                                <Text style={styles.toggleLink}>{mode === 'login' ? 'Sign up' : 'Sign in'}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            disabled={loading}
                            activeOpacity={0.88}
                            style={styles.btnWrapper}
                            onPress={handleSubmit}
                        >
                            <LinearGradient
                                colors={[Colors.primary, Colors.primaryContainer]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.btn}
                            >
                                {loading ? (
                                    <ActivityIndicator color={Colors.onPrimary} size='small' />
                                ) : (
                                    <>
                                        <Text style={styles.btnText}>
                                            {mode === 'login' ? 'Sign in' : 'Create Account'}
                                            <Ionicons name='arrow-forward' size={18} color={Colors.onPrimary} />
                                        </Text>

                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}