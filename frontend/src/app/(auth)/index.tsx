import { styles } from '@/assets/styles/AuthScreen.styles';
import { useRouter } from 'expo-router';
import { useState } from 'react'
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../../constants/Colors';
import { SvgXml } from 'react-native-svg';
import { Ionicons } from "@expo/vector-icons";

type Mode = 'login' | 'register'

export default function AuthScreen() {

    const [mode, setMode] = useState<Mode>('login');
    const [name, setName] = useState('');
    const [handle, setHandle] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);

    const router = useRouter();

    const handleSubmit = async () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setVerifying(true);
        }, 1500)
    };

    const handleVerify = async () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            router.replace('/(tabs)');
        }, 1500)
    }

    const svgMarkup = `
    <svg
      width="63"
      height="70"
      viewBox="0 0 63 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M33.817 52.382C17.829 65.342 4.869 81.33 4.869 52.382V17.585C4.869 1.598 17.829 0 33.817 0C49.805 0 62.765 1.598 62.765 17.585V52.382C62.765 68.369 49.805 70 33.817 52.382Z"
        fill="#fff"
      />
    
      <g clip-path="url(#a)">
        <path
          d="M31.487 0C40.251 7.049 47.368 15.881 47.479 31.873C47.59 47.865 40.473 56.697 31.487 63.746C22.501 56.697 15.384 47.865 15.495 31.873C15.606 15.881 22.723 7.049 31.487 0Z"
          fill="#fff"
        />
      </g>
    
      <defs>
        <clipPath id="a">
          <path
            fill="#fff"
            d="M15.494 0H47.48V63.746H15.494Z"
          />
        </clipPath>
      </defs>
    </svg>
    `;

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
                                <Text style={styles.toggleText}>{mode === 'login' ? 'Sign up' : 'Sign in'}</Text>
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