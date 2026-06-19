import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react'
import { dummyUserProfile } from '@/assets/assets'
import { styles } from '@/assets/styles/ProfileScreen.styles';
import { ScrollView, View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import Avatar from '../../../components/Avatar';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

export default function profile() {

    const { auth } = { auth: { user: dummyUserProfile } }

    const user = auth.user;
    const [editMode, setEditMode] = useState(false);
    const [profileName, setProfileName] = useState(auth.user?.name || '');
    const [profileHandle, setProfileHandle] = useState(auth.user?.handle || '');
    const [profileBio, setProfileBio] = useState(auth.user?.bio || '');
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const displayAvatar = avatarUri || user?.avatar;

    const pickAvatar = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permission required', 'Please enable camera roll permissions to change your avatar.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0].uri) {
            setAvatarUri(result.assets[0].uri);
        }
    };

    const saveProfile = async () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setEditMode(false);
            setAvatarUri(null);
        }, 2000);
    };

    const handleLogout = async () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: () => { } },
            ]
        )
    };

    return (
        <SafeAreaView
            style={styles.safe}
            edges={['top']}
        >
            <ScrollView
                contentContainerStyle={styles.scroll}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Profile</Text>
                    {!editMode && (
                        <TouchableOpacity
                            style={styles.editBtn}
                            onPress={() => setEditMode(true)}
                        >
                            <Ionicons
                                name="pencil"
                                size={16}
                                color={Colors.primary}
                            />
                            <Text style={styles.editBtnText}>Edit</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Avatar */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity
                        onPress={editMode ? pickAvatar : undefined}
                        activeOpacity={editMode ? 0.7 : 1}
                    >
                        <View style={styles.avatarWrapper}>
                            <Avatar
                                name={user?.name || '?'}
                                size={100}
                                src={displayAvatar}
                            />
                            {editMode && (
                                <View style={styles.cameraOverlay}>
                                    <Ionicons
                                        name="camera"
                                        size={24}
                                        color='#fff'
                                    />
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                    {!editMode && (
                        <View style={styles.userInfo}>
                            <Text style={styles.userName}>{user?.name}</Text>
                            <Text style={styles.userHandle}>@{user?.handle}</Text>
                            <Text style={styles.userEmail}>{user?.email}</Text>
                            {user?.bio && <Text style={styles.userBio}>{user?.bio}</Text>}
                        </View>
                    )}
                </View>

                {/* Edit Form */}
                {editMode && (
                    <View style={styles.form}>
                        {/* NAME */}
                        <View style={styles.field}>
                            <Text style={styles.fieldLabel}>NAME</Text>
                            <TextInput
                                style={styles.input}
                                value={profileName}
                                onChangeText={setProfileName}
                                placeholder="Your Name"
                                placeholderTextColor={Colors.outlineVariant}
                                autoCapitalize='words'
                            />
                        </View>

                        {/* HANDLE */}
                        <View style={styles.field}>
                            <Text style={styles.fieldLabel}>HANDLE</Text>
                            <View style={styles.handleRow}>
                                <Text style={styles.atSign}>@</Text>
                                <TextInput
                                    style={[styles.input, styles.handleInput]}
                                    value={profileHandle}
                                    onChangeText={(v) => setProfileHandle(v.toLowerCase().replace(/\s/g, ''))}
                                    placeholder="username"
                                    placeholderTextColor={Colors.outlineVariant}
                                    autoCapitalize='none'
                                />
                            </View>
                        </View>

                        {/* BIO */}
                        <View style={styles.field}>
                            <Text style={styles.fieldLabel}>BIO</Text>
                            <TextInput
                                style={[styles.input, styles.bioInput]}
                                value={profileBio}
                                onChangeText={setProfileBio}
                                placeholder="Tell us about yourself"
                                placeholderTextColor={Colors.outlineVariant}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        {/* SAVE BUTTON */}
                        <TouchableOpacity
                            onPress={saveProfile}
                            disabled={loading}
                            style={styles.saveWrapper}
                            activeOpacity={0.88}
                        >
                            <LinearGradient
                                colors={[Colors.primary, Colors.primaryContainer]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.saveBtn}
                            >
                                {loading ? (
                                    <ActivityIndicator color={Colors.onPrimary} />
                                ) : (
                                    <Text style={styles.saveBtnText}>Save Changes</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* CANCEL BUTTON */}
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => setEditMode(false)}
                        >
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Profile Options */}
                {!editMode && (
                    <View style={styles.optionsSection}>
                        <TouchableOpacity style={styles.optionRow}>
                            <View style={styles.optionIcon}>
                                <Ionicons
                                    name="settings-outline"
                                    size={20}
                                    color={Colors.onSurfaceVariant}
                                />
                            </View>
                            <Text style={styles.optionText}>Settings</Text>
                            <Ionicons
                                name="chevron-forward"
                                size={16}
                                color={Colors.onSurfaceVariant}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.optionRow}>
                            <View style={styles.optionIcon}>
                                <Ionicons
                                    name="notifications-outline"
                                    size={20}
                                    color={Colors.onSurfaceVariant}
                                />
                            </View>
                            <Text style={styles.optionText}>Notifications</Text>
                            <Ionicons
                                name="chevron-forward"
                                size={16}
                                color={Colors.onSurfaceVariant}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.optionRow}>
                            <View style={styles.optionIcon}>
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={20}
                                    color={Colors.onSurfaceVariant}
                                />
                            </View>
                            <Text style={styles.optionText}>Privacy & Security</Text>
                            <Ionicons
                                name="chevron-forward"
                                size={16}
                                color={Colors.onSurfaceVariant}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.optionRow}>
                            <View style={styles.optionIcon}>
                                <Ionicons
                                    name="help-circle-outline"
                                    size={20}
                                    color={Colors.onSurfaceVariant}
                                />
                            </View>
                            <Text style={styles.optionText}>Help & Support</Text>
                            <Ionicons
                                name="chevron-forward"
                                size={16}
                                color={Colors.onSurfaceVariant}
                            />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Sign Out */}
                <View style={styles.signOutSection}>
                    <TouchableOpacity
                        style={styles.signOutBtn}
                        onPress={handleLogout}
                    >
                        <Ionicons
                            name="log-out-outline"
                            size={20}
                            color={Colors.error}
                        />
                        <Text style={styles.signOutText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
